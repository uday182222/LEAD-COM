import dotenv from 'dotenv';
dotenv.config();

import Queue from 'bull';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/sendEmail.js';
import { emailJobSchema } from '../utils/validators.js';

console.log('Connecting to Redis at:', process.env.REDIS_URL);

const emailQueue = new Queue('emailQueue', process.env.REDIS_URL, {
  redis: {
    tls: {
      rejectUnauthorized: false
    }
  }
});

logger.info('🚀 Worker is up and listening for jobs...');

emailQueue.on('error', (err) => {
  logger.error('[Bull] Queue error:', err);
});

emailQueue.process('sendEmail', async (job) => {
  logger.info(`📥 Processing job: ${JSON.stringify(job.data)}`);
  const result = emailJobSchema.safeParse(job.data);

  if (!result.success) {
    logger.error(`❌ Invalid job payload for job ID ${job.id}: ${result.error}`);
    throw new Error(`Validation failed for job ID ${job.id}: ${result.error}`);
  }

  try {
    await sendEmail(result.data);
    logger.info(`✅ Email sent for job ID: ${job.id}`);
  } catch (err) {
    logger.error(`❌ Failed to send email for job ID ${job.id}: ${err.message}`);
    throw err;
  }
}); 