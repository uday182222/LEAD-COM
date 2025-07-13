import pkg from '@aws-sdk/client-ses';
const { SESClient, SendEmailCommand, GetSendQuotaCommand } = pkg;
import fs from 'fs/promises';
import path from 'path';

/**
 * Email Service using Amazon SES API
 * 
 * This service provides functionality to send HTML emails using Amazon SES API
 * with support for loading external HTML templates.
 */

// Environment variables for Amazon SES API
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'your-verified-email@domain.com';

// Initialize SES client
let sesClient = null;

/**
 * Validate SES API configuration
 * @returns {Object} Validation result with isValid boolean and issues array
 */
const validateSESConfig = () => {
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
 * Initialize SES client
 * @returns {Promise<boolean>} Success status
 */
const initializeSESClient = async () => {
  const validation = validateSESConfig();
  
  if (!validation.isValid) {
    console.log('⚠️ SES API configuration issues:', validation.issues);
    console.log('💡 To enable email features, update your .env file with:');
    console.log('   AWS_ACCESS_KEY_ID=your_aws_access_key');
    console.log('   AWS_SECRET_ACCESS_KEY=your_aws_secret_key');
    console.log('   AWS_REGION=us-east-1 (or your preferred region)');
    console.log('   EMAIL_FROM=your_verified_email@domain.com');
    return false;
  }

  try {
    // Create SES client
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
    console.log(`📧 Provider: Amazon SES API`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize SES API client:', error.message);
    console.log('💡 Please check your AWS credentials and ensure:');
    console.log('   1. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct');
    console.log('   2. Email address is verified in Amazon SES');
    console.log('   3. AWS account is out of SES sandbox mode');
    sesClient = null;
    return false;
  }
};

/**
 * Replace template variables in HTML content
 * @param {string} htmlContent - HTML template content
 * @param {Object} templateData - Data object with variables to replace
 * @returns {string} Processed HTML content with variables replaced
 */
const replaceTemplateVariables = (htmlContent, templateData = {}) => {
  if (!htmlContent || typeof htmlContent !== 'string') return '';

  let processedHTML = htmlContent;

  // Replace both {{variable}} and {variable}
  Object.keys(templateData).forEach(key => {
    const value = templateData[key] ?? '';

    const doubleBraceRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const singleBraceRegex = new RegExp(`{\\s*${key}\\s*}`, 'g');

    processedHTML = processedHTML
      .replace(doubleBraceRegex, value)
      .replace(singleBraceRegex, value);
  });

  return processedHTML;
};

/**
 * Load HTML template from file
 * @param {string} templatePath - Path to HTML template file
 * @returns {Promise<string>} HTML content
 */
const loadHTMLTemplate = async (templatePath) => {
  try {
    // Resolve template path relative to project root
    const resolvedPath = path.resolve(process.cwd(), templatePath);
    
    // Check if file exists
    await fs.access(resolvedPath);
    
    // Read and return HTML content
    const htmlContent = await fs.readFile(resolvedPath, 'utf-8');
    
    console.log(`📄 HTML template loaded: ${templatePath}`);
    return htmlContent;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`HTML template file not found: ${templatePath}`);
    }
    throw new Error(`Failed to load HTML template: ${error.message}`);
  }
};

/**
 * Send HTML email using external template or raw HTML
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {Object} options - { html, templatePath }
 * @param {Object} templateData - Data for template variables
 * @returns {Promise<Object>} Result object with success status and details
 */
const sendHTMLEmail = async (to, subject, options = {}, templateData = {}) => {
  let html = options.html;

  if (!html || typeof html !== 'string' || html.trim().length < 10) {
    console.error("❌ [SEND ERROR] Invalid HTML for campaign", {
      to,
      htmlLength: html?.length || 0
    });
    throw new Error("No valid HTML provided");
  }
  try {
    if (!sesClient) {
      throw new Error('SES API client is not initialized. Please check your AWS credentials.');
    }
    if (!to || !subject) {
      throw new Error('Recipient email and subject are required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid email format: ${to}`);
    }
    const processedHTML = replaceTemplateVariables(html, templateData);

    // Fallback if replaceTemplateVariables returns empty (e.g., no variables present)
    const finalHTML = (processedHTML && processedHTML.trim().length > 0)
      ? processedHTML
      : html;

    if (!finalHTML || finalHTML.trim() === '') {
      throw new Error('No valid HTML provided');
    }

    // Log output and variable summary for debugging
    console.log(`[EMAIL SEND] To: ${to}, Subject: "${subject}"`);
    console.log(`[Template Preview]: ${finalHTML.slice(0, 200)}...`);
    console.log(`[Used Variables]:`, templateData);

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
          Html: {
            Data: finalHTML,
            Charset: 'UTF-8',
          },
          Text: {
            Data: finalHTML.replace(/<[^>]*>/g, ''),
            Charset: 'UTF-8',
          },
        },
      },
    };
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log(`✅ HTML email sent successfully!`);
    console.log(`📧 Message ID: ${result.MessageId}`);
    return {
      success: true,
      messageId: result.MessageId,
      to: to,
      from: EMAIL_FROM,
      htmlSource: 'db',
      templateData: templateData
    };
  } catch (error) {
    console.error('❌ Error sending HTML email:', error.message);
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
      to: to,
      from: EMAIL_FROM,
      htmlSource: 'db',
      templateData: templateData
    };
  }
};

/**
 * Test SES API connection
 * @returns {Promise<boolean>} Connection success status
 */
const testSESConnection = async () => {
  try {
    if (!sesClient) {
      console.log('❌ SES client not initialized');
      return false;
    }

    const validation = validateSESConfig();
    if (!validation.isValid) {
      console.log('⚠️ SES API configuration issues:', validation.issues);
      return false;
    }

    // Test by sending a simple command to verify connection
    const command = new GetSendQuotaCommand({});
    await sesClient.send(command);
    
    console.log('✅ Amazon SES API connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Amazon SES API connection failed:', error.message);
    return false;
  }
};

/**
 * Get current SES configuration status
 * @returns {Object} Configuration status
 */
const getSESStatus = () => {
  return {
    configured: !!sesClient,
    region: AWS_REGION,
    from: EMAIL_FROM,
    accessKeyId: AWS_ACCESS_KEY_ID ? '***configured***' : 'not configured'
  };
};

// Initialize SES client on module load
initializeSESClient();

const emailService = {
  sendHTMLEmail,
  testSESConnection,
  getSESStatus,
  validateSESConfig,
  initializeSESClient,
  EMAIL_FROM
}; 

export default emailService; 