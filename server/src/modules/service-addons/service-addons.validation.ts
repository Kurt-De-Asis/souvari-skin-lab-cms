import { z } from 'zod';

export const serviceAddonQuerySchema = z.object({
  service_id: z.coerce.number().int().positive(),
  is_active: z.coerce.boolean().optional(),
});

export const createServiceAddonSchema = z.object({
  service_id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  price: z.number().min(0).default(0),
  additional_duration_minutes: z.number().int().min(0).default(0),
});

export const updateServiceAddonSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  price: z.number().min(0).optional(),
  additional_duration_minutes: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});
