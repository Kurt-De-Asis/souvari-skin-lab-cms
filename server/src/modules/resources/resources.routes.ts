import { Router } from 'express';
import resourcesController from './resources.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { resourceQuerySchema, createResourceSchema, updateResourceSchema, assignResourceSchema } from './resources.validation';

const router = Router();

// Resource CRUD
router.get('/', resourcesController.list);
router.get('/:id', resourcesController.getById);
router.post('/', authenticate, authorize('admin'), validate(createResourceSchema), resourcesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateResourceSchema), resourcesController.update);
router.delete('/:id', authenticate, authorize('admin'), resourcesController.remove);

// Service ↔ Resource assignment
router.get('/service/:serviceId', resourcesController.getResourcesForService);
router.post('/service/:serviceId', authenticate, authorize('admin'), validate(assignResourceSchema), resourcesController.assignToService);

export default router;
