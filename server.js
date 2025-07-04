// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const path = require('path');
const db = require('./database');
const crypto = require('crypto');
const twilio = require('./twilio-config');
const email = require('./email-config');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Temporary storage for uploaded files (in production, use a database)
const uploadedFiles = new Map();

// Cleanup old files every 30 minutes
setInterval(() => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [fileId, data] of uploadedFiles.entries()) {
    const timestamp = parseInt(fileId.split('-').pop());
    if (now - timestamp > thirtyMinutes) {
      uploadedFiles.delete(fileId);
      console.log(`Cleaned up old file: ${fileId}`);
    }
  }
}, 30 * 60 * 1000);

// Parse CSV file using PapaParse with enhanced error handling
function parseCSV(buffer) {
  try {
    const csvString = buffer.toString('utf-8');
    
    // Check if file is empty
    if (!csvString.trim()) {
      throw new Error('CSV file is empty');
    }

    const result = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true,
      error: (error) => {
        throw new Error(`CSV parsing error at row ${error.row}: ${error.message}`);
      }
    });
    
    // Check for parsing errors
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map(e => 
        `Row ${e.row}: ${e.message}`
      ).join('; ');
      throw new Error(`CSV parsing errors: ${errorMessages}`);
    }

    // Check if data is empty after parsing
    if (!result.data || result.data.length === 0) {
      throw new Error('No data found in CSV file after parsing');
    }

    // Check for inconsistent column counts
    const expectedColumns = Object.keys(result.data[0]).length;
    const inconsistentRows = result.data.filter(row => 
      Object.keys(row).length !== expectedColumns
    );

    if (inconsistentRows.length > 0) {
      throw new Error(`Found ${inconsistentRows.length} rows with inconsistent column counts. Expected ${expectedColumns} columns.`);
    }

    // Check for completely empty rows
    const emptyRows = result.data.filter(row => 
      Object.values(row).every(value => !value || value.toString().trim() === '')
    );

    if (emptyRows.length === result.data.length) {
      throw new Error('All rows in CSV file are empty');
    }

    return result.data;

  } catch (error) {
    if (error.message.includes('CSV parsing error') || 
        error.message.includes('No data found') ||
        error.message.includes('inconsistent column counts') ||
        error.message.includes('empty')) {
      throw error;
    }
    throw new Error(`Failed to parse CSV file: ${error.message}`);
  }
}

