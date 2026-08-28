import { z } from 'zod';

const serviceCategoryEnum = z.enum([
  'facial',
  'body',
  'hair_removal',
  'skin_rejuvenation',
  'injection',
  'laser',
  'consultation',
  'package',
  'signature_facial',
  'other',
]);

const serviceStatusEnum = z.enum(['active', 'inactive', 'draft']);

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  category: serviceCategoryEnum.default('other'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  vip_price: z.coerce.number().min(0).optional(),
  non_member_price: z.coerce.number().min(0).optional(),
  duration_minutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  image_url: z.string().url('Invalid URL').max(500).optional(),
  is_active: z.boolean().default(true),
  status: serviceStatusEnum.default('active'),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: serviceCategoryEnum.optional(),
  price: z.coerce.number().min(0).optional(),
  vip_price: z.coerce.number().min(0).optional().nullable(),
  non_member_price: z.coerce.number().min(0).optional().nullable(),
  duration_minutes: z.coerce.number().int().min(1).optional(),
  image_url: z.string().url('Invalid URL').max(500).optional().nullable(),
  is_active: z.boolean().optional(),
  status: serviceStatusEnum.optional(),
});

export const serviceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: serviceCategoryEnum.optional(),
  status: serviceStatusEnum.optional(),
  search: z.string().max(255).optional(),
  is_active: z.coerce.boolean().optional(),
});

export const assignStaffSchema = z.object({
  staff_id: z.coerce.number().int().positive('Staff ID must be positive'),
});

export const bulkAssignStaffSchema = z.object({
  staff_ids: z
    .array(z.coerce.number().int().positive('Staff ID must be positive'))
    .min(1, 'At least one staff ID is required'),
});

export const configureInventorySchema = z.object({
  product_id: z.coerce.number().int().positive('Product ID must be positive'),
  quantity_per_session: z.coerce
    .number()
    .positive('Quantity must be positive')
    .default(1),
  is_optional: z.boolean().default(false),
  notes: z.string().max(255).optional(),
});

export const updateInventoryItemSchema = z.object({
  quantity_per_session: z.coerce.number().positive('Quantity must be positive').optional(),
  is_optional: z.boolean().optional(),
  notes: z.string().max(255).optional().nullable(),
});

export const publicServiceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: serviceCategoryEnum.optional(),
  search: z.string().max(255).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type BulkAssignStaffInput = z.infer<typeof bulkAssignStaffSchema>;
export type ConfigureInventoryInput = z.infer<typeof configureInventorySchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type PublicServiceQueryInput = z.infer<typeof publicServiceQuerySchema>;
