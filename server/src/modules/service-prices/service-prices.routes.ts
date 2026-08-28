import { Router } from 'express';
import servicePricesController from './service-prices.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { servicePriceQuerySchema, updateServicePriceSchema, bulkUpdateSchema, matrixQuerySchema } from './service-prices.validation';

const router = Router();

router.get('/matrix', authenticate, authorize('admin'), validate(matrixQuerySchema, 'query'), servicePricesController.getMatrix);
router.get('/', authenticate, authorize('admin'), validate(servicePriceQuerySchema, 'query'), servicePricesController.list);
router.put('/:id', authenticate, authorize('admin'), validate(updateServicePriceSchema), servicePricesController.update);
router.post('/bulk-update', authenticate, authorize('admin'), validate(bulkUpdateSchema), servicePricesController.bulkUpdate);

export default router;
