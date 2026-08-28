import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';

export class SettingsController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getAll();
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getPublic();
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.update(req.body);
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
