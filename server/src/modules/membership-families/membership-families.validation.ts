import { z } from 'zod';

const familyCodeEnum = z.enum(['VIP_ELITE_PLATINUM', 'VIP_RADIANT_SKIN', 'VIP_LASH_NAIL', 'SILVER_ACCESS']);
const variantCodeEnum = z.enum(['student', 'single', 'duo', 'family', 'add_on']);

export const membershipFamilyQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  include_plans: z.coerce.boolean().optional(),
});

export const createMembershipFamilySchema = z.object({
  code: familyCodeEnum,
  name: z.string().min(1).max(150),
  tagline: z.string().max(255).optional(),
  description: z.string().optional(),
  eligible_categories: z.array(z.string()).nullable().optional(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const updateMembershipFamilySchema = z.object({
  name: z.string().min(1).max(150).optional(),
  tagline: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  eligible_categories: z.array(z.string()).nullable().optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});
