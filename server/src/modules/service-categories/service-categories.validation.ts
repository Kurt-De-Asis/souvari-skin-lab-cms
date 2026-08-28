import { z } from 'zod';

export const serviceCategoryQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const createServiceCategorySchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().default(0),
});

export const updateServiceCategorySchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});
