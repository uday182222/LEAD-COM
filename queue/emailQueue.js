import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

const connection = {
  url: process.env.REDIS_URL,
    tls: {
    rejectUnauthorized: false,
  },
};

const emailQueue = new Queue(process.env.QUEUE_NAME || 'emailQueue', { connection });

export default emailQueue; 