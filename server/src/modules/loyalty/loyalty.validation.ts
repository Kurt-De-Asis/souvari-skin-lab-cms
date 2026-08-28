import { z } from 'zod';

const loyaltyPlanTypeEnum = z.enum(['SILVER', 'GOLD', 'PLATINUM', 'ELITE']);

export const loyaltyQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  membership_id: z.coerce.number().int().positive().optional(),
  plan_type: loyaltyPlanTypeEnum.optional(),
});

export const updateMilestoneSchema = z.object({
  spend_threshold: z.number().min(0, 'Spend threshold must be at least 0'),
  reward_pct: z.number().min(0, 'Reward percentage must be at least 0').max(100, 'Reward percentage cannot exceed 100'),
  label: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const createMilestoneSchema = z.object({
  plan_type: loyaltyPlanTypeEnum,
  spend_threshold: z.number().min(0, 'Spend threshold must be at least 0'),
  reward_pct: z.number().min(0, 'Reward percentage must be at least 0').max(100, 'Reward percentage cannot exceed 100'),
  label: z.string().nullable().optional(),
  plan_id: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const adjustSpendSchema = z.object({
  membership_id: z.number().int().positive('Membership ID is required'),
  amount: z.number(),
  reason: z.string().min(1, 'Reason is required'),
});

export type LoyaltyQuery = z.infer<typeof loyaltyQuerySchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type AdjustSpendInput = z.infer<typeof adjustSpendSchema>;
