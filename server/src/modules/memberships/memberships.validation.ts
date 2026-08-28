import { z } from 'zod';

const membershipStatusEnum = z.enum(['active', 'expired', 'suspended', 'cancelled', 'pending']);

export const createMembershipSchema = z.object({
  customer_id: z.number().int().positive('Customer ID is required'),
  plan_id: z.number().int().positive('Plan ID is required'),
  notes: z.string().nullable().optional(),
});

export const updateMembershipStatusSchema = z.object({
  status: membershipStatusEnum,
  reason: z.string().nullable().optional(),
});

export const extendMembershipSchema = z.object({
  months: z.number().int().min(1).max(12),
  reason: z.string().nullable().optional(),
});

export const availMembershipSchema = z.object({
  plan_id: z.number().int().positive('Plan ID is required'),
  notes: z.string().nullable().optional(),
});

export const membershipQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: membershipStatusEnum.optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type AvailMembershipInput = z.infer<typeof availMembershipSchema>;
export type UpdateMembershipStatusInput = z.infer<typeof updateMembershipStatusSchema>;
export type ExtendMembershipInput = z.infer<typeof extendMembershipSchema>;
export type MembershipQuery = z.infer<typeof membershipQuerySchema>;
