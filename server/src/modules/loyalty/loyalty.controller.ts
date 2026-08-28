import { Request, Response, NextFunction } from 'express';
import { loyaltyService } from './loyalty.service';

export class LoyaltyController {
  async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const membershipId = parseInt(String(req.params.membershipId), 10);
      const result = await loyaltyService.getProgress(membershipId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loyaltyService.listMilestones(req.query as any);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const milestone = await loyaltyService.createMilestone(req.body);
      res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const milestone = await loyaltyService.updateMilestone(id, req.body);
      res.json({
        success: true,
        message: 'Milestone updated successfully',
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await loyaltyService.deleteMilestone(id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustSpend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { membership_id, amount, reason } = req.body;
      const result = await loyaltyService.adjustSpend(
        membership_id,
        amount,
        reason,
        req.user!.userId
      );
      res.json({
        success: true,
        message: 'Spend adjusted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async recalculateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const membershipId = parseInt(String(req.params.membershipId), 10);
      const result = await loyaltyService.recalculateProgress(membershipId);
      res.json({
        success: true,
        message: 'Progress recalculated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const loyaltyController = new LoyaltyController();
