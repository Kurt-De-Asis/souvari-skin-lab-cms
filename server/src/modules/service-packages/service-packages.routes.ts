import { Router } from 'express';
import servicePackagesController from './service-packages.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { servicePackageQuerySchema, createServicePackageSchema, updateServicePackageSchema } from './service-packages.validation';

const router = Router();

router.get('/', authenticate, authorize('admin'), validate(servicePackageQuerySchema, 'query'), servicePackagesController.list);
router.get('/:id', authenticate, authorize('admin'), servicePackagesController.getById);
router.post('/', authenticate, authorize('admin'), validate(createServicePackageSchema), servicePackagesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateServicePackageSchema), servicePackagesController.update);
router.delete('/:id', authenticate, authorize('admin'), servicePackagesController.remove);

export default router;
