// Test script for HTML Email Service using Amazon SES API
require('dotenv').config();
const { sendHTMLEmail, sendTextEmail, testSESConnection, getSESStatus } = require('./email-service');

async function testHTMLEmailService() {
  console.log('🧪 Testing HTML Email Service with Amazon SES API\n');
  
  // Display current SES configuration status
  console.log('📧 Current SES Configuration:');
  const status = getSESStatus();
  console.log(JSON.stringify(status, null, 2));
  console.log('');
  
  // Test SES connection
  console.log('🔗 Testing SES API Connection...');
  const connectionTest = await testSESConnection();
  if (!connectionTest) {
    console.log('❌ SES API connection failed. Please check your configuration.');
    return;
  }
  console.log('');
  
  // Test 1: Send HTML email with template
  console.log('📤 Test 1: Sending HTML Email with Template');
  console.log('=' .repeat(50));
  
  const htmlEmailResult = await sendHTMLEmail(
    'uday@motionfalcon.com',
    'Welcome to Lead-Com - HTML Email Test',
    'templates/welcome.html'
  );
  
  if (htmlEmailResult.success) {
    console.log('✅ HTML email sent successfully!');
    console.log(`📧 Message ID: ${htmlEmailResult.messageId}`);
    console.log(`📧 To: ${htmlEmailResult.to}`);
    console.log(`📧 From: ${htmlEmailResult.from}`);
    console.log(`📄 Template: ${htmlEmailResult.templatePath}`);
  } else {
    console.log('❌ HTML email failed:');
    console.log(`Error: ${htmlEmailResult.error}`);
    console.log(`Error Code: ${htmlEmailResult.code}`);
  }
  console.log('');
  
  // Test 2: Send simple text email
  console.log('📤 Test 2: Sending Text Email');
  console.log('=' .repeat(50));
  
  const textEmailResult = await sendTextEmail(
    'uday@motionfalcon.com',
    'Lead-Com - Text Email Test',
    `Hello Uday!

This is a test text email from the Lead-Com system using Amazon SES API.

Features tested:
✅ Amazon SES API
✅ Text email sending
✅ SES configuration

Sent at: ${new Date().toISOString()}
From: ${process.env.EMAIL_FROM}

Best regards,
Lead-Com System`
  );
  
  if (textEmailResult.success) {
    console.log('✅ Text email sent successfully!');
    console.log(`📧 Message ID: ${textEmailResult.messageId}`);
    console.log(`📧 To: ${textEmailResult.to}`);
    console.log(`📧 From: ${textEmailResult.from}`);
  } else {
    console.log('❌ Text email failed:');
    console.log(`Error: ${textEmailResult.error}`);
    console.log(`Error Code: ${textEmailResult.code}`);
  }
  console.log('');
  
  // Test 3: Test with non-existent template
  console.log('📤 Test 3: Testing with Non-existent Template (Error Handling)');
  console.log('=' .repeat(50));
  
  const errorTestResult = await sendHTMLEmail(
    'uday@motionfalcon.com',
    'Test Error Handling',
    'templates/non-existent.html'
  );
  
  if (!errorTestResult.success) {
    console.log('✅ Error handling working correctly:');
    console.log(`Error: ${errorTestResult.error}`);
  } else {
    console.log('❌ Error handling failed - email was sent when it should have failed');
  }
  console.log('');
  
  console.log('🎉 HTML Email Service Testing Complete!');
}

// Run the test
testHTMLEmailService().catch(console.error); 