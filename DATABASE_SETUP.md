# PostgreSQL Database Setup

This guide will help you set up PostgreSQL for the Lead Management System.

## Prerequisites

1. **PostgreSQL Installation**
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Node.js Dependencies**
   ```bash
   npm install pg
   ```

## Database Setup Steps

### 1. Start PostgreSQL Service

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

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database
CREATE DATABASE lead_management;

# Create user (optional - you can use the default postgres user)
CREATE USER lead_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lead_management TO lead_user;

# Exit psql
\q
```

### 3. Run Database Setup Script

```bash
# Connect to the new database
psql -d lead_management -f setup-database.sql
```

### 4. Configure Environment Variables

Create a `.env` file in your project root:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lead_management
DB_PASSWORD=your_password_here
DB_PORT=5432

# Server Configuration
PORT=5001
```

### 5. Test Database Connection

```bash
# Start the server
node server.js
```

You should see:
```
✅ PostgreSQL database connected successfully
✅ Database tables initialized successfully
File upload server running on port 5001
```

## Database Schema

### Leads Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| lead_id | VARCHAR(50) | Unique lead identifier |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| email | VARCHAR(255) | Email address (unique) |
| phone | VARCHAR(50) | Phone number |
| company | VARCHAR(200) | Company name |
| job_title | VARCHAR(200) | Job title |
| industry | VARCHAR(100) | Industry |
| website | VARCHAR(255) | Website URL |
| linkedin_url | VARCHAR(255) | LinkedIn profile URL |
| tags | TEXT[] | Array of tags |
| source | VARCHAR(100) | Lead source |
| notes | TEXT | Additional notes |
| status | VARCHAR(50) | Lead status (default: 'new') |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Indexes

- `idx_leads_email` - For fast email lookups
- `idx_leads_phone` - For fast phone lookups
- `idx_leads_lead_id` - For fast lead_id lookups
- `idx_leads_created_at` - For chronological sorting
- `idx_leads_status` - For status filtering

## Features

### Batch Insertion
- Processes leads in batches of 50 for optimal performance
- Transactional safety ensures data integrity
- Automatic rollback on errors

### Duplicate Detection
- Checks for existing leads by email or phone
- Case-insensitive email matching
- Digit-only phone matching (ignores formatting)

### Performance Optimizations
- Connection pooling (max 20 connections)
- Database indexes for fast queries
- Batch processing for large datasets

## Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Check port
netstat -an | grep 5432

# Test connection
psql -h localhost -U postgres -d lead_management
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

## API Endpoints

- `POST /api/upload` - Upload and parse files
- `POST /api/validate` - Validate lead data
- `POST /api/save-leads` - Save leads to database
- `GET /api/leads` - Retrieve leads from database
- `GET /api/health` - Health check

## Monitoring

Check database performance:
```sql
-- View table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
WHERE tablename = 'leads';

-- Check index usage
SELECT indexrelname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE relname = 'leads';
``` 