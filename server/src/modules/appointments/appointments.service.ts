import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import pricingService from '../../services/pricing.service';
import { notificationDispatch } from '../../services/notification-dispatch.service';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  ListAppointmentsQuery,
} from './appointments.validation';

export class AppointmentService {
  async quote(serviceId: number, customerId?: number) {
    const pricing = await pricingService.calculatePrice({ serviceId }, customerId);
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.appointments.count({ where }),
    ]);

    return createPaginatedResult(appointments, total, { page, limit, skip });
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
        status_history: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        treatment_record: {
          select: { id: true, notes: true, satisfaction_rating: true },
        },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    return appointment;
  }

  async create(data: CreateAppointmentInput) {
    const customer = await prisma.customers.findFirst({
      where: { id: data.customer_id, deleted_at: null },
    });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const staff = await prisma.staff.findFirst({
      where: { id: data.staff_id, deleted_at: null },
    });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const service = await prisma.services.findFirst({
      where: { id: data.service_id, deleted_at: null },
    });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    let endTime = data.end_time;
    if (!endTime) {
      const [hours, minutes] = data.start_time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + service.duration_minutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMins = totalMinutes % 60;
      endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    }

    const conflicts = await prisma.appointments.findMany({
      where: {
        staff_id: data.staff_id,
        appointment_date: new Date(data.appointment_date),
        status: { notIn: ['cancelled', 'no_show'] },
        deleted_at: null,
        OR: [
          { start_time: { lt: data.end_time! }, end_time: { gt: data.start_time } },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError('Staff member already has an appointment during this time slot', 409);
    }

    let quotedPrice: number | null = null;
    try {
      const pricing = await pricingService.calculatePrice(
        { serviceId: data.service_id },
        data.customer_id
      );
      quotedPrice = pricing.finalTotal;
    } catch {
      quotedPrice = null;
    }

    const appointment = await prisma.appointments.create({
      data: {
        customer_id: data.customer_id,
        staff_id: data.staff_id,
        service_id: data.service_id,
        appointment_date: new Date(data.appointment_date),
        start_time: data.start_time,
        end_time: endTime,
        quoted_price: quotedPrice,
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

  async update(id: number, data: UpdateAppointmentInput) {
    const existing = await prisma.appointments.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Appointment not found', 404);
    }

    const updateData: any = {};
    if (data.staff_id !== undefined) updateData.staff_id = data.staff_id;
    if (data.service_id !== undefined) updateData.service_id = data.service_id;
    if (data.appointment_date !== undefined) updateData.appointment_date = new Date(data.appointment_date);
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.cancellation_reason !== undefined) updateData.cancellation_reason = data.cancellation_reason;

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

      // Auto-create transaction when appointment is completed
      if (data.status === 'completed') {
        try {
          const price = existing.quoted_price ? Number(existing.quoted_price) : Number(updated.service.price);
          if (price > 0) {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const prefix = `TXN-${dateStr}-`;
            const lastTxn = await prisma.transactions.findFirst({
              where: { transaction_number: { startsWith: prefix } },
              orderBy: { transaction_number: 'desc' },
              select: { transaction_number: true },
            });
            let nextNumber = 1;
            if (lastTxn) {
              const parts = lastTxn.transaction_number.split('-');
              nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
            }
            const txnNumber = `${prefix}${String(nextNumber).padStart(5, '0')}`;

            await prisma.transactions.create({
              data: {
                transaction_number: txnNumber,
                customer_id: existing.customer_id,
                staff_id: existing.staff_id,
                appointment_id: id,
                type: 'sale',
                subtotal: price,
                total_amount: price,
                payment_method: 'cash',
                payment_status: 'paid',
                paid_at: now,
                notes: `Auto-created on appointment #${id} completion`,
                items: {
                  create: [{
                    service_id: existing.service_id,
                    description: updated.service.name,
                    quantity: 1,
                    unit_price: price,
                    line_total: price,
                  }],
                },
              },
            });
          }
        } catch (err: any) {
          // Transaction creation failure should not block status update
        }
      }

      return updated;
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

  async getAvailability(staffId: number, serviceId: number, date: string) {
    if (!staffId || !serviceId || !date) {
      throw new AppError('staff_id, service_id, and date are required', 400);
    }

    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
    });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const existingAppointments = await prisma.appointments.findMany({
      where: {
        staff_id: staffId,
        appointment_date: new Date(date),
        status: { notIn: ['cancelled', 'no_show'] },
        deleted_at: null,
      },
      select: { start_time: true, end_time: true },
      orderBy: { start_time: 'asc' },
    });

    const allSlots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        allSlots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }

    const bookedSlots = new Set<string>();
    for (const appt of existingAppointments) {
      for (const slot of allSlots) {
        if (slot >= appt.start_time && slot < appt.end_time) {
          bookedSlots.add(slot);
        }
      }
    }

    const durationMinutes = service.duration_minutes;
    const slotsNeeded = Math.ceil(durationMinutes / 30);

    const availableSlots = allSlots.filter((slot, idx) => {
      if (bookedSlots.has(slot)) return false;
      for (let i = 0; i < slotsNeeded; i++) {
        if (idx + i >= allSlots.length) return false;
        if (bookedSlots.has(allSlots[idx + i])) return false;
      }
      return true;
    });

    return { date, staff_id: staffId, service_id: serviceId, duration_minutes: durationMinutes, available_slots: availableSlots, booked_appointments: existingAppointments };
  }
}

export const appointmentService = new AppointmentService();
