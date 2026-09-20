import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import { CreateReviewInput, ReviewQuery } from './reviews.validation';

export class ReviewService {
  async create(userId: number, data: CreateReviewInput) {
    const customer = await prisma.customers.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    const appointment = await prisma.appointments.findFirst({
      where: { id: data.appointment_id, deleted_at: null },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.customer_id !== customer.id) {
      throw new AppError('You can only review your own appointments', 403);
    }

    if (appointment.status !== 'completed') {
      throw new AppError('Appointments can only be reviewed once completed', 400);
    }

    const existing = await prisma.service_reviews.findUnique({
      where: { appointment_id: data.appointment_id },
    });

    if (existing) {
      throw new AppError('You have already reviewed this appointment', 409);
    }

    return prisma.service_reviews.create({
      data: {
        customer_id: customer.id,
        appointment_id: data.appointment_id,
        service_id: appointment.service_id,
        staff_id: appointment.staff_id,
        rating: data.rating,
        feedback: data.feedback ?? null,
      },
      include: {
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async list(query: ReviewQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { service_id, staff_id, rating } = query;

    const where: any = {};

    if (service_id) where.service_id = service_id;
    if (staff_id) where.staff_id = staff_id;
    if (rating) where.rating = rating;

    const [reviews, total] = await Promise.all([
      prisma.service_reviews.findMany({
        where,
        include: {
          customer: { select: { id: true, first_name: true, last_name: true } },
          service: { select: { id: true, name: true } },
          staff: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.service_reviews.count({ where }),
    ]);

    return createPaginatedResult(reviews, total, { page, limit, skip });
  }

  async getMine(userId: number) {
    const customer = await prisma.customers.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    return prisma.service_reviews.findMany({
      where: { customer_id: customer.id },
      include: {
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, first_name: true, last_name: true } },
        appointment: { select: { id: true, appointment_date: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getByAppointment(appointmentId: number, userId: number) {
    const customer = await prisma.customers.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    return prisma.service_reviews.findFirst({
      where: {
        appointment_id: appointmentId,
        customer_id: customer.id,
      },
    });
  }

  async getServiceStats(serviceId: number) {
    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
      select: { id: true, name: true },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const aggregate = await prisma.service_reviews.aggregate({
      where: { service_id: serviceId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      service,
      average_rating: aggregate._avg.rating ?? 0,
      total_reviews: aggregate._count._all,
    };
  }
}

export const reviewService = new ReviewService();