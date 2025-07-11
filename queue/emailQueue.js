import dotenv from 'dotenv';
dotenv.config();

import Queue from 'bull';

// Shared Bull queue instance for email jobs
if (!process.env.REDIS_URL || !process.env.QUEUE_NAME) {
  throw new Error('Missing REDIS_URL or QUEUE_NAME in environment');
}

const emailQueue = new Queue(process.env.QUEUE_NAME, process.env.REDIS_URL, {
  redis: {
    tls: {
      rejectUnauthorized: false
    }
  }
});

// Log queue errors
emailQueue.on('error', (err) => {
  console.error('[Bull] Queue error:', err);
});
emailQueue.on('failed', (job, err) => {
  console.error(`[Bull] Job ${job.id} failed:`, err);
});
emailQueue.on('waiting', (jobId) => {
  console.log(`[Bull] Job waiting: ${jobId}`);
});
emailQueue.on('active', (job, jobPromise) => {
  console.log(`[Bull] Job active: ${job.id}`);
});
emailQueue.on('completed', (job, result) => {
  console.log(`[Bull] Job completed: ${job.id}`);
});

export default emailQueue;
export { emailQueue }; 