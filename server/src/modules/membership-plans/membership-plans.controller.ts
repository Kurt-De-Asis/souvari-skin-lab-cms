import { Request, Response, NextFunction } from 'express';
import { membershipPlanService } from './membership-plans.service';

export class MembershipPlanController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await membershipPlanService.list(req.query as any);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await membershipPlanService.listPublic();
      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const plan = await membershipPlanService.getById(id);
      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await membershipPlanService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Membership plan created successfully',
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const plan = await membershipPlanService.update(id, req.body);
      res.json({
        success: true,
        message: 'Membership plan updated successfully',
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await membershipPlanService.delete(id);
      res.json({
        success: true,
        message: 'Membership plan deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const membershipPlanController = new MembershipPlanController();
