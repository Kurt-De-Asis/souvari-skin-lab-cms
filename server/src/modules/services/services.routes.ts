import { Router } from 'express';
import { servicesController } from './services.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceQuerySchema,
  assignStaffSchema,
  bulkAssignStaffSchema,
  configureInventorySchema,
  updateInventoryItemSchema,
  publicServiceQuerySchema,
} from './services.validation';

const router = Router();

router.get(
  '/browse',
  validate(publicServiceQuerySchema, 'query'),
  servicesController.listPublic
);

router.get(
  '/',
  authenticate,
  validate(serviceQuerySchema, 'query'),
  servicesController.list
);

router.get(
  '/:id',
  authenticate,
  servicesController.getById
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createServiceSchema),
  servicesController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateServiceSchema),
  servicesController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  servicesController.delete
);

router.post(
  '/:id/staff',
  authenticate,
  authorize('admin'),
  validate(assignStaffSchema),
  servicesController.assignStaff
);

router.post(
  '/:id/staff/bulk',
  authenticate,
  authorize('admin'),
  validate(bulkAssignStaffSchema),
  servicesController.bulkAssignStaff
);

router.delete(
  '/:id/staff/:staffId',
  authenticate,
  authorize('admin'),
  servicesController.removeStaff
);

router.post(
  '/:id/inventory',
  authenticate,
  authorize('admin'),
  validate(configureInventorySchema),
  servicesController.configureInventory
);

router.put(
  '/:id/inventory/:itemId',
  authenticate,
  authorize('admin'),
  validate(updateInventoryItemSchema),
  servicesController.updateInventoryItem
);

router.delete(
  '/:id/inventory/:itemId',
  authenticate,
  authorize('admin'),
  servicesController.removeInventoryItem
);

export default router;
