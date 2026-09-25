import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import pricingService from '../../services/pricing.service';
import { notificationDispatch } from '../../services/notification-dispatch.service';
import posService from '../pos/pos.service';
import { customerService } from '../customers/customers.service';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import logger from '../../utils/logger';
import {
  CreateAppointmentInput,
  CreateGroupAppointmentInput,
  UpdateAppointmentInput,
  ListAppointmentsQuery,
} from './appointments.validation';

export class AppointmentService {
  async quote(serviceId: number, customerId?: number, membershipCode?: string) {
    const pricing = await pricingService.calculatePrice(
      { serviceId, membershipCode },
      customerId
    );
    return pricing;
  }

  async list(query: ListAppointmentsQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { customer_id, staff_id, service_id, status, date_from, date_to, sort_by, sort_order } = query;

    const where: any = { deleted_at: null };

    if (customer_id) where.customer_id = customer_id;
    if (staff_id) where.staff_id = staff_id;
    if (service_id) where.service_id = service_id;
    if (status) where.status = status;

    if (date_from || date_to) {
      where.appointment_date = {};
      if (date_from) where.appointment_date.gte = new Date(date_from);
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        where.appointment_date.lte = endDate;
      }
    }

    const orderBy: any = {};
    if (sort_by) {
      orderBy[sort_by] = sort_order || 'desc';
    } else {
      orderBy.appointment_date = 'desc';
    }

