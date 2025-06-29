-- Lead Management Database Setup
-- Run this script in your PostgreSQL database

-- Create database (run this as superuser)
-- CREATE DATABASE lead_management;

-- Connect to the database
-- \c lead_management;

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  company VARCHAR(200),
  job_title VARCHAR(200),
  industry VARCHAR(100),
  website VARCHAR(255),
  linkedin_url VARCHAR(255),
  tags TEXT[],
  source VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO leads (lead_id, first_name, last_name, email, phone, company, job_title, source) VALUES
('lead_sample_1', 'John', 'Doe', 'john.doe@example.com', '5551234567', 'Tech Corp', 'Software Engineer', 'manual'),
('lead_sample_2', 'Jane', 'Smith', 'jane.smith@example.com', '5559876543', 'Design Inc', 'UI Designer', 'manual')
ON CONFLICT (lead_id) DO NOTHING;

-- Show table structure
\d leads;

-- Show sample data
SELECT * FROM leads LIMIT 5; 