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
});

export const posCheckoutSchema = posQuoteSchema.extend({
  payment_method: z.enum(['cash', 'gcash', 'gotyme', 'rcbc', 'paid_on_us']),
  notes: z.string().optional(),
  discount_pct: z.coerce.number().min(0).max(100).optional(),
  discount_reason: z.string().nullable().optional(),
  discount_applied_by: z.number().int().positive().nullable().optional(),
  appointment_id: z.number().int().positive().nullable().optional(),
  staff_id: z.number().int().positive().nullable().optional(),
});
