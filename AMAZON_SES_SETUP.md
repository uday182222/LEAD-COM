# Amazon SES Setup Guide

This guide will help you set up Amazon SES (Simple Email Service) to replace Gmail SMTP for sending emails in your Lead Management System.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI** (optional but recommended): For easier credential management
3. **Domain or Email Address**: A domain or email address you want to send emails from

## Step 1: Create AWS Account and Get Credentials

### 1.1 Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add a payment method (SES has a free tier)

### 1.2 Create IAM User for SES
1. Go to AWS IAM Console
2. Click "Users" → "Add user"
3. Enter username: `ses-email-user`
4. Select "Programmatic access"
5. Click "Next: Permissions"

### 1.3 Attach SES Permissions
1. Click "Attach existing policies directly"
2. Search for "AmazonSESFullAccess"
3. Select it and click "Next"
4. Review and create the user

### 1.4 Get Access Keys
1. After creating the user, click on the user name
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Application running outside AWS"
5. Copy the **Access Key ID** and **Secret Access Key**

## Step 2: Set Up Amazon SES

### 2.1 Go to SES Console
1. Go to [Amazon SES Console](https://console.aws.amazon.com/ses/)
2. Select your preferred region (e.g., `us-east-1`)

### 2.2 Verify Email Address
1. Click "Verified identities" in the left sidebar
2. Click "Create identity"
3. Select "Email address"
4. Enter your email address (e.g., `your-email@domain.com`)
5. Click "Create identity"
6. Check your email and click the verification link

### 2.3 (Optional) Verify Domain
If you want to send from a custom domain:
1. Click "Create identity"
2. Select "Domain"
3. Enter your domain name
4. Follow the DNS verification steps

## Step 3: Request Production Access

### 3.1 Check Sandbox Status
- New SES accounts are in "sandbox mode"
- You can only send to verified email addresses
- Check your sending limits in the SES console

### 3.2 Request Production Access
1. In SES Console, go to "Account dashboard"
2. Click "Request production access"
3. Fill out the form:
   - **Use case description**: "Sending marketing emails to leads"
   - **Website URL**: Your website URL
   - **How you plan to send emails**: "Through our lead management application"
   - **How you plan to handle bounces and complaints**: "We will remove bounced emails and honor unsubscribe requests"
4. Submit the request
5. Wait for approval (usually 24-48 hours)

## Step 4: Update Your Environment Variables

### 4.1 Update .env File
Replace your current email configuration with:

```env
# Amazon SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
EMAIL_FROM=your-verified-email@domain.com

# Remove these Gmail variables:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password
```

### 4.2 Test Configuration
Run the setup script to verify your configuration:

```bash
node setup-env.js
```

## Step 5: Test Email Sending

### 5.1 Start Your Application
```bash
npm run dev
```

### 5.2 Test Email Functionality
1. Upload some test leads
2. Create a campaign
3. Check the console logs for email sending status

## Step 6: Monitor and Optimize

### 6.1 Monitor SES Metrics
- Go to SES Console → "Sending statistics"
- Monitor bounce rate, complaint rate, and delivery rate
- Keep bounce rate below 5% and complaint rate below 0.1%

### 6.2 Set Up CloudWatch Alarms
1. Go to CloudWatch Console
2. Create alarms for:
   - Bounce rate > 5%
   - Complaint rate > 0.1%
   - Daily sending quota usage

## Troubleshooting

### Common Issues

#### 1. "Email address not verified"
- **Solution**: Verify your email address in SES console
- **Prevention**: Always verify sender emails before sending

#### 2. "Message rejected"
- **Solution**: Check if you're in sandbox mode
- **Prevention**: Request production access

#### 3. "Access denied"
- **Solution**: Check your AWS credentials and permissions
- **Prevention**: Ensure IAM user has SES permissions

#### 4. "Rate exceeded"
- **Solution**: Check your sending limits
- **Prevention**: Implement rate limiting in your application

### Best Practices

1. **Always verify sender emails** before sending
2. **Implement proper error handling** for bounces and complaints
3. **Monitor your sending statistics** regularly
4. **Use dedicated IP addresses** for high-volume sending
5. **Implement proper authentication** (SPF, DKIM, DMARC)

## Cost Considerations

### SES Pricing (as of 2024)
- **First 62,000 emails/month**: Free (when sent from EC2)
- **Additional emails**: $0.10 per 1,000 emails
- **Data transfer**: Free within AWS

### Cost Optimization
1. **Use EC2 instances** to qualify for free tier
2. **Batch your emails** to reduce API calls
3. **Monitor usage** to avoid unexpected charges

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** when possible instead of access keys
3. **Rotate access keys** regularly
4. **Use least privilege principle** for IAM permissions
5. **Enable CloudTrail** for audit logging

## Migration Checklist

- [ ] Create AWS account
- [ ] Set up IAM user with SES permissions
- [ ] Verify email address in SES
- [ ] Request production access (if needed)
- [ ] Update .env file with AWS credentials
- [ ] Test email sending functionality
- [ ] Monitor sending statistics
- [ ] Set up CloudWatch alarms
- [ ] Update documentation

## Support Resources

- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [AWS Support](https://aws.amazon.com/support/) 