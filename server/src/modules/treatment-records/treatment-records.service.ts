import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  getPaginationParams,
  createPaginatedResult,
  PaginatedResult,
} from '../../utils/pagination';
import {
  ListTreatmentRecordsQuery,
  CreateTreatmentRecordInput,
  UpdateTreatmentRecordInput,
} from './treatment-records.validation';

class TreatmentRecordsService {
  async list(
    query: ListTreatmentRecordsQuery,
    user: { userId: number; role: string }
  ): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { customer_id, staff_id, start_date, end_date } = query;

    const where: any = {};

    if (user.role === 'customer') {
      const customer = await prisma.customers.findUnique({
        where: { user_id: user.userId },
      });
      if (!customer) {
        throw new AppError('Customer profile not found', 404);
      }
      where.customer_id = customer.id;
    } else if (user.role === 'staff') {
      const staff = await prisma.staff.findUnique({
        where: { user_id: user.userId },
      });
      if (!staff) {
        throw new AppError('Staff profile not found', 404);
      }
      // If a specific customer is requested, staff can see all records for that customer
      if (customer_id) {
        where.customer_id = customer_id;
      } else {
        where.staff_id = staff.id;
      }
    }

    if (customer_id && user.role === 'admin') {
      where.customer_id = customer_id;
    }

    if (staff_id && user.role === 'admin') {
      where.staff_id = staff_id;
    }

    if (start_date || end_date) {
      where.treatment_date = {};
      if (start_date) {
        where.treatment_date.gte = new Date(start_date);
      }
      if (end_date) {
        where.treatment_date.lte = new Date(end_date);
      }
    }

    const [records, total] = await Promise.all([
      prisma.treatment_records.findMany({
        where,
        include: {
          appointment: {
            select: { id: true, appointment_date: true, start_time: true, end_time: true, status: true },
          },
          customer: {
            select: { id: true, first_name: true, last_name: true },
          },
          staff: {
            select: { id: true, first_name: true, last_name: true },
          },
          service: {
            select: { id: true, name: true, price: true },
          },
        },
        orderBy: { treatment_date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.treatment_records.count({ where }),
    ]);

    return createPaginatedResult(records, total, { page, limit, skip });
  }

  async getById(id: number) {
    const record = await prisma.treatment_records.findUnique({
      where: { id },
      include: {
        appointment: {
          select: {
            id: true,
            appointment_date: true,
            start_time: true,
            end_time: true,
            status: true,
            notes: true,
          },
        },
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            user: { select: { phone: true } },
          },
        },
        staff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            position: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration_minutes: true,
          },
        },
      },
    });

    if (!record) {
      throw new AppError('Treatment record not found', 404);
    }

    return record;
  }

  async create(data: CreateTreatmentRecordInput, userId: number) {
    const staff = await prisma.staff.findUnique({
      where: { user_id: userId },
    });

    if (!staff) {
      throw new AppError('Staff profile not found', 404);
    }

    if (data.appointment_id) {
      const appointment = await prisma.appointments.findUnique({
        where: { id: data.appointment_id },
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      if (appointment.status !== 'completed') {
        throw new AppError('Treatment record can only be created for completed appointments', 400);
      }

      const existingRecord = await prisma.treatment_records.findUnique({
        where: { appointment_id: data.appointment_id },
      });

      if (existingRecord) {
        const record = await prisma.treatment_records.update({
          where: { id: existingRecord.id },
          data: {
            notes: data.notes ?? existingRecord.notes,
            recommendations: data.recommendations ?? existingRecord.recommendations,
            side_effects: data.side_effects ?? existingRecord.side_effects,
            before_photo: data.before_photo ?? existingRecord.before_photo,
            after_photo: data.after_photo ?? existingRecord.after_photo,
          },
          include: {
            appointment: {
              select: { id: true, appointment_date: true, start_time: true, end_time: true, status: true },
            },
            customer: {
              select: { id: true, first_name: true, last_name: true },
            },
            staff: {
              select: { id: true, first_name: true, last_name: true },
            },
            service: {
              select: { id: true, name: true, price: true },
            },
          },
        });

        return record;
      }

      const record = await prisma.treatment_records.create({
        data: {
          appointment_id: data.appointment_id,
          staff_id: staff.id,
          customer_id: appointment.customer_id,
          service_id: appointment.service_id,
          treatment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          notes: data.notes ?? null,
          recommendations: data.recommendations ?? null,
          side_effects: data.side_effects ?? null,
          before_photo: data.before_photo ?? null,
          after_photo: data.after_photo ?? null,
        },
        include: {
          appointment: {
            select: { id: true, appointment_date: true, start_time: true, end_time: true, status: true },
          },
          customer: {
            select: { id: true, first_name: true, last_name: true },
          },
          staff: {
            select: { id: true, first_name: true, last_name: true },
          },
          service: {
            select: { id: true, name: true, price: true },
          },
        },
      });

      return record;
    }

    // Handle general clinical notes (no appointment_id)
    const record = await prisma.treatment_records.create({
      data: {
        staff_id: staff.id,
        customer_id: data.customer_id,
        treatment_date: data.treatment_date ? new Date(data.treatment_date) : new Date(),
        notes: data.notes ?? null,
        recommendations: data.recommendations ?? null,
        side_effects: data.side_effects ?? null,
      },
      include: {
        customer: {
          select: { id: true, first_name: true, last_name: true },
        },
        staff: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    return record;
  }

  async update(
    id: number,
    data: UpdateTreatmentRecordInput,
    user: { userId: number; role: string }
  ) {
    const existing = await prisma.treatment_records.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Treatment record not found', 404);
    }

    if (user.role === 'staff') {
      const staff = await prisma.staff.findUnique({
        where: { user_id: user.userId },
      });

      if (!staff || staff.id !== existing.staff_id) {
        throw new AppError('You can only update your own treatment records', 403);
      }
    }

    const record = await prisma.treatment_records.update({
      where: { id },
      data: {
        notes: data.notes,
        recommendations: data.recommendations,
        side_effects: data.side_effects,
        before_photo: data.before_photo,
        after_photo: data.after_photo,
      },
      include: {
        appointment: {
          select: { id: true, appointment_date: true, start_time: true, end_time: true, status: true },
        },
        customer: {
          select: { id: true, first_name: true, last_name: true },
        },
        staff: {
          select: { id: true, first_name: true, last_name: true },
        },
        service: {
          select: { id: true, name: true, price: true },
        },
      },
    });

    return record;
  }
}

export const treatmentRecordsService = new TreatmentRecordsService();
