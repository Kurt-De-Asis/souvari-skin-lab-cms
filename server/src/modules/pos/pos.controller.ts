import { Request, Response } from 'express';
import posService from './pos.service';

class POSController {
  async getQuote(req: Request, res: Response) {
    try {
      const result = await posService.getQuote(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async checkout(req: Request, res: Response) {
    try {
      const result = await posService.checkout(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new POSController();
