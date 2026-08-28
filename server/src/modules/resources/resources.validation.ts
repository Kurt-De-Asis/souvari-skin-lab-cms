import { z } from 'zod';

const resourceTypeEnum = z.enum(['room', 'equipment', 'vehicle', 'other']);

export const resourceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: resourceTypeEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const createResourceSchema = z.object({
  name: z.string().min(1).max(150),
  type: resourceTypeEnum.default('equipment'),
  description: z.string().max(500).optional(),
});

export const updateResourceSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  type: resourceTypeEnum.optional(),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const assignResourceSchema = z.object({
  resource_ids: z.array(z.number().int().positive()).min(1),
});
