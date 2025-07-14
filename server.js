import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Papa from 'papaparse';
import XLSX from 'xlsx';
import path from 'path';
import db from './database.js';
import crypto from 'crypto';
import mailer from './mailer.js';
import emailQueue from './emailQueue.js';
import jobRoutes from './routes/jobsRoutes.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsp from 'fs/promises';
import pkg from '@aws-sdk/client-ses';
const { SESClient, GetAccountAttributesCommand } = pkg;
import emailService, { replaceTemplateVariables } from './email-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const EMAIL_DELAY_MS = process.env.EMAIL_DELAY_MS || 100; // Configurable email delay

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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

    // Debug: Log first few lines to see the format
    console.log('CSV content preview:');
    console.log(csvString.split('\n').slice(0, 3).join('\n'));
    
    // Debug: Check for potential issues
    const lines = csvString.split('\n');
    console.log('Total lines:', lines.length);
    console.log('First line:', lines[0]);
    console.log('Second line:', lines[1]);

    const result = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true,
      delimiter: ',', // Explicitly specify comma delimiter
      error: (error) => {
        throw new Error(`CSV parsing error at row ${error.row}: ${error.message}`);
      }
    });
    
    // Check for parsing errors
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map(e => 
        `Row ${e.row}: ${e.message}`
      ).join('; ');
      console.log('CSV parsing errors:', result.errors);
      throw new Error(`CSV parsing errors: ${errorMessages}`);
    }

    // Check if data is empty after parsing
    if (!result.data || result.data.length === 0) {
      throw new Error('No data found in CSV file after parsing');
    }

    // Debug: Log parsed headers
    console.log('Parsed headers:', Object.keys(result.data[0] || {}));
    console.log('First row data:', result.data[0]);

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

    // Filter out empty headers and trim whitespace
    const validHeaders = headers
      .map(header => header ? header.toString().trim() : '')
      .filter(header => header !== '');
    
    if (validHeaders.length === 0) {
      throw new Error('Excel file has no valid column headers after filtering');
    }

    console.log('Original headers:', headers);
    console.log('Valid headers after filtering:', validHeaders);

    // Convert remaining rows to objects using only valid headers
    const data = jsonData.slice(1).map((row, index) => {
      const obj = {};
      validHeaders.forEach((header, colIndex) => {
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
    const expectedColumns = validHeaders.length;
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
    // Allow up to 2000 leads per request for better UX
    const maxLimit = Math.min(parseInt(limit) || 100, 2000);
    const leads = await db.getAllLeads(maxLimit, parseInt(offset));
    const totalCount = await db.getLeadCount();
    
    res.json({
      totalLeads: totalCount,
      leads: leads,
      limit: maxLimit,
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
    const { name, templateId, templateName, leadIds, scheduledAt, template } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required'
      });
    }
    
    if (!templateId && !templateName) {
      return res.status(400).json({
        success: false,
        error: 'Either Template ID or Template Name is required'
      });
    }
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one lead ID is required'
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
    
    // Create campaign data
    const campaignData = {
      name: name.trim(),
      leadIds: leadIds.map(id => parseInt(id)),
      scheduledAt: validatedScheduledAt
    };
    
    // Handle template creation/selection
    let selectedTemplate = null;
    if (templateName) {
      // HTML template campaign - create or get template
      const templateData = template || {
        type: 'email',
        subject: `Hello from ${name.trim()}`,
        custom_message: 'We\'d love to connect with you and discuss how we can help.',
        cta_link: 'https://example.com',
        cta_text: 'Learn More',
        unsubscribe_link: 'https://example.com/unsubscribe'
      };
      // Create template in database
      const createdTemplate = await db.createTemplate({
        name: templateName,
        html_template: templateData.htmlTemplate || '<html><body><h1>Default Template</h1></body></html>',
        fields: templateData.fields || []
      });
      campaignData.templateId = createdTemplate.id;
      selectedTemplate = createdTemplate;
    } else {
      // Regular template campaign - validate templateId is UUID
      if (!templateId || typeof templateId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Template ID must be a valid UUID'
        });
      }
      // Validate template exists and is valid
      selectedTemplate = await db.getEmailTemplateById(templateId);
      if (!selectedTemplate || !selectedTemplate.html_template || selectedTemplate.html_template.trim().length < 100) {
        // Fallback to master template (ID: 94)
        console.warn(`⚠️ Template ${templateId} is invalid or missing. Using Master Template (ID: 94).`);
        selectedTemplate = await db.getEmailTemplateById(94);
        if (!selectedTemplate || !selectedTemplate.html_template || selectedTemplate.html_template.trim().length < 100) {
          return res.status(400).json({
            success: false,
            error: 'No valid template found for campaign (neither selected nor master template).'
          });
        }
        campaignData.templateId = 94;
      } else {
        campaignData.templateId = templateId;
      }
    }
    
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
    
    // Get campaign details with template information
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
    
    // Get template information
    let templateInfo = null;
    if (campaign.template_id) {
      templateInfo = await db.getEmailTemplateById(campaign.template_id);
    }
    // ✅ Hardcoded template variables
    const templateVariables = {
      headline: "🚀 Customized AI Solutions for Everyone",
      subheadline: "We identify, educate, and develop customized AI systems for every need",
      cta_text: "Know More",
      cta_link: "https://www.aimotion.in"
    };
    // After you fetch templateInfo by template_id
    if (!templateInfo?.html_template || templateInfo.html_template.trim().length < 100) {
      console.warn(`⚠️ Template ${templateInfo?.id} is missing or too short. Using hardcoded fallback template.`);
      templateInfo = {
        id: 104,
        name: 'Fallback',
        subject: '🚀 Customized AI Solutions for Everyone',
        html_template: `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <link href="https://fonts.googleapis.com/css?family=Fira+Sans:ital,wght@0,400;0,500;0,700" rel="stylesheet" />
  <title>🚀 Customized AI Solutions for Everyone</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Fira Sans', sans-serif; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: 40px auto; padding: 40px 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); text-align: center;">
    <img src="https://cloudfilesdm.com/postcards/Motion_Falcon_Logo_Set-02-0c9c3be2.png" alt="Logo" width="120" style="margin-bottom: 20px;" />
    <h1 style="font-size: 24px; color: #333333;">🚀 Customized AI Solutions for Everyone</h1>
    <h2 style="font-size: 18px; color: #1595e7; margin: 10px 0;">We identify, educate, and develop customized AI systems for every need</h2>
    <a href="https://www.aimotion.in" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #1595e7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Know More</a>
  </div>
</body>
</html>`,
        type: 'html', // ✅ ADD THIS LINE
      };
    }
    // Step 3: Default fields fallback
    if (!templateInfo.fields || templateInfo.fields.length === 0) {
      templateInfo.fields = ['headline', 'subheadline', 'content', 'cta_text', 'cta_link'];
    }
    // Clean and debug html_template
    let rawHTML = (templateInfo?.html_template || '').trim();
    // Remove wrapping quotes if present
    if (rawHTML.startsWith("'") && rawHTML.endsWith("'")) {
      rawHTML = rawHTML.slice(1, -1).trim();
    }
    console.log('[TEMPLATE DEBUG]', 'typeof:', typeof rawHTML, 'length:', rawHTML.length, 'preview:', rawHTML.slice(0, 80));
    // Check if the template has valid HTML content
    let isValidTemplate = typeof rawHTML === 'string' && rawHTML.includes('<html');

    if (!isValidTemplate) {
      console.warn(`⚠️ Template ${campaign.template_id} is invalid. Using Master Template (ID: 94)`);
      templateInfo = await db.getTemplateById(94);
      rawHTML = (templateInfo?.html_template || '').trim();
      if (rawHTML.startsWith("'") && rawHTML.endsWith("'")) {
        rawHTML = rawHTML.slice(1, -1).trim();
      }
      console.log('[TEMPLATE DEBUG] (fallback)', 'typeof:', typeof rawHTML, 'length:', rawHTML.length, 'preview:', rawHTML.slice(0, 80));
      isValidTemplate = typeof rawHTML === 'string' && rawHTML.includes('<html');
    }

    if (!isValidTemplate && !templateInfo.file_name) {
      throw new Error('No valid HTML template source found (neither html_template nor file_name)');
    }

    // 🩹 Patch: Ensure fields are always defined
    if (!Array.isArray(templateInfo.fields) || templateInfo.fields.length === 0) {
      templateInfo.fields = ['headline', 'subheadline', 'content', 'cta_text', 'cta_link'];
      console.log('🛠 Fields were empty or missing. Defaulted to:', templateInfo.fields);
    }
    
    // Update campaign status to RUNNING
    const updatedCampaign = await db.updateCampaignStatus(campaignId, 'RUNNING');
    
    console.log(`🚀 Campaign "${campaign.name}" (ID: ${campaignId}) started successfully`);
    console.log(`📊 Campaign has ${campaign.leadCount} leads to process`);
    
    if (templateInfo.type === 'email') {
      // Send emails to all leads
      console.log(`📧 Sending emails to ${campaign.leadCount} leads...`);
      let sentCount = 0;
      let failedCount = 0;
      // Fetch leads for campaign
      console.log("📌 campaignId passed to getAvailableLeads:", campaignId);
      let leads = await db.getAvailableLeads(campaignId);
      if (!Array.isArray(leads)) leads = [];
      // ✅ Step 3: Double-Log leads Value Before Length
      console.log("🐛 Raw leads from DB:", leads);
      console.log("📊 Campaign has", leads.length, "leads to process");
      if (leads.length === 0) {
        console.error('❌ No leads found for campaign:', campaignId);
        throw new Error('No leads available for this campaign.');
      }
      for (const lead of leads) {
        // 2.1 Subject fallback and validation
        let subject = '🚀 Customized AI Solutions for Everyone';
        // 🔁 Merge templateVariables and lead for personalizedVars
        const personalizedVars = { ...templateVariables, ...lead };
        // Use master template HTML
        const masterHTML = templateInfo.html_template;
        // Guard: Warn if template includes deprecated {content}
        if (masterHTML.includes('{content}')) {
          console.warn('⚠️ Warning: Template includes deprecated {content} variable.');
        }
        const renderedHTML = replaceTemplateVariables(masterHTML, personalizedVars);
        const renderedSubject = replaceTemplateVariables(subject, personalizedVars);
        // DEBUG: Log the full HTML being sent
        console.log('=== FINAL HTML TO SEND ===');
        console.log(renderedHTML);
        if (!renderedHTML || !renderedHTML.trim().startsWith('<')) {
          console.warn("❌ Skipping lead: invalid HTML", { leadId: lead.id });
          continue;
        }
        // 2.2 Test mode override
        let to = lead.email;
        if (campaign.test_mode) {
          console.log("🧪 Test mode ON — overriding", lead.email, "→ team@motionfalcon.com");
          to = 'team@motionfalcon.com';
        }
        // Send email with merged variables
        console.log("[Final Template Vars for Lead]", personalizedVars);
        const result = await emailService.sendHTMLEmail(to, renderedSubject, { html: renderedHTML }, personalizedVars);
        if (result.success) {
          console.log(`✅ Email sent to ${lead.email} (${lead.first_name || 'Unknown'})`);
          sentCount++;
          await db.updateCampaignLeadStatus(campaignId, lead.id, 'SENT');
          // Delete the lead from database after successful email delivery
          try {
            await db.deleteLeadAfterEmail(lead.id);
            console.log(`🗑️ Lead ${lead.id} (${lead.email}) deleted from database after successful email`);
          } catch (deleteError) {
            console.error(`⚠️ Failed to delete lead ${lead.id} after email:`, deleteError.message);
          }
        } else {
          console.log(`❌ Failed to send email to ${lead.email}: ${result.error}`);
          failedCount++;
          await db.updateCampaignLeadStatus(campaignId, lead.id, 'FAILED', result.error);
        }
        await new Promise(resolve => setTimeout(resolve, EMAIL_DELAY_MS));
      }
      // 3.3 After the loop, check if any emails were sent
      if (sentCount === 0) {
        console.warn(`⚠️ Campaign ${campaignId} skipped all leads — marking as COMPLETED.`);
        await db.updateCampaignStatus(campaignId, 'COMPLETED');
        return res.status(200).json({
          success: true,
          message: 'Campaign completed — no valid emails were sent.'
        });
        }
        console.log(`📧 Email campaign completed: ${sentCount} sent, ${failedCount} failed`);
      } else {
        // Only email campaigns are supported
        console.log(`⚠️ Template type not supported: ${template?.type}`);
        return res.status(400).json({
          success: false,
          error: 'Only email campaigns are supported'
        });
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

// Get available HTML templates
app.get('/api/templates', async (req, res) => {
  try {
    const templatesDir = path.join(process.cwd(), 'templates');
    
    try {
      const files = await fsp.readdir(templatesDir);
      const htmlTemplates = files.filter(file => file.endsWith('.html'));
      
      // Get templates from database
      const dbTemplates = await db.getTemplates();
      
      // Create a map of existing templates
      const existingTemplates = new Map(dbTemplates.map(t => [t.file_name, t]));
      
      // Process HTML files and create/update templates in database
      const templates = [];
      for (const file of htmlTemplates) {
        const displayName = file.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Check if template exists in database
        let template = existingTemplates.get(file);
        
        if (!template) {
          // Create template in database
          const filePath = path.join(templatesDir, file);
          const htmlContent = fs.readFileSync(filePath, 'utf-8');
          template = await db.createTemplate({
            name: displayName,
            html_template: htmlContent,
            fields: []
          });
        }
        
        templates.push({
          id: template.id,
          name: template.name,
          file_name: template.file_name,
          path: `templates/${file}`,
          displayName: displayName
        });
      }
      
      res.json({
        success: true,
        templates: templates
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          templates: []
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get templates'
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

// Test Email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    const configStatus = mailer.getEmailConfigStatus();
    const isConnected = await mailer.testEmailConnection();
    
    res.json({
      success: true,
      message: 'Email configuration test completed',
      isConnected: isConnected,
      configStatus: configStatus,
      fromEmail: mailer.EMAIL_FROM
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

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, subject, templateType, templateData, htmlTemplate } = req.body;

    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({ error: 'Recipient email and subject are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (templateType !== 'html' || !htmlTemplate) {
      return res.status(400).json({ error: 'Only HTML template emails are supported.' });
    }

    // Process HTML template
    let emailContent = htmlTemplate;
    Object.keys(templateData || {}).forEach(key => {
      const placeholder = new RegExp(`{${key}}`, 'g');
      const value = templateData[key] || '';
      emailContent = emailContent.replace(placeholder, value);
    });

    // Send test email using the email service
    const result = await emailService.sendHTMLEmail(to, subject, htmlTemplate, templateData);

      if (result.success) {
        res.json({ success: true, message: 'Test email sent successfully!' });
      } else {
        res.status(500).json({ error: result.error || 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email: ' + error.message });
  }
});

// Get pending leads count
app.get('/api/pending-leads-count', async (req, res) => {
  try {
    const count = await db.getPendingLeadsCount();
    res.json({ count });
  } catch (error) {
    console.error('Error getting pending leads count:', error);
    res.status(500).json({ error: 'Failed to get pending leads count' });
  }
});

// Delete a single lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      return res.status(400).json({ success: false, error: 'Invalid lead ID' });
    }
    const deletedLead = await db.deleteLead(leadId);
    res.json({ 
      success: true, 
      message: 'Lead deleted successfully',
      deletedLead 
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead: ' + error.message });
  }
});

// Delete multiple leads
app.post('/api/leads/delete-multiple', async (req, res) => {
  try {
    const { leadIds } = req.body;
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'Lead IDs array is required' });
    }
    
    const deletedLeads = await db.deleteLeads(leadIds);
    res.json({ 
      success: true, 
      message: `${deletedLeads.length} leads deleted successfully`,
      deletedLeads 
    });
  } catch (error) {
    console.error('Error deleting leads:', error);
    res.status(500).json({ error: 'Failed to delete leads: ' + error.message });
  }
});

// Clear all pending leads
app.delete('/api/leads/clear-all', async (req, res) => {
  try {
    const deletedLeads = await db.clearAllPendingLeads();
    res.json({ 
      success: true, 
      message: `All pending leads cleared successfully (${deletedLeads.length} leads)`,
      deletedLeads 
    });
  } catch (error) {
    console.error('Error clearing all pending leads:', error);
    res.status(500).json({ error: 'Failed to clear all pending leads: ' + error.message });
  }
});

// SES Configuration endpoint
app.post('/api/ses-config', async (req, res) => {
  try {
    const { awsRegion, awsAccessKeyId, awsSecretAccessKey, emailFrom } = req.body;
    
    // Validate required fields
    if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey || !emailFrom) {
      return res.status(400).json({
        success: false,
        error: 'All SES configuration fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailFrom)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format for FROM address'
      });
    }

    console.log('📧 Updating SES configuration...');
    
    // In a production app, you would update the .env file or configuration
    // For now, we'll just validate the configuration
    const testConfig = {
      AWS_REGION: awsRegion,
      AWS_ACCESS_KEY_ID: awsAccessKeyId,
      AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
      EMAIL_FROM: emailFrom,
      EMAIL_METHOD: 'ses-api'
    };

    // Test the configuration by trying to initialize SES
    const testClient = new SESClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    // Try to get SES account attributes to test connection
    const command = new GetAccountAttributesCommand();
    
    try {
      await testClient.send(command);
      
      // If successful, update the actual .env file
      const actualEnvPath = path.join(__dirname, '.env');
      fs.writeFileSync(actualEnvPath, envContent);
      
      // Clean up temp file
      fs.unlinkSync(tempEnvPath);
      
      console.log('✅ SES configuration updated successfully');
      
      res.json({
        success: true,
        message: 'SES configuration updated successfully',
        config: {
          region: awsRegion,
          fromEmail: emailFrom,
          method: 'ses-api'
        }
      });
      
    } catch (sesError) {
      // Clean up temp file
      if (fs.existsSync(tempEnvPath)) {
        fs.unlinkSync(tempEnvPath);
      }
      
      console.error('❌ SES configuration test failed:', sesError.message);
      res.status(400).json({
        success: false,
        error: `SES configuration test failed: ${sesError.message}`,
        details: 'Please check your AWS credentials and ensure your email is verified in SES'
      });
    }

  } catch (error) {
    console.error('❌ Error updating SES configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get pending leads (leads that haven't been emailed yet)
app.get('/api/leads/pending', async (req, res) => {
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
    
    const leads = await db.getPendingLeads(limitNum, offsetNum);
    const totalCount = await db.getPendingLeadsCount();
    
    res.json({
      success: true,
      leads: leads,
      totalLeads: totalCount,
      limit: limitNum,
      offset: offsetNum
    });
    
  } catch (error) {
    console.error('Error fetching pending leads:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch pending leads'
    });
  }
});

// Get completed leads count (leads that have been emailed)
app.get('/api/leads/completed/count', async (req, res) => {
  try {
    const count = await db.getCompletedLeadsCount();
    
    res.json({
      success: true,
      completedLeads: count
    });
    
  } catch (error) {
    console.error('Error fetching completed leads count:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch completed leads count'
    });
  }
});

// Preview HTML email template
app.get('/api/templates/:templateName/preview', async (req, res) => {
  try {
    const { templateName } = req.params;
    const { sampleData } = req.query;
    
    // Parse sample data if provided
    let templateData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company: 'Tech Corp',
      company_name: 'Tech Corp',
      custom_message: 'We\'d love to connect with you and discuss how we can help.',
      cta_link: 'https://example.com',
      cta_text: 'Learn More',
      unsubscribe_link: 'https://example.com/unsubscribe'
    };
    
    if (sampleData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(sampleData));
        templateData = { ...templateData, ...parsedData };
      } catch (error) {
        console.log('Using default sample data for preview');
      }
    }
    
    // Load the HTML template
    const templatePath = `templates/${templateName}`;
    
    try {
      // Load HTML template content
      const resolvedPath = path.resolve(process.cwd(), templatePath);
      
      const htmlContent = await fsp.readFile(resolvedPath, 'utf-8');
      
      // Replace template variables
      let processedHTML = htmlContent;
      Object.keys(templateData).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const value = templateData[key] || '';
        processedHTML = processedHTML.replace(placeholder, value);
      });
      
      res.json({
        success: true,
        templateName,
        html: processedHTML,
        sampleData: templateData
      });
      
    } catch (error) {
      res.status(404).json({
        success: false,
        error: `Template not found: ${templateName}`
      });
    }
    
  } catch (error) {
    console.error('Template preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Email Templates API
app.get('/api/email-templates', async (req, res) => {
  console.log("GET /api/email-templates called");
  console.log("DB object keys:", Object.keys(db));
  try {
    const templates = await db.getEmailTemplates();
    // Add original_template_id to each template if present
    const templatesWithOriginal = templates.map(t => ({
      ...t,
      original_template_id: t.original_template_id || null,
    }));
    res.json({ success: true, templates: templatesWithOriginal });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/email-templates/:id', async (req, res) => {
  try {
    const template = await db.getEmailTemplateById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, template: {
      ...template,
      original_template_id: template.original_template_id || null,
    }});
  } catch (error) {
    console.error('Error fetching email template by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email-templates', async (req, res) => {
  console.log("Received template data:", req.body);
  console.log("Received html_template:", req.body.html_template);
  try {
    const { name, html_template, fields, type } = req.body;
    const subject = req.body.subject?.trim() || 'Untitled Subject';
    if (!name || !html_template) {
      return res.status(400).json({ success: false, error: 'Name and html_template are required' });
    }
    if (!subject || subject === '') {
      return res.status(400).json({ error: 'Subject is required' });
    }
    const template = await db.createEmailTemplate({ name, html_template, fields, subject, type });
    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/email-templates/:id', async (req, res) => {
  console.log('📩 [Backend] PUT /api/email-templates/:id payload:', req.body);
  try {
    const { name, subject, html_template, fields, type } = req.body;
    if (!name || !html_template) {
      return res.status(400).json({ success: false, error: 'Name and html_template are required' });
    }
    if (!subject || subject.trim() === '') {
      return res.status(400).json({ error: 'Subject is required' });
    }
    const template = await db.updateEmailTemplate(req.params.id, { name, html_template, fields, subject, type });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/email-templates/:id', async (req, res) => {
  try {
    const deleted = await db.deleteEmailTemplate(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/email-templates/clone/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const original = await db.getEmailTemplateById(id);
    if (!original) return res.status(404).json({ error: 'Template not found' });

    const clonedName = `${original.name} (Copy)`;
    const newTemplate = {
      name: clonedName,
      html_template: original.html_template,
      fields: Array.isArray(original.fields) ? original.fields : [],
      subject: original.subject?.trim() || 'Untitled Subject',
      type: original.type || 'email',
      original_template_id: original.id, // ✅ NEW LINE
    };
    const result = await db.createEmailTemplate(newTemplate);
    res.json(result);
  } catch (err) {
    console.error('Error cloning template:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add test email endpoint for templates
app.post('/api/email-templates/:id/test', async (req, res) => {
  const { id } = req.params;
  const { to, fields } = req.body;
  try {
    const template = await db.getEmailTemplateById(id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    // Use provided or default test address and fields
    const testTo = to || 'team@motionfalcon.com';
    const testFields = fields || { first_name: 'Test', company: 'Motion Falcon', cta_link: 'https://motionfalcon.com', cta_text: 'Try Now' };
    // Replace variables in HTML
    let html = template.html_template;
    Object.keys(testFields).forEach(key => {
      html = html.replace(new RegExp(`{${key}}`, 'g'), testFields[key]);
    });
    // Use your mailer or email service here
    await mailer.sendHtmlEmail(testTo, template.subject || 'Test Email', html);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({ error: 'Failed to send test email' });
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

// Catch-all error handler (must be last middleware)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
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