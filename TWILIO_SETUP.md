# Twilio WhatsApp Setup Guide

This guide will help you configure Twilio WhatsApp messaging for the Lead Management System.

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **WhatsApp Sandbox**: Enable WhatsApp messaging in your Twilio console
3. **Node.js**: Ensure you have Node.js installed

## Step 1: Get Your Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Note down your **WhatsApp number** (format: +1234567890)

## Step 2: Configure Environment Variables

You can set the environment variables in several ways:

### Option A: Environment Variables (Recommended)
```bash
export TWILIO_ACCOUNT_SID=your_account_sid_here
export TWILIO_AUTH_TOKEN=your_auth_token_here
export TWILIO_WHATSAPP_NUMBER=your_whatsapp_number_here
```

### Option B: Direct in twilio-config.js
Edit `twilio-config.js` and replace the placeholder values:
```javascript
const TWILIO_ACCOUNT_SID = 'your_account_sid_here';
const TWILIO_AUTH_TOKEN = 'your_auth_token_here';
const TWILIO_WHATSAPP_NUMBER = 'your_whatsapp_number_here';
```

## Step 3: Test Configuration

### Test Twilio Connection
```bash
curl http://localhost:5001/api/test-twilio
```

### Test WhatsApp Message Sending
```bash
curl -X POST http://localhost:5001/api/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from Lead Management System! 🚀"
  }'
```

## Step 4: Start Using WhatsApp Campaigns

1. Create a campaign with a WhatsApp template
2. Click "Start Campaign" to begin sending messages
3. Monitor the console for message sending progress

## Troubleshooting

### Common Issues

1. **"Twilio not configured properly"**
   - Check that all environment variables are set correctly
   - Verify your Account SID and Auth Token

2. **"Invalid phone number"**
   - Ensure phone numbers include country code (e.g., +1234567890)
   - Check that the number is in the correct format

3. **"Message sending failed"**
   - Verify your WhatsApp sandbox is active
   - Check that the recipient has joined your sandbox

## Security Notes

- Never commit your Twilio credentials to version control
- Use environment variables for sensitive data
- Regularly rotate your Auth Token
- Monitor your Twilio usage and costs 