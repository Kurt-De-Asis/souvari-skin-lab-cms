import { Request, Response, NextFunction } from 'express';
import { servicesService } from './services.service';

export class ServicesController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await servicesService.list(req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await servicesService.listPublic(req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const service = await servicesService.getById(id);
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await servicesService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const service = await servicesService.update(id, req.body);
      res.json({
        success: true,
        message: 'Service updated successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await servicesService.delete(id);
      res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async assignStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.id), 10);
      const assignment = await servicesService.assignStaff(serviceId, req.body.staff_id);
      res.status(201).json({
        success: true,
        message: 'Staff assigned to service',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkAssignStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.id), 10);
      const result = await servicesService.bulkAssignStaff(serviceId, req.body);
      res.status(201).json({
        success: true,
        message: `${result.count} staff assigned to service`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.id), 10);
      const staffId = parseInt(String(req.params.staffId), 10);
      await servicesService.removeStaff(serviceId, staffId);
      res.json({ success: true, message: 'Staff removed from service' });
    } catch (error) {
      next(error);
    }
  }

  async configureInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.id), 10);
      const item = await servicesService.configureInventory(serviceId, req.body);
      res.status(201).json({
        success: true,
        message: 'Inventory consumption configured',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.id), 10);
      const itemId = parseInt(String(req.params.itemId), 10);
      const item = await servicesService.updateInventoryItem(serviceId, itemId, req.body);
      res.json({
        success: true,
        message: 'Inventory item updated',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = parseInt(String(req.params.id), 10);
      const itemId = parseInt(String(req.params.itemId), 10);
      await servicesService.removeInventoryItem(serviceId, itemId);
      res.json({ success: true, message: 'Inventory item removed from service' });
    } catch (error) {
      next(error);
    }
  }
}

export const servicesController = new ServicesController();
