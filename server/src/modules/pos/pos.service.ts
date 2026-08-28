import prisma from '../../config/database';
import pricingService from '../../services/pricing.service';
import { roundPeso } from '../../services/pricing-engine.core';

class POSService {
  async getQuote(data: any) {
    const results = [];
    let subtotal = 0;
    let totalMembershipDiscount = 0;
    let totalMonthlyPerkDiscount = 0;
    let totalReferralCredit = 0;
    let allBenefits: string[] = [];
    let allPerks: string[] = [];
    let anyNeedsVerification = false;

    for (const item of data.items) {
      const pricing = await pricingService.calculatePrice(
        {
          serviceId: item.service_id,
          membershipCode: data.membership_code,
          variantKey: item.variant_id ? undefined : undefined,
          staffTier: item.staff_tier,
          quantity: item.quantity,
          useMonthlyPerk: data.use_monthly_perk,
          referralCreditAmount: data.referral_credit_amount,
        },
        data.customer_id
      );

      subtotal += pricing.applicablePrice;
      totalMembershipDiscount += pricing.membershipDiscount;
      totalMonthlyPerkDiscount += pricing.monthlyPerkDiscount;
      totalReferralCredit += pricing.referralCredit;
      allBenefits.push(...pricing.benefits);
      allPerks.push(...pricing.perksApplied);
      if (pricing.needsVerification) anyNeedsVerification = true;

      results.push({
        service_id: item.service_id,
        variant_id: item.variant_id,
        audience: pricing.priceType,
        unit_amount: pricing.applicablePrice / (item.quantity || 1),
        quantity: item.quantity || 1,
        line_total: pricing.applicablePrice,
        warnings: pricing.priceBreakdown[0]?.warnings ?? [],
      });
    }

    const finalTotal = roundPeso(subtotal - totalMonthlyPerkDiscount - totalReferralCredit);

    return {
      items: results,
      subtotal: roundPeso(subtotal),
      membership_discount: roundPeso(totalMembershipDiscount),
      monthly_perk_discount: roundPeso(totalMonthlyPerkDiscount),
      referral_credit: roundPeso(totalReferralCredit),
      final_total: Math.max(0, finalTotal),
      benefits: [...new Set(allBenefits)],
      perks_applied: [...new Set(allPerks)],
      needs_verification: anyNeedsVerification,
    };
  }

  async checkout(data: any) {
    const quote = await this.getQuote(data);

    // Generate transaction number
    const txCount = await prisma.transactions.count();
    const txNumber = `TXN-${String(txCount + 1).padStart(6, '0')}`;

    // Create transaction
    const transaction = await prisma.transactions.create({
      data: {
        transaction_number: txNumber,
        customer_id: data.customer_id ?? null,
        staff_id: null,
        type: 'sale',
        subtotal: quote.subtotal,
        discount_amount: quote.membership_discount + quote.monthly_perk_discount + quote.referral_credit,
        tax_amount: 0,
        total_amount: quote.final_total,
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

    return { transaction, quote };
  }
}

export default new POSService();