// Parse Excel file using xlsx with enhanced error handling
function parseExcel(buffer) {
  try {
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    // Check if workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file contains no worksheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Check if worksheet is empty
    if (!worksheet || !worksheet['!ref']) {
      throw new Error('Excel worksheet is empty or has no data');
    }

    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    });
    
    if (jsonData.length === 0) {
      throw new Error('Excel file is empty or has no data');
    }

    // Check if first row (headers) exists
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least headers and one data row');
    }

    // Extract headers from first row
    const headers = jsonData[0];
    
    // Validate headers
    if (!headers || headers.length === 0) {
      throw new Error('Excel file has no column headers');
    }

    // Check for empty or invalid headers
    const invalidHeaders = headers.filter(header => 
      !header || header.toString().trim() === ''
    );
    
    if (invalidHeaders.length > 0) {
      throw new Error(`Found ${invalidHeaders.length} empty or invalid column headers`);
    }

    // Convert remaining rows to objects
    const data = jsonData.slice(1).map((row, index) => {
      const obj = {};
      headers.forEach((header, colIndex) => {
        obj[header] = row[colIndex] || '';
      });
      return obj;
    });

    // Check for completely empty data rows
    const emptyRows = data.filter(row => 
      Object.values(row).every(value => !value || value.toString().trim() === '')
    );

    if (emptyRows.length === data.length) {
      throw new Error('All data rows in Excel file are empty');
    }

    // Check for inconsistent column counts
    const expectedColumns = headers.length;
    const inconsistentRows = data.filter(row => 
      Object.keys(row).length !== expectedColumns
    );

    if (inconsistentRows.length > 0) {
      throw new Error(`Found ${inconsistentRows.length} rows with inconsistent column counts. Expected ${expectedColumns} columns.`);
    }

    return data;

  } catch (error) {
    if (error.message.includes('Excel file') || 
        error.message.includes('worksheet') ||
        error.message.includes('headers') ||
        error.message.includes('empty') ||
        error.message.includes('inconsistent')) {
      throw error;
    }
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

// File upload and parsing endpoint with enhanced error handling
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;
    let data;

    // Parse file based on type
    if (mimetype === 'text/csv' || originalname.toLowerCase().endsWith('.csv')) {
      data = parseCSV(buffer);
    } else if (mimetype.includes('excel') || originalname.toLowerCase().endsWith('.xlsx') || originalname.toLowerCase().endsWith('.xls')) {
      data = parseExcel(buffer);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Extract headers and preview data
    const headers = Object.keys(data[0] || {});
    const preview = data.slice(0, 5);
    const totalRows = data.length;

    // Store the full dataset temporarily
    const fileId = `${originalname}-${Date.now()}`;
    uploadedFiles.set(fileId, data);

    res.json({
      fileName: originalname,
      fileId: fileId,
      headers,
      preview,
      totalRows,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Data validation endpoint
app.post('/api/validate', async (req, res) => {
  try {
    const { fileName, fieldMappings, columnRenames, totalRows, fileId } = req.body;
    
    // Get the full dataset from storage
    const fullData = uploadedFiles.get(fileId);
    
    if (!fullData) {
      return res.status(404).json({ error: 'File data not found. Please re-upload the file.' });
    }
    
    const validRows = [];
    const invalidRows = [];
    const validationStats = {
      totalEmails: 0,
      invalidEmails: 0,
      totalPhones: 0,
      invalidPhones: 0
    };
    
    // Validate each row in the full dataset
    fullData.forEach((row, index) => {
      const rowErrors = [];
      
      // Validate each mapped field
      Object.entries(fieldMappings).forEach(([header, mapping]) => {
        if (mapping && mapping !== 'skip') {
          const value = row[header] || '';
          
          if (mapping === 'email' && value) {
            validationStats.totalEmails++;
            const emailString = String(value).trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailString)) {
              validationStats.invalidEmails++;
              rowErrors.push(`Invalid email format: "${value}"`);
            }
          }
          
          // Phone validation removed - accept any phone number format
        }
      });
      
      if (rowErrors.length > 0) {
        invalidRows.push({
          rowIndex: index + 1,
          data: row,
          errors: rowErrors
        });
      } else {
        validRows.push(row);
      }
    });
    
    const validationResults = {
      totalRows: fullData.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      invalidRowDetails: invalidRows,
      validationRate: ((validRows.length / fullData.length) * 100).toFixed(1),
      stats: validationStats,
      fileId: fileId // Include fileId for saving later
    };
    
    res.json(validationResults);
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save validated leads endpoint
app.post('/api/save-leads', async (req, res) => {
  try {
    const { fileId, fieldMappings } = req.body;
    
    // Get the full dataset from storage
    const fullData = uploadedFiles.get(fileId);
    
    if (!fullData) {
      return res.status(404).json({ error: 'File data not found. Please re-upload the file.' });
    }
    
    const processingStats = {
      totalRecords: fullData.length,
      validRecords: 0,
      invalidRecords: 0,
      invalidDetails: []
    };
    
    // Filter out invalid rows (re-validate to be safe)
    const validRows = [];
    
    fullData.forEach((row, index) => {
      const rowErrors = [];
      
      // Validate each mapped field
      Object.entries(fieldMappings).forEach(([header, mapping]) => {
        if (mapping && mapping !== 'skip') {
          const value = row[header] || '';
          
          if (mapping === 'email' && value) {
            const emailString = String(value).trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailString)) {
              rowErrors.push(`Invalid email format: "${value}"`);
            }
          }
          
          // Phone validation removed - accept any phone number format
        }
      });
      
      if (rowErrors.length === 0) {
        validRows.push(row);
        processingStats.validRecords++;
      } else {
        processingStats.invalidRecords++;
        processingStats.invalidDetails.push({
          rowIndex: index + 1,
          data: row,
          errors: rowErrors
        });
      }
    });
    
    // Transform data for database insertion
    const leadsForDatabase = validRows.map((row, index) => {
      const lead = {
        lead_id: `lead_${Date.now()}_${index}_${crypto.randomBytes(8).toString('hex')}`,
        source: 'file_upload'
      };
      
      // Map fields to lead properties
      Object.entries(fieldMappings).forEach(([header, mapping]) => {
        if (mapping && mapping !== 'skip') {
          lead[mapping] = row[header] || '';
        }
      });
      
      // Debug: Log a few sample leads to see the mapping
      if (index < 3) {
        console.log(`Sample lead ${index + 1}:`, {
          original: row,
          mapped: lead,
          fieldMappings: fieldMappings
        });
      }
      
      return lead;
    });
    
    // Save leads to PostgreSQL database with batch insertion
    const saveResults = await db.batchInsertLeads(leadsForDatabase, 50); // Batch size of 50
    
    // Get total lead count from database
    const totalLeadsInDatabase = await db.getLeadCount();
    
    // Clean up the uploaded file
    uploadedFiles.delete(fileId);
    
    // Compile comprehensive response
    const response = {
      success: true,
      message: `Successfully processed ${fullData.length} records from file`,
      processingStats: {
        totalRecords: processingStats.totalRecords,
        validRecords: processingStats.validRecords,
        invalidRecords: processingStats.invalidRecords,
        validationRate: ((processingStats.validRecords / processingStats.totalRecords) * 100).toFixed(1)
      },
      databaseResults: {
        saved: saveResults.saved,
        duplicates: saveResults.duplicates,
        errors: saveResults.errors,
        successRate: saveResults.saved > 0 ? ((saveResults.saved / processingStats.validRecords) * 100).toFixed(1) : '0.0'
      },
      summary: {
        totalProcessed: processingStats.totalRecords,
        totalSaved: saveResults.saved,
        totalSkipped: processingStats.invalidRecords + saveResults.duplicates,
        totalRejected: saveResults.errors,
        totalInDatabase: totalLeadsInDatabase
      },
      details: {
        invalidRecords: processingStats.invalidDetails,
        duplicateDetails: saveResults.duplicateDetails,
        errorDetails: saveResults.errorDetails
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Save leads error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to process and save leads'
    });
  }
});

// Get all leads endpoint (for debugging/testing)
app.get('/api/leads', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const leads = await db.getAllLeads(parseInt(limit), parseInt(offset));
    const totalCount = await db.getLeadCount();
    
    res.json({
      totalLeads: totalCount,
      leads: leads,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available fields from database
app.get('/api/available-fields', async (req, res) => {
  try {
    const client = await db.pool.connect();
    
    // Get column information from the leads table
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND table_schema = 'public'
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
      ORDER BY ordinal_position
    `;
    
    const result = await client.query(query);
    client.release();
    
    const availableFields = result.rows.map(row => row.column_name);
    
    res.json({
      success: true,
      fields: availableFields
    });
    
  } catch (error) {
    console.error('Get available fields error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Campaign API endpoints

// Create a new campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const { name, templateId, leadIds, scheduledAt } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required'
      });
    }
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one lead ID is required'
      });
    }
    
    // Validate templateId is a number
    if (isNaN(parseInt(templateId))) {
      return res.status(400).json({
        success: false,
        error: 'Template ID must be a valid number'
      });
    }
    
    // Validate leadIds are numbers
    const invalidLeadIds = leadIds.filter(id => isNaN(parseInt(id)));
    if (invalidLeadIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid lead IDs: ${invalidLeadIds.join(', ')}`
      });
    }
    
    // Validate scheduledAt if provided
    let validatedScheduledAt = null;
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid scheduled date format'
        });
      }
      validatedScheduledAt = scheduledDate;
    }
    
    // Create campaign
    const campaignData = {
      name: name.trim(),
      templateId: parseInt(templateId),
      leadIds: leadIds.map(id => parseInt(id)),
      scheduledAt: validatedScheduledAt
    };
    
    const campaign = await db.createCampaign(campaignData);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        templateId: campaign.template_id,
        status: campaign.status,
        scheduledAt: campaign.scheduled_at,
        createdAt: campaign.created_at,
        leadCount: campaign.leadCount
      }
    });
    
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create campaign'
    });
  }
});

