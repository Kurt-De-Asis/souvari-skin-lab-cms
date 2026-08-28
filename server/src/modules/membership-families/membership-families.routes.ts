import { Router } from 'express';
import membershipFamiliesController from './membership-families.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { membershipFamilyQuerySchema, createMembershipFamilySchema, updateMembershipFamilySchema } from './membership-families.validation';

const router = Router();

router.get('/', membershipFamiliesController.list);
router.get('/:id', membershipFamiliesController.getById);
router.get('/code/:code', membershipFamiliesController.getByCode);
router.post('/', authenticate, authorize('admin'), validate(createMembershipFamilySchema), membershipFamiliesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateMembershipFamilySchema), membershipFamiliesController.update);

export default router;
