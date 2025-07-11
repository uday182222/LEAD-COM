import { Worker, QueueEvents } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

// Assume these helpers are already imported elsewhere in your project
import { sendEmailToLead } from './utils/sendEmail.js';
import db from './database.js';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL is not set');

const connection = { connection: { url: REDIS_URL } };

// Worker to process jobs from campaignQueue
const worker = new Worker(
  'campaignQueue',
  async (job) => {
    const { lead, campaignId } = job.data;
    try {
      await sendEmailToLead(lead);
      await db.updateCampaignLeadStatus(campaignId, lead.id, 'COMPLETED');
      return { status: 'completed', leadId: lead.id };
    } catch (err) {
      await db.updateCampaignLeadStatus(campaignId, lead.id, 'FAILED');
      throw err;
    }
  },
  connection
);

// Log completed and failed jobs
const queueEvents = new QueueEvents('campaignQueue', connection);

queueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed: ${failedReason}`);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('🚀 Worker is running and listening for campaignQueue jobs...'); 