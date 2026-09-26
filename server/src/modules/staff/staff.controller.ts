import { Request, Response, NextFunction } from 'express';
import { staffService } from './staff.service';

export class StaffController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await staffService.findAll(req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await staffService.findById(Number(String(req.params.id)));
      res.json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await staffService.create(req.body);
      res.status(201).json({ success: true, message: 'Staff member created', data: staff });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await staffService.update(Number(String(req.params.id)), req.body);
      res.json({ success: true, message: 'Staff member updated', data: staff });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await staffService.remove(Number(String(req.params.id)), req.user?.userId);
      res.json({ success: true, message: 'Staff member deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await staffService.getSchedules(Number(String(req.params.id)));
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  async updateSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schedules = await staffService.updateSchedules(Number(String(req.params.id)), req.body);
      res.json({ success: true, message: 'Schedules updated', data: schedules });
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const availability = await staffService.getAvailability(
        Number(String(req.params.id)),
        req.query.date as string
      );
      res.json({ success: true, data: availability });
    } catch (error) {
      next(error);
    }
  }

  async assignService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await staffService.assignService(Number(String(req.params.id)), req.body);
      res.status(201).json({ success: true, message: 'Service assigned', data: assignment });
    } catch (error) {
      next(error);
    }
  }

  async unassignService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await staffService.unassignService(Number(String(req.params.id)), Number(String(req.params.serviceId)));
      res.json({ success: true, message: 'Service unassigned' });
    } catch (error) {
      next(error);
    }
  }

  async getAssignedServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = await staffService.getAssignedServices(Number(String(req.params.id)));
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  }

  async getByService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await staffService.getStaffByService(Number(String(req.params.serviceId)));
      res.json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await staffService.findPublicTeam();
      res.json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();
