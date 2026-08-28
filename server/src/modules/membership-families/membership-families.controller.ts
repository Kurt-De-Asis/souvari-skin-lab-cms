import { Request, Response } from 'express';
import membershipFamiliesService from './membership-families.service';

class MembershipFamiliesController {
  async list(req: Request, res: Response) {
    try {
      const result = await membershipFamiliesService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await membershipFamiliesService.getById(parseInt(req.params.id));
      if (!result) return res.status(404).json({ success: false, message: 'Family not found' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const result = await membershipFamiliesService.getByCode(req.params.code);
      if (!result) return res.status(404).json({ success: false, message: 'Family not found' });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await membershipFamiliesService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await membershipFamiliesService.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new MembershipFamiliesController();
