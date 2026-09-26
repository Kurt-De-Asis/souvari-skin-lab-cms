import { Request, Response } from 'express';
import serviceCategoriesService from './service-categories.service';

class ServiceCategoriesController {
  async browse(req: Request, res: Response) {
    try {
      const result = await serviceCategoriesService.browse();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const result = await serviceCategoriesService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await serviceCategoriesService.getById(Number(req.params.id));
      if (!result) return res.status(404).json({ success: false, message: 'Category not found' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await serviceCategoriesService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await serviceCategoriesService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await serviceCategoriesService.remove(Number(req.params.id));
      res.json({ success: true, message: 'Category deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new ServiceCategoriesController();
