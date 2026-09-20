import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getDashboard();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getRevenue(req.query as any);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointmentTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getAppointmentTrends(req.query as any);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getServices();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getInventory();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getSummary(req.query as any);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
