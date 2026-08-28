import { z } from 'zod';

export const updateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1, 'Setting key is required').max(100),
        value: z.any(),
        description: z.string().max(500).nullable().optional(),
      })
    )
    .min(1, 'At least one setting is required'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
