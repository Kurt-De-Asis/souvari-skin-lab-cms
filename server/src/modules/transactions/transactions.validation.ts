import { z } from 'zod';

const transactionTypeEnum = z.enum(['sale', 'refund', 'adjustment']);
const paymentMethodEnum = z.enum(['cash', 'gcash', 'gotyme', 'rcbc', 'paid_on_us']);
const paymentStatusEnum = z.enum(['pending', 'paid', 'partial', 'refunded', 'voided']);

const transactionItemSchema = z.object({
  product_id: z.number().int().positive().nullable().optional(),
  service_id: z.number().int().positive().nullable().optional(),
  description: z.string().min(1, 'Description is required').max(255),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit_price: z.coerce.number().min(0, 'Unit price must be non-negative'),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
});

export const createTransactionSchema = z.object({
  customer_id: z.number().int().positive().nullable().optional(),
  staff_id: z.number().int().positive().nullable().optional(),
  appointment_id: z.number().int().positive().nullable().optional(),
  type: transactionTypeEnum.optional(),
  discount_amount: z.coerce.number().min(0).optional(),
  discount_pct: z.coerce.number().min(0).max(100).optional(),
  discount_reason: z.string().nullable().optional(),
  discount_applied_by: z.number().int().positive().nullable().optional(),
  tax_amount: z.coerce.number().min(0).optional(),
  payment_method: paymentMethodEnum.nullable().optional(),
  payment_status: paymentStatusEnum.optional(),
  paid_at: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(transactionItemSchema).min(1, 'At least one item is required'),
});

export const listTransactionsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  customer: z.string().optional(),
  type: transactionTypeEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
  payment_method: paymentMethodEnum.optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  appointment_id: z.coerce.number().int().positive().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['created_at', 'total_amount', 'transaction_number']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const transactionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const voidTransactionSchema = z.object({
  reason: z.string().nullable().optional(),
});

export const refundTransactionSchema = z.object({
  item_ids: z.array(z.number().int().positive()).min(1, 'At least one item must be selected for refund').optional(),
  reason: z.string().nullable().optional(),
  payment_method: paymentMethodEnum.nullable().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type VoidTransactionInput = z.infer<typeof voidTransactionSchema>;
export type RefundTransactionInput = z.infer<typeof refundTransactionSchema>;
