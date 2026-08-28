import { z } from 'zod';

const priceAudienceEnum = z.enum(['vip', 'non_member', 'regular']);
const staffPriceTierEnum = z.enum(['standard', 'technician', 'senior', 'guru']);
const genderScopeEnum = z.enum(['any', 'male', 'female']);

export const servicePriceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  service_id: z.coerce.number().int().positive().optional(),
  group_slug: z.string().optional(),
  audience: priceAudienceEnum.optional(),
  staff_tier: staffPriceTierEnum.optional(),
  available: z.coerce.boolean().optional(),
  needs_verification: z.coerce.boolean().optional(),
});

export const updateServicePriceSchema = z.object({
  amount: z.number().min(0).optional(),
  is_available: z.boolean().optional(),
  needs_verification: z.boolean().optional(),
  source_ref: z.string().max(120).optional(),
});

export const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.number().int().positive(),
    amount: z.number().min(0).optional(),
    is_available: z.boolean().optional(),
    needs_verification: z.boolean().optional(),
  })).min(1).max(100),
});

export const matrixQuerySchema = z.object({
  group_slug: z.string().optional(),
  service_id: z.coerce.number().int().positive().optional(),
});
