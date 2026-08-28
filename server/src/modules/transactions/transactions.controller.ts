import { Request, Response, NextFunction } from 'express';
import { transactionService } from './transactions.service';
import prisma from '../../config/database';

export class TransactionsController {
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.createTransaction(req.body, req.user!.userId);
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = { ...req.query } as any;

      if (req.user!.role === 'customer') {
        const customer = await prisma.customers.findFirst({
          where: { user_id: req.user!.userId, deleted_at: null },
          select: { id: true },
        });
        if (customer) {
          query.customer_id = customer.id;
        }
      }

      const result = await transactionService.getTransactions(query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const transaction = await transactionService.getTransactionById(id);

      if (req.user!.role === 'customer') {
        const customer = await prisma.customers.findFirst({
          where: { user_id: req.user!.userId, deleted_at: null },
          select: { id: true },
        });
        if (!customer || transaction.customer_id !== customer.id) {
          res.status(404).json({ success: false, message: 'Transaction not found' });
          return;
        }
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async voidTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const transaction = await transactionService.voidTransaction(id, req.body, req.user!.userId);
      res.json({
        success: true,
        message: 'Transaction voided successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async refundTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const refund = await transactionService.refundTransaction(id, req.body, req.user!.userId);
      res.status(201).json({
        success: true,
        message: 'Refund processed successfully',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionsController = new TransactionsController();
