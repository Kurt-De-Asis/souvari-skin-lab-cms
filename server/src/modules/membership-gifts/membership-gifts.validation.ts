import { z } from 'zod';

const giftStatusEnum = z.enum(['available', 'pending_approval', 'approved', 'redeemed']);

const giftApprovalStatusEnum = z.enum(['approved', 'rejected']);

export const createGiftSchema = z.object({
  nominee_name: z.string().min(1, 'Nominee name is required').max(255),
  nominee_email: z.string().email('Invalid email address').max(255).nullable().optional(),
  nominee_phone: z.string().max(20).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const giftQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: giftStatusEnum.optional(),
  membership_id: z.coerce.number().int().positive().optional(),
});

export const approveGiftSchema = z.object({
  status: giftApprovalStatusEnum,
  notes: z.string().nullable().optional(),
});

export type CreateGiftInput = z.infer<typeof createGiftSchema>;
export type GiftQuery = z.infer<typeof giftQuerySchema>;
export type ApproveGiftInput = z.infer<typeof approveGiftSchema>;