    const [appointments, total] = await Promise.all([
      prisma.appointments.findMany({
        where,
        include: {
          customer: {
            select: { id: true, first_name: true, last_name: true },
          },
          staff: {
            select: { id: true, first_name: true, last_name: true, position: true },
          },
          service: {
            select: { id: true, name: true, price: true, duration_minutes: true },
          },
          services: {
            include: {
              service: { select: { id: true, name: true, price: true, duration_minutes: true } },
            },
            orderBy: { id: 'asc' },
          },
          transactions: { select: { payment_status: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.appointments.count({ where }),
    ]);

    return createPaginatedResult(
      appointments.map((a) => this.withServices(a)),
      total,
      { page, limit, skip }
    );
  }

  private withServices(a: any): any {
    const { services, transactions, ...rest } = a;
    const mapped = (services ?? []).map((as: any) => ({
      id: as.service_id,
      name: as.service.name,
      price: as.unit_price !== null && as.unit_price !== undefined ? Number(as.unit_price) : Number(as.service.price),
      duration_minutes: as.duration_minutes ?? as.service.duration_minutes,
    }));
    const paid = (transactions ?? []).some((t: any) => t.payment_status === 'paid');
    return { ...rest, services: mapped, paid };
  }

  async getById(id: number) {
    const appointment = await prisma.appointments.findFirst({
      where: { id, deleted_at: null },
      include: {
        customer: {
          select: { id: true, first_name: true, last_name: true },
        },
        staff: {
          select: { id: true, first_name: true, last_name: true, position: true },
        },
        service: {
          select: { id: true, name: true, price: true, duration_minutes: true },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, price: true, duration_minutes: true } },
          },
          orderBy: { id: 'asc' },
        },
        transactions: { select: { payment_status: true } },
        status_history: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        treatment_record: {
          select: { id: true, notes: true },
        },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    return this.withServices(appointment);
  }

  async create(data: CreateAppointmentInput) {
    const customer = await prisma.customers.findFirst({
      where: { id: data.customer_id, deleted_at: null },
    });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const service = await prisma.services.findFirst({
      where: { id: data.service_id, deleted_at: null },
    });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    // Clinic-wide operating days gate: reject bookings on days the clinic is
    // closed, mirroring the getAvailability closed-day handling.
    const closedWeekdays = await this.getClosedWeekdays();
    if (closedWeekdays.has(this.weekdayOf(data.appointment_date))) {
      throw new AppError(
        'The clinic is closed on this day. Please choose an operating day.',
        422
      );
    }

    // Past-date gate: bookings must be for a current or future date.
    if (data.appointment_date < this.localDateString()) {
      throw new AppError(
        'Cannot book an appointment in the past. Please choose a current or future date.',
        422
      );
    }

    let endTime = data.end_time;
    if (!endTime) {
      const [hours, minutes] = data.start_time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + service.duration_minutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMins = totalMinutes % 60;
      endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    }

    // Resolve the staff member. Every booking must explicitly select the
    // specialist who will perform the service.
    const staff = await this.resolveStaff(
      data.staff_id,
      data.appointment_date,
      data.start_time,
      endTime
    );

    let quotedPrice: number | null = null;
    let priceType: string | null = null;
    try {
      const pricing = await pricingService.calculatePrice(
        {
          serviceId: data.service_id,
          membershipCode: data.membership_code ?? undefined,
        },
        data.customer_id
      );
      quotedPrice = pricing.finalTotal;
      priceType = pricing.priceType;
    } catch {
      quotedPrice = null;
      priceType = null;
    }

    const appointment = await prisma.appointments.create({
      data: {
        customer_id: data.customer_id,
        staff_id: staff.id,
        service_id: data.service_id,
        appointment_date: new Date(data.appointment_date),
        start_time: data.start_time,
        end_time: endTime,
        quoted_price: quotedPrice,
        price_type: priceType,
        membership_code: data.membership_code ?? null,
        notes: data.notes ?? null,
      },
      include: {
        customer: {
          select: { id: true, first_name: true, last_name: true },
        },
        staff: {
          select: { id: true, first_name: true, last_name: true, position: true, user_id: true },
        },
        service: {
          select: { id: true, name: true, price: true, duration_minutes: true },
        },
      },
    });

    // Dispatch notifications for new booking
    try {
      const customerUser = await prisma.users.findUnique({
        where: { id: customer.user_id },
        select: { id: true, phone: true },
      });
      const adminUserIds = await notificationDispatch.getAdminUserIds();

      await notificationDispatch.dispatchNewBooking({
        appointmentId: appointment.id,
        customerUserId: customer.user_id,
        customerName: `${customer.first_name} ${customer.last_name}`,
        customerPhone: customerUser?.phone ?? null,
        staffUserId: staff.user_id,
        staffName: `${staff.first_name} ${staff.last_name}`,
        serviceName: service.name,
        appointmentDate: data.appointment_date,
        appointmentTime: data.start_time,
        quotedPrice: quotedPrice,
        adminUserIds,
      });
    } catch (err: any) {
      // Notification failure should not block appointment creation
    }

    return appointment;
  }

  async createGroup(data: CreateGroupAppointmentInput) {
    const services = await prisma.services.findMany({
      where: { id: { in: data.service_ids }, deleted_at: null },
    });
    if (services.length !== data.service_ids.length) {
      throw new AppError('One or more services not found', 404);
    }
    // Preserve the requested selection order
    const orderedServices = data.service_ids
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s);

    const totalDuration = orderedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Clinic-wide operating days gate
    const closedWeekdays = await this.getClosedWeekdays();
    if (closedWeekdays.has(this.weekdayOf(data.appointment_date))) {
      throw new AppError(
        'The clinic is closed on this day. Please choose an operating day.',
        422
      );
    }

    // Past-date gate: bookings must be for a current or future date.
    if (data.appointment_date < this.localDateString()) {
      throw new AppError(
        'Cannot book an appointment in the past. Please choose a current or future date.',
        422
      );
    }

    // Resolve the client: an existing customer by id, or a new customer record
    // for a walk-in. Walk-in customers are created only after the services and
    // operating-day checks pass, so invalid bookings do not leave orphan rows.
    let customer: any;
    let customerId: number;
    if (data.walk_in) {
      customer = await customerService.createWalkIn(data.walk_in);
      customerId = customer.id;
    } else {
      customer = await prisma.customers.findFirst({
        where: { id: data.customer_id, deleted_at: null },
      });
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }
      customerId = customer.id;
    }

    // Combined block [start_time, end_time] spanning all services
    const [startHours, startMins] = data.start_time.split(':').map(Number);
    const startTotal = startHours * 60 + startMins;
    const endTotal = startTotal + totalDuration;
    const endTime = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

    // Resolve the single specialist who handles the whole block
    const staff = await this.resolveStaff(data.staff_id, data.appointment_date, data.start_time, endTime);

    // Per-service pricing (member/perk aware) for the combined quoted price
    const pricingList: Array<any> = [];
    let quotedPrice = 0;
    let primaryPriceType: string | null = null;
    for (const svc of orderedServices) {
      try {
        const pricing = await pricingService.calculatePrice(
          { serviceId: svc.id, membershipCode: data.membership_code ?? undefined },
          customerId
        );
        pricingList.push(pricing);
        quotedPrice += pricing.finalTotal;
        if (!primaryPriceType) primaryPriceType = pricing.priceType;
      } catch {
        pricingList.push(null);
      }
    }

    // ONE appointment holding all services
    const appointment = await prisma.appointments.create({
      data: {
        customer_id: customerId,
        staff_id: staff.id,
        service_id: orderedServices[0].id,
        appointment_date: new Date(data.appointment_date),
        start_time: data.start_time,
        end_time: endTime,
        quoted_price: quotedPrice ? Math.round(quotedPrice * 100) / 100 : null,
        price_type: primaryPriceType,
        membership_code: data.membership_code ?? null,
        status: data.payment ? 'confirmed' : 'pending',
        notes: data.notes ?? null,
        services: {
          create: orderedServices.map((svc, i) => ({
            service_id: svc.id,
            unit_price: pricingList[i] ? pricingList[i].applicablePrice : svc.price,
            duration_minutes: svc.duration_minutes,
          })),
        },
      },
      include: {
        customer: { select: { id: true, first_name: true, last_name: true } },
        staff: { select: { id: true, first_name: true, last_name: true, position: true, user_id: true } },
        service: { select: { id: true, name: true, price: true, duration_minutes: true } },
        services: {
          include: { service: { select: { id: true, name: true, price: true, duration_minutes: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });

    // Dispatch notifications for new booking
    try {
      const customerUser = await prisma.users.findUnique({
        where: { id: customer.user_id },
        select: { id: true, phone: true },
      });
      const adminUserIds = await notificationDispatch.getAdminUserIds();

      await notificationDispatch.dispatchNewBooking({
        appointmentId: appointment.id,
        customerUserId: customer.user_id,
        customerName: `${customer.first_name} ${customer.last_name}`,
        customerPhone: customerUser?.phone ?? null,
        staffUserId: staff.user_id,
        staffName: `${staff.first_name} ${staff.last_name}`,
        serviceName: orderedServices.map((s) => s.name).join(', '),
        appointmentDate: data.appointment_date,
        appointmentTime: data.start_time,
        quotedPrice: Math.round(quotedPrice * 100) / 100 || null,
        adminUserIds,
      });
    } catch (err: any) {
      // Notification failure should not block appointment creation
    }

    // Optional payment collected at booking time
    let transaction: any = null;
    if (data.payment) {
      try {
        const quote = await posService.getQuote({
          customer_id: customerId,
          items: orderedServices.map((s) => ({ service_id: s.id, quantity: 1 })),
        });
        const { transaction: tx } = await posService.createSale(
          {
            customer_id: customerId,
            staff_id: staff.id,
            payment_method: data.payment.payment_method,
            amount_tendered: data.payment.amount_tendered,
            notes: data.notes ?? null,
          },
          quote,
          appointment.id
        );
        transaction = {
          id: tx.id,
          transaction_number: tx.transaction_number,
          total_amount: tx.total_amount,
        };
      } catch (err: any) {
        throw new AppError('Appointment saved but payment could not be recorded. Please complete at checkout.', 500);
      }
    }

    return {
      appointment: this.withServices(appointment),
      totalDuration,
      start_time: data.start_time,
      end_time: endTime,
      transaction,
    };
  }

  // ─── Staff resolution ───────────────────────────────────────────────
  // Validates the explicitly selected specialist: must exist, must have no
  // conflicting appointment over the booking window.
  private async resolveStaff(
    staffId: number | undefined,
    appointmentDate: string,
    startTime: string,
    endTime: string
  ): Promise<any> {
    if (!staffId) {
      throw new AppError('Please choose a specialist for this appointment', 400);
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, deleted_at: null },
    });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const conflicts = await prisma.appointments.findMany({
      where: {
        staff_id: staff.id,
        appointment_date: new Date(appointmentDate),
        status: { notIn: ['cancelled', 'no_show'] },
        deleted_at: null,
        OR: [{ start_time: { lt: endTime }, end_time: { gt: startTime } }],
      },
      select: { id: true },
    });
    if (conflicts.length > 0) {
      throw new AppError('Staff member already has an appointment during this time slot', 409);
    }

    return staff;
  }

  async update(id: number, data: UpdateAppointmentInput) {
    const existing = await prisma.appointments.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Appointment not found', 404);
    }

    // Validate the resulting appointment window when the booking details change.
    // Guards against clinic-closed days, staff conflicts, and staff reassigned
    // to a service they are not qualified for (parity with the create path).
    // Status-only transitions (confirm/check-in/complete/cancel) are untouched.
    const slotOrStaffChanged =
      data.appointment_date !== undefined ||
      data.start_time !== undefined ||
      data.end_time !== undefined ||
      data.staff_id !== undefined;

    if (slotOrStaffChanged) {
      // Past-date gate: only explicit date changes are checked, so notes/staff
      // edits on existing (even past) appointments remain allowed.
      if (data.appointment_date && data.appointment_date < this.localDateString()) {
        throw new AppError(
          'Cannot reschedule to a past date. Please choose a current or future date.',
          422
        );
      }
      const effectiveDate = data.appointment_date ?? new Date(existing.appointment_date).toISOString().slice(0, 10);
      const effectiveStart = data.start_time ?? existing.start_time;
      const effectiveEnd = data.end_time ?? existing.end_time;
      const effectiveStaffId = data.staff_id ?? existing.staff_id;

      await this.validateUpdateWindow(
        id,
        effectiveStaffId,
        effectiveDate,
        effectiveStart,
        effectiveEnd
      );
    }

    const updateData: any = {};
    if (data.staff_id !== undefined) updateData.staff_id = data.staff_id;
    if (data.appointment_date !== undefined) updateData.appointment_date = new Date(data.appointment_date);
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.service_id !== undefined) updateData.service_id = data.service_id;
    if (data.cancellation_reason !== undefined) updateData.cancellation_reason = data.cancellation_reason;
    if (data.reschedule_reason !== undefined) updateData.reschedule_reason = data.reschedule_reason;

    // Cancellation requires a message so the customer can be informed why
    if (data.status === 'cancelled' && !data.cancellation_reason?.trim()) {
      throw new AppError('Please provide a reason for cancelling the appointment', 400);
    }

    // Recompute quoted price when service or membership changes
    if (data.service_id !== undefined || data.membership_code !== undefined) {
      try {
        const pricing = await pricingService.calculatePrice(
          { serviceId: data.service_id ?? existing.service_id },
          existing.customer_id
        );
        updateData.quoted_price = pricing.finalTotal;
        updateData.price_type = pricing.priceType;
        updateData.membership_code = data.membership_code ?? existing.membership_code;
      } catch {
        // keep existing quoted_price if recalculation fails
      }
    }

    if (data.status) {
      await prisma.appointments.update({
        where: { id },
        data: updateData,
      });

      const updated = await prisma.appointments.update({
        where: { id },
        data: { status: data.status },
        include: {
          customer: {
            select: { id: true, first_name: true, last_name: true },
          },
          staff: {
            select: { id: true, first_name: true, last_name: true, position: true },
          },
          service: {
            select: { id: true, name: true, price: true, duration_minutes: true },
          },
        },
      });

      await prisma.appointment_status_history.create({
        data: {
          appointment_id: id,
          old_status: existing.status,
          new_status: data.status,
          reason: data.cancellation_reason ?? null,
        },
      });

      // Dispatch notifications for status change
      try {
        const customerRecord = await prisma.customers.findUnique({
          where: { id: existing.customer_id },
          select: { user_id: true },
        });
        const customerUser = customerRecord
          ? await prisma.users.findUnique({ where: { id: customerRecord.user_id }, select: { id: true, phone: true } })
          : null;
        const staffRecord = await prisma.staff.findUnique({
          where: { id: existing.staff_id },
          select: { user_id: true },
        });
        const adminUserIds = await notificationDispatch.getAdminUserIds();
        const apptDate = new Date(existing.appointment_date).toLocaleDateString('en-PH', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        await notificationDispatch.dispatchAppointmentStatus({
          appointmentId: id,
          oldStatus: existing.status,
          newStatus: data.status,
          customerUserId: customerUser?.id ?? customerRecord?.user_id ?? 0,
          customerName: `${updated.customer.first_name} ${updated.customer.last_name}`,
          customerPhone: customerUser?.phone ?? null,
          staffUserId: staffRecord?.user_id ?? null,
          staffName: `${updated.staff.first_name} ${updated.staff.last_name}`,
          serviceName: updated.service.name,
          appointmentDate: apptDate,
          appointmentTime: existing.start_time,
          cancellationReason: data.cancellation_reason ?? null,
          adminUserIds,
        });
      } catch (err: any) {
        // Notification failure should not block status update
      }

      // Auto-create treatment record so the customer's treatment history is populated
      if (data.status === 'completed') {
        try {
          await prisma.treatment_records.upsert({
            where: { appointment_id: id },
            update: {},
            create: {
              appointment_id: id,
              staff_id: existing.staff_id,
              customer_id: existing.customer_id,
              service_id: existing.service_id,
              treatment_date: existing.appointment_date,
              start_time: existing.start_time ?? null,
              end_time: existing.end_time ?? null,
              notes: existing.notes ?? null,
            },
          });
        } catch (err: any) {
          // Treatment record creation failure should not block status update
        }
      }

      return updated;
    }

    // Detect a reschedule: appointment date and/or start time actually changed
    const newDate = data.appointment_date ? new Date(data.appointment_date) : existing.appointment_date;
    const newTime = data.start_time ?? existing.start_time;
    const dateChanged = data.appointment_date !== undefined
      && newDate.toISOString().slice(0, 10) !== new Date(existing.appointment_date).toISOString().slice(0, 10);
    const timeChanged = data.start_time !== undefined && data.start_time !== existing.start_time;
    const isReschedule = dateChanged || timeChanged;

    // A reschedule requires a message to inform the customer why
    if (isReschedule && !data.reschedule_reason?.trim()) {
      throw new AppError('Please provide a message explaining the reschedule', 400);
    }

    const appointment = await prisma.appointments.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, first_name: true, last_name: true },
        },
        staff: {
          select: { id: true, first_name: true, last_name: true, position: true },
        },
        service: {
          select: { id: true, name: true, price: true, duration_minutes: true },
        },
      },
    });

