# Mailer Utility Setup Guide

This guide explains how to set up and use the new mailer utility that supports both Amazon SES SMTP and SES API methods.

## 🚀 Features

- **Dual Email Methods**: Support for both SMTP and SES API
- **Automatic Fallback**: Falls back to SMTP if SES API is not available
- **Environment-based Configuration**: Easy configuration via environment variables
- **Connection Testing**: Built-in connection validation
- **Error Handling**: Comprehensive error handling and logging
- **Reusable**: Easy to integrate into any part of your application

## 📧 Email Methods

### 1. Amazon SES SMTP (Recommended)
- Uses Amazon SES SMTP endpoint
- More reliable for high-volume sending
- Better error handling and retry logic
- Supports both text and HTML emails

### 2. Amazon SES API (Alternative)
- Direct API calls to Amazon SES
- Faster for single emails
- More control over email parameters
- Good for low-volume sending

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_METHOD=smtp                    # 'smtp' or 'ses-api'
EMAIL_FROM=your-verified-email@domain.com

# Amazon SES SMTP Configuration (Recommended)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=false

# Amazon SES API Configuration (Alternative)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### Amazon SES SMTP Setup

1. **Get SMTP Credentials**:
   - Go to AWS SES Console
   - Navigate to "SMTP settings"
   - Click "Create SMTP credentials"
   - Save the username and password

2. **Verify Email Address**:
   - In SES Console, go to "Verified identities"
   - Add and verify your sender email address

3. **Configure Environment**:
   ```env
   EMAIL_METHOD=smtp
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   EMAIL_FROM=your-verified-email@domain.com
   ```

### Amazon SES API Setup

1. **Create IAM User**:
   - Go to AWS IAM Console
   - Create a new user with SES permissions
   - Generate access keys

2. **Verify Email Address**:
   - Same as SMTP setup

3. **Configure Environment**:
   ```env
   EMAIL_METHOD=ses-api
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   EMAIL_FROM=your-verified-email@domain.com
   ```

## 📖 Usage Examples

### Basic Usage

```javascript
const mailer = require('./mailer');

// Send a simple text email
const result = await mailer.sendEmail(
  'recipient@example.com',
  'Test Subject',
  'Hello, this is a test email!'
);

if (result.success) {
  console.log('Email sent successfully!');
  console.log('Message ID:', result.messageId);
} else {
  console.log('Email failed:', result.error);
}
```

### HTML Email

```javascript
const htmlBody = `
<html>
  <body>
    <h1>Welcome to Lead-Com!</h1>
    <p>This is an HTML email with <strong>rich formatting</strong>.</p>
    <p>Sent at: ${new Date().toLocaleString()}</p>
  </body>
</html>
`;

const result = await mailer.sendHtmlEmail(
  'recipient@example.com',
  'Welcome Email',
  htmlBody
);
```

### Text Email

```javascript
const result = await mailer.sendTextEmail(
  'recipient@example.com',
  'Plain Text Email',
  'This is a plain text email without HTML formatting.'
);
```

### Method-Specific Sending

```javascript
// Force SMTP method
const smtpResult = await mailer.sendEmailViaSmtp(
  'recipient@example.com',
  'SMTP Test',
  'This email was sent via SMTP'
);

// Force SES API method
const sesResult = await mailer.sendEmailViaSesApi(
  'recipient@example.com',
  'SES API Test',
  'This email was sent via SES API'
);
```

### Testing Connection

```javascript
// Test email connection
const isConnected = await mailer.testEmailConnection();
if (isConnected) {
  console.log('✅ Email connection successful!');
} else {
  console.log('❌ Email connection failed');
}

// Get configuration status
const config = mailer.getEmailConfigStatus();
console.log('Current config:', config);
```

## 🔍 API Reference

### Main Functions

#### `sendEmail(to, subject, body, isHtml = false)`
Main email sending function that automatically chooses the best method.

**Parameters:**
- `to` (string): Recipient email address
- `subject` (string): Email subject
- `body` (string): Email body content
- `isHtml` (boolean): Whether body is HTML (default: false)

**Returns:**
```javascript
{
  success: boolean,
  messageId?: string,
  to: string,
  from: string,
  method: 'smtp' | 'ses-api',
  error?: string,
  code?: string
}
```

#### `sendHtmlEmail(to, subject, htmlBody)`
Send HTML email (convenience function).

#### `sendTextEmail(to, subject, textBody)`
Send text email (convenience function).

#### `testEmailConnection()`
Test the current email configuration.

**Returns:** `Promise<boolean>`

#### `getEmailConfigStatus()`
Get current email configuration status.

**Returns:**
```javascript
{
  method: string,
  from: string,
  smtp: {
    configured: boolean,
    host: string,
    port: number,
    user: string,
    secure: boolean
  },
  sesApi: {
    configured: boolean,
    region: string,
    accessKeyId: string
  }
}
```

### Method-Specific Functions

#### `sendEmailViaSmtp(to, subject, body, isHtml = false)`
Force SMTP method.

#### `sendEmailViaSesApi(to, subject, body, isHtml = false)`
Force SES API method.

### Configuration Functions

#### `validateSmtpConfig()`
Validate SMTP configuration.

#### `validateSesConfig()`
Validate SES API configuration.

#### `initializeSmtpTransporter()`
Initialize SMTP transporter.

#### `initializeSesClient()`
Initialize SES API client.

## 🧪 Testing

Run the test script to verify your configuration:

```bash
node test-mailer.js
```

This will:
1. Display your current configuration
2. Test the email connection
3. Send a test email (if connection is successful)
4. Show available functions

## 🔧 Integration with Server

The mailer is already integrated into your server.js. To use it in other parts of your application:

```javascript
const mailer = require('./mailer');

// In your route handlers or business logic
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const result = await mailer.sendEmail(to, subject, body);
    
    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 🚨 Troubleshooting

### Common Issues

1. **"SMTP transporter is not configured"**
   - Check your SMTP credentials in .env
   - Verify EMAIL_METHOD is set to 'smtp'

2. **"Amazon SES API is not configured"**
   - Check your AWS credentials in .env
   - Verify EMAIL_METHOD is set to 'ses-api'

3. **"Email address not verified"**
   - Verify your sender email in Amazon SES console
   - Wait for verification to complete

4. **"Connection timeout"**
   - Check your network connection
   - Verify SMTP_HOST and SMTP_PORT are correct
   - Ensure firewall allows outbound SMTP traffic

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed connection and sending logs.

## 📝 Migration from email-config.js

The new mailer utility replaces the old `email-config.js`. The main changes:

1. **Import change**: `const email = require('./email-config')` → `const mailer = require('./mailer')`
2. **Function names**: `email.sendEmail()` → `mailer.sendEmail()`
3. **Additional features**: Connection testing, configuration status, method selection

The old `email-config.js` can be removed after migration is complete. 