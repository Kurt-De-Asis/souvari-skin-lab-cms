import { Request, Response, NextFunction } from 'express';
import { contactService } from './contact.service';

class ContactController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactService.sendMessage(req.body);
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const contactController = new ContactController();