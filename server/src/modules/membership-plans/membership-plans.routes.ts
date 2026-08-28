import { Router } from 'express';
import { membershipPlanController } from './membership-plans.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
  membershipPlanQuerySchema,
} from './membership-plans.validation';

const router = Router();

router.get(
  '/browse',
  membershipPlanController.listPublic
);

router.use(authenticate);

router.get(
  '/',
  authorize('admin'),
  validate(membershipPlanQuerySchema, 'query'),
  membershipPlanController.list
);

router.get(
  '/:id',
  authorize('admin'),
  membershipPlanController.getById
);

router.post(
  '/',
  authorize('admin'),
  validate(createMembershipPlanSchema),
  membershipPlanController.create
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateMembershipPlanSchema),
  membershipPlanController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  membershipPlanController.delete
);

export default router;
