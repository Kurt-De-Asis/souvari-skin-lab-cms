import { Request, Response, NextFunction } from 'express';
import { reviewService } from './reviews.service';

export class ReviewsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.create(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reviewService.list(req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await reviewService.getMine(req.user!.userId);
      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }

  async getByAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = parseInt(String(req.params.appointmentId), 10);
      const review = await reviewService.getByAppointment(appointmentId, req.user!.userId);
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  async getServiceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.serviceId), 10);
      const stats = await reviewService.getServiceStats(serviceId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewsController = new ReviewsController();