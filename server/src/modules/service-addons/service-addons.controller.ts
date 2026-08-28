import { Request, Response } from 'express';
import serviceAddonsService from './service-addons.service';

class ServiceAddonsController {
  async list(req: Request, res: Response) {
    try {
      const result = await serviceAddonsService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await serviceAddonsService.getById(Number(req.params.id));
      if (!result) return res.status(404).json({ success: false, message: 'Add-on not found' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await serviceAddonsService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await serviceAddonsService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await serviceAddonsService.remove(Number(req.params.id));
      res.json({ success: true, message: 'Add-on deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ServiceAddonsController();
