import { Request, Response, NextFunction } from 'express';
import { membershipGiftService } from './membership-gifts.service';
import prisma from '../../config/database';

export class MembershipGiftsController {
  async createGift(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const membership = await prisma.memberships.findFirst({
        where: {
          customer_id: customer.id,
          status: 'active',
        },
        orderBy: { created_at: 'desc' },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          message: 'No active membership found',
        });
        return;
      }

      const gift = await membershipGiftService.createGift(membership.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Gift nominated successfully',
        data: gift,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyGifts(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const membership = await prisma.memberships.findFirst({
        where: {
          customer_id: customer.id,
          status: 'active',
        },
        orderBy: { created_at: 'desc' },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          message: 'No active membership found',
        });
        return;
      }

      const gifts = await membershipGiftService.getGiftsForMembership(membership.id);
      res.json({
        success: true,
        data: gifts,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await membershipGiftService.list(req.query as any);
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
      const gift = await membershipGiftService.getById(id);
      res.json({
        success: true,
        data: gift,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveGift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status, notes } = req.body;
      const gift = await membershipGiftService.approveGift(id, status, req.user!.userId, notes);
      res.json({
        success: true,
        message: `Gift ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        data: gift,
      });
    } catch (error) {
      next(error);
    }
  }

  async redeemGift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const gift = await membershipGiftService.redeemGift(id);
      res.json({
        success: true,
        message: 'Gift redeemed successfully',
        data: gift,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const membershipGiftsController = new MembershipGiftsController();
