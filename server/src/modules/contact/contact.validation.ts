import { z } from 'zod';

export const sendContactMessageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required').max(255),
  subject: z.string().min(1, 'Subject is required').max(150),
  message: z.string().min(1, 'Message is required').max(5000),
});

export type SendContactMessageInput = z.infer<typeof sendContactMessageSchema>;