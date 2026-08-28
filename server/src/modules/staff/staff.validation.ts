import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeField = (label: string, required = true) =>
  required
    ? z.string().regex(timePattern, `${label} must be in HH:MM format`)
    : z.string().regex(timePattern, `${label} must be in HH:MM format`).nullable().optional();

const scheduleEntrySchema = z.object({
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: timeField('Start time'),
  end_time: timeField('End time'),
  break_start: timeField('Break start', false),
  break_end: timeField('Break end', false),
  is_active: z.boolean().optional().default(true),
});

export const createStaffSchema = z.object({
  user_id: z.number().int().positive('User ID must be a positive integer'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  position: z.enum(['doctor', 'nurse', 'aesthetician', 'therapist', 'receptionist', 'manager']).optional().default('aesthetician'),
  job_title: z.string().max(100).optional().nullable(),
  permission_level: z.enum(['manager', 'medium', 'owner']).optional().default('medium'),
  rating: z.number().min(0).max(5).optional().nullable(),
  status: z.enum(['active', 'on_leave', 'inactive', 'terminated']).optional().default('active'),
  hire_date: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  address: z.string().optional().nullable(),
  avatar_url: z.string().max(500).optional().nullable(),
  bio: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateStaffSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  position: z.enum(['doctor', 'nurse', 'aesthetician', 'therapist', 'receptionist', 'manager']).optional(),
  job_title: z.string().max(100).optional().nullable(),
  permission_level: z.enum(['manager', 'medium', 'owner']).optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  status: z.enum(['active', 'on_leave', 'inactive', 'terminated']).optional(),
  hire_date: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  address: z.string().optional().nullable(),
  avatar_url: z.string().max(500).optional().nullable(),
  bio: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const staffQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  position: z.enum(['doctor', 'nurse', 'aesthetician', 'therapist', 'receptionist', 'manager']).optional(),
  status: z.enum(['active', 'on_leave', 'inactive', 'terminated']).optional(),
});

export const updateSchedulesSchema = z.object({
  schedules: z.array(scheduleEntrySchema).min(1, 'At least one schedule entry is required').max(7),
});

export const assignServiceSchema = z.object({
  service_id: z.number().int().positive('Service ID must be a positive integer'),
});

export const serviceStaffQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type StaffQueryInput = z.infer<typeof staffQuerySchema>;
export type UpdateSchedulesInput = z.infer<typeof updateSchedulesSchema>;
export type AssignServiceInput = z.infer<typeof assignServiceSchema>;
export type ServiceStaffQueryInput = z.infer<typeof serviceStaffQuerySchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
