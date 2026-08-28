import { Router } from 'express';
import { referralsController } from './referrals.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createReferralSchema,
  referralQuerySchema,
  approveReferralSchema,
} from './referrals.validation';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createReferralSchema),
  referralsController.createReferral
);

router.get('/me', referralsController.getMyReferrals);

router.get('/balance', referralsController.getBalance);

router.get(
  '/admin',
  authorize('admin'),
  validate(referralQuerySchema, 'query'),
  referralsController.list
);

router.get('/admin/:id', authorize('admin'), referralsController.getById);

router.put(
  '/admin/:id/approve',
  authorize('admin'),
  validate(approveReferralSchema),
  referralsController.approveReferral
);

export default router;
