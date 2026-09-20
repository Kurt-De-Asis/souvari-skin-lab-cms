import { z } from 'zod';

export const createReviewSchema = z.object({
  appointment_id: z.number().int().positive('Appointment ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  feedback: z.string().max(2000).nullable().optional(),
});

export const reviewQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  service_id: z.coerce.number().int().positive().optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const serviceStatsSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;