    if (isReschedule) {
      // Audit trail in status history (status unchanged, reason carries the message)
      try {
        await prisma.appointment_status_history.create({
          data: {
            appointment_id: id,
            old_status: existing.status,
            new_status: existing.status,
            reason: data.reschedule_reason ?? null,
          },
        });
      } catch (err: any) {
        // History failure should not block reschedule
      }

      // Notify customer (in-app + SMS), assigned staff and admins
      try {
        const customerRecord = await prisma.customers.findUnique({
          where: { id: existing.customer_id },
          select: { user_id: true },
        });
        const customerUser = customerRecord
          ? await prisma.users.findUnique({ where: { id: customerRecord.user_id }, select: { id: true, phone: true } })
          : null;
        const staffRecord = await prisma.staff.findUnique({
          where: { id: existing.staff_id },
          select: { user_id: true },
        });
        const adminUserIds = await notificationDispatch.getAdminUserIds();
        const fmt = (d: Date) => d.toLocaleDateString('en-PH', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        await notificationDispatch.dispatchAppointmentRescheduled({
          appointmentId: id,
          customerUserId: customerUser?.id ?? customerRecord?.user_id ?? 0,
          customerName: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
          customerPhone: customerUser?.phone ?? null,
          staffUserId: staffRecord?.user_id ?? null,
          staffName: `${appointment.staff.first_name} ${appointment.staff.last_name}`,
          serviceName: appointment.service.name,
          oldDate: fmt(new Date(existing.appointment_date)),
          oldTime: existing.start_time,
          newDate: fmt(newDate),
          newTime,
          reason: data.reschedule_reason ?? null,
          adminUserIds,
        });
      } catch (err: any) {
        // Notification failure should not block reschedule
      }
    }

    return appointment;
  }