// Get all campaigns with optional filters
app.get('/api/campaigns', async (req, res) => {
  try {
    const { 
      status, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate
    } = req.query;
    
    // Validate filters
    const filters = {};
    
    if (status) {
      const validStatuses = ['DRAFT', 'RUNNING', 'COMPLETED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      filters.status = status.toUpperCase();
    }
    
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100'
        });
      }
      filters.limit = limitNum;
    }
    
    if (offset) {
      const offsetNum = parseInt(offset);
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative number'
        });
      }
      filters.offset = offsetNum;
    }
    
    if (startDate) {
      const startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start date format'
        });
      }
      filters.startDate = startDateObj;
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end date format'
        });
      }
      filters.endDate = endDateObj;
    }
    
    const campaigns = await db.getCampaigns(filters);
    
    res.json({
      success: true,
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        templateId: campaign.template_id,
        status: campaign.status,
        scheduledAt: campaign.scheduled_at,
        createdAt: campaign.created_at,
        leadCount: campaign.lead_count
      })),
      filters: filters,
      total: campaigns.length
    });
    
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch campaigns'
    });
  }
});

// Get campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }
    
    const campaign = await db.getCampaignById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        templateId: campaign.template_id,
        status: campaign.status,
        scheduledAt: campaign.scheduled_at,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        leadCount: campaign.lead_count,
        sentCount: campaign.sent_count,
        deliveredCount: campaign.delivered_count,
        openedCount: campaign.opened_count,
        clickedCount: campaign.clicked_count,
        repliedCount: campaign.replied_count,
        failedCount: campaign.failed_count,
        leads: campaign.leads
      }
    });
    
  } catch (error) {
    console.error('Get campaign by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch campaign'
    });
  }
});

