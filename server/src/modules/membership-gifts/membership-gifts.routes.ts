import { Router } from 'express';
import { membershipGiftsController } from './membership-gifts.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createGiftSchema,
  giftQuerySchema,
  approveGiftSchema,
} from './membership-gifts.validation';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createGiftSchema),
  membershipGiftsController.createGift
);

router.get('/me', membershipGiftsController.getMyGifts);

router.get(
  '/admin',
  authorize('admin'),
  validate(giftQuerySchema, 'query'),
  membershipGiftsController.list
);

router.get(
  '/admin/:id',
  authorize('admin'),
  membershipGiftsController.getById
);

router.put(
  '/admin/:id/approve',
  authorize('admin'),
  validate(approveGiftSchema),
  membershipGiftsController.approveGift
);

router.put(
  '/admin/:id/redeem',
  authorize('admin'),
  membershipGiftsController.redeemGift
);

export default router;
