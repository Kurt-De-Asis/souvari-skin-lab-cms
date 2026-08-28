import { Request, Response } from 'express';
import servicePricesService from './service-prices.service';

class ServicePricesController {
  async list(req: Request, res: Response) {
    try {
      const result = await servicePricesService.list(req.query as any);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMatrix(req: Request, res: Response) {
    try {
      const { group_slug, service_id } = req.query as any;
      const result = await servicePricesService.getMatrix(group_slug, service_id ? parseInt(service_id) : undefined);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await servicePricesService.update(parseInt(id), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async bulkUpdate(req: Request, res: Response) {
    try {
      const result = await servicePricesService.bulkUpdate(req.body.updates);
      res.json({ success: true, data: { updated: result.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new ServicePricesController();
