import { z } from 'zod';

export const servicePackageQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  group_slug: z.string().optional(),
  search: z.string().optional(),
});

export const createServicePackageSchema = z.object({
  service_id: z.number().int().positive(),
  sessions_included: z.number().int().min(1).default(7),
  session_price: z.number().min(0),
  ten_session_price: z.number().min(0).optional(),
  inclusions: z.array(z.string()).optional(),
  savings_note: z.string().max(255).optional(),
});

export const updateServicePackageSchema = z.object({
  sessions_included: z.number().int().min(1).optional(),
  session_price: z.number().min(0).optional(),
  ten_session_price: z.number().min(0).nullable().optional(),
  inclusions: z.array(z.string()).nullable().optional(),
  savings_note: z.string().max(255).nullable().optional(),
});
