import { z } from 'zod';

const productUnitEnum = z.enum(['piece', 'ml', 'mg', 'unit', 'vial', 'tablet', 'bottle', 'box']);
const productStatusEnum = z.enum(['active', 'inactive', 'discontinued']);
const inventoryMovementTypeEnum = z.enum([
  'purchase',
  'sale',
  'adjustment',
  'consumption',
  'return',
  'damage',
  'transfer',
  'opening_stock',
]);

export const createProductSchema = z.object({
  product_category_id: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  unit: productUnitEnum.optional(),
  unit_cost: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  current_stock: z.coerce.number().min(0).optional(),
  minimum_stock: z.coerce.number().min(0).optional(),
  maximum_stock: z.coerce.number().min(0).nullable().optional(),
  is_retail: z.boolean().optional(),
  is_consumable: z.boolean().optional(),
  barcode: z.string().max(100).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  status: productStatusEnum.optional(),
});

export const updateProductSchema = z.object({
  product_category_id: z.number().int().positive().nullable().optional(),
  name: z.string().min(1).max(255).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().nullable().optional(),
  unit: productUnitEnum.optional(),
  unit_cost: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  current_stock: z.coerce.number().min(0).optional(),
  minimum_stock: z.coerce.number().min(0).optional(),
  maximum_stock: z.coerce.number().min(0).nullable().optional(),
  is_retail: z.boolean().optional(),
  is_consumable: z.boolean().optional(),
  barcode: z.string().max(100).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  status: productStatusEnum.optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  product_category_id: z.coerce.number().int().positive().optional(),
  status: productStatusEnum.optional(),
  is_retail: z.coerce.boolean().optional(),
  is_consumable: z.coerce.boolean().optional(),
  low_stock: z.coerce.boolean().optional(),
  sort_by: z.enum(['name', 'sku', 'unit_price', 'current_stock', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(150),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listCategoriesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  include_inactive: z.coerce.boolean().optional(),
});

export const stockAdjustmentSchema = z.object({
  product_id: z.number().int().positive('Product ID is required'),
  type: inventoryMovementTypeEnum,
  quantity: z.number().positive('Quantity must be positive'),
  unit_cost: z.number().min(0).nullable().optional(),
  reference_type: z.string().max(50).nullable().optional(),
  reference_id: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
