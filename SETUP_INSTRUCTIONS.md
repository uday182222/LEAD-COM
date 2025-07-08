# Lead Management System - Setup Instructions

This guide will help you set up the Lead Management System on your local machine.

## Prerequisites

### 1. **Node.js and npm**
- Install Node.js (version 16 or higher) from [nodejs.org](https://nodejs.org/)
- npm comes bundled with Node.js

### 2. **PostgreSQL Database**
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### 3. **Git**
- Install Git from [git-scm.com](https://git-scm.com/)

## Installation Steps

### 1. **Clone the Repository**
```bash
git clone https://github.com/uday182222/LEAD-COM.git
cd LEAD-COM
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Set Up Environment Variables**
```bash
node setup-env.js
```

This will create a `.env` file with placeholder values. Edit the `.env` file with your actual credentials:

#### **Option A: Amazon SES (Recommended)**
```env
# Amazon SES Configuration (Recommended)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
EMAIL_FROM=your-verified-email@domain.com

# Database Configuration (Required)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lead_management
DB_USER=your_db_user_here
DB_PASSWORD=your_db_password_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

**📧 Amazon SES Setup**: See [AMAZON_SES_SETUP.md](./AMAZON_SES_SETUP.md) for detailed setup instructions.

#### **Option B: Gmail SMTP (Alternative)**
```env
# Gmail SMTP Configuration (Alternative)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Database Configuration (Required)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lead_management
DB_USER=your_db_user_here
DB_PASSWORD=your_db_password_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

**📧 Gmail Setup**: 
- Enable 2-factor authentication on your Gmail account
- Generate an App Password (not your regular password)
- Use the App Password in EMAIL_PASS

### 4. **Start PostgreSQL Service**

**macOS:**
```bash
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
- PostgreSQL service should start automatically after installation

### 5. **Create Database and User**

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database
CREATE DATABASE lead_management;

# Create user (optional - you can use the default postgres user)
CREATE USER your_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lead_management TO your_user;

# Exit psql
\q
```

### 6. **Run Database Setup Script**

```bash
psql -d lead_management -f setup-database.sql
```

### 7. **Start the Application**

```bash
# Start the backend server
node server.js
```

You should see:
```
✅ PostgreSQL database connected successfully
✅ Database tables initialized successfully
File upload server running on port 5001
```

### 8. **Start the Frontend (In a new terminal)**

```bash
npm start
```

The React app will open in your browser at `http://localhost:3000`

## Features

### **File Upload and Lead Management**
- Upload CSV and Excel files
- Automatic data validation
- Duplicate detection
- Batch processing
- Real-time progress tracking

### **Campaign Management**
- Create email campaigns
- Template builder with dynamic fields
- Campaign scheduling
- Performance tracking

### **Dashboard**
- Lead statistics
- Campaign performance charts
- Recent activity feed

## API Endpoints

- `POST /api/upload` - Upload and parse files
- `POST /api/validate` - Validate lead data
- `POST /api/save-leads` - Save leads to database
- `GET /api/leads` - Retrieve leads from database
- `GET /api/available-leads` - Get leads for campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/health` - Health check

## Database Schema

### Leads Table
- `id` - Primary key
- `lead_id` - Unique lead identifier
- `first_name`, `last_name` - Contact information
- `email` - Email address (unique, required)
- `phone` - Phone number (required)
- `company`, `job_title`, `industry` - Professional information
- `website`, `linkedin_url` - Social profiles
- `tags` - Array of tags
- `source` - Lead source (e.g., 'file_upload', 'manual')
- `notes` - Additional notes
- `status` - Lead status (default: 'new')
- `created_at`, `updated_at` - Timestamps

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Check port
netstat -an | grep 5432

# Test connection
psql -h localhost -U your_user -d lead_management
```

### Permission Issues
```bash
# Grant necessary permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE lead_management TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Reset Database
```bash
# Drop and recreate database
psql postgres -c "DROP DATABASE IF EXISTS lead_management;"
psql postgres -c "CREATE DATABASE lead_management;"
psql -d lead_management -f setup-database.sql
```

### Port Already in Use
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 <PID>
```

## Development

### Project Structure
```
Lead-Com/
├── src/                    # React frontend components
│   ├── App.js             # Main application component
│   ├── Dashboard.js       # Dashboard with charts and stats
│   ├── LeadFileUpload.js  # File upload and processing
│   ├── TemplateBuilder.js # Email/WhatsApp template builder
│   ├── CampaignForm.js    # Campaign creation form
│   └── FieldSelection.js  # Field mapping interface
├── server.js              # Express.js backend server
├── database.js            # Database operations
├── setup-database.sql     # Database schema and setup
├── setup-env.js           # Environment configuration template
└── package.json           # Dependencies and scripts
```

### Adding New Features
1. Backend changes go in `server.js` or create new modules
2. Frontend changes go in the `src/` directory
3. Database changes go in `setup-database.sql`
4. Update this documentation for any new setup requirements

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all prerequisites are installed correctly
4. Verify your `.env` configuration

## License

This project is open source and available under the MIT License. 