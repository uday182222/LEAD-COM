// Test script for Amazon SES API email sending
import dotenv from 'dotenv';
dotenv.config();
import { sendEmail, validateEmailConfig } from './email-config.js';

async function testSESEmail() {
  console.log('🧪 Testing Amazon SES API Email Sending\n');
  
  // Display current configuration
  console.log('📧 Current SES Configuration:');
  const validation = validateEmailConfig();
  console.log('Configuration validation:', validation);
  console.log('');
  
  if (!validation.isValid) {
    console.log('⚠️ SES configuration issues:', validation.issues);
    return;
  }
  
  // Test sending email to uday@motionfalcon.com
  console.log('📤 Testing Email Sending to uday@motionfalcon.com...');
  
  const testEmail = {
    to: 'uday@motionfalcon.com',
    subject: 'Test Email from Lead-Com SES API',
    body: `
Hello Uday!

This is a test email from the Lead-Com system using Amazon SES API.

Features tested:
✅ Amazon SES API configuration
✅ Email validation
✅ Email sending

Sent at: ${new Date().toISOString()}
From: ${process.env.EMAIL_FROM}

Best regards,
Lead-Com System
    `.trim()
  };
  
  try {
    console.log(`Sending test email to: ${testEmail.to}`);
    console.log(`From: ${process.env.EMAIL_FROM}`);
    console.log(`Subject: ${testEmail.subject}`);
    
    const result = await sendEmail(testEmail.to, testEmail.subject, testEmail.body);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`To: ${result.to}`);
      console.log(`From: ${result.from}`);
    } else {
      console.log('❌ Test email failed:');
      console.log(`Error: ${result.error}`);
      console.log(`Error Code: ${result.code}`);
    }
  } catch (error) {
    console.log('❌ Test email failed with exception:');
    console.log(error.message);
  }
}

// Run the test
testSESEmail().catch(console.error); 