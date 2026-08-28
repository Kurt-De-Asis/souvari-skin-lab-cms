import { z } from 'zod';

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
  staff_id: z.number().int().positive('Staff ID is required'),
  service_id: z.number().int().positive('Service ID is required'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format').optional(),
  notes: z.string().nullable().optional(),
});

export const updateAppointmentSchema = z.object({
  staff_id: z.number().int().positive().optional(),
  service_id: z.number().int().positive().optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  status: appointmentStatusEnum.optional(),
  cancellation_reason: z.string().nullable().optional(),
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
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
