import { Request, Response } from 'express';
import dataQualityService from './data-quality.service';

class DataQualityController {
  async list(req: Request, res: Response) {
    try {
      const result = await dataQualityService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const result = await dataQualityService.getSummary();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async resolve(req: Request, res: Response) {
    try {
      const result = await dataQualityService.resolve(parseInt(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async runScan(req: Request, res: Response) {
    try {
      const result = await dataQualityService.runScan();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new DataQualityController();
