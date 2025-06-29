const fs = require('fs');
const path = require('path');

// Template for environment configuration (replace with your actual values)
const envConfig = `# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number_here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lead_management
DB_USER=your_db_user_here
DB_PASSWORD=your_db_password_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Server Configuration
PORT=5001
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envConfig);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please update the configuration values in the .env file:');
  console.log('   - TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  console.log('   - DB_USER and DB_PASSWORD');
  console.log('   - EMAIL_USER and EMAIL_PASS');
  console.log('');
  console.log('Current .env contents:');
  console.log('----------------------');
  console.log(envConfig);
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('');
  console.log('Please create a .env file manually in the project root with the following content:');
  console.log('----------------------');
  console.log(envConfig);
} 