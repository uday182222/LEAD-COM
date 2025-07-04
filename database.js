const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'udaytomar',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lead_management',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create leads table
    const createLeadsTable = `
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL CHECK (email != ''),
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
    `;
    
    // Create campaigns table
    const createCampaignsTable = `
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        template_id BIGINT NOT NULL,
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RUNNING', 'COMPLETED')),
        scheduled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create campaign_leads junction table for many-to-many relationship
    const createCampaignLeadsTable = `
      CREATE TABLE IF NOT EXISTS campaign_leads (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'FAILED')),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        replied_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(campaign_id, lead_id)
      );
    `;
    
    // Create indexes for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
      CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
      CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
      
      CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON campaign_leads(lead_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON campaign_leads(status);
    `;
    
    await client.query(createLeadsTable);
    await client.query(createCampaignsTable);
    await client.query(createCampaignLeadsTable);
    await client.query(createIndexes);
    
    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Batch insert leads with duplicate checking
const batchInsertLeads = async (leads, batchSize = 100) => {
  const client = await pool.connect();
  const results = {
    saved: 0,
    duplicates: 0,
    errors: 0,
    duplicateDetails: [],
    errorDetails: []
  };
  
  // Track error types for debugging
  const errorTypes = {};
  
  try {
    // Process leads individually to avoid transaction abortion cascade
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        // Validate required fields - BOTH email AND phone are required
        if (!lead.email || lead.email.trim() === '') {
          const errorMsg = 'Email is required and cannot be empty';
          errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
          results.errors++;
          results.errorDetails.push({
            lead: lead,
            error: errorMsg
          });
          continue;
        }
        
        // Validate phone number is present
        if (!lead.phone || lead.phone.toString().trim() === '') {
          const errorMsg = 'Phone number is required and cannot be empty';
          errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
          results.errors++;
          results.errorDetails.push({
            lead: lead,
            error: errorMsg
          });
          continue;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lead.email.trim())) {
          const errorMsg = 'Invalid email format';
          errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
          results.errors++;
          results.errorDetails.push({
            lead: lead,
            error: errorMsg
          });
          continue;
        }
        
        // Validate lead_id
        if (!lead.lead_id || lead.lead_id.trim() === '') {
          const errorMsg = 'Lead ID is required';
          errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
          results.errors++;
          results.errorDetails.push({
                lead: lead,
            error: errorMsg
              });
              continue;
            }
            
        // Use ON CONFLICT to handle duplicates gracefully
            const insertQuery = `
              INSERT INTO leads (
                lead_id, first_name, last_name, email, phone, company, 
                job_title, industry, website, linkedin_url, tags, source, notes, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (email) DO NOTHING
          RETURNING id, lead_id, email
            `;
            
            const values = [
              lead.lead_id,
              lead.first_name || '',
              lead.last_name || '',
          lead.email.trim().toLowerCase(),
              lead.phone || '',
              lead.company || '',
              lead.job_title || '',
              lead.industry || '',
              lead.website || '',
              lead.linkedin_url || '',
              lead.tags || [],
              lead.source || 'file_upload',
              lead.notes || '',
              'new'
            ];
            
        const result = await client.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          // Lead was successfully inserted
            results.saved++;
        } else {
          // Lead was not inserted due to duplicate email
          results.duplicates++;
          results.duplicateDetails.push({
              lead: lead,
            reason: 'Email already exists'
          });
        }
        
      } catch (error) {
        const errorMsg = error.message;
        errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
          results.errors++;
          results.errorDetails.push({
            lead: lead,
          error: errorMsg
        });
        console.error(`Error inserting lead ${i + 1}/${leads.length}:`, {
          email: lead.email,
          error: error.message,
          lead_id: lead.lead_id
        });
        
        // Continue with next lead
      }
    }
    
    // Log error breakdown
    console.log('📊 Error breakdown:');
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`  - ${error}: ${count} occurrences`);
    });
    
    console.log(`✅ Batch insert completed: ${results.saved} saved, ${results.duplicates} duplicates, ${results.errors} errors`);
    
  } catch (error) {
    console.error('❌ Batch insert failed:', error);
    throw error;
  } finally {
    client.release();
  }
  
  return results;
};

