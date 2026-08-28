import { Request, Response, NextFunction } from 'express';
import { customerService } from './customers.service';

export class CustomerController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerService.list(req.query as any);
      res.json({
        success: true,
        data: result,
        message: 'Customers retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const customer = await customerService.getById(id);
      res.json({
        success: true,
        data: customer,
        message: 'Customer retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.create(req.body);
      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const customer = await customerService.update(id, req.body);
      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await customerService.delete(id);
      res.json({
        success: true,
        data: null,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getByUserId(req.user!.userId);
      res.json({
        success: true,
        data: customer,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.updateByUserId(req.user!.userId, req.body);
      res.json({
        success: true,
        data: customer,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
