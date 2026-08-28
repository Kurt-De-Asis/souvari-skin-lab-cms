import { Request, Response, NextFunction } from 'express';
import { monthlyPerksService } from './monthly-perks.service';
import prisma from '../../config/database';

export class MonthlyPerksController {
  async getMyPerk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await prisma.customers.findFirst({
        where: { user_id: req.user!.userId, deleted_at: null },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
        });
        return;
      }

      const membership = await prisma.memberships.findFirst({
        where: { customer_id: customer.id, status: 'active' },
        select: { id: true },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          message: 'No active membership found',
        });
        return;
      }

      const perk = await monthlyPerksService.getMyPerk(membership.id);
      res.json({
        success: true,
        data: perk,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await monthlyPerksService.list(req.query as any);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async usePerk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { membership_id, transaction_id, discount_amount } = req.body;

      const customer = await prisma.customers.findFirst({
        where: { user_id: req.user!.userId, deleted_at: null },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer profile not found',
        });
        return;
      }

      const membership = await prisma.memberships.findFirst({
        where: { id: membership_id, customer_id: customer.id },
        select: { id: true },
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this membership',
        });
        return;
      }

      const perk = await monthlyPerksService.usePerk(
        membership_id,
        discount_amount,
        transaction_id
      );

      res.json({
        success: true,
        message: 'Perk used successfully',
        data: perk,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPerk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { membership_id, year_month } = req.body;
      const perk = await monthlyPerksService.resetPerk(
        membership_id,
        year_month,
        req.user!.userId
      );

      res.json({
        success: true,
        message: 'Perk reset successfully',
        data: perk,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const monthlyPerksController = new MonthlyPerksController();
