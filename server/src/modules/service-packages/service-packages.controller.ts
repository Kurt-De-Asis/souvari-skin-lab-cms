import { Request, Response } from 'express';
import servicePackagesService from './service-packages.service';

class ServicePackagesController {
  async list(req: Request, res: Response) {
    try {
      const result = await servicePackagesService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await servicePackagesService.getById(parseInt(String(req.params.id)));
      if (!result) return res.status(404).json({ success: false, message: 'Package not found' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await servicePackagesService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await servicePackagesService.update(parseInt(String(req.params.id)), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await servicePackagesService.remove(parseInt(String(req.params.id)));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ServicePackagesController();