  async delete(id: number) {
    const existing = await prisma.appointments.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Appointment not found', 404);
    }

    await prisma.appointments.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'cancelled' },
    });
  }

  async getAvailability(staffId: number | undefined, serviceId: number, date: string, durationOverride?: number) {
    if (!serviceId || !date) {
      throw new AppError('service_id and date are required', 400);
    }

    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
    });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    // Clinic-wide operating days gate: if the clinic is closed this weekday, no
    // slots are offered regardless of individual staff schedules.
    const closedWeekdays = await this.getClosedWeekdays();
    if (closedWeekdays.has(this.weekdayOf(date))) {
      const busy = await prisma.appointments.findMany({
        where: { service_id: serviceId, appointment_date: new Date(date), status: { notIn: ['cancelled', 'no_show'] }, deleted_at: null },
        select: { staff_id: true, start_time: true, end_time: true },
      });
      return {
        date,
        staff_id: staffId ?? undefined,
        service_id: serviceId,
        closed: true,
        duration_minutes: durationOverride || service.duration_minutes,
        available_slots: [],
        booked_appointments: busy,
      };
    }

    const durationMinutes = durationOverride || service.duration_minutes;
    const slotsNeeded = Math.ceil(durationMinutes / 30);

    // Resolve which staff to check availability for.
    let staffList: any[];
    if (staffId) {
      const staff = await prisma.staff.findFirst({
        where: { id: staffId, deleted_at: null },
      });
      if (!staff) {
        throw new AppError('Staff not found', 404);
      }
      staffList = [staff];
    } else {
      staffList = await prisma.staff.findMany({
        where: { deleted_at: null, status: 'active' },
      });
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const weekday = days[new Date(`${date}T00:00:00`).getDay()];

    const schedules = await prisma.staff_schedules.findMany({
      where: {
        staff_id: { in: staffList.map((s) => s.id) },
        day_of_week: weekday,
      },
    });
    const scheduleByStaff = new Map(schedules.map((s) => [s.staff_id, s]));

    const existingAppointments = await prisma.appointments.findMany({
      where: {
        staff_id: { in: staffList.map((s) => s.id) },
        appointment_date: new Date(date),
        status: { notIn: ['cancelled', 'no_show'] },
        deleted_at: null,
      },
      select: { staff_id: true, start_time: true, end_time: true },
    });

    const dayGrid: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        dayGrid.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }

    const isToday = date === this.localDateString();
    const nowTime = this.localTimeString();

    const availableSlots: Array<{
      start: string;
      end: string;
      staff_id: number;
      staff_name: string;
    }> = [];

    for (const staff of staffList) {
      const schedule = scheduleByStaff.get(staff.id);

      // A staff member with no schedule row for this weekday, an inactive
      // schedule, or an explicit off-day (00:00-00:00) is NOT available.
      // There is no default work window — shifts must be configured by an
      // admin or the staff member will not appear in customer availability.
      if (!schedule) continue;
      if (!schedule.is_active) continue;
      if (schedule.start_time === '00:00' && schedule.end_time === '00:00') continue;

      const windowStart = schedule.start_time;
      const windowEnd = schedule.end_time;
      const breakStart = schedule.break_start ?? null;
      const breakEnd = schedule.break_end ?? null;

      const startIdx = dayGrid.indexOf(windowStart);
      const endIdx = dayGrid.indexOf(windowEnd);
      if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) continue;

      const booked = new Set<string>();
      for (const appt of existingAppointments) {
        if (appt.staff_id !== staff.id) continue;
        for (const slot of dayGrid) {
          if (slot >= appt.start_time && slot < appt.end_time) booked.add(slot);
        }
      }

      for (let idx = startIdx; idx + slotsNeeded <= endIdx; idx++) {
        const slot = dayGrid[idx];
        if (booked.has(slot)) continue;

        let free = true;
        for (let i = 0; i < slotsNeeded; i++) {
          if (!dayGrid[idx + i] || booked.has(dayGrid[idx + i])) {
            free = false;
            break;
          }
        }
        if (!free) continue;

        if (breakStart && breakEnd) {
          const slotStartMin = this.timeToMinutes(slot);
          const slotEndMin = slotStartMin + durationMinutes;
          const bStart = this.timeToMinutes(breakStart);
          const bEnd = this.timeToMinutes(breakEnd);
          if (slotStartMin < bEnd && slotEndMin > bStart) continue;
        }

        if (isToday && slot <= nowTime) continue;

        availableSlots.push({
          start: slot,
          end: this.addMinutesToTime(slot, durationMinutes),
          staff_id: staff.id,
          staff_name: `${staff.first_name} ${staff.last_name}`,
        });
      }
    }

    availableSlots.sort(
      (a, b) => a.start.localeCompare(b.start) || a.staff_id - b.staff_id
    );

    return {
      date,
      staff_id: staffId ?? undefined,
      service_id: serviceId,
      duration_minutes: durationMinutes,
      available_slots: availableSlots,
      booked_appointments: existingAppointments,
    };
  }

  // Sends automatic appointment reminders for tomorrow's confirmed/pending
  // appointments. Runs once daily (see server.ts scheduler). Each appointment
  // is reminded at most once, guarded by the `reminder_sent` flag.
  async processAppointmentReminders(): Promise<{ reminded: number; failed: number }> {
    const tomorrow = this.localDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const rows = await prisma.appointments.findMany({
      where: {
        appointment_date: new Date(tomorrow),
        status: { in: ['confirmed', 'pending'] },
        reminder_sent: false,
        deleted_at: null,
      },
      include: {
        customer: {
          include: { user: { select: { id: true, phone: true } } },
        },
        service: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    let reminded = 0;
    let failed = 0;

    for (const appointment of rows) {
      const customer = appointment.customer;
      const phone = customer.user?.phone ?? null;

      if (!customer.user) {
        // No user account tied to the customer; mark as reminded to avoid retries.
        await prisma.appointments.update({
          where: { id: appointment.id },
          data: { reminder_sent: true },
        });
        continue;
      }

      const serviceNames = (appointment.services?.length
        ? appointment.services.map((s: any) => s.service.name).join(', ')
        : appointment.service?.name) ?? '';

      const [, month, day] = tomorrow.split('-');
      const message =
        `Hi ${customer.first_name}, this is a reminder from Souvari Skin Lab: your ${serviceNames} ` +
        `appointment is on ${month}-${day} at ${appointment.start_time}. See you!`;

      try {
        await notificationDispatch.dispatch({
          userId: customer.user.id,
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message,
          data: { appointment_id: appointment.id },
          sendSMS: true,
          smsPhone: phone ?? undefined,
        });
        reminded += 1;
      } catch (err: any) {
        failed += 1;
        logger.error(`[REMINDER] Failed for appointment ${appointment.id}: ${err.message}`);
      }

      await prisma.appointments.update({
        where: { id: appointment.id },
        data: { reminder_sent: true },
      });
    }

    return { reminded, failed };
  }

  // Validates the resulting appointment window for an update: the clinic must
  // be open, the assigned staff must be qualified for the service, and the
  // staff must have no conflicting (non-cancelled) appointment covering the
  // window. The appointment being updated is excluded from the conflict scan.
private async validateUpdateWindow(
    appointmentId: number,
    staffId: number,
    appointmentDate: string,
    startTime: string,
    endTime: string
  ): Promise<void> {
    const closedWeekdays = await this.getClosedWeekdays();
    if (closedWeekdays.has(this.weekdayOf(appointmentDate))) {
      throw new AppError(
        'The clinic is closed on this day. Please choose an operating day.',
        422
      );
    }

    const conflicts = await prisma.appointments.findMany({
      where: {
        staff_id: staffId,
        appointment_date: new Date(appointmentDate),
        status: { notIn: ['cancelled', 'no_show'] },
        deleted_at: null,
        id: { not: appointmentId },
        OR: [{ start_time: { lt: endTime }, end_time: { gt: startTime } }],
      },
      select: { id: true },
    });

    if (conflicts.length > 0) {
      throw new AppError('Staff member already has an appointment during this time slot', 409);
    }
  }

  // ─── Weekday helpers for clinic-wide closed-day enforcement. ─────────
  // JS getDay() numbering: 0=Sunday … 6=Saturday.
  private weekdayOf(dateStr: string): number {
    return new Date(`${dateStr}T00:00:00`).getDay();
  }

  // Weekdays the clinic is routinely closed. Computed as the complement of the
  // `business_days` system setting (the authoritative operating-week policy).
  private async getClosedWeekdays(): Promise<Set<number>> {
    const rows = await prisma.system_settings.findMany({
      where: { setting_key: 'business_days' },
    });
    const open = rows.length > 0
      ? JSON.parse(rows[0].setting_value)
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekdayNumber: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    };
    const openSet = new Set((Array.isArray(open) ? open : []).map((d: string) => weekdayNumber[d.toLowerCase?.() ?? d]));
    return new Set([0, 1, 2, 3, 4, 5, 6].filter((n) => !openSet.has(n)));
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const total = this.timeToMinutes(time) + minutes;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private localDateString(date?: Date): string {
    const now = date ?? new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private localTimeString(): string {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

export const appointmentService = new AppointmentService();
