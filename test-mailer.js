// Test script for the new mailer utility
import dotenv from 'dotenv';
dotenv.config();
import mailer from './mailer.js';

async function testMailer() {
  console.log('🧪 Testing Mailer Utility\n');
  
  // Display current configuration
  console.log('📧 Current Email Configuration:');
  const config = mailer.getEmailConfigStatus();
  console.log(JSON.stringify(config, null, 2));
  console.log('');
  
  // Test connection
  console.log('🔗 Testing Email Connection...');
  const connectionTest = await mailer.testEmailConnection();
  console.log(`Connection test result: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  
  if (!connectionTest) {
    console.log('⚠️ Email connection failed. Please check your configuration.');
    return;
  }
  
  // Test sending a simple email
  console.log('📤 Testing Email Sending...');
  
  const testEmail = {
    to: 'udaytomar.in@gmail.com', // Testing email to udaytomar.in@gmail.com
    subject: 'Test Email from Lead-Com Mailer',
    body: `
Hello Uday!

This is a test email from the Lead-Com mailer utility.

Features tested:
✅ SMTP/SES API configuration
✅ Email validation
✅ Connection testing
✅ Email sending

Sent at: ${new Date().toISOString()}
Method: ${config.method}

Best regards,
Lead-Com System
    `.trim()
  };
  
  try {
    console.log(`Sending test email to: ${testEmail.to}`);
    const result = await mailer.sendEmail(testEmail.to, testEmail.subject, testEmail.body);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`Method used: ${result.method}`);
    } else {
      console.log('❌ Test email failed:');
      console.log(`Error: ${result.error}`);
      console.log(`Method: ${result.method}`);
    }
  } catch (error) {
    console.log('❌ Test email failed with exception:');
    console.log(error.message);
  }
  
  console.log('\n📋 Mailer Utility Functions Available:');
  console.log('- mailer.sendEmail(to, subject, body, isHtml)');
  console.log('- mailer.sendHtmlEmail(to, subject, htmlBody)');
  console.log('- mailer.sendTextEmail(to, subject, textBody)');
  console.log('- mailer.testEmailConnection()');
  console.log('- mailer.getEmailConfigStatus()');
  console.log('- mailer.sendEmailViaSmtp(to, subject, body, isHtml)');
  console.log('- mailer.sendEmailViaSesApi(to, subject, body, isHtml)');
}

// Run the test
testMailer().catch(console.error); 