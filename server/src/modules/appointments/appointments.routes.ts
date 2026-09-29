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
  operatingDaysImpactQuerySchema,
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
  '/operating-days-impact',
  authorize('admin'),
  validate(operatingDaysImpactQuerySchema, 'query'),
  appointmentsController.operatingDaysImpact
);

// Balance owed on a booking, itemised by service. Used when a booking was
// edited to add an unpaid service after payment was already taken. Declared
// before `/:id` so the literal path is not swallowed by the id param.
router.get(
  '/:id/balance',
  appointmentsController.getBalance
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

// Customers may reach these so they can cancel their own booking; the
// controller restricts them to cancellations of appointments they own.
router.patch(
  '/:id/status',
  authorize('admin', 'staff', 'customer'),
  validate(updateStatusSchema),
  appointmentsController.updateStatus
);

router.put(
  '/:id',
  authorize('admin', 'staff', 'customer'),
  validate(updateAppointmentSchema),
  appointmentsController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  appointmentsController.delete
);

export default router;
