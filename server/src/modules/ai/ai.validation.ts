import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  session_token: z.string().max(128).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
