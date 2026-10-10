import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import pricingService from '../../services/pricing.service';
import { roundPeso } from '../../services/pricing-engine.core';
import { computeQuoteLine, sumQuoteLines, type QuoteLine } from './pos-quote-math';
import { notificationDispatch } from '../../services/notification-dispatch.service';

class POSService {
  async getQuote(data: any) {
    const results = [];
    const lines: QuoteLine[] = [];
    let allBenefits: string[] = [];
    let allPerks: string[] = [];
    let anyNeedsVerification = false;

    for (const item of data.items) {
      const pricing = await pricingService.calculatePrice(
        {
          serviceId: item.service_id,
          membershipCode: data.membership_code,
          quantity: item.quantity,
          useMonthlyPerk: data.use_monthly_perk,
        },
        data.customer_id
      );

      // `calculatePrice` returns per-unit figures, so the line math multiplies
      // them by quantity. `subtotal` is the catalogue value of the services —
      // what they are worth before any discount — while `applicablePrice` is
      // already reduced, so accumulating the gross and subtracting each discount
      // exactly once keeps the rows consistent:
      // subtotal - membership - monthlyPerk === final_total.
      const line = computeQuoteLine({
        basePrice: pricing.basePrice,
        applicablePrice: pricing.applicablePrice,
        priceType: pricing.priceType,
        monthlyPerkDiscount: pricing.monthlyPerkDiscount,
        quantity: item.quantity,
      });

      allBenefits.push(...pricing.benefits);
      allPerks.push(...pricing.perksApplied);
      if (pricing.needsVerification) anyNeedsVerification = true;

      lines.push(line);
      results.push({
        service_id: item.service_id,
        variant_id: item.variant_id,
        audience: pricing.priceType,
        unit_amount: line.unit_amount,
        quantity: line.quantity,
        line_total: line.line_total,
        discount: line.discount,
        monthly_perk_discount: line.monthlyPerkDiscount,
        warnings: pricing.priceBreakdown[0]?.warnings ?? [],
      });
    }

    // Round once, at the end, off the accumulated figures. Rounding the
    // discounts individually but not here leaves a stray cent between the
    // displayed rows and the charged total.
    const {
      subtotal: roundedSubtotal,
      membership_discount: roundedMembershipDiscount,
      monthly_perk_discount: roundedMonthlyPerkDiscount,
      final_total: finalTotal,
    } = sumQuoteLines(lines);

    return {
      items: results,
      subtotal: roundedSubtotal,
      membership_discount: roundedMembershipDiscount,
      monthly_perk_discount: roundedMonthlyPerkDiscount,
      final_total: Math.max(0, finalTotal),
      benefits: [...new Set(allBenefits)],
      perks_applied: [...new Set(allPerks)],
      needs_verification: anyNeedsVerification,
    };
  }

  async createSale(data: any, quote?: any, appointmentId?: number | null) {
    if (!quote) quote = await this.getQuote(data);

    const baseDiscount = quote.membership_discount + quote.monthly_perk_discount;
    let discountAmount = baseDiscount;
    if (data.discount_pct && !data.discount_amount) {
      discountAmount = roundPeso(quote.final_total * (data.discount_pct / 100) + baseDiscount);
    } else if (data.discount_amount) {
      discountAmount = roundPeso(data.discount_amount);
    }
    const totalAmount = Math.max(0, roundPeso(quote.final_total - (discountAmount - baseDiscount)));

    // Generate transaction number
    const txCount = await prisma.transactions.count();
    const txNumber = `TXN-${String(txCount + 1).padStart(6, '0')}`;

    // Create transaction
    const transaction = await prisma.transactions.create({
      data: {
        transaction_number: txNumber,
        customer_id: data.customer_id ?? null,
        staff_id: data.staff_id ?? null,
        appointment_id: appointmentId ?? data.appointment_id ?? null,
        type: 'sale',
        subtotal: quote.subtotal,
        discount_amount: discountAmount,
        discount_pct: data.discount_pct ? new Decimal(String(data.discount_pct)) : null,
        discount_reason: data.discount_reason ?? null,
        discount_applied_by: data.discount_applied_by ?? null,
        tax_amount: 0,
        total_amount: totalAmount,
        payment_method: data.payment_method,
        payment_status: 'paid',
        paid_at: new Date(),
        notes: data.notes ?? null,
      },
    });

    // Create transaction items
    for (const item of quote.items) {
      const service = await prisma.services.findUnique({ where: { id: item.service_id } });
      await prisma.transaction_items.create({
        data: {
          transaction_id: transaction.id,
          service_id: item.service_id,
          description: service?.name ?? `Service #${item.service_id}`,
          quantity: item.quantity,
          unit_price: roundPeso(item.unit_amount),
          discount: 0,
          tax: 0,
          line_total: roundPeso(item.line_total),
        },
      });
    }

    return { transaction, quote, discountAmount, totalAmount };
  }

