import { Request, Response } from 'express';
import resourcesService from './resources.service';

class ResourcesController {
  async list(req: Request, res: Response) {
    try {
      const result = await resourcesService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await resourcesService.getById(Number(req.params.id));
      if (!result) return res.status(404).json({ success: false, message: 'Resource not found' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await resourcesService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await resourcesService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await resourcesService.remove(Number(req.params.id));
      res.json({ success: true, message: 'Resource deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async assignToService(req: Request, res: Response) {
    try {
      const result = await resourcesService.assignToService(Number(req.params.serviceId), req.body.resource_ids);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getResourcesForService(req: Request, res: Response) {
    try {
      const result = await resourcesService.getResourcesForService(Number(req.params.serviceId));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ResourcesController();
