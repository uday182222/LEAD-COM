// Email Configuration using Nodemailer
const nodemailer = require('nodemailer');

// Environment variables for email
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER || 'your_email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_app_password';
const EMAIL_FROM = process.env.EMAIL_FROM || 'your_email@gmail.com';

// Initialize email transporter
let emailTransporter = null;

// Function to validate email configuration
const validateEmailConfig = () => {
  const issues = [];
  
  if (!EMAIL_USER || EMAIL_USER === 'your_email@gmail.com') {
    issues.push('EMAIL_USER is not configured');
  }
  
  if (!EMAIL_PASS || EMAIL_PASS === 'your_app_password') {
    issues.push('EMAIL_PASS is not configured');
  }
  
  if (!EMAIL_FROM || EMAIL_FROM === 'your_email@gmail.com') {
    issues.push('EMAIL_FROM is not configured');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

// Initialize email transporter if credentials are valid
const initializeEmailTransporter = async () => {
  const validation = validateEmailConfig();
  if (validation.isValid) {
    try {
      emailTransporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Test the connection
      await emailTransporter.verify();
      console.log('✅ Email transporter initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ Email not configured - Email features will be disabled');
    console.log('Configuration issues:', validation.issues);
    return false;
  }
};

// Function to send email
const sendEmail = async (to, subject, body, isHtml = false) => {
  try {
    // Check if email is properly configured
    if (!emailTransporter) {
      throw new Error('Email is not configured. Please set up your email credentials.');
    }

    // Validate inputs
    if (!to || !subject || !body) {
      throw new Error('Recipient email, subject, and body are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid email format: ${to}`);
    }

    console.log(`📧 Sending email to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);

    // Send email
    const mailOptions = {
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      [isHtml ? 'html' : 'text']: body
    };

    const result = await emailTransporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully! Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      to: to,
      from: EMAIL_FROM
    };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
};

// Function to send HTML email
const sendHtmlEmail = async (to, subject, htmlBody) => {
  return sendEmail(to, subject, htmlBody, true);
};

// Function to test email connection
const testEmailConnection = async () => {
  try {
    if (!emailTransporter) {
      console.log('❌ Email transporter not initialized');
      return false;
    }

    const validation = validateEmailConfig();
    if (!validation.isValid) {
      console.log('⚠️ Email configuration issues:', validation.issues);
      return false;
    }

    // Test the connection
    await emailTransporter.verify();
    console.log('✅ Email connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    return false;
  }
};

// Initialize on module load
initializeEmailTransporter();

module.exports = {
  emailTransporter,
  sendEmail,
  sendHtmlEmail,
  validateEmailConfig,
  testEmailConnection,
  EMAIL_FROM
}; 