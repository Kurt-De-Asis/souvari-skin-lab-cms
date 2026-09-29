import { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointments.service';
import type { OperatingDaysImpactQuery } from './appointments.validation';
import prisma from '../../config/database';
import { summarizeAppointmentPayment } from './payment-summary';

/** True when the authenticated customer owns the given appointment.
 * Module-level helper (no `this`) so it can be shared by controller handlers
 * that Express invokes as unbound method references. */
async function ownsAppointment(id: number, req: Request): Promise<boolean> {
  const customer = await prisma.customers.findFirst({
    where: { user_id: req.user!.userId, deleted_at: null },
    select: { id: true },
  });
  if (!customer) return false;
  const appointment = await prisma.appointments.findFirst({
    where: { id, deleted_at: null },
    select: { customer_id: true },
  });
  return !!appointment && appointment.customer_id === customer.id;
}

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
          cancellation_reason: true,
          customer: { select: { id: true, first_name: true, last_name: true } },
          staff: { select: { id: true, first_name: true, last_name: true } },
          service: { select: { id: true, name: true } },
          services: {
            select: { service_id: true, service: { select: { id: true, name: true } } },
            orderBy: { id: 'asc' },
          },
          quoted_price: true,
          discount_pct: true,
          transactions: { select: { id: true, type: true, payment_status: true, total_amount: true } },
        },
        orderBy: [{ appointment_date: 'asc' }, { start_time: 'asc' }],
      });

      const mapped = appointments.map((a) => {
        const payment = summarizeAppointmentPayment({
          quotedPrice: a.quoted_price,
          discountPct: a.discount_pct,
          transactions: a.transactions,
        });
        return {
          id: a.id,
          date: a.appointment_date,
          start_time: a.start_time,
          end_time: a.end_time,
          status: a.status,
          notes: a.notes,
          cancellation_reason: a.cancellation_reason,
          customer: a.customer,
          staff: a.staff,
          service: a.service,
          services: a.services.map((as) => ({ id: as.service_id, name: as.service.name })),
          // `paid` now means "nothing outstanding", so a booking that was
          // edited to add an unpaid service still opens the balance modal.
          paid: payment.balance <= 0,
          amount_due: payment.amount_due,
          paid_amount: payment.paid_amount,
          balance: payment.balance,
        };
      });

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
      const result = await appointmentService.createGroup(req.body, req.user?.role);
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
      const role = req.user!.role as 'admin' | 'staff' | 'customer';

      // Customers may only touch their own appointments, and only to cancel.
      if (role === 'customer' && !(await ownsAppointment(id, req))) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }

      const appointment = await appointmentService.update(id, req.body, {
        role,
        userId: req.user!.userId,
      });
      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const role = req.user!.role;

      // Customers may only see their own balance.
      if (role === 'customer' && !(await ownsAppointment(id, req))) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }

      const balance = await appointmentService.getBalance(id);
      res.json({ success: true, data: balance });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const role = req.user!.role as 'admin' | 'staff' | 'customer';
      let { status, reason } = req.body;

      if (role === 'customer') {
        if (!(await ownsAppointment(id, req))) {
          res.status(404).json({ success: false, message: 'Appointment not found' });
          return;
        }
        // A customer self-service cancellation is always a cancel. Never honour
        // a status a customer submits directly.
        status = 'cancelled';
      }

      const appointment = await appointmentService.update(
        id,
        { status, cancellation_reason: reason },
        { role, userId: req.user!.userId }
      );
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

  /**
   * Upcoming, still-actionable bookings per weekday. Backs the admin
   * "days the store is open" warning before a day is closed.
   */
  async operatingDaysImpact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Already parsed and validated into weekday names by the route's
      // `operatingDaysImpactQuerySchema`.
      const { days } = req.query as unknown as OperatingDaysImpactQuery;
      const impact = await appointmentService.getOperatingDaysImpact(days);
      res.json({ success: true, data: impact });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentsController = new AppointmentsController();
