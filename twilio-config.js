// Twilio Configuration
const twilio = require('twilio');

// Environment variables for Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid_here';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token_here';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'your_twilio_whatsapp_number_here';

// Initialize Twilio client only if credentials are properly configured
let twilioClient = null;

// Function to validate Twilio configuration
const validateTwilioConfig = () => {
  const issues = [];
  
  if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID === 'your_twilio_account_sid_here') {
    issues.push('TWILIO_ACCOUNT_SID is not configured');
  }
  
  if (!TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN === 'your_twilio_auth_token_here') {
    issues.push('TWILIO_AUTH_TOKEN is not configured');
  }
  
  if (!TWILIO_WHATSAPP_NUMBER || TWILIO_WHATSAPP_NUMBER === 'your_twilio_whatsapp_number_here') {
    issues.push('TWILIO_WHATSAPP_NUMBER is not configured');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

// Initialize Twilio client if credentials are valid
const initializeTwilioClient = () => {
  const validation = validateTwilioConfig();
  if (validation.isValid) {
    try {
      twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Twilio client:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ Twilio not configured - WhatsApp features will be disabled');
    console.log('Configuration issues:', validation.issues);
    return false;
  }
};

// Initialize on module load
initializeTwilioClient();

// Function to send WhatsApp message
const sendWhatsAppMessage = async (to, messageBody) => {
  try {
    // Check if Twilio is properly configured
    if (!twilioClient) {
      throw new Error('Twilio is not configured. Please set up your Twilio credentials.');
    }

    // Validate inputs
    if (!to || !messageBody) {
      throw new Error('Recipient number and message body are required');
    }

    // Format phone number for WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

    console.log(`📱 Sending WhatsApp message to: ${formattedTo}`);
    console.log(`📝 Message: ${messageBody.substring(0, 100)}${messageBody.length > 100 ? '...' : ''}`);

    // Send message via Twilio
    const message = await twilioClient.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: messageBody
    });

    console.log(`✅ WhatsApp message sent successfully! SID: ${message.sid}`);
    
    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
      to: formattedTo,
      from: formattedFrom
    };

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
};

// Function to test Twilio connection
const testTwilioConnection = async () => {
  try {
    if (!twilioClient) {
      console.log('❌ Twilio client not initialized');
      return false;
    }

    const validation = validateTwilioConfig();
    if (!validation.isValid) {
      console.log('⚠️ Twilio configuration issues:', validation.issues);
      return false;
    }

    // Try to fetch account info to test connection
    const account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Twilio connection successful!');
    console.log(`📞 Account: ${account.friendlyName} (${account.status})`);
    return true;
    
  } catch (error) {
    console.error('❌ Twilio connection failed:', error.message);
    return false;
  }
};

module.exports = {
  twilioClient,
  sendWhatsAppMessage,
  validateTwilioConfig,
  testTwilioConnection,
  TWILIO_WHATSAPP_NUMBER
}; 