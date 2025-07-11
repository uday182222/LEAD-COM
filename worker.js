require('dotenv').config();
const Queue = require('bull');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

console.log('🚀 Worker is up and listening for jobs...');

const emailQueue = new Queue('emailQueue', process.env.REDIS_URL, {
  redis: { tls: {} }
});

// Global queue error listener
emailQueue.on('error', (err) => {
  console.error('💥 Queue error:', err);
});

const ses = new SESClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

emailQueue.process(async (job) => {
  console.log('📥 Job received by worker:', job.id, job.data);
  try {
    const { to, subject, html } = job.data;
    console.log(`⏳ Sending email to: ${to}`);

    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } }
      }
    };

    const result = await ses.send(new SendEmailCommand(params));
    console.log('✅ Email sent to:', to, 'SES MessageId:', result.MessageId);
  } catch (err) {
    console.error('❌ Job failed:', err);
  }
}); 