import { Router } from 'express';
import { customerController } from './customers.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema } from './customers.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/me',
  customerController.getMe
);

router.put(
  '/me',
  validate(updateCustomerSchema),
  customerController.updateMe
);

router.get(
  '/',
  authorize('admin', 'staff'),
  validate(customerQuerySchema, 'query'),
  customerController.list
);

router.get(
  '/:id',
  authorize('admin', 'staff'),
  customerController.getById
);

router.post(
  '/',
  authorize('admin'),
  validate(createCustomerSchema),
  customerController.create
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateCustomerSchema),
  customerController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  customerController.delete
);

export default router;
