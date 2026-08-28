import { z } from 'zod';

const posItemSchema = z.object({
  service_id: z.number().int().positive(),
  variant_id: z.number().int().positive().optional(),
  staff_tier: z.enum(['standard', 'technician', 'senior', 'guru']).optional(),
  quantity: z.number().int().min(1).default(1),
});

export const posQuoteSchema = z.object({
  customer_id: z.number().int().positive().optional(),
  membership_code: z.string().optional(),
  items: z.array(posItemSchema).min(1).max(20),
  use_monthly_perk: z.boolean().optional(),
  referral_credit_amount: z.number().min(0).optional(),
});

export const posCheckoutSchema = posQuoteSchema.extend({
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'voucher']),
  notes: z.string().optional(),
});
