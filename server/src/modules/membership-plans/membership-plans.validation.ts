import { z } from 'zod';

const membershipTierEnum = z.enum(['SILVER', 'GOLD', 'PLATINUM', 'ELITE']);
const membershipVariantEnum = z.enum(['student', 'single', 'duo', 'family', 'add_on']);

export const createMembershipPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255),
  tier: membershipTierEnum.default('SILVER'),
  duration_months: z.number().int().min(1, 'Duration must be at least 1 month'),
  regular_price: z.number().min(0, 'Regular price must be at least 0'),
  promo_price: z.number().min(0, 'Promo price must be at least 0'),
  discount_pct: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  family_id: z.number().int().optional(),
  variant_code: membershipVariantEnum.default('single'),
  term_months: z.number().int().min(1).default(6),
  max_persons: z.number().int().min(1).default(1),
  add_on_price: z.number().min(0).optional(),
  advertised_per_day_price: z.number().min(0).optional(),
  computed_per_day_price: z.number().min(0).optional(),
  sort_order: z.number().int().default(0),
});

export const updateMembershipPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  tier: membershipTierEnum.optional(),
  duration_months: z.number().int().min(1).optional(),
  regular_price: z.number().min(0).optional(),
  promo_price: z.number().min(0).optional(),
  discount_pct: z.number().min(0).max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  family_id: z.number().int().nullable().optional(),
  variant_code: membershipVariantEnum.optional(),
  term_months: z.number().int().min(1).optional(),
  max_persons: z.number().int().min(1).optional(),
  add_on_price: z.number().min(0).nullable().optional(),
  advertised_per_day_price: z.number().min(0).nullable().optional(),
  computed_per_day_price: z.number().min(0).nullable().optional(),
  sort_order: z.number().int().optional(),
});

export const membershipPlanQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  tier: membershipTierEnum.optional(),
  family_id: z.coerce.number().int().optional(),
  variant_code: membershipVariantEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>;
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>;
export type MembershipPlanQuery = z.infer<typeof membershipPlanQuerySchema>;
