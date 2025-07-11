import { z } from 'zod';

export const emailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  templateName: z.string().optional(),
  dynamicFields: z.record(z.string()).optional(),
}); 