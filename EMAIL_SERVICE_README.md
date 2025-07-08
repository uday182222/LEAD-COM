# HTML Email Service with Amazon SES SMTP

This service provides a production-ready solution for sending HTML emails using Nodemailer with Amazon SES SMTP, including support for external HTML templates.

## 🚀 Features

- **Nodemailer with Amazon SES SMTP** - Reliable email delivery
- **HTML Template Support** - Load external HTML files
- **Text Email Support** - Fallback for email clients
- **Comprehensive Error Handling** - Graceful failure management
- **Connection Testing** - SMTP connection verification
- **Express.js Integration** - Ready-to-use API routes

## 📋 Prerequisites

1. **Amazon SES Account** - Configured and out of sandbox mode
2. **SES SMTP Credentials** - Username and password (not AWS API keys)
3. **Verified Email Address** - Sender email verified in SES
4. **Node.js Environment** - With required dependencies

## 🔧 Environment Configuration

Add these variables to your `.env` file:

```env
# Amazon SES SMTP Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
SMTP_SECURE=false
EMAIL_FROM=your_verified_email@domain.com

# Server Configuration
PORT=5001
NODE_ENV=development
```

## 📦 Installation

1. **Install Dependencies**
   ```bash
   npm install nodemailer
   ```

2. **Create Template Directory**
   ```bash
   mkdir templates
   ```

3. **Add HTML Templates**
   - Place your HTML email templates in the `templates/` directory
   - Use relative paths when referencing templates

## 🎯 Usage Examples

### Basic HTML Email

```javascript
const { sendHTMLEmail } = require('./email-service');

// Send HTML email with template
const result = await sendHTMLEmail(
  'recipient@example.com',
  'Welcome to Our Service',
  'templates/welcome.html'
);

if (result.success) {
  console.log('Email sent successfully!', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Text Email

```javascript
const { sendTextEmail } = require('./email-service');

// Send simple text email
const result = await sendTextEmail(
  'recipient@example.com',
  'Important Update',
  'This is a plain text email message.'
);
```

### Connection Testing

```javascript
const { testSMTPConnection, getSMTPStatus } = require('./email-service');

// Test SMTP connection
const isConnected = await testSMTPConnection();
console.log('SMTP Connected:', isConnected);

// Get configuration status
const status = getSMTPStatus();
console.log('SMTP Status:', status);
```

## 🌐 Express.js Integration

### 1. Import Routes

```javascript
const emailRoutes = require('./email-routes');

// Add to your Express app
app.use('/api/email', emailRoutes);
```

### 2. API Endpoints

#### Send HTML Email
```http
POST /api/email/send-html
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Welcome Email",
  "templatePath": "templates/welcome.html",
  "templateData": {
    "name": "John Doe"
  }
}
```

#### Send Text Email
```http
POST /api/email/send-text
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Important Update",
  "body": "This is a text email message."
}
```

#### Get SMTP Status
```http
GET /api/email/status
```

#### Test Connection
```http
POST /api/email/test-connection
```

#### Send Welcome Email
```http
POST /api/email/send-welcome
Content-Type: application/json

{
  "to": "recipient@example.com",
  "name": "John Doe"
}
```

## 📄 HTML Template Structure

Create HTML templates in the `templates/` directory:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        /* Inline CSS for email compatibility */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome!</h1>
        <p>This is your email content.</p>
        <!-- Template variables can be added here -->
    </div>
</body>
</html>
```

## 🧪 Testing

Run the test script to verify your setup:

```bash
node test-html-email.js
```

This will:
1. Test SMTP connection
2. Send HTML email with template
3. Send text email
4. Test error handling

## 🔍 Error Handling

The service provides comprehensive error handling:

```javascript
const result = await sendHTMLEmail(to, subject, templatePath);

if (result.success) {
  // Email sent successfully
  console.log('Message ID:', result.messageId);
} else {
  // Handle error
  console.error('Error:', result.error);
  console.error('Code:', result.code);
}
```

### Common Error Scenarios

- **Template Not Found** - Invalid template path
- **SMTP Authentication Failed** - Incorrect credentials
- **Invalid Email Format** - Malformed recipient email
- **Connection Timeout** - Network or configuration issues

## 📊 Response Format

### Success Response
```javascript
{
  success: true,
  messageId: "01090197d02efba3-611c9748-e41b-4115-b0d0-b918dca25db9-000000",
  to: "recipient@example.com",
  from: "sender@domain.com",
  templatePath: "templates/welcome.html",
  accepted: ["recipient@example.com"],
  rejected: []
}
```

### Error Response
```javascript
{
  success: false,
  error: "HTML template file not found: templates/missing.html",
  to: "recipient@example.com",
  from: "sender@domain.com",
  templatePath: "templates/missing.html"
}
```

## 🔧 Configuration Options

### SMTP Settings
- **Host**: `email-smtp.us-east-1.amazonaws.com` (SES SMTP endpoint)
- **Port**: `587` (TLS) or `465` (SSL)
- **Security**: TLS recommended for port 587

### Template Options
- **Path Resolution**: Relative to project root
- **Encoding**: UTF-8
- **File Types**: HTML files only

## 🚀 Production Considerations

### Security
- Store SMTP credentials securely
- Use environment variables
- Validate email addresses
- Implement rate limiting

### Performance
- Connection pooling (handled by Nodemailer)
- Template caching (future enhancement)
- Batch processing for multiple emails

### Monitoring
- Log all email attempts
- Track success/failure rates
- Monitor SMTP connection health
- Set up alerts for failures

## 🔮 Future Enhancements

- **Template Variables** - Dynamic content replacement
- **Template Caching** - Improved performance
- **Batch Sending** - Multiple recipients
- **Email Tracking** - Open/click tracking
- **Template Management** - CRUD operations

## 📞 Support

For issues or questions:
1. Check SMTP configuration
2. Verify SES credentials
3. Test with provided test script
4. Review error logs

---

**Note**: This service is designed for production use with proper error handling, logging, and security considerations. 