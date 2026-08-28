import { Router } from 'express';
import { monthlyPerksController } from './monthly-perks.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  monthlyPerksQuerySchema,
  usePerkSchema,
  resetPerkSchema,
} from './monthly-perks.validation';

const router = Router();

router.use(authenticate);

router.get('/me', monthlyPerksController.getMyPerk);

router.post(
  '/use',
  validate(usePerkSchema),
  monthlyPerksController.usePerk
);

router.get(
  '/admin',
  authorize('admin'),
  validate(monthlyPerksQuerySchema, 'query'),
  monthlyPerksController.list
);

router.post(
  '/admin/reset',
  authorize('admin'),
  validate(resetPerkSchema),
  monthlyPerksController.resetPerk
);

export default router;