// Update campaign status
app.patch('/api/campaigns/:id/status', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const validStatuses = ['DRAFT', 'RUNNING', 'COMPLETED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const updatedCampaign = await db.updateCampaignStatus(campaignId, status.toUpperCase());
    
    res.json({
      success: true,
      message: 'Campaign status updated successfully',
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        status: updatedCampaign.status,
        updatedAt: updatedCampaign.updated_at
      }
    });
    
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update campaign status'
    });
  }
});

// Start campaign - begin sending messages
app.post('/api/campaigns/:id/start', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { template } = req.body; // template: { type, subject, body, fields }
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }
    
    // Get campaign details
    const campaign = await db.getCampaignById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Check if campaign is in DRAFT status
    if (campaign.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: `Campaign cannot be started. Current status: ${campaign.status}. Only DRAFT campaigns can be started.`
      });
    }
    
    // Update campaign status to RUNNING
    const updatedCampaign = await db.updateCampaignStatus(campaignId, 'RUNNING');
    
    console.log(`🚀 Campaign "${campaign.name}" (ID: ${campaignId}) started successfully`);
    console.log(`📊 Campaign has ${campaign.leadCount} leads to process`);
    
    // Send messages to all leads in the campaign
    if (campaign.leads && campaign.leads.length > 0) {
      let sentCount = 0;
      let failedCount = 0;
      
      if (template && template.type === 'email') {
        // Send emails to all leads
        console.log(`📧 Sending emails to ${campaign.leads.length} leads...`);
        for (const lead of campaign.leads) {
          try {
            if (!lead.email || lead.email.trim() === '') {
              console.log(`⚠️ Skipping lead ${lead.id} - no email`);
              failedCount++;
              continue;
            }
            // Personalize subject and body
            let subject = template.subject;
            let body = template.body;
            if (template.fields && Array.isArray(template.fields)) {
              template.fields.forEach(field => {
                const placeholder = `{${field}}`;
                const value = lead[field] || '';
                subject = subject.replace(new RegExp(placeholder, 'g'), value);
                body = body.replace(new RegExp(placeholder, 'g'), value);
              });
            }
            // Send email
            const result = await require('./email-config').sendEmail(lead.email, subject, body);
            if (result.success) {
              console.log(`✅ Email sent to ${lead.email} (${lead.first_name || 'Unknown'})`);
              sentCount++;
              await db.updateCampaignLeadStatus(campaignId, lead.id, 'SENT');
            } else {
              console.log(`❌ Failed to send email to ${lead.email}: ${result.error}`);
              failedCount++;
              await db.updateCampaignLeadStatus(campaignId, lead.id, 'FAILED', result.error);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`❌ Error processing lead ${lead.id}:`, error.message);
            failedCount++;
            await db.updateCampaignLeadStatus(campaignId, lead.id, 'FAILED', error.message);
          }
        }
        console.log(`📧 Email campaign completed: ${sentCount} sent, ${failedCount} failed`);
      } else {
        // WhatsApp fallback (existing logic)
        const twilioValidation = twilio.validateTwilioConfig();
        if (!twilioValidation.isValid) {
          return res.status(500).json({
            success: false,
            error: 'Twilio not configured properly',
            details: twilioValidation.issues
          });
        }
        console.log(`📱 Starting to send WhatsApp messages to ${campaign.leads.length} leads...`);
        for (const lead of campaign.leads) {
          try {
            if (!lead.phone || lead.phone.trim() === '') {
              console.log(`⚠️ Skipping lead ${lead.id} - no phone number`);
              failedCount++;
              continue;
            }
            let messageBody = '';
            if (lead.first_name && lead.first_name.trim() !== '') {
              messageBody = `Hi ${lead.first_name}! 👋\n\nThank you for your interest. We'd love to connect with you.\n\nBest regards,\nYour Team`;
            } else {
              messageBody = `Hi there! 👋\n\nThank you for your interest. We'd love to connect with you.\n\nBest regards,\nYour Team`;
            }
            const result = await twilio.sendWhatsAppMessage(lead.phone, messageBody);
            if (result.success) {
              console.log(`✅ Message sent to ${lead.phone} (${lead.first_name || 'Unknown'})`);
              sentCount++;
              await db.updateCampaignLeadStatus(campaignId, lead.id, 'SENT');
            } else {
              console.log(`❌ Failed to send message to ${lead.phone}: ${result.error}`);
              failedCount++;
              await db.updateCampaignLeadStatus(campaignId, lead.id, 'FAILED', result.error);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`❌ Error processing lead ${lead.id}:`, error.message);
            failedCount++;
            await db.updateCampaignLeadStatus(campaignId, lead.id, 'FAILED', error.message);
          }
        }
        console.log(`📊 Campaign messaging completed: ${sentCount} sent, ${failedCount} failed`);
      }
    } else {
      console.log(`⚠️ No leads found for campaign ${campaignId}`);
    }
    
    res.json({
      success: true,
      message: 'Campaign started successfully',
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        status: updatedCampaign.status,
        updatedAt: updatedCampaign.updated_at,
        leadCount: campaign.leadCount
      }
    });
    
  } catch (error) {
    console.error('Start campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to start campaign'
    });
  }
});