  async checkout(data: any) {
    const quote = await this.getQuote(data);

    const { transaction } = await this.createSale(data, quote);

    // If appointment_id provided, complete the appointment and create treatment record
    if (data.appointment_id) {
      const appointment = await prisma.appointments.findUnique({
        where: { id: data.appointment_id },
      });
      if (appointment && appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        const oldStatus = appointment.status;
        await prisma.appointments.update({
          where: { id: data.appointment_id },
          data: { status: 'completed' },
        });
        await prisma.appointment_status_history.create({
          data: {
            appointment_id: data.appointment_id,
            old_status: oldStatus,
            new_status: 'completed',
            changed_by: data.discount_applied_by ?? data.staff_id ?? 0,
            reason: 'Service completed via POS checkout',
          },
        });
        const existingRecord = await prisma.treatment_records.findUnique({
          where: { appointment_id: data.appointment_id },
        });
        if (!existingRecord) {
          await prisma.treatment_records.create({
            data: {
              appointment_id: data.appointment_id,
              staff_id: appointment.staff_id,
              customer_id: appointment.customer_id,
              service_id: appointment.service_id,
              treatment_date: appointment.appointment_date,
              start_time: appointment.start_time ?? null,
              end_time: appointment.end_time ?? null,
            },
          });
        }

        try {
          const apptFull = await prisma.appointments.findUnique({
            where: { id: data.appointment_id },
            include: {
              customer: { select: { user_id: true, first_name: true, last_name: true } },
              staff: { select: { user_id: true, first_name: true, last_name: true } },
              service: { select: { name: true } },
            },
          });
          if (apptFull) {
            const customerUser = await prisma.users.findUnique({
              where: { id: apptFull.customer.user_id },
              select: { id: true, phone: true },
            });
            const staffUser = apptFull.staff
              ? await prisma.users.findUnique({
                  where: { id: apptFull.staff.user_id },
                  select: { id: true, phone: true },
                })
              : null;
            const adminUserIds = await notificationDispatch.getAdminUserIds();
            const apptDate = new Date(apptFull.appointment_date).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            await notificationDispatch.dispatchAppointmentStatus({
              appointmentId: apptFull.id,
              oldStatus,
              newStatus: 'completed',
              customerUserId: customerUser?.id ?? 0,
              customerName: `${apptFull.customer.first_name} ${apptFull.customer.last_name}`,
              customerPhone: customerUser?.phone ?? null,
              staffUserId: staffUser?.id ?? null,
              staffName: apptFull.staff ? `${apptFull.staff.first_name} ${apptFull.staff.last_name}` : '',
              serviceName: apptFull.service.name,
              appointmentDate: apptDate,
              appointmentTime: apptFull.start_time ?? '',
              adminUserIds,
            });
          }
        } catch (err) {
          // Notification failure should not block POS checkout
        }
      }
    }

    return { transaction, quote };
  }
}

export default new POSService();
