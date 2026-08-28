import { Router } from 'express';
import { loyaltyController } from './loyalty.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  loyaltyQuerySchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  adjustSpendSchema,
} from './loyalty.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get(
  '/progress/:membershipId',
  loyaltyController.getProgress
);

router.get(
  '/milestones',
  validate(loyaltyQuerySchema, 'query'),
  loyaltyController.listMilestones
);

router.post(
  '/milestones',
  validate(createMilestoneSchema),
  loyaltyController.createMilestone
);

router.put(
  '/milestones/:id',
  validate(updateMilestoneSchema),
  loyaltyController.updateMilestone
);

router.delete(
  '/milestones/:id',
  loyaltyController.deleteMilestone
);

router.post(
  '/adjust',
  validate(adjustSpendSchema),
  loyaltyController.adjustSpend
);

router.post(
  '/recalculate/:membershipId',
  loyaltyController.recalculateProgress
);

export default router;
