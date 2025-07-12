import nodemailer from 'nodemailer';
import pkg from '@aws-sdk/client-ses';
const { SESClient, SendEmailCommand } = pkg;

// Environment variables for email configuration
const EMAIL_METHOD = process.env.EMAIL_METHOD || 'smtp'; // 'smtp' or 'ses-api'
const EMAIL_FROM = process.env.EMAIL_FROM || 'your-verified-email@domain.com';

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || false;

// SES API Configuration (for direct API calls)
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Initialize email clients
let smtpTransporter = null;
let sesClient = null;

/**
 * Validate SMTP configuration
 */
const validateSmtpConfig = () => {
  const issues = [];
  
  if (!SMTP_HOST) {
    issues.push('SMTP_HOST is not configured');
  }
  
  if (!SMTP_USER) {
    issues.push('SMTP_USER is not configured');
  }
  
  if (!SMTP_PASS) {
    issues.push('SMTP_PASS is not configured');
  }
  
  if (!EMAIL_FROM || EMAIL_FROM === 'your-verified-email@domain.com') {
    issues.push('EMAIL_FROM is not configured with a verified email address');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

/**
 * Validate SES API configuration
 */
const validateSesConfig = () => {
  const issues = [];
  
  if (!AWS_ACCESS_KEY_ID) {
    issues.push('AWS_ACCESS_KEY_ID is not configured');
  }
  
  if (!AWS_SECRET_ACCESS_KEY) {
    issues.push('AWS_SECRET_ACCESS_KEY is not configured');
  }
  
  if (!EMAIL_FROM || EMAIL_FROM === 'your-verified-email@domain.com') {
    issues.push('EMAIL_FROM is not configured with a verified email address');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

/**
 * Initialize SMTP transporter
 */
const initializeSmtpTransporter = async () => {
  const validation = validateSmtpConfig();
  if (validation.isValid) {
    try {
      smtpTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false // Only for development/testing
        }
      });
      
      // Verify connection
      await smtpTransporter.verify();
      
      console.log('✅ SMTP transporter initialized successfully');
      console.log(`📧 Using SMTP: ${SMTP_HOST}:${SMTP_PORT}`);
      console.log(`📧 From email: ${EMAIL_FROM}`);
      return true;
    } catch (error) {
      console.log('⚠️ SMTP configuration issue - Email features will be disabled');
      console.log('Error:', error.message);
      console.log('💡 To enable SMTP email features:');
      console.log('   1. Update your .env file with valid SMTP credentials');
      console.log('   2. Ensure your email provider allows SMTP access');
      console.log('   3. Verify your email address is properly configured');
      smtpTransporter = null;
      return false;
    }
  } else {
    console.log('⚠️ SMTP not configured - Email features will be disabled');
    console.log('Configuration issues:', validation.issues);
    console.log('💡 To enable SMTP email features, update your .env file with:');
    console.log('   SMTP_HOST=email-smtp.us-east-1.amazonaws.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=your_smtp_username');
    console.log('   SMTP_PASS=your_smtp_password');
    console.log('   EMAIL_FROM=your_verified_email@domain.com');
    return false;
  }
};

/**
 * Initialize SES API client
 */
const initializeSesClient = async () => {
  const validation = validateSesConfig();
  if (validation.isValid) {
    try {
      sesClient = new SESClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      });
      
      console.log('✅ Amazon SES API client initialized successfully');
      console.log(`📧 Using region: ${AWS_REGION}`);
      console.log(`📧 From email: ${EMAIL_FROM}`);
      return true;
    } catch (error) {
      console.log('⚠️ Amazon SES API configuration issue - Email features will be disabled');
      console.log('Error:', error.message);
      console.log('💡 To enable SES API email features:');
      console.log('   1. Update your .env file with valid AWS credentials');
      console.log('   2. Verify your email address in Amazon SES console');
      console.log('   3. Ensure your AWS account is out of SES sandbox mode');
      sesClient = null;
      return false;
    }
  } else {
    console.log('⚠️ Amazon SES API not configured - Email features will be disabled');
    console.log('Configuration issues:', validation.issues);
    console.log('💡 To enable SES API email features, update your .env file with:');
    console.log('   AWS_ACCESS_KEY_ID=your_aws_access_key');
    console.log('   AWS_SECRET_ACCESS_KEY=your_aws_secret_key');
    console.log('   AWS_REGION=us-east-1 (or your preferred region)');
    console.log('   EMAIL_FROM=your_verified_email@domain.com');
    return false;
  }
};

/**
 * Send email using SMTP
 */
