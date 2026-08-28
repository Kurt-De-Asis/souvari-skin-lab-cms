import { Request, Response, NextFunction } from 'express';
import { referralService } from './referrals.service';
import prisma from '../../config/database';

export class ReferralsController {
  async createReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await prisma.customers.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer profile not found' });
        return;
      }

      const membership = await prisma.memberships.findFirst({
        where: { customer_id: customer.id, status: 'active' },
      });

      if (!membership) {
        res.status(400).json({ success: false, message: 'No active membership found' });
        return;
      }

      const referral = await referralService.createReferral(membership.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Referral created successfully',
        data: referral,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyReferrals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await prisma.customers.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer profile not found' });
        return;
      }

      const membership = await prisma.memberships.findFirst({
        where: { customer_id: customer.id, status: 'active' },
      });

      if (!membership) {
        res.status(400).json({ success: false, message: 'No active membership found' });
        return;
      }

      const referrals = await referralService.getReferralsForMembership(membership.id);
      res.json({ success: true, data: referrals });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await referralService.list(req.query as any);
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
      const referral = await referralService.getById(id);
      res.json({ success: true, data: referral });
    } catch (error) {
      next(error);
    }
  }

  async approveReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status, credit_amount } = req.body;
      const referral = await referralService.approveReferral(id, status, credit_amount, req.user!.userId);
      res.json({
        success: true,
        message: `Referral ${status} successfully`,
        data: referral,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await prisma.customers.findUnique({
        where: { user_id: req.user!.userId },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer profile not found' });
        return;
      }

      const balance = await referralService.getReferralBalance(customer.id);
      res.json({ success: true, data: balance });
    } catch (error) {
      next(error);
    }
  }
}

export const referralsController = new ReferralsController();
