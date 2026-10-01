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

// Self-service enrolment is closed: only admin/staff may put a customer on a
// plan. Kept for admin-side flows that reuse the avail handler.
router.post(
  '/avail',
  authorize('admin', 'staff'),
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

// "I'll pay at the store" is a customer-initiated purchase step, so it is
// staff-only. Balances are collected through the admin collect-payment route.
router.post(
  '/:id/pay-in-store',
  authorize('admin', 'staff'),
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
