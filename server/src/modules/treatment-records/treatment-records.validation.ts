import { z } from 'zod';

export const listTreatmentRecordsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const createTreatmentRecordSchema = z.object({
  appointment_id: z.number().int().positive().optional(),
  customer_id: z.number().int().positive('Customer ID is required'),
  treatment_date: z.string().optional(),
  notes: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  side_effects: z.string().nullable().optional(),
  before_photo: z.string().max(500).nullable().optional(),
  after_photo: z.string().max(500).nullable().optional(),
});

export const updateTreatmentRecordSchema = z.object({
  notes: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  side_effects: z.string().nullable().optional(),
  before_photo: z.string().max(500).nullable().optional(),
  after_photo: z.string().max(500).nullable().optional(),
});

export const treatmentRecordIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ListTreatmentRecordsQuery = z.infer<typeof listTreatmentRecordsQuerySchema>;
export type CreateTreatmentRecordInput = z.infer<typeof createTreatmentRecordSchema>;
export type UpdateTreatmentRecordInput = z.infer<typeof updateTreatmentRecordSchema>;
