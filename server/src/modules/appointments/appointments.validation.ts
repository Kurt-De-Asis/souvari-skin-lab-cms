import { z } from 'zod';
import { walkInCustomerSchema } from '../customers/customers.validation';

const appointmentStatusEnum = z.enum([
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

export const createAppointmentSchema = z.object({
  customer_id: z.number().int().positive('Customer ID is required'),
  staff_id: z.number().int().positive('Staff ID is required').optional(),
  service_id: z.number().int().positive('Service ID is required'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format').optional(),
  membership_code: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
});

export const createGroupAppointmentSchema = z
  .object({
    customer_id: z.number().int().positive('Customer ID is required').optional(),
    walk_in: walkInCustomerSchema.optional(),
    staff_id: z.number().int().positive('Staff ID is required').optional(),
    service_ids: z.array(z.number().int().positive('Service ID is required')).min(1, 'At least one service is required'),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
    membership_code: z.string().min(1).optional(),
    notes: z.string().nullable().optional(),
    payment: z
      .object({
        payment_method: z.enum(['cash', 'gcash', 'gotyme', 'rcbc', 'paid_on_us']),
        amount_tendered: z.number().nonnegative().optional(),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    const hasCustomerId = val.customer_id !== undefined;
    const hasWalkIn = val.walk_in !== undefined;
    if (hasCustomerId === hasWalkIn) {
      ctx.addIssue({
        code: 'custom',
        path: ['customer_id'],
        message: 'Provide either a customer_id or walk_in client information',
      });
    }
  });

export const updateAppointmentSchema = z.object({
  staff_id: z.number().int().positive().optional(),
  service_id: z.number().int().positive().optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  status: appointmentStatusEnum.optional(),
  cancellation_reason: z.string().nullable().optional(),
  reschedule_reason: z.string().nullable().optional(),
  membership_code: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
});

export const listAppointmentsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  service_id: z.coerce.number().int().positive().optional(),
  status: appointmentStatusEnum.optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['appointment_date', 'created_at', 'start_time']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const appointmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateStatusSchema = z.object({
  status: appointmentStatusEnum,
  reason: z.string().nullable().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateGroupAppointmentInput = z.infer<typeof createGroupAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