// Get all leads from database
const getAllLeads = async (limit = 100, offset = 0) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM leads 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await client.query(query, [limit, offset]);
    return result.rows;
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get lead count
const getLeadCount = async () => {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT COUNT(*) FROM leads');
    return parseInt(result.rows[0].count);
    
  } catch (error) {
    console.error('Error getting lead count:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Close database connection
const closeDatabase = async () => {
  await pool.end();
  console.log('Database connection closed');
};

// Campaign-related functions

// Create a new campaign
const createCampaign = async (campaignData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert campaign
    const campaignQuery = `
      INSERT INTO campaigns (name, template_id, scheduled_at)
      VALUES ($1, $2, $3)
      RETURNING id, name, template_id, status, scheduled_at, created_at
    `;
    
    const campaignValues = [
      campaignData.name,
      campaignData.templateId,
      campaignData.scheduledAt || null
    ];
    
    const campaignResult = await client.query(campaignQuery, campaignValues);
    const campaign = campaignResult.rows[0];
    
    // Insert campaign-lead relationships if leadIds are provided
    if (campaignData.leadIds && campaignData.leadIds.length > 0) {
      const leadIds = campaignData.leadIds;
      
      // Verify all lead IDs exist
      const leadCheckQuery = `
        SELECT id FROM leads WHERE id = ANY($1)
      `;
      const leadCheckResult = await client.query(leadCheckQuery, [leadIds]);
      const existingLeadIds = leadCheckResult.rows.map(row => row.id);
      
      if (existingLeadIds.length !== leadIds.length) {
        const missingIds = leadIds.filter(id => !existingLeadIds.includes(id));
        throw new Error(`Some lead IDs do not exist: ${missingIds.join(', ')}`);
      }
      
      // Insert campaign-lead relationships
      const campaignLeadsQuery = `
        INSERT INTO campaign_leads (campaign_id, lead_id)
        VALUES ($1, $2)
        ON CONFLICT (campaign_id, lead_id) DO NOTHING
      `;
      
      for (const leadId of leadIds) {
        await client.query(campaignLeadsQuery, [campaign.id, leadId]);
      }
    }
    
    await client.query('COMMIT');
    
    // Get lead count for the campaign
    const leadCountQuery = `
      SELECT COUNT(*) as lead_count
      FROM campaign_leads
      WHERE campaign_id = $1
    `;
    const leadCountResult = await client.query(leadCountQuery, [campaign.id]);
    
    return {
      ...campaign,
      leadCount: parseInt(leadCountResult.rows[0].lead_count)
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating campaign:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get all campaigns with optional filters
const getCampaigns = async (filters = {}) => {
  const client = await pool.connect();
  
  try {
    let query = `
      SELECT 
        c.id,
        c.name,
        c.template_id,
        c.status,
        c.scheduled_at,
        c.created_at,
        COUNT(cl.lead_id) as lead_count
      FROM campaigns c
      LEFT JOIN campaign_leads cl ON c.id = cl.campaign_id
    `;
    
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Add status filter
    if (filters.status) {
      whereConditions.push(`c.status = $${paramIndex}`);
      queryParams.push(filters.status);
      paramIndex++;
    }
    
    // Add date range filters
    if (filters.startDate) {
      whereConditions.push(`c.created_at >= $${paramIndex}`);
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      whereConditions.push(`c.created_at <= $${paramIndex}`);
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    // Add WHERE clause if filters exist
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add GROUP BY and ORDER BY
    query += `
      GROUP BY c.id, c.name, c.template_id, c.status, c.scheduled_at, c.created_at
      ORDER BY c.created_at DESC
    `;
    
    // Add pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      queryParams.push(filters.limit);
      paramIndex++;
    }
    
    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      queryParams.push(filters.offset);
    }
    
    const result = await client.query(query, queryParams);
    
    return result.rows.map(row => ({
      ...row,
      lead_count: parseInt(row.lead_count)
    }));
    
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get campaign by ID with detailed information
const getCampaignById = async (campaignId) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.template_id,
        c.status,
        c.scheduled_at,
        c.created_at,
        c.updated_at,
        COUNT(cl.lead_id) as lead_count,
        COUNT(CASE WHEN cl.status = 'SENT' THEN 1 END) as sent_count,
        COUNT(CASE WHEN cl.status = 'DELIVERED' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN cl.status = 'OPENED' THEN 1 END) as opened_count,
        COUNT(CASE WHEN cl.status = 'CLICKED' THEN 1 END) as clicked_count,
        COUNT(CASE WHEN cl.status = 'REPLIED' THEN 1 END) as replied_count,
        COUNT(CASE WHEN cl.status = 'FAILED' THEN 1 END) as failed_count
      FROM campaigns c
      LEFT JOIN campaign_leads cl ON c.id = cl.campaign_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.template_id, c.status, c.scheduled_at, c.created_at, c.updated_at
    `;
    
    const result = await client.query(query, [campaignId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const campaign = result.rows[0];
    
    // Get leads for this campaign
    const leadsQuery = `
      SELECT 
        l.id,
        l.lead_id,
        l.first_name,
        l.last_name,
        l.email,
        l.company,
        cl.status as campaign_status,
        cl.sent_at,
        cl.delivered_at,
        cl.opened_at,
        cl.clicked_at,
        cl.replied_at,
        cl.error_message
      FROM leads l
      JOIN campaign_leads cl ON l.id = cl.lead_id
      WHERE cl.campaign_id = $1
      ORDER BY l.created_at DESC
    `;
    
    const leadsResult = await client.query(leadsQuery, [campaignId]);
    
    return {
      ...campaign,
      lead_count: parseInt(campaign.lead_count),
      sent_count: parseInt(campaign.sent_count),
      delivered_count: parseInt(campaign.delivered_count),
      opened_count: parseInt(campaign.opened_count),
      clicked_count: parseInt(campaign.clicked_count),
      replied_count: parseInt(campaign.replied_count),
      failed_count: parseInt(campaign.failed_count),
      leads: leadsResult.rows
    };
    
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update campaign status
const updateCampaignStatus = async (campaignId, status) => {
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE campaigns 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [status, campaignId]);
    
    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }
    
    return result.rows[0];
    
  } catch (error) {
    console.error('Error updating campaign status:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update campaign lead status
const updateCampaignLeadStatus = async (campaignId, leadId, status, errorMessage = null) => {
  const client = await pool.connect();
  
  try {
    let query;
    let params;
    
    if (errorMessage) {
      query = `
        UPDATE campaign_leads 
        SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $3 AND lead_id = $4
        RETURNING *
      `;
      params = [status, errorMessage, campaignId, leadId];
    } else {
      query = `
        UPDATE campaign_leads 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $2 AND lead_id = $3
        RETURNING *
      `;
      params = [status, campaignId, leadId];
    }
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Campaign lead not found');
    }
    
    return result.rows[0];
    
  } catch (error) {
    console.error('Error updating campaign lead status:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get available leads for campaign selection
const getAvailableLeads = async (limit = 100, offset = 0) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        id,
        lead_id,
        first_name,
        last_name,
        email,
        company,
        job_title,
        industry,
        created_at
      FROM leads 
      WHERE email IS NOT NULL AND email != ''
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await client.query(query, [limit, offset]);
    return result.rows;
    
  } catch (error) {
    console.error('Error fetching available leads:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  batchInsertLeads,
  getAllLeads,
  getLeadCount,
  closeDatabase,
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
  updateCampaignLeadStatus,
  getAvailableLeads
}; 