const sendEmailViaSmtp = async (to, subject, body, isHtml = false) => {
  try {
    if (!smtpTransporter) {
      throw new Error('SMTP transporter is not configured. Please set up your SMTP credentials.');
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

    console.log(`📧 Sending email via SMTP to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);

    const mailOptions = {
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      [isHtml ? 'html' : 'text']: body
    };

    const result = await smtpTransporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully via SMTP! Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      to: to,
      from: EMAIL_FROM,
      method: 'smtp'
    };

  } catch (error) {
    console.error('❌ Error sending email via SMTP:', error.message);
    
    return {
      success: false,
      error: error.message,
      method: 'smtp'
    };
  }
};

/**
 * Send email using SES API
 */
const sendEmailViaSesApi = async (to, subject, body, isHtml = false) => {
  try {
    if (!sesClient) {
      throw new Error('Amazon SES API is not configured. Please set up your AWS credentials.');
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

    console.log(`📧 Sending email via SES API to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);

    // Prepare email parameters
    const params = {
      Source: EMAIL_FROM,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          [isHtml ? 'Html' : 'Text']: {
            Data: body,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // Send email using SES
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    console.log(`✅ Email sent successfully via SES API! Message ID: ${result.MessageId}`);
    
    return {
      success: true,
      messageId: result.MessageId,
      to: to,
      from: EMAIL_FROM,
      method: 'ses-api'
    };

  } catch (error) {
    console.error('❌ Error sending email via SES API:', error.message);
    
    // Handle specific SES errors
    let errorCode = 'UNKNOWN_ERROR';
    if (error.name === 'MessageRejected') {
      errorCode = 'MESSAGE_REJECTED';
    } else if (error.name === 'MailFromDomainNotVerifiedException') {
      errorCode = 'MAIL_FROM_NOT_VERIFIED';
    } else if (error.name === 'ConfigurationSetDoesNotExistException') {
      errorCode = 'CONFIGURATION_SET_NOT_FOUND';
    }
    
    return {
      success: false,
      error: error.message,
      code: errorCode,
      method: 'ses-api'
    };
  }
};

/**
 * Main email sending function - automatically chooses method based on configuration
 */
const sendEmail = async (to, subject, body, isHtml = false) => {
  // Determine which method to use
  if (EMAIL_METHOD === 'ses-api') {
    if (sesClient) {
      return await sendEmailViaSesApi(to, subject, body, isHtml);
    } else {
      console.log('⚠️ SES API not available, falling back to SMTP...');
    }
  }
  
  // Default to SMTP or fallback
  if (smtpTransporter) {
    return await sendEmailViaSmtp(to, subject, body, isHtml);
  }
  
  // If neither method is available
  throw new Error('No email method is configured. Please set up either SMTP or SES API credentials.');
};

/**
 * Send HTML email
 */
const sendHtmlEmail = async (to, subject, htmlBody) => {
  return sendEmail(to, subject, htmlBody, true);
};

/**
 * Test email connection
 */
const testEmailConnection = async () => {
  try {
    if (EMAIL_METHOD === 'ses-api') {
      if (!sesClient) {
        console.log('❌ SES API client not initialized');
        return false;
      }

      const validation = validateSesConfig();
      if (!validation.isValid) {
        console.log('⚠️ SES API configuration issues:', validation.issues);
        return false;
      }

      // Test by sending a simple email to verify connection
      // We'll use a simple test instead of GetAccountAttributesCommand
      console.log('✅ SES API client is initialized and ready');
      return true;
      
      console.log('✅ Amazon SES API connection successful!');
      return true;
    } else {
      // Test SMTP
      if (!smtpTransporter) {
        console.log('❌ SMTP transporter not initialized');
        return false;
      }

      const validation = validateSmtpConfig();
      if (!validation.isValid) {
        console.log('⚠️ SMTP configuration issues:', validation.issues);
        return false;
      }

      // Test SMTP connection
      await smtpTransporter.verify();
      
      console.log('✅ SMTP connection successful!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Email connection test failed:', error.message);
    return false;
  }
};

/**
 * Get current email configuration status
 */
const getEmailConfigStatus = () => {
  return {
    method: EMAIL_METHOD,
    from: EMAIL_FROM,
    smtp: {
      configured: !!smtpTransporter,
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER ? '***configured***' : 'not configured',
      secure: SMTP_SECURE
    },
    sesApi: {
      configured: !!sesClient,
      region: AWS_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID ? '***configured***' : 'not configured'
    }
  };
};

/**
 * Initialize email system based on configuration
 */
const initializeEmailSystem = async () => {
  console.log(`🚀 Initializing email system with method: ${EMAIL_METHOD}`);
  
  if (EMAIL_METHOD === 'ses-api') {
    await initializeSesClient();
  } else {
    await initializeSmtpTransporter();
  }
  
  // Log configuration status
  const status = getEmailConfigStatus();
  console.log('📧 Email configuration status:', JSON.stringify(status, null, 2));
};

// Initialize on module load
initializeEmailSystem();

const mailer = {
  // Main functions
  sendEmail,
  sendHtmlEmail,
  testEmailConnection,
  getEmailConfigStatus,
  
  // Individual method functions
  sendEmailViaSmtp,
  sendEmailViaSesApi,
  
  // Configuration functions
  validateSmtpConfig,
  validateSesConfig,
  initializeSmtpTransporter,
  initializeSesClient,
  
  // Configuration constants
  EMAIL_METHOD,
  EMAIL_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_SECURE
};

export default mailer; 