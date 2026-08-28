import { Router } from 'express';
import { transactionsController } from './transactions.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionIdParamSchema,
  voidTransactionSchema,
  refundTransactionSchema,
} from './transactions.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listTransactionsQuerySchema, 'query'),
  transactionsController.getTransactions
);

router.get(
  '/:id',
  validate(transactionIdParamSchema, 'params'),
  transactionsController.getTransactionById
);

router.post(
  '/',
  authorize('admin', 'staff'),
  validate(createTransactionSchema),
  transactionsController.createTransaction
);

router.post(
  '/:id/void',
  authorize('admin'),
  validate(transactionIdParamSchema, 'params'),
  validate(voidTransactionSchema),
  transactionsController.voidTransaction
);

router.post(
  '/:id/refund',
  authorize('admin', 'staff'),
  validate(transactionIdParamSchema, 'params'),
  validate(refundTransactionSchema),
  transactionsController.refundTransaction
);

export default router;
