import { z } from 'zod';

const referralStatusEnum = z.enum(['pending', 'completed', 'rejected']);
const approveReferralStatusEnum = z.enum(['completed', 'rejected']);

export const createReferralSchema = z.object({
  referred_name: z.string().min(1, 'Referred name is required').max(255),
  referred_email: z.string().email('Valid email is required'),
});

export const referralQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: referralStatusEnum.optional(),
  customer_id: z.coerce.number().int().positive().optional(),
});

export const approveReferralSchema = z.object({
  status: approveReferralStatusEnum,
  credit_amount: z.number().positive().optional(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type ReferralQuery = z.infer<typeof referralQuerySchema>;
export type ApproveReferralInput = z.infer<typeof approveReferralSchema>;
