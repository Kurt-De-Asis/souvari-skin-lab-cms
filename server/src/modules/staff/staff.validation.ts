import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const scheduleEntrySchema = z
  .object({
    day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    start_time: z.string().regex(timePattern, 'Start time must be in HH:MM format'),
    end_time: z.string().regex(timePattern, 'End time must be in HH:MM format'),
    break_start: z.string().regex(timePattern, 'Break start must be in HH:MM format').nullable().optional(),
    break_end: z.string().regex(timePattern, 'Break end must be in HH:MM format').nullable().optional(),
    is_active: z.boolean().optional().default(true),
  })
  .superRefine((val, ctx) => {
    const isOffDay = val.start_time === '00:00' && val.end_time === '00:00';
    if (isOffDay) return;
    if (val.start_time < val.end_time) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_time'],
      message: 'End time must be later than start time',
    });
  })
  .superRefine((val, ctx) => {
    if (val.start_time === '00:00' && val.end_time === '00:00') return;
    const hasBreakStart = !!val.break_start;
    const hasBreakEnd = !!val.break_end;
    if (hasBreakStart && !hasBreakEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['break_end'],
        message: 'Break end time is required when a break start time is set',
      });
      return;
    }
    if (hasBreakEnd && !hasBreakStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['break_start'],
        message: 'Break start time is required when a break end time is set',
      });
      return;
    }
    if (hasBreakStart && hasBreakEnd) {
      const bStart = toMinutes(val.break_start as string);
      const bEnd = toMinutes(val.break_end as string);
      const wStart = toMinutes(val.start_time);
      const wEnd = toMinutes(val.end_time);
      if (bEnd <= bStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['break_end'],
          message: 'Break end time must be later than break start time',
        });
      }
      if (bStart < wStart || bEnd > wEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['break_start'],
          message: 'Break time must fall within the working hours',
        });
      }
    }
  });

export const createStaffSchema = z.object({
  user_id: z.number().int().positive('User ID must be a positive integer').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20).optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  position: z.enum(['doctor', 'nurse', 'aesthetician', 'therapist', 'receptionist', 'manager']).optional().default('aesthetician'),
  job_title: z.string().max(100).optional().nullable(),
  permission_level: z.enum(['manager', 'medium', 'owner']).optional().default('medium'),
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
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20).optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  position: z.enum(['doctor', 'nurse', 'aesthetician', 'therapist', 'receptionist', 'manager']).optional(),
  job_title: z.string().max(100).optional().nullable(),
  permission_level: z.enum(['manager', 'medium', 'owner']).optional(),
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