// Stop campaign - stop sending messages
app.post('/api/campaigns/:id/stop', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }
    
    // Get campaign details
    const campaign = await db.getCampaignById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Check if campaign is in RUNNING status
    if (campaign.status !== 'RUNNING') {
      return res.status(400).json({
        success: false,
        error: `Campaign cannot be stopped. Current status: ${campaign.status}. Only RUNNING campaigns can be stopped.`
      });
    }
    
    // Update campaign status to COMPLETED
    const updatedCampaign = await db.updateCampaignStatus(campaignId, 'COMPLETED');
    
    // TODO: In a real implementation, you would:
    // 1. Stop any ongoing message sending processes
    // 2. Cancel any scheduled messages
    // 3. Update any pending campaign_lead statuses
    
    console.log(`🛑 Campaign "${campaign.name}" (ID: ${campaignId}) stopped successfully`);
    
    res.json({
      success: true,
      message: 'Campaign stopped successfully',
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        status: updatedCampaign.status,
        updatedAt: updatedCampaign.updated_at,
        leadCount: campaign.leadCount
      }
    });
    
  } catch (error) {
    console.error('Stop campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to stop campaign'
    });
  }
});

// Get available leads for campaign selection
app.get('/api/available-leads', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 500) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be a number between 1 and 500'
      });
    }
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Offset must be a non-negative number'
      });
    }
    
    const leads = await db.getAvailableLeads(limitNum, offsetNum);
    
    res.json({
      success: true,
      leads: leads,
      limit: limitNum,
      offset: offsetNum,
      total: leads.length
    });
    
  } catch (error) {
    console.error('Get available leads error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch available leads'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'File upload server is running',
    timestamp: new Date().toISOString()
  });
});

// Test Twilio configuration
app.get('/api/test-twilio', async (req, res) => {
  try {
    const validation = twilio.validateTwilioConfig();
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Twilio configuration issues',
        details: validation.issues
      });
    }
    
    const isConnected = await twilio.testTwilioConnection();
    
    res.json({
      success: true,
      message: 'Twilio configuration test completed',
      isConnected: isConnected,
      whatsappNumber: twilio.TWILIO_WHATSAPP_NUMBER
    });
    
  } catch (error) {
    console.error('Test Twilio error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test Twilio configuration'
    });
  }
});

// Test WhatsApp message sending (for development only)
app.post('/api/test-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Recipient number and message are required'
      });
    }
    
    const result = await twilio.sendWhatsAppMessage(to, message);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
      details: result
    });
    
  } catch (error) {
    console.error('Test WhatsApp error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send test WhatsApp message'
    });
  }
});

// Test Email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    const validation = email.validateEmailConfig();
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Email configuration issues',
        details: validation.issues
      });
    }
    
    const isConnected = await email.testEmailConnection();
    
    res.json({
      success: true,
      message: 'Email configuration test completed',
      isConnected: isConnected,
      fromEmail: email.EMAIL_FROM
    });
    
  } catch (error) {
    console.error('Test Email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test Email configuration'
    });
  }
});

// Test Email message sending (for development only)
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, subject, body, isHtml = false } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email, subject, and body are required'
      });
    }
    
    const result = isHtml ? 
      await email.sendHtmlEmail(to, subject, body) :
      await email.sendEmail(to, subject, body);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      details: result
    });
    
  } catch (error) {
    console.error('Test Email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send test email'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database on startup
const initializeApp = async () => {
  try {
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }
    
    // Initialize database tables
    await db.initializeDatabase();
    
    console.log('File upload server running on port', PORT);
    console.log('Health check: http://localhost:5000/api/health');
    
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
};

app.listen(PORT, () => {
  initializeApp();
}); 