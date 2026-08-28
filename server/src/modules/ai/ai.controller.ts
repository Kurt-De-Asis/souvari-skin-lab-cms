import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';

export class AiController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await aiService.processMessage(req.body, req.user?.userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AiController();
