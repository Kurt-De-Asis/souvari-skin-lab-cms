import { Router } from 'express';
import { staffController } from './staff.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createStaffSchema,
  updateStaffSchema,
  staffQuerySchema,
  updateSchedulesSchema,
  assignServiceSchema,
  availabilityQuerySchema,
} from './staff.validation';

const router = Router();

router.get(
  '/public/team',
  staffController.listPublic
);

router.use(authenticate);

router.get(
  '/service/:serviceId',
  staffController.getByService
);

router.get(
  '/',
  validate(staffQuerySchema, 'query'),
  staffController.list
);

router.get(
  '/:id',
  staffController.getById
);

router.post(
  '/',
  authorize('admin'),
  validate(createStaffSchema),
  staffController.create
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateStaffSchema),
  staffController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  staffController.remove
);

router.get(
  '/:id/schedules',
  staffController.getSchedules
);

router.put(
  '/:id/schedules',
  authorize('admin'),
  validate(updateSchedulesSchema),
  staffController.updateSchedules
);

router.get(
  '/:id/availability',
  validate(availabilityQuerySchema, 'query'),
  staffController.getAvailability
);

router.get(
  '/:id/services',
  staffController.getAssignedServices
);

router.post(
  '/:id/services',
  authorize('admin'),
  validate(assignServiceSchema),
  staffController.assignService
);

router.delete(
  '/:id/services/:serviceId',
  authorize('admin'),
  staffController.unassignService
);

export default router;
