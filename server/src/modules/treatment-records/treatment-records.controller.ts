import { Request, Response, NextFunction } from 'express';
import { treatmentRecordsService } from './treatment-records.service';

export class TreatmentRecordsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await treatmentRecordsService.list(req.query as any, req.user!);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const record = await treatmentRecordsService.getById(id);
      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await treatmentRecordsService.create(req.body, req.user!.userId);
      res.status(201).json({
        success: true,
        message: 'Treatment record created successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const record = await treatmentRecordsService.update(id, req.body, req.user!);
      res.json({
        success: true,
        message: 'Treatment record updated successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const treatmentRecordsController = new TreatmentRecordsController();
