import { Queue } from 'bullmq';

const connection = {
  connection: {
    url: process.env.REDIS_URL
  }
};

const emailQueue = new Queue('emailQueue', connection);

export default emailQueue; 