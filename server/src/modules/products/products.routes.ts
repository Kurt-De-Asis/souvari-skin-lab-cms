import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  stockAdjustmentSchema,
} from './products.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listProductsQuerySchema, 'query'),
  productsController.getProducts
);

router.get('/low-stock', productsController.getLowStockProducts);

router.post(
  '/stock-adjustments',
  authorize('admin'),
  validate(stockAdjustmentSchema),
  productsController.adjustStock
);

router.get('/categories', validate(listCategoriesQuerySchema, 'query'), productsController.getCategories);
router.get('/categories/:id', productsController.getCategoryById);

router.post(
  '/categories',
  authorize('admin'),
  validate(createCategorySchema),
  productsController.createCategory
);

router.put(
  '/categories/:id',
  authorize('admin'),
  validate(updateCategorySchema),
  productsController.updateCategory
);

router.delete(
  '/categories/:id',
  authorize('admin'),
  productsController.deleteCategory
);

router.get('/:id', productsController.getProductById);
router.get('/:id/movements', productsController.getProductWithMovements);

router.post(
  '/',
  authorize('admin'),
  validate(createProductSchema),
  productsController.createProduct
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateProductSchema),
  productsController.updateProduct
);

router.delete(
  '/:id',
  authorize('admin'),
  productsController.deleteProduct
);

export default router;
