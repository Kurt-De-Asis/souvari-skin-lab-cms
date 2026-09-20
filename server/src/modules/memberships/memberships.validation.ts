import { z } from 'zod';

const membershipStatusEnum = z.enum(['active', 'expired', 'suspended', 'cancelled', 'pending']);
const paymentMethodEnum = z.enum(['cash', 'gcash', 'gotyme', 'rcbc', 'paid_on_us']);
const paymentTypeEnum = z.enum(['FULL', 'DOWN_PAYMENT', 'INSTALLMENT']);

export const createMembershipSchema = z.object({
  customer_id: z.number().int().positive('Customer ID is required'),
  plan_id: z.number().int().positive('Plan ID is required'),
  payment_method: paymentMethodEnum.optional(),
  payment_type: paymentTypeEnum.optional(),
  amount_paid: z.coerce.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

export const updateMembershipStatusSchema = z.object({
  status: membershipStatusEnum,
  reason: z.string().nullable().optional(),
});

export const extendMembershipSchema = z.object({
  months: z.number().int().min(1).max(12),
  payment_method: paymentMethodEnum.optional(),
  payment_type: paymentTypeEnum.optional(),
  amount_paid: z.coerce.number().min(0).optional(),
  reason: z.string().nullable().optional(),
});

export const availMembershipSchema = z.object({
  plan_id: z.number().int().positive('Plan ID is required'),
  payment_method: paymentMethodEnum.optional(),
  payment_type: paymentTypeEnum.optional(),
  amount_paid: z.coerce.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

export const membershipPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: paymentMethodEnum,
  payment_type: paymentTypeEnum,
  installment_no: z.number().int().positive().optional(),
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
export type MembershipPaymentInput = z.infer<typeof membershipPaymentSchema>;
export type MembershipQuery = z.infer<typeof membershipQuerySchema>;
