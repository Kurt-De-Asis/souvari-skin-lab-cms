import { Router } from 'express';
import { appointmentsController } from './appointments.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createAppointmentSchema,
  createGroupAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
  listAppointmentsQuerySchema,
} from './appointments.validation';

const router = Router();

router.get(
  '/availability',
  appointmentsController.getAvailability
);

router.use(authenticate);

router.get(
  '/',
  validate(listAppointmentsQuerySchema, 'query'),
  appointmentsController.list
);

router.get(
  '/calendar',
  appointmentsController.getCalendar
);

router.get(
  '/quote',
  appointmentsController.quote
);

router.get(
  '/:id',
  appointmentsController.getById
);

router.post(
  '/',
  authorize('admin', 'staff', 'customer'),
  validate(createAppointmentSchema),
  appointmentsController.create
);

router.post(
  '/group',
  authorize('admin', 'staff', 'customer'),
  validate(createGroupAppointmentSchema),
  appointmentsController.createGroup
);

router.patch(
  '/:id/status',
  authorize('admin', 'staff'),
  validate(updateStatusSchema),
  appointmentsController.updateStatus
);

router.put(
  '/:id',
  authorize('admin', 'staff'),
  validate(updateAppointmentSchema),
  appointmentsController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  appointmentsController.delete
);

export default router;
