import { Router } from 'express';
import serviceCategoriesController from './service-categories.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { serviceCategoryQuerySchema, createServiceCategorySchema, updateServiceCategorySchema } from './service-categories.validation';

const router = Router();

router.get('/', serviceCategoriesController.list);
router.get('/:id', serviceCategoriesController.getById);
router.post('/', authenticate, authorize('admin'), validate(createServiceCategorySchema), serviceCategoriesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateServiceCategorySchema), serviceCategoriesController.update);
router.delete('/:id', authenticate, authorize('admin'), serviceCategoriesController.remove);

export default router;
