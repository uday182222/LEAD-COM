import 'dotenv/config';
import { emailJobSchema } from './utils/emailSchema.js';
import emailQueue from './queue/emailQueue.js';

const testJobs = [
  {
    label: '✅ Valid job',
    payload: {
      to: 'uday@motionfalcon.com',
      subject: 'Test: Valid Email',
      html: '<p>This is a valid test email.</p>'
    }
  },
  {
    label: '❌ Missing "to"',
    payload: {
      subject: 'Test: Missing To Field',
      html: '<p>This should fail.</p>'
    }
  },
  {
    label: '❌ Invalid email format',
    payload: {
      to: 'not-an-email',
      subject: 'Test: Invalid Email Format',
      html: '<p>This should fail.</p>'
    }
  },
  {
    label: '❌ Empty HTML',
    payload: {
      to: 'uday@motionfalcon.com',
      subject: 'Test: Empty HTML',
      html: ''
    }
  }
];

(async () => {
  for (const job of testJobs) {
    try {
      emailJobSchema.parse(job.payload);
      await emailQueue.add(job.payload);
      console.log(`${job.label} – Job added ✅`);
    } catch (error) {
      console.error(`${job.label} – ❌ Job validation failed: ${error.message}`);
    }
  }
  process.exit(0);
})(); 