import { z } from 'zod';

const perkStatusEnum = z.enum(['available', 'used', 'expired']);

export const monthlyPerksQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  membership_id: z.coerce.number().int().positive().optional(),
  year_month: z.string().optional(),
  status: perkStatusEnum.optional(),
});

export const usePerkSchema = z.object({
  membership_id: z.number().int().positive('Membership ID is required'),
  transaction_id: z.number().int().positive().optional(),
  discount_amount: z.number().min(0, 'Discount must be non-negative').max(300, 'Discount cannot exceed 300').optional(),
});

export const resetPerkSchema = z.object({
  membership_id: z.number().int().positive('Membership ID is required'),
  year_month: z.string().regex(/^\d{4}-\d{2}$/, 'Year-month must be in YYYY-MM format'),
});

export type MonthlyPerksQuery = z.infer<typeof monthlyPerksQuerySchema>;
export type UsePerkInput = z.infer<typeof usePerkSchema>;
export type ResetPerkInput = z.infer<typeof resetPerkSchema>;
