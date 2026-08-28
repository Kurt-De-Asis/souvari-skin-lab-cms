import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';

export class InventoryController {
  async listMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.listMovements(req.query as any);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStockProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await inventoryService.getLowStockProducts();
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.createAdjustment(req.body, req.user!.userId);
      res.status(201).json({
        success: true,
        message: 'Stock adjustment recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.createPurchase(req.body, req.user!.userId);
      res.status(201).json({
        success: true,
        message: 'Purchase recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(String(req.params.productId), 10);
      const result = await inventoryService.getProductMovements(productId, req.query as any);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
