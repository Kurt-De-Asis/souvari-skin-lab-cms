import { Router } from 'express';
import { membershipsController } from './memberships.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createMembershipSchema,
  updateMembershipStatusSchema,
  extendMembershipSchema,
  membershipQuerySchema,
  availMembershipSchema,
  membershipPaymentSchema,
} from './memberships.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'staff'),
  validate(membershipQuerySchema, 'query'),
  membershipsController.list
);

router.get('/me', membershipsController.getMyMembership);

router.get('/validate/:code', membershipsController.validateCode);

router.post(
  '/avail',
  validate(availMembershipSchema),
  membershipsController.availPlan
);

router.get('/:id', authorize('admin', 'staff'), membershipsController.getById);

router.post(
  '/',
  authorize('admin', 'staff'),
  validate(createMembershipSchema),
  membershipsController.create
);

router.put(
  '/:id/status',
  authorize('admin'),
  validate(updateMembershipStatusSchema),
  membershipsController.updateStatus
);

router.put(
  '/:id/extend',
  authorize('admin'),
  validate(extendMembershipSchema),
  membershipsController.extend
);

router.post(
  '/:id/pay-in-store',
  membershipsController.requestPayInStore
);

router.get(
  '/:id/payments',
  authorize('admin', 'staff'),
  membershipsController.listPayments
);

router.get(
  '/:id/payments/me',
  membershipsController.listMyPayments
);

router.post(
  '/:id/payments',
  authorize('admin', 'staff'),
  validate(membershipPaymentSchema),
  membershipsController.recordPayment
);

export default router;
