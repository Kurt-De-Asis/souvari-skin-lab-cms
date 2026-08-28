import { Router } from 'express';
import serviceAddonsController from './service-addons.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { serviceAddonQuerySchema, createServiceAddonSchema, updateServiceAddonSchema } from './service-addons.validation';

const router = Router();

router.get('/', validate(serviceAddonQuerySchema, 'query'), serviceAddonsController.list);
router.get('/:id', serviceAddonsController.getById);
router.post('/', authenticate, authorize('admin'), validate(createServiceAddonSchema), serviceAddonsController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateServiceAddonSchema), serviceAddonsController.update);
router.delete('/:id', authenticate, authorize('admin'), serviceAddonsController.remove);

export default router;
