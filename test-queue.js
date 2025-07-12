import dotenv from 'dotenv';
dotenv.config();
import Queue from 'bull';
console.log('Connecting to Redis at:', process.env.REDIS_URL);
const emailQueue = new Queue('emailQueue', process.env.REDIS_URL, {
  redis: {
    tls: {}
  }
});

emailQueue.on('error', (err) => {
  console.error('Queue error:', err);
});

emailQueue.add({
  to: process.env.EMAIL_USER, // send to yourself for test
  subject: 'Test Email from Bull Queue',
  html: '<h1>Hello</h1><p>This is a test email from Bull queue.</p>',
}).then(() => {
  console.log('Test job added!');
  process.exit(0);
}).catch((err) => {
  console.error('Failed to add job:', err);
  process.exit(1);
}); 