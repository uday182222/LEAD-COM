import { emailJobSchema } from './validators.js';
import nodemailer from 'nodemailer';

export async function sendEmail(data) {
  const result = emailJobSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${JSON.stringify(result.error)}`);
  }
  // ...send email logic using nodemailer or SES...
  // For now, just log:
  console.log('Sending email:', result.data);
  return { MessageId: 'SIMULATED-EMAIL-ID' };
} 