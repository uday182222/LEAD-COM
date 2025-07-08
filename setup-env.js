const fs = require('fs');
const path = require('path');

// Environment variables template
const envTemplate = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lead_management
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Email Configuration
# Choose your email method: 'smtp' (default) or 'ses-api'
EMAIL_METHOD=smtp
EMAIL_FROM=your-verified-email@domain.com

# Option 1: SMTP Configuration (Recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false

# Option 2: Amazon SES SMTP Configuration (Alternative)
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_USER=your_smtp_username
# SMTP_PASS=your_smtp_password
# SMTP_SECURE=false

# Option 3: Amazon SES API Configuration (Alternative)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_aws_access_key_id
# AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key



# Server Configuration
PORT=5001
NODE_ENV=development
`;

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file with template configuration');
  console.log('📝 Please update the .env file with your actual credentials:');
  console.log('');
  console.log('🔧 Required for SMTP Email:');
  console.log('   - SMTP_USER: Your email address');
  console.log('   - SMTP_PASS: Your email password or app password');
  console.log('   - EMAIL_FROM: Your email address');
  console.log('');
  console.log('🔧 Required for Database:');
  console.log('   - DB_USER: PostgreSQL username');
  console.log('   - DB_PASSWORD: PostgreSQL password');
  console.log('');
  
} else {
  console.log('⚠️ .env file already exists');
  console.log('📝 To configure email, update these variables:');
  console.log('   - SMTP_USER: Your email address');
  console.log('   - SMTP_PASS: Your email password or app password');
  console.log('   - EMAIL_FROM: Your email address');
  console.log('');
  console.log('📝 For Gmail, you may need to:');
  console.log('   1. Enable 2-factor authentication');
  console.log('   2. Generate an app password');
  console.log('   3. Use the app password as SMTP_PASS');
} 