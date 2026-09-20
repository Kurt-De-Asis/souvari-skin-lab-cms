import { z } from 'zod';

export const revenueQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  group_by: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export const appointmentTrendsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const summaryQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
export type AppointmentTrendsQuery = z.infer<typeof appointmentTrendsQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
