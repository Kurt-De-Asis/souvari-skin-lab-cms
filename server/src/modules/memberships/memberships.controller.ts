import { Request, Response, NextFunction } from 'express';
import { membershipService } from './memberships.service';
import prisma from '../../config/database';

export class MembershipsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await membershipService.list(req.query as any);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const membership = await membershipService.getById(id);
      res.json({
        success: true,
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await prisma.customers.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
        });
        return;
      }

      const membership = await membershipService.getByCustomerId(customer.id);
      res.json({
        success: true,
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const membership = await membershipService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Membership created successfully',
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async availPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plan_id, notes, payment_method, payment_type, amount_paid } = req.body;
      const membership = await membershipService.availPlan(
        req.user!.userId,
        { plan_id, notes, payment_method, payment_type, amount_paid }
      );
      res.status(201).json({
        success: true,
        message: 'Membership availed successfully',
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status, reason } = req.body;
      const membership = await membershipService.updateStatus(id, status, reason);
      res.json({
        success: true,
        message: 'Membership status updated successfully',
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async extend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { months, reason, payment_method, payment_type, amount_paid } = req.body;
      const membership = await membershipService.extend(id, months, reason, payment_method, payment_type, amount_paid);
      res.json({
        success: true,
        message: 'Membership extended successfully',
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await membershipService.recordPayment(id, req.body, req.user?.userId);
      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const payments = await membershipService.listPayments(id);
      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestPayInStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const membership = await membershipService.requestPayInStore(
        id,
        req.user!.role,
        req.user!.userId
      );
      res.json({
        success: true,
        message: 'Payment at store requested. The clinic has been notified.',
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  async listMyPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await membershipService.ensureOwnership(id, req.user!.role, req.user!.userId);
      const payments = await membershipService.listPayments(id);
      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params as { code: string };
      const membership = await membershipService.validateCode(code);
      res.json({
        success: true,
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const membershipsController = new MembershipsController();
