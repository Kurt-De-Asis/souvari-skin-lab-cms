import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  listMovementsQuerySchema,
  createAdjustmentSchema,
  createPurchaseSchema,
  productMovementsQuerySchema,
} from './inventory.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(listMovementsQuerySchema, 'query'), inventoryController.listMovements);

router.get('/low-stock', inventoryController.getLowStockProducts);

router.post(
  '/adjustments',
  authorize('admin'),
  validate(createAdjustmentSchema),
  inventoryController.createAdjustment
);

router.post(
  '/purchase',
  authorize('admin'),
  validate(createPurchaseSchema),
  inventoryController.createPurchase
);

router.get(
  '/product/:productId',
  validate(productMovementsQuerySchema, 'query'),
  inventoryController.getProductMovements
);

export default router;
