import { z } from 'zod';

const notificationTypeEnum = z.enum([
  'appointment_reminder',
  'appointment_update',
  'payment',
  'promotion',
  'system',
  'low_stock',
]);

const notificationStatusEnum = z.enum(['unread', 'read', 'archived']);

export const listNotificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: notificationTypeEnum.optional(),
  status: notificationStatusEnum.optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
