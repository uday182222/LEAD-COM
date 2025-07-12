import dotenv from 'dotenv';
dotenv.config();
import pkg from '@aws-sdk/client-ses';
const { SESClient, SendEmailCommand } = pkg;

const ses = new SESClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const params = {
  Source: process.env.EMAIL_FROM,
  Destination: { ToAddresses: [process.env.TEST_RECIPIENT || 'uday@motionfalcon.com'] },
  Message: {
    Subject: { Data: 'Direct SES Test Email' },
    Body: { Html: { Data: '<h1>This is a direct SES test email.</h1><p>If you see this, SES is working end-to-end.</p>' } }
  }
};

console.log('SES send params:', JSON.stringify(params, null, 2));

(async () => {
  try {
    const response = await ses.send(new SendEmailCommand(params));
    console.log('SES send response:', JSON.stringify(response, null, 2));
    if (response.MessageId) {
      console.log('✅ SES email sent! MessageId:', response.MessageId);
    } else {
      console.log('⚠️ SES did not return a MessageId.');
    }
  } catch (err) {
    console.error('❌ SES send failed:', err);
  }
})(); 