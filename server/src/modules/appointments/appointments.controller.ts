import { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointments.service';
import prisma from '../../config/database';

export class AppointmentsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = { ...req.query } as any;

      if (req.user!.role === 'customer') {
        const customer = await prisma.customers.findFirst({
          where: { user_id: req.user!.userId, deleted_at: null },
          select: { id: true },
        });
        if (customer) {
          query.customer_id = customer.id;
        }
      }

      if (req.user!.role === 'staff') {
        const staff = await prisma.staff.findFirst({
          where: { user_id: req.user!.userId, deleted_at: null },
          select: { id: true },
        });
        if (!staff) {
          res.status(403).json({ success: false, message: 'Staff record not found' });
          return;
        }
        query.staff_id = staff.id;
      }

      const result = await appointmentService.list(query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const appointment = await appointmentService.getById(id);

      if (req.user!.role === 'customer') {
        const customer = await prisma.customers.findFirst({
          where: { user_id: req.user!.userId, deleted_at: null },
          select: { id: true },
        });
        if (!customer || appointment.customer_id !== customer.id) {
          res.status(404).json({ success: false, message: 'Appointment not found' });
          return;
        }
      }

      if (req.user!.role === 'staff') {
        const staff = await prisma.staff.findFirst({
          where: { user_id: req.user!.userId, deleted_at: null },
          select: { id: true },
        });
        if (!staff || appointment.staff_id !== staff.id) {
          res.status(404).json({ success: false, message: 'Appointment not found' });
          return;
        }
      }

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { staff_id, service_id, date, duration_minutes } = req.query;
      const result = await appointmentService.getAvailability(
        parseInt(String(staff_id), 10),
        parseInt(String(service_id), 10),
        String(date),
        duration_minutes ? parseInt(String(duration_minutes), 10) : undefined
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      const where: any = { deleted_at: null };
      if (start_date) where.appointment_date = { ...where.appointment_date, gte: new Date(String(start_date)) };
      if (end_date) where.appointment_date = { ...where.appointment_date, lte: new Date(String(end_date) + 'T23:59:59.999Z') };

      const appointments = await prisma.appointments.findMany({
        where,
        select: {
          id: true,
          appointment_date: true,
          start_time: true,
          end_time: true,
          status: true,
          notes: true,
          customer: { select: { id: true, first_name: true, last_name: true } },
          staff: { select: { id: true, first_name: true, last_name: true } },
          service: { select: { id: true, name: true } },
          services: {
            select: { service_id: true, service: { select: { id: true, name: true } } },
            orderBy: { id: 'asc' },
          },
          transactions: { select: { id: true, payment_status: true } },
        },
        orderBy: [{ appointment_date: 'asc' }, { start_time: 'asc' }],
      });

      const mapped = appointments.map((a) => ({
        id: a.id,
        date: a.appointment_date,
        start_time: a.start_time,
        end_time: a.end_time,
        status: a.status,
        notes: a.notes,
        customer: a.customer,
        staff: a.staff,
        service: a.service,
        services: a.services.map((as) => ({ id: as.service_id, name: as.service.name })),
        paid: a.transactions.some((t) => t.payment_status === 'paid'),
      }));

      res.json({ success: true, data: { appointments: mapped } });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await appointmentService.createGroup(req.body);
      res.status(201).json({
        success: true,
        message: 'Appointments created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async quote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.query.service_id), 10);
      if (!serviceId || Number.isNaN(serviceId)) {
        res.status(400).json({ success: false, message: 'service_id is required' });
        return;
      }

      let customerId: number | undefined;
      if (req.user!.role === 'customer') {
        const customer = await prisma.customers.findUnique({
          where: { user_id: req.user!.userId },
        });
        customerId = customer?.id;
      } else if (req.query.customer_id) {
        customerId = parseInt(String(req.query.customer_id), 10);
      }

      const membershipCode = typeof req.query.membership_code === 'string' ? req.query.membership_code : undefined;
      const pricing = await appointmentService.quote(serviceId, customerId, membershipCode);
      res.json({ success: true, data: pricing });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const appointment = await appointmentService.update(id, req.body);
      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status, reason } = req.body;
      const appointment = await appointmentService.update(id, { status, cancellation_reason: reason });
      res.json({
        success: true,
        message: 'Appointment status updated',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await appointmentService.delete(id);
      res.json({
        success: true,
        message: 'Appointment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentsController = new AppointmentsController();
