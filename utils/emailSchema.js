import { z } from 'zod';

export const emailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
}); 