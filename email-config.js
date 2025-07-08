// Email Configuration using Amazon SES API
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Environment variables for Amazon SES
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'your-verified-email@domain.com';

// Initialize SES client
let sesClient = null;

// Function to validate email configuration
const validateEmailConfig = () => {
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

// Initialize SES client if credentials are valid
const initializeEmailTransporter = async () => {
  const validation = validateEmailConfig();
  if (validation.isValid) {
    try {
      sesClient = new SESClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      });
      
      console.log('✅ Amazon SES client initialized successfully');
      console.log(`📧 Using region: ${AWS_REGION}`);
      console.log(`📧 From email: ${EMAIL_FROM}`);
      return true;
    } catch (error) {
      console.log('⚠️ Amazon SES configuration issue - Email features will be disabled');
      console.log('Error:', error.message);
      console.log('💡 To enable email features:');
      console.log('   1. Update your .env file with valid AWS credentials');
      console.log('   2. Verify your email address in Amazon SES console');
      console.log('   3. Ensure your AWS account is out of SES sandbox mode');
      sesClient = null;
      return false;
    }
  } else {
    console.log('⚠️ Amazon SES not configured - Email features will be disabled');
    console.log('Configuration issues:', validation.issues);
    console.log('💡 To enable email features, update your .env file with:');
    console.log('   AWS_ACCESS_KEY_ID=your_aws_access_key');
    console.log('   AWS_SECRET_ACCESS_KEY=your_aws_secret_key');
    console.log('   AWS_REGION=us-east-1 (or your preferred region)');
    console.log('   EMAIL_FROM=your_verified_email@domain.com');
    return false;
  }
};

// Function to send email
const sendEmail = async (to, subject, body, isHtml = false) => {
  try {
    // Check if SES is properly configured
    if (!sesClient) {
      throw new Error('Amazon SES is not configured. Please set up your AWS credentials.');
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
    
    console.log(`✅ Email sent successfully! Message ID: ${result.MessageId}`);
    
    return {
      success: true,
      messageId: result.MessageId,
      to: to,
      from: EMAIL_FROM
    };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
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
      code: errorCode
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
    if (!sesClient) {
      console.log('❌ SES client not initialized');
      return false;
    }

    const validation = validateEmailConfig();
    if (!validation.isValid) {
      console.log('⚠️ SES configuration issues:', validation.issues);
      return false;
    }

    // Test by getting SES account attributes
    const { GetAccountAttributesCommand } = require('@aws-sdk/client-ses');
    const command = new GetAccountAttributesCommand({});
    await sesClient.send(command);
    
    console.log('✅ Amazon SES connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Amazon SES connection failed:', error.message);
    return false;
  }
};

// Initialize on module load
initializeEmailTransporter();

module.exports = {
  emailTransporter: sesClient, // Keep for backward compatibility
  sesClient,
  sendEmail,
  sendHtmlEmail,
  validateEmailConfig,
  testEmailConnection,
  EMAIL_FROM
}; 