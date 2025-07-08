import React, { useRef, useState } from 'react';

const ACCEPTED_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const STANDARD_FIELDS = [
  { value: '', label: '-- Select Field --' },
  { value: 'first_name', label: 'First Name' },
  { value: 'middle_name', label: 'Middle Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email (Required)' },
  { value: 'phone', label: 'Phone (Required)' },
  { value: 'mobile', label: 'Mobile Phone' },
  { value: 'work_phone', label: 'Work Phone' },
  { value: 'company', label: 'Company Name' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'department', label: 'Department' },
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn Profile' },
  { value: 'twitter', label: 'Twitter Handle' },
  { value: 'facebook', label: 'Facebook Profile' },
  { value: 'address', label: 'Address' },
  { value: 'street_address', label: 'Street Address' },
  { value: 'building_name', label: 'Building Name' },
  { value: 'building_number', label: 'Building Number' },
  { value: 'street_name', label: 'Street Name' },
  { value: 'street_number', label: 'Street Number' },
  { value: 'locality', label: 'Locality/Neighborhood' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State/Province' },
  { value: 'zip', label: 'ZIP/Postal Code' },
  { value: 'country', label: 'Country' },
  { value: 'industry', label: 'Industry' },
  { value: 'sub_industry', label: 'Sub Industry' },
  { value: 'company_size', label: 'Company Size' },
  { value: 'revenue', label: 'Annual Revenue' },
  { value: 'founded_year', label: 'Founded Year' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Lead Source' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'status', label: 'Lead Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assigned_to', label: 'Assigned To' },
  { value: 'created_date', label: 'Created Date' },
  { value: 'last_contact', label: 'Last Contact Date' },
  { value: 'fax', label: 'Fax Number' },
  { value: 'extension', label: 'Phone Extension' },
  { value: 'timezone', label: 'Timezone' },
  { value: 'language', label: 'Language' },
  { value: 'currency', label: 'Currency' },
  { value: 'skip', label: 'Skip Column' }
];

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

const LeadFileUpload = ({ onFileAccepted = null, onUploadComplete = null }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [showMapping, setShowMapping] = useState(false);
  const [mappingErrors, setMappingErrors] = useState([]);
  const [columnRenames, setColumnRenames] = useState({});
  const [editingColumn, setEditingColumn] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationResults, setShowValidationResults] = useState(false);
  const [saveResults, setSaveResults] = useState(null);
  const [showSaveResults, setShowSaveResults] = useState(false);

  const showError = (message) => {
    setError(message);
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
    setParsedData(null);
    setFieldMappings({});
    setShowMapping(false);
    setMappingErrors([]);
    setColumnRenames({});
    setEditingColumn(null);
    setValidationResults(null);
    setShowValidationResults(false);
    setSaveResults(null);
    setShowSaveResults(false);
    // Clear error after 5 seconds
    setTimeout(() => setError(''), 5000);
  };

  const uploadFile = async (file) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setProgress(100);
      setStatus('Upload complete!');
      setParsedData(data);
      
      // Initialize field mappings
      const initialMappings = {};
      data.headers.forEach(header => {
        initialMappings[header] = '';
      });
      setFieldMappings(initialMappings);
      setShowMapping(true);
      
      if (onFileAccepted) onFileAccepted(file, data);

    } catch (error) {
      showError(error.message);
      return;
    }

    setIsProcessing(false);
    
    // Reset progress after showing completion
    setTimeout(() => {
      setProgress(0);
      setStatus('');
    }, 2000);
  };

  const handleFieldMapping = (header, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const handleColumnRename = (originalHeader, newName) => {
    setColumnRenames(prev => ({
      ...prev,
      [originalHeader]: newName
    }));
  };

  const startEditingColumn = (header) => {
    setEditingColumn(header);
  };

  const finishEditingColumn = () => {
    setEditingColumn(null);
  };

  const getFinalColumnName = (originalHeader) => {
    return columnRenames[originalHeader] || originalHeader;
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateRow = (row, fieldMappings) => {
    const errors = [];
    
    Object.entries(fieldMappings).forEach(([header, mapping]) => {
      if (mapping && mapping !== 'skip') {
        const value = row[header] || '';
        
        if (mapping === 'email' && value && !validateEmail(value)) {
          errors.push(`Invalid email format: "${value}"`);
        }
        
        // Phone validation removed - accept any phone number format
      }
    });
    
    return errors;
  };

  const validateMappings = () => {
    console.log('🔍 validateMappings called');
    console.log('Current field mappings:', fieldMappings);
    
    const errors = [];
    const mappedFields = Object.values(fieldMappings);
    
    console.log('Mapped fields:', mappedFields);
    
    if (!mappedFields.includes('email')) {
      errors.push('Email field is required. Please map a column to Email.');
      console.log('❌ Email field missing');
    }
    
    if (!mappedFields.includes('phone')) {
      errors.push('Phone field is required. Please map a column to Phone.');
      console.log('❌ Phone field missing');
    }
    
    // Check for duplicate mappings
    const usedFields = mappedFields.filter(field => field && field !== 'skip');
    const duplicates = usedFields.filter((field, index) => usedFields.indexOf(field) !== index);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate mappings found: ${[...new Set(duplicates)].join(', ')}`);
      console.log('❌ Duplicate mappings found:', duplicates);
    }
    
    console.log('Validation errors:', errors);
    setMappingErrors(errors);
    return errors.length === 0;
  };

  const handleContinue = () => {
    console.log('🔄 handleContinue called');
    console.log('Field mappings:', fieldMappings);
    console.log('Parsed data:', parsedData);
    
    if (validateMappings()) {
      console.log('✅ Mappings validated, calling validateFullDataset');
      // Perform data validation on the full dataset
      validateFullDataset();
    } else {
      console.log('❌ Mappings validation failed');
    }
  };

  const validateFullDataset = async () => {
    setIsProcessing(true);
    setStatus('Validating data...');
    
    try {
      // Send validation request to backend
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: parsedData.fileName,
          fileId: parsedData.fileId,
          fieldMappings: fieldMappings,
          columnRenames: columnRenames,
          totalRows: parsedData.totalRows
        }),
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      const validationResults = await response.json();
      
      setValidationResults(validationResults);
      setShowValidationResults(true);
      setShowMapping(false);
      setIsProcessing(false);
      setStatus('');
      
    } catch (error) {
      console.error('Validation error:', error);
      // Fallback to preview validation if backend validation fails
      performPreviewValidation();
      setIsProcessing(false);
      setStatus('');
    }
  };

  const performPreviewValidation = () => {
    // Perform data validation on preview data (fallback)
    const validRows = [];
    const invalidRows = [];
    
    parsedData.preview.forEach((row, index) => {
      const rowErrors = validateRow(row, fieldMappings);
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
      totalRows: parsedData.totalRows,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      invalidRowDetails: invalidRows,
      validationRate: ((validRows.length / parsedData.totalRows) * 100).toFixed(1),
      note: "Validation performed on preview data only"
    };
    
    setValidationResults(validationResults);
    setShowValidationResults(true);
    setShowMapping(false);
  };

  const handleProceedWithValidData = async () => {
    if (!validationResults) return;
    
    console.log('🚀 Starting save process...');
    console.log('Validation results:', validationResults);
    
    setIsProcessing(true);
    setStatus('Saving leads to database...');
    
    try {
      // Save leads to database
      console.log('📡 Sending request to save leads...');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/save-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: validationResults.fileId,
          fieldMappings: fieldMappings
        }),
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error('Failed to save leads');
      }

      const saveResults = await response.json();
      console.log('💾 Save results received:', saveResults);
      
      // Show success message with results
      setStatus('');
      setIsProcessing(false);
      
      // Format results for display
      const formattedResults = {
        totalProcessed: saveResults.processingStats.totalRecords,
        validRecords: saveResults.processingStats.validRecords,
        invalidRecords: saveResults.processingStats.invalidRecords,
        validationRate: saveResults.processingStats.validationRate,
        savedLeads: saveResults.databaseResults.saved,
        duplicates: saveResults.databaseResults.duplicates,
        errors: saveResults.databaseResults.errors,
        successRate: saveResults.databaseResults.successRate,
        totalSkipped: saveResults.summary.totalSkipped,
        totalRejected: saveResults.summary.totalRejected,
        totalInDatabase: saveResults.summary.totalInDatabase,
        message: saveResults.message
      };
      
      console.log('🎯 Setting save results:', formattedResults);
      setSaveResults(formattedResults);
      setShowSaveResults(true);
      console.log('✅ Save results set, confirmation screen should show!');
      
      // Reset the component
      setSelectedFile(null);
      setParsedData(null);
      setFieldMappings({});
      setShowMapping(false);
      setMappingErrors([]);
      setColumnRenames({});
      setEditingColumn(null);
      setValidationResults(null);
      setShowValidationResults(false);
      
      // Call the upload complete callback with the uploaded leads
      if (onUploadComplete) {
        try {
          // Fetch the uploaded leads from the database
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
          const leadsResponse = await fetch(`${API_URL}/api/leads/pending`);
          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            onUploadComplete(leadsData.leads || []);
          } else {
            onUploadComplete([]);
          }
        } catch (error) {
          console.error('Error fetching uploaded leads:', error);
          onUploadComplete([]);
        }
      }
      
    } catch (error) {
      console.error('❌ Save error:', error);
      setStatus('');
      setIsProcessing(false);
      alert(`❌ Error saving leads: ${error.message}`);
    }
  };

  const handleRetrySave = async () => {
    if (!validationResults) return;
    
    console.log('🔄 Retrying save process...');
    setIsProcessing(true);
    setStatus('Retrying save process...');
    
    try {
      // Retry saving leads to database with same settings
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/save-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: validationResults.fileId,
          fieldMappings: fieldMappings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save leads');
      }

      const saveResults = await response.json();
      
      // Show success message with results
      setStatus('');
      setIsProcessing(false);
      
      // Format results for display
      const formattedResults = {
        totalProcessed: saveResults.processingStats.totalRecords,
        validRecords: saveResults.processingStats.validRecords,
        invalidRecords: saveResults.processingStats.invalidRecords,
        validationRate: saveResults.processingStats.validationRate,
        savedLeads: saveResults.databaseResults.saved,
        duplicates: saveResults.databaseResults.duplicates,
        errors: saveResults.databaseResults.errors,
        successRate: saveResults.databaseResults.successRate,
        totalSkipped: saveResults.summary.totalSkipped,
        totalRejected: saveResults.summary.totalRejected,
        totalInDatabase: saveResults.summary.totalInDatabase,
        message: saveResults.message
      };
      
      setSaveResults(formattedResults);
      setShowSaveResults(true);
      
      // Call the upload complete callback
      if (onUploadComplete) {
        try { const leadsResponse = await fetch(`${API_URL}/api/leads/pending`); if (leadsResponse.ok) { const leadsData = await leadsResponse.json(); onUploadComplete(leadsData.leads || []); } else { onUploadComplete([]); } } catch (error) { console.error("Error fetching uploaded leads:", error); onUploadComplete([]); }
      }
      
    } catch (error) {
      console.error('❌ Retry save error:', error);
      setStatus('');
      setIsProcessing(false);
      alert(`❌ Error retrying save: ${error.message}`);
    }
  };

  const handleFile = async (file) => {
    // Check file size first
    if (file.size > MAX_FILE_SIZE) {
      showError('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    // Check file type
    const ext = getFileExtension(file.name);
    const isValid =
      ACCEPTED_TYPES.includes(file.type) ||
      ext === 'csv' ||
      ext === 'xlsx' ||
      ext === 'xls';
    
    if (!isValid) {
      showError('Only .csv, .xlsx, and .xls files are allowed.');
      return;
    }

    // All validations passed
    setError('');
    setSelectedFile(file);
    setParsedData(null);
    setFieldMappings({});
    setShowMapping(false);
    setMappingErrors([]);
    setColumnRenames({});
    setEditingColumn(null);
    setValidationResults(null);
    setShowValidationResults(false);
    
    // Start upload
    await uploadFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '2rem auto', 
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      {/* Debug Info */}
      {console.log('🔍 Current state:', {
        showMapping,
        showValidationResults,
        showSaveResults,
        hasSaveResults: !!saveResults,
        isProcessing
      })}
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        style={{
          border: dragActive ? '2px solid #64ffda' : '2px dashed #8892b0',
          borderRadius: 12,
          padding: '3rem',
          textAlign: 'center',
          background: dragActive ? 'rgba(100, 255, 218, 0.1)' : 'rgba(136, 146, 176, 0.1)',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: isProcessing ? 0.6 : 1,
          backdropFilter: 'blur(10px)',
          boxShadow: dragActive ? '0 0 30px rgba(100, 255, 218, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '800px'
        }}
      >
        <input
          id="leadFileInput"
          name="leadFileInput"
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />
        <div style={{ fontSize: 20, marginBottom: 12, color: '#ffffff' }}>
          Drag & drop your <b style={{ color: '#64ffda' }}>.csv</b>, <b style={{ color: '#64ffda' }}>.xlsx</b>, or <b style={{ color: '#64ffda' }}>.xls</b> file here
        </div>
        <div style={{ color: '#8892b0', fontSize: 16 }}>
          or <span style={{ color: '#64ffda', textDecoration: 'underline', cursor: 'pointer' }}>click to select a file</span>
        </div>
        <div style={{ marginTop: 20, color: '#8892b0', fontSize: 14 }}>
          Only .csv, .xlsx, and .xls files are accepted (max 5MB).
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div style={{ marginTop: 24, width: '100%', maxWidth: '800px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 12,
            fontSize: 16,
            color: '#ffffff'
          }}>
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div style={{
            width: '100%',
            height: 10,
            backgroundColor: 'rgba(136, 146, 176, 0.2)',
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #64ffda, #4cd8b2)',
              transition: 'width 0.3s ease',
              borderRadius: 6,
              boxShadow: '0 0 10px rgba(100, 255, 218, 0.5)'
            }} />
          </div>
        </div>
      )}

      {/* Validation Results */}
      {showValidationResults && validationResults && (
        <div style={{ 
          marginTop: 32, 
          width: '100%',
          maxWidth: '1200px',
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ color: '#64ffda', marginBottom: 24, fontSize: '1.5rem', textAlign: 'center' }}>
            🔍 Data Validation Results
          </h3>
          
          {/* Validation Summary */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(100, 255, 218, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(100, 255, 218, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#64ffda', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>TOTAL ROWS</div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{validationResults.totalRows}</div>
            </div>
            
            <div style={{
              background: 'rgba(100, 255, 218, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(100, 255, 218, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#64ffda', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>VALID ROWS</div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{validationResults.validRows}</div>
            </div>
            
            <div style={{
              background: validationResults.invalidRows > 0 ? 'rgba(220, 53, 69, 0.1)' : 'rgba(136, 146, 176, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: validationResults.invalidRows > 0 ? '1px solid rgba(220, 53, 69, 0.2)' : '1px solid rgba(136, 146, 176, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: validationResults.invalidRows > 0 ? '#ff6b6b' : '#8892b0', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '4px' 
              }}>
                INVALID ROWS
              </div>
              <div style={{ 
                color: validationResults.invalidRows > 0 ? '#ff6b6b' : '#8892b0', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {validationResults.invalidRows}
              </div>
            </div>
            
            <div style={{
              background: parseFloat(validationResults.validationRate) >= 90 ? 'rgba(100, 255, 218, 0.1)' : 
                         parseFloat(validationResults.validationRate) >= 70 ? 'rgba(255, 193, 7, 0.1)' : 'rgba(220, 53, 69, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: parseFloat(validationResults.validationRate) >= 90 ? '1px solid rgba(100, 255, 218, 0.2)' :
                      parseFloat(validationResults.validationRate) >= 70 ? '1px solid rgba(255, 193, 7, 0.2)' : '1px solid rgba(220, 53, 69, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: parseFloat(validationResults.validationRate) >= 90 ? '#64ffda' : 
                       parseFloat(validationResults.validationRate) >= 70 ? '#ffc107' : '#ff6b6b', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '4px' 
              }}>
                VALIDATION RATE
              </div>
              <div style={{ 
                color: parseFloat(validationResults.validationRate) >= 90 ? '#64ffda' : 
                       parseFloat(validationResults.validationRate) >= 70 ? '#ffc107' : '#ff6b6b', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {validationResults.validationRate}%
              </div>
            </div>
          </div>

          {/* Detailed Validation Statistics */}
          {validationResults.stats && (
            <div style={{ 
              marginBottom: '24px',
              background: 'rgba(136, 146, 176, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(136, 146, 176, 0.1)'
            }}>
              <h4 style={{ 
                color: '#8892b0', 
                marginBottom: 16, 
                fontSize: '1.1rem', 
                textAlign: 'center' 
              }}>
                📊 Detailed Validation Statistics
              </h4>
              
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {/* Email Statistics */}
                <div style={{
                  background: 'rgba(100, 255, 218, 0.08)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(100, 255, 218, 0.2)',
                  minWidth: '200px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#64ffda', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    📧 Email Validation
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '12px', marginBottom: '4px' }}>
                    Total: {validationResults.stats.totalEmails}
                  </div>
                  <div style={{ 
                    color: validationResults.stats.invalidEmails > 0 ? '#ff6b6b' : '#64ffda', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }}>
                    Invalid: {validationResults.stats.invalidEmails}
                  </div>
                  {validationResults.stats.totalEmails > 0 && (
                    <div style={{ 
                      color: '#8892b0', 
                      fontSize: '10px', 
                      marginTop: '4px' 
                    }}>
                      {((validationResults.stats.totalEmails - validationResults.stats.invalidEmails) / validationResults.stats.totalEmails * 100).toFixed(1)}% valid
                    </div>
                  )}
                </div>
                
                {/* Phone Statistics */}
                <div style={{
                  background: 'rgba(100, 255, 218, 0.08)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(100, 255, 218, 0.2)',
                  minWidth: '200px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#64ffda', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    📞 Phone Validation
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '12px', marginBottom: '4px' }}>
                    Total: {validationResults.stats.totalPhones}
                  </div>
                  <div style={{ 
                    color: validationResults.stats.invalidPhones > 0 ? '#ff6b6b' : '#64ffda', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }}>
                    Invalid: {validationResults.stats.invalidPhones}
                  </div>
                  {validationResults.stats.totalPhones > 0 && (
                    <div style={{ 
                      color: '#8892b0', 
                      fontSize: '10px', 
                      marginTop: '4px' 
                    }}>
                      {((validationResults.stats.totalPhones - validationResults.stats.invalidPhones) / validationResults.stats.totalPhones * 100).toFixed(1)}% valid
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invalid Rows Details */}
          {validationResults.invalidRows > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#ff6b6b', 
                marginBottom: 16, 
                fontSize: '1.1rem', 
                textAlign: 'center' 
              }}>
                ❌ Invalid Rows Found
              </h4>
              
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                background: 'rgba(220, 53, 69, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(220, 53, 69, 0.2)',
                padding: '16px'
              }}>
                {validationResults.invalidRowDetails.map((invalidRow, index) => (
                  <div key={index} style={{
                    background: 'rgba(220, 53, 69, 0.1)',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: '1px solid rgba(220, 53, 69, 0.2)'
                  }}>
                    <div style={{ 
                      color: '#ff6b6b', 
                      fontWeight: 'bold', 
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      Row {invalidRow.rowIndex}:
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {invalidRow.errors.map((error, errorIndex) => (
                        <div key={errorIndex} style={{ 
                          color: '#ff6b6b', 
                          fontSize: '12px', 
                          marginBottom: '4px',
                          paddingLeft: '12px'
                        }}>
                          • {error}
                        </div>
                      ))}
                    </div>
                    <div style={{ 
                      color: '#8892b0', 
                      fontSize: '11px',
                      fontStyle: 'italic'
                    }}>
                      Data: {Object.entries(invalidRow.data)
                        .filter(([header, value]) => value && value.toString().trim() !== '')
                        .map(([header, value]) => `${header}: "${value}"`)
                        .join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            marginTop: '24px'
          }}>
            <button
              onClick={() => {
                setShowValidationResults(false);
                setShowMapping(true);
              }}
              style={{
                padding: '12px 24px',
                background: 'rgba(136, 146, 176, 0.1)',
                color: '#8892b0',
                border: '1px solid rgba(136, 146, 176, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(136, 146, 176, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(136, 146, 176, 0.1)';
              }}
            >
              Back to Mapping
            </button>
            <button
              onClick={handleProceedWithValidData}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(100, 255, 218, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.3)';
              }}
            >
              Proceed with Valid Data Only
            </button>
            <button
              onClick={() => {
                // Process field mappings first
                const mappedHeaders = Object.entries(fieldMappings)
                  .filter(([header, mapping]) => mapping && mapping !== 'skip')
                  .map(([header]) => header);
                
                const filteredData = {
                  ...parsedData,
                  headers: mappedHeaders.map(header => getFinalColumnName(header)),
                  preview: parsedData.preview.map(row => {
                    const filteredRow = {};
                    mappedHeaders.forEach(header => {
                      const finalColumnName = getFinalColumnName(header);
                      filteredRow[finalColumnName] = row[header] || '';
                    });
                    return filteredRow;
                  }),
                  totalRows: parsedData.totalRows,
                  fileName: parsedData.fileName,
                  fieldMappings: fieldMappings,
                  columnRenames: columnRenames,
                  originalHeaders: parsedData.headers
                };
                
                setParsedData(filteredData);
                setShowMapping(false);
                setShowValidationResults(false);
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8892b0, #6c7b7f)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(136, 146, 176, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(136, 146, 176, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(136, 146, 176, 0.3)';
              }}
            >
              👁️ View Preview
            </button>
          </div>
        </div>
      )}

      {/* Field Mapping Component */}
      {showMapping && parsedData && (
        <div style={{ 
          marginTop: 32, 
          width: '100%',
          maxWidth: '1000px',
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ color: '#64ffda', marginBottom: 24, fontSize: '1.5rem', textAlign: 'center' }}>
            🗺️ Map Your Fields
          </h3>
          <p style={{ color: '#8892b0', marginBottom: 24, textAlign: 'center' }}>
            Map your file columns to standard fields. <strong style={{ color: '#64ffda' }}>Email and Phone are required.</strong>
          </p>
          
          {/* Mapping Summary */}
          {Object.keys(fieldMappings).length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'rgba(100, 255, 218, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(100, 255, 218, 0.2)',
                color: '#64ffda',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                📊 Total Columns: {parsedData.headers.length}
              </div>
              <div style={{
                background: 'rgba(100, 255, 218, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(100, 255, 218, 0.2)',
                color: '#64ffda',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ✅ Included: {Object.values(fieldMappings).filter(mapping => mapping && mapping !== 'skip').length}
              </div>
              <div style={{
                background: 'rgba(136, 146, 176, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(136, 146, 176, 0.2)',
                color: '#8892b0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ⏭️ Skipped: {Object.values(fieldMappings).filter(mapping => mapping === 'skip').length}
              </div>
              <div style={{
                background: 'rgba(136, 146, 176, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(136, 146, 176, 0.2)',
                color: '#8892b0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                🔄 Unmapped: {Object.values(fieldMappings).filter(mapping => !mapping).length}
              </div>
              {Object.keys(columnRenames).length > 0 && (
                <div style={{
                  background: 'rgba(255, 193, 7, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 193, 7, 0.2)',
                  color: '#ffc107',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  ✏️ Renamed: {Object.keys(columnRenames).length}
                </div>
              )}
            </div>
          )}
          
          {/* Column Rename Summary */}
          {Object.keys(columnRenames).length > 0 && (
            <div style={{ 
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(255, 193, 7, 0.05)',
              border: '1px solid rgba(255, 193, 7, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{ 
                color: '#ffc107', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                ✏️ Column Renames
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {Object.entries(columnRenames).map(([original, renamed]) => (
                  <div key={original} style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    color: '#ffc107',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ color: '#8892b0' }}>{original}</span>
                    <span style={{ margin: '0 4px' }}>→</span>
                    <span style={{ fontWeight: 'bold' }}>{renamed}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            {parsedData.headers.map((header, index) => {
              const currentMapping = fieldMappings[header] || '';
              const isMapped = currentMapping && currentMapping !== 'skip';
              const isRequired = currentMapping === 'email' || currentMapping === 'phone';
              const isEditing = editingColumn === header;
              const finalColumnName = getFinalColumnName(header);
              
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: isMapped 
                    ? (isRequired ? 'rgba(100, 255, 218, 0.1)' : 'rgba(136, 146, 176, 0.08)')
                    : 'rgba(136, 146, 176, 0.05)',
                  borderRadius: '8px',
                  border: isMapped 
                    ? (isRequired ? '1px solid rgba(100, 255, 218, 0.3)' : '1px solid rgba(136, 146, 176, 0.2)')
                    : '1px solid rgba(136, 146, 176, 0.1)',
                  position: 'relative'
                }}>
                  {isRequired && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#64ffda',
                      color: '#1a1a2e',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      border: '1px solid #64ffda'
                    }}>
                      REQUIRED
                    </div>
                  )}
                  
                  {/* Original Column Name */}
                  <div style={{ 
                    flex: '0 0 120px',
                    color: isMapped ? '#ffffff' : '#8892b0',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}>
                    {header}
                  </div>

                  {/* Column Rename Section */}
                  <div style={{ 
                    flex: '0 0 120px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isEditing ? (
                      <input
                        id={`columnRename-${header}`}
                        name={`columnRename-${header}`}
                        type="text"
                        value={columnRenames[header] || header}
                        onChange={(e) => handleColumnRename(header, e.target.value)}
                        onBlur={finishEditingColumn}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            finishEditingColumn();
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          background: 'rgba(26, 26, 46, 0.8)',
                          color: '#ffffff',
                          border: '1px solid rgba(100, 255, 218, 0.5)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEditingColumn(header)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(26, 26, 46, 0.6)',
                          color: columnRenames[header] ? '#64ffda' : '#8892b0',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          border: '1px solid rgba(136, 146, 176, 0.2)',
                          transition: 'all 0.2s ease',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(100, 255, 218, 0.1)';
                          e.target.style.borderColor = 'rgba(100, 255, 218, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(26, 26, 46, 0.6)';
                          e.target.style.borderColor = 'rgba(136, 146, 176, 0.2)';
                        }}
                        title={columnRenames[header] ? `Renamed from: ${header}` : 'Click to rename column'}
                      >
                        {finalColumnName}
                        {columnRenames[header] && (
                          <span style={{ marginLeft: '4px', fontSize: '10px' }}>✏️</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <select
                    id={`fieldMapping-${header}`}
                    name={`fieldMapping-${header}`}
                    value={currentMapping}
                    onChange={(e) => handleFieldMapping(header, e.target.value)}
                    style={{
                      flex: '1',
                      padding: '8px 12px',
                      background: 'rgba(26, 26, 46, 0.8)',
                      color: '#ffffff',
                      border: isMapped 
                        ? (isRequired ? '1px solid rgba(100, 255, 218, 0.5)' : '1px solid rgba(136, 146, 176, 0.3)')
                        : '1px solid rgba(136, 146, 176, 0.2)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#64ffda';
                      e.target.style.boxShadow = '0 0 8px rgba(100, 255, 218, 0.3)';
                    }}
                    onBlur={(e) => {
                      const mapping = e.target.value;
                      const isMapped = mapping && mapping !== 'skip';
                      const isRequired = mapping === 'email' || mapping === 'phone';
                      e.target.style.borderColor = isMapped 
                        ? (isRequired ? 'rgba(100, 255, 218, 0.5)' : 'rgba(136, 146, 176, 0.3)')
                        : 'rgba(136, 146, 176, 0.2)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {STANDARD_FIELDS.map((field, fieldIndex) => (
                      <option key={fieldIndex} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  {currentMapping && (
                    <div style={{
                      fontSize: '12px',
                      color: isMapped ? '#64ffda' : '#8892b0',
                      fontWeight: '500',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {isMapped ? '✓ Included' : '✗ Skipped'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Errors */}
          {mappingErrors.length > 0 && (
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '8px'
            }}>
              {mappingErrors.map((error, index) => (
                <div key={index} style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '4px' }}>
                  ❌ {error}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            marginTop: '24px'
          }}>
            <button
              onClick={() => setShowMapping(false)}
              style={{
                padding: '12px 24px',
                background: 'rgba(136, 146, 176, 0.1)',
                color: '#8892b0',
                border: '1px solid rgba(136, 146, 176, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(136, 146, 176, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(136, 146, 176, 0.1)';
              }}
            >
              Back to Preview
            </button>
            <button
              onClick={handleContinue}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(100, 255, 218, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.3)';
              }}
            >
              Continue with Mapping
            </button>
            <button
              onClick={() => {
                // Process field mappings first
                const mappedHeaders = Object.entries(fieldMappings)
                  .filter(([header, mapping]) => mapping && mapping !== 'skip')
                  .map(([header]) => header);
                
                const filteredData = {
                  ...parsedData,
                  headers: mappedHeaders.map(header => getFinalColumnName(header)),
                  preview: parsedData.preview.map(row => {
                    const filteredRow = {};
                    mappedHeaders.forEach(header => {
                      const finalColumnName = getFinalColumnName(header);
                      filteredRow[finalColumnName] = row[header] || '';
                    });
                    return filteredRow;
                  }),
                  totalRows: parsedData.totalRows,
                  fileName: parsedData.fileName,
                  fieldMappings: fieldMappings,
                  columnRenames: columnRenames,
                  originalHeaders: parsedData.headers
                };
                
                setParsedData(filteredData);
                setShowMapping(false);
                setShowValidationResults(false);
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8892b0, #6c7b7f)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(136, 146, 176, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(136, 146, 176, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(136, 146, 176, 0.3)';
              }}
            >
              👁️ View Preview
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {parsedData && !showMapping && !showValidationResults && !showSaveResults && (
        <div style={{ 
          marginTop: 32, 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h3 style={{ color: '#64ffda', marginBottom: 20, fontSize: '1.5rem', textAlign: 'center' }}>
            📊 File Preview: {parsedData.fileName}
          </h3>
          
          {/* File Info Boxes */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: 20, 
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '600px'
          }}>
            <div style={{ 
              background: 'rgba(100, 255, 218, 0.1)', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid rgba(100, 255, 218, 0.2)',
              minWidth: '150px'
            }}>
              <div style={{ color: '#64ffda', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>TOTAL ROWS</div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{parsedData.totalRows}</div>
            </div>
            
            <div style={{ 
              background: 'rgba(100, 255, 218, 0.1)', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid rgba(100, 255, 218, 0.2)',
              minWidth: '150px'
            }}>
              <div style={{ color: '#64ffda', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>TOTAL COLUMNS</div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{parsedData.headers.length}</div>
            </div>
          </div>

          {/* Mapped Data Preview */}
          {parsedData.fieldMappings && (
            <div style={{ 
              marginBottom: 30, 
              width: '100%',
              maxWidth: '1200px'
            }}>
              <h4 style={{ 
                color: '#64ffda', 
                marginBottom: 16, 
                fontSize: '1.2rem', 
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                🎯 Mapped Data Preview (5 Sample Leads)
              </h4>
              
              {/* Mapped Fields Summary */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                {Object.entries(parsedData.fieldMappings)
                  .filter(([header, mapping]) => mapping && mapping !== 'skip')
                  .map(([header, mapping]) => {
                    const finalColumnName = parsedData.columnRenames?.[header] || header;
                    const standardField = STANDARD_FIELDS.find(field => field.value === mapping);
                    return (
                      <div key={header} style={{
                        background: mapping === 'email' || mapping === 'phone' 
                          ? 'rgba(100, 255, 218, 0.15)' 
                          : 'rgba(136, 146, 176, 0.1)',
                        color: mapping === 'email' || mapping === 'phone' ? '#64ffda' : '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        border: mapping === 'email' || mapping === 'phone'
                          ? '1px solid rgba(100, 255, 218, 0.3)'
                          : '1px solid rgba(136, 146, 176, 0.2)',
                        whiteSpace: 'nowrap',
                        fontWeight: mapping === 'email' || mapping === 'phone' ? 'bold' : 'normal'
                      }}>
                        <span style={{ color: '#8892b0', fontSize: '10px' }}>{finalColumnName}</span>
                        <span style={{ margin: '0 4px' }}>→</span>
                        <span>{standardField?.label || mapping}</span>
                      </div>
                    );
                  })}
              </div>

              {/* Mapped Data Table */}
              <div style={{ 
                overflowX: 'auto', 
                borderRadius: 12, 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(100, 255, 218, 0.2)',
                background: 'rgba(26, 26, 46, 0.9)'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'separate',
                  borderSpacing: '8px',
                  fontSize: 12,
                  padding: '16px'
                }}>
                  <thead>
                    <tr>
                      {Object.entries(parsedData.fieldMappings)
                        .filter(([header, mapping]) => mapping && mapping !== 'skip')
                        .map(([header, mapping]) => {
                          const standardField = STANDARD_FIELDS.find(field => field.value === mapping);
                          const isRequired = mapping === 'email' || mapping === 'phone';
                          return (
                            <th key={header} style={{ 
                              padding: '12px 8px', 
                              textAlign: 'left',
                              background: isRequired 
                                ? 'linear-gradient(135deg, #64ffda, #4cd8b2)' 
                                : 'linear-gradient(135deg, #8892b0, #6c7b7f)',
                              color: isRequired ? '#1a1a2e' : '#ffffff',
                              fontWeight: '600',
                              borderRadius: '8px',
                              border: isRequired 
                                ? '2px solid rgba(100, 255, 218, 0.3)' 
                                : '1px solid rgba(136, 146, 176, 0.3)',
                              boxShadow: isRequired 
                                ? '0 2px 8px rgba(100, 255, 218, 0.3)' 
                                : '0 2px 4px rgba(136, 146, 176, 0.2)',
                              minWidth: '120px',
                              maxWidth: '180px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              position: 'relative'
                            }}>
                              <div style={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                {standardField?.label || mapping}
                              </div>
                              {isRequired && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-6px',
                                  right: '-6px',
                                  background: '#ff6b6b',
                                  color: '#ffffff',
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                  padding: '1px 4px',
                                  borderRadius: '8px',
                                  border: '1px solid #ff6b6b'
                                }}>
                                  REQ
                                </div>
                              )}
                            </th>
                          );
                        })}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.preview.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.entries(parsedData.fieldMappings)
                          .filter(([header, mapping]) => mapping && mapping !== 'skip')
                          .map(([header, mapping]) => {
                            const value = row[header] || '';
                            const isRequired = mapping === 'email' || mapping === 'phone';
                            return (
                              <td key={header} style={{ 
                                padding: '10px 8px', 
                                background: isRequired 
                                  ? 'rgba(100, 255, 218, 0.08)' 
                                  : 'rgba(136, 146, 176, 0.05)',
                                color: '#ffffff',
                                borderRadius: '6px',
                                border: isRequired 
                                  ? '1px solid rgba(100, 255, 218, 0.2)' 
                                  : '1px solid rgba(136, 146, 176, 0.1)',
                                minWidth: '120px',
                                maxWidth: '180px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transition: 'all 0.2s ease',
                                cursor: 'default'
                              }}
                              title={value}
                              onMouseEnter={(e) => {
                                e.target.style.background = isRequired 
                                  ? 'rgba(100, 255, 218, 0.15)' 
                                  : 'rgba(136, 146, 176, 0.1)';
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = isRequired 
                                  ? 'rgba(100, 255, 218, 0.08)' 
                                  : 'rgba(136, 146, 176, 0.05)';
                                e.target.style.transform = 'translateY(0)';
                              }}
                              >
                                <div style={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '11px'
                                }}>
                                  {value}
                                </div>
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Column Names Display */}
          <div style={{ 
            marginBottom: 20, 
            width: '100%',
            maxWidth: '1000px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ color: '#64ffda', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>COLUMN NAMES:</div>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%'
            }}>
              {parsedData.headers.map((header, index) => (
                <div key={index} style={{
                  background: 'rgba(136, 146, 176, 0.1)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  border: '1px solid rgba(136, 146, 176, 0.2)',
                  whiteSpace: 'nowrap'
                }}>
                  {header}
                </div>
              ))}
            </div>
          </div>

          {/* Map Fields Button */}
          <button
            onClick={() => setShowMapping(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(100, 255, 218, 0.3)',
              marginBottom: '20px',
              marginRight: '12px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.3)';
            }}
          >
            🗺️ Map Fields
          </button>
          
          {/* Remap Fields Button (only show if already mapped) */}
          {parsedData.fieldMappings && (
            <button
              onClick={() => setShowMapping(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8892b0, #6c7b7f)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(136, 146, 176, 0.3)',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(136, 146, 176, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(136, 146, 176, 0.3)';
              }}
            >
              🔄 Remap Fields
            </button>
          )}
        </div>
      )}

      {selectedFile && !isProcessing && !parsedData && (
        <div style={{ marginTop: 20, color: '#ffffff', fontSize: 16 }}>
          Selected file: <b style={{ color: '#64ffda' }}>{selectedFile.name}</b>
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: 20, 
          color: '#ffffff', 
          fontSize: 16, 
          background: 'rgba(220, 53, 69, 0.2)', 
          padding: '16px 20px', 
          borderRadius: 12,
          border: '1px solid rgba(220, 53, 69, 0.3)',
          boxShadow: '0 4px 20px rgba(220, 53, 69, 0.2)',
          animation: 'slideIn 0.3s ease-out',
          maxWidth: '800px',
          width: '100%'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Save Results */}
      {showSaveResults && saveResults && (
        <div style={{ 
          marginTop: 32, 
          width: '100%',
          maxWidth: '1000px',
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ color: '#64ffda', marginBottom: 24, fontSize: '1.5rem', textAlign: 'center' }}>
            ✅ Upload Processing Complete!
          </h3>
          
          {/* Processing Summary */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(100, 255, 218, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(100, 255, 218, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#64ffda', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>TOTAL PROCESSED</div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{saveResults.totalProcessed}</div>
            </div>
            
            <div style={{
              background: 'rgba(100, 255, 218, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(100, 255, 218, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#64ffda', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>SAVED LEADS</div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{saveResults.savedLeads}</div>
            </div>
            
            <div style={{
              background: saveResults.totalSkipped > 0 ? 'rgba(255, 193, 7, 0.1)' : 'rgba(136, 146, 176, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: saveResults.totalSkipped > 0 ? '1px solid rgba(255, 193, 7, 0.2)' : '1px solid rgba(136, 146, 176, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: saveResults.totalSkipped > 0 ? '#ffc107' : '#8892b0', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '4px' 
              }}>
                SKIPPED
              </div>
              <div style={{ 
                color: saveResults.totalSkipped > 0 ? '#ffc107' : '#8892b0', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {saveResults.totalSkipped}
              </div>
            </div>
            
            <div style={{
              background: saveResults.totalRejected > 0 ? 'rgba(220, 53, 69, 0.1)' : 'rgba(136, 146, 176, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: saveResults.totalRejected > 0 ? '1px solid rgba(220, 53, 69, 0.2)' : '1px solid rgba(136, 146, 176, 0.2)',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: saveResults.totalRejected > 0 ? '#ff6b6b' : '#8892b0', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                marginBottom: '4px' 
              }}>
                REJECTED
              </div>
              <div style={{ 
                color: saveResults.totalRejected > 0 ? '#ff6b6b' : '#8892b0', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {saveResults.totalRejected}
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Processing Stats */}
            <div style={{
              background: 'rgba(136, 146, 176, 0.05)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(136, 146, 176, 0.1)'
            }}>
              <h4 style={{ color: '#8892b0', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                📊 Processing Statistics
              </h4>
              <div style={{ fontSize: '12px', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Valid Records:</span>
                  <span style={{ color: '#64ffda' }}>{saveResults.validRecords}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Invalid Records:</span>
                  <span style={{ color: '#ff6b6b' }}>{saveResults.invalidRecords}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Validation Rate:</span>
                  <span style={{ color: '#64ffda' }}>{saveResults.validationRate}%</span>
                </div>
              </div>
            </div>

            {/* Database Results */}
            <div style={{
              background: 'rgba(136, 146, 176, 0.05)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(136, 146, 176, 0.1)'
            }}>
              <h4 style={{ color: '#8892b0', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                💾 Database Results
              </h4>
              <div style={{ fontSize: '12px', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Duplicates:</span>
                  <span style={{ color: '#ffc107' }}>{saveResults.duplicates}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Errors:</span>
                  <span style={{ color: '#ff6b6b' }}>{saveResults.errors}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Success Rate:</span>
                  <span style={{ color: '#64ffda' }}>{saveResults.successRate}%</span>
                </div>
              </div>
            </div>

            {/* Database Summary */}
            <div style={{
              background: 'rgba(136, 146, 176, 0.05)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(136, 146, 176, 0.1)'
            }}>
              <h4 style={{ color: '#8892b0', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                🗄️ Database Summary
              </h4>
              <div style={{ fontSize: '12px', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Total in DB:</span>
                  <span style={{ color: '#64ffda' }}>{saveResults.totalInDatabase}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>New Added:</span>
                  <span style={{ color: '#64ffda' }}>{saveResults.savedLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Growth:</span>
                  <span style={{ color: '#64ffda' }}>
                    {saveResults.totalInDatabase > 0 ? ((saveResults.savedLeads / saveResults.totalInDatabase) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(100, 255, 218, 0.05)',
            border: '1px solid rgba(100, 255, 218, 0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#64ffda', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              🎉 {saveResults.message}
            </div>
            {saveResults.totalSkipped > 0 && (
              <div style={{ color: '#8892b0', fontSize: '12px' }}>
                🔄 {saveResults.totalSkipped} records were skipped (invalid format or duplicates).
              </div>
            )}
            {saveResults.totalRejected > 0 && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                ❌ {saveResults.totalRejected} records were rejected due to database errors.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            justifyContent: 'center',
            marginTop: '24px',
            flexWrap: 'wrap'
          }}>
            {saveResults.totalRejected > 0 && (
              <button
                onClick={handleRetrySave}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ffc107, #ff9800)',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(255, 193, 7, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                }}
              >
                🔄 Retry Save
              </button>
            )}
            <button
              onClick={() => {
                setSelectedFile(null);
                setParsedData(null);
                setFieldMappings({});
                setShowMapping(false);
                setMappingErrors([]);
                setColumnRenames({});
                setEditingColumn(null);
                setValidationResults(null);
                setShowValidationResults(false);
                setSaveResults(null);
                setShowSaveResults(false);
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(100, 255, 218, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.3)';
              }}
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LeadFileUpload; 