import React, { useState, useEffect } from 'react';

const CampaignForm = ({ onSubmit, onCancel, uploadedLeads = [] }) => {
  const [campaignName, setCampaignName] = useState('');
  const [selectedHtmlTemplate, setSelectedHtmlTemplate] = useState('');
  const [htmlTemplates, setHtmlTemplates] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [templateSubject, setTemplateSubject] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Fetch HTML templates from backend API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/email-templates`);
        const data = await response.json();
        if (data.success) {
          setHtmlTemplates(data.templates || []);
        } else {
          setHtmlTemplates([]);
        }
      } catch (error) {
        setHtmlTemplates([]);
      }
    };
    fetchTemplates();
  }, []);

  // Use uploaded leads if provided, otherwise fetch from backend
  useEffect(() => {
    if (uploadedLeads && uploadedLeads.length > 0) {
      // Use the leads passed from the upload step
      console.log('Using uploaded leads:', uploadedLeads);
      setAvailableLeads(uploadedLeads);
    } else {
      // Fetch available leads from backend (fallback)
      const fetchAvailableLeads = async () => {
        try {
          const response = await fetch(`${API_URL}/api/leads/pending`);
          if (response.ok) {
            const data = await response.json();
            setAvailableLeads(data.leads || []);
          } else {
            console.error('Failed to fetch pending leads:', response.status);
          }
        } catch (error) {
          console.error('Error fetching pending leads:', error);
        }
      };

      fetchAvailableLeads();
    }
  }, [uploadedLeads]);

  useEffect(() => {
    if (selectedHtmlTemplate) {
      const selectedTemplate = htmlTemplates.find(t => t.name === selectedHtmlTemplate);
      if (selectedTemplate && selectedTemplate.id) {
        fetch(`${API_URL}/api/email-templates/${selectedTemplate.id}`)
          .then(res => res.json())
          .then(data => {
            setTemplateSubject(data.template?.subject || 'No Subject');
          })
          .catch(err => {
            console.error('Failed to fetch template subject:', err);
            setTemplateSubject('');
          });
      } else {
        setTemplateSubject('');
      }
    }
  }, [selectedHtmlTemplate, htmlTemplates]);

  const validateForm = () => {
    const newErrors = {};

    // Validate campaign name
    if (!campaignName.trim()) {
      newErrors.campaignName = 'Campaign name is required';
    } else if (campaignName.trim().length < 3) {
      newErrors.campaignName = 'Campaign name must be at least 3 characters';
    }

    // Validate HTML template selection
    if (!selectedHtmlTemplate) {
      newErrors.selectedHtmlTemplate = 'Please select an HTML template';
    } else {
      // Validate subject of selected template
      const selectedTemplate = htmlTemplates.find(t => t.name === selectedHtmlTemplate);
      if (!selectedTemplate || !selectedTemplate.subject || !selectedTemplate.subject.trim()) {
        newErrors.selectedHtmlTemplate = 'Template must have a subject to proceed';
      }
    }

    // Validate available leads
    if (availableLeads.length === 0) {
      newErrors.leads = 'No pending leads available for campaign. Please upload leads first.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let selectedTemplateData = null;
      let campaignData = {
        name: campaignName.trim(),
        leadIds: availableLeads.map(lead => lead.id),
        scheduledAt: null // Optional, can be set later
      };

      // Using HTML template
      selectedTemplateData = htmlTemplates.find(t => t.name === selectedHtmlTemplate);
      campaignData.templateName = selectedHtmlTemplate;
      campaignData.template = {
        type: 'email',
        subject: `Hello from ${campaignName.trim()}`,
        custom_message: 'We\'d love to connect with you and discuss how we can help.',
        cta_link: 'https://example.com',
        cta_text: 'Learn More',
        unsubscribe_link: 'https://example.com/unsubscribe'
      };

      // Call backend API to create campaign
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();
      
      // Call parent onSubmit with the created campaign data
      await onSubmit({
        ...result.campaign,
        template: selectedTemplateData,
        templateName: selectedHtmlTemplate,
        createdAt: new Date().toISOString()
      });
      
      // Reset form on successful submission
      setCampaignName('');
      setSelectedHtmlTemplate('');
      setErrors({});
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: error.message || 'Failed to create campaign. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getFieldDisplayName = (field) => {
    const fieldNames = {
      first_name: 'First Name',
      last_name: 'Last Name',
      company: 'Company',
      job_title: 'Job Title',
      city: 'City',
      state: 'State',
      industry: 'Industry',
      phone: 'Phone',
      email: 'Email',
      website: 'Website',
      linkedin_url: 'LinkedIn',
      notes: 'Notes',
      source: 'Source'
    };
    return fieldNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '2rem auto', 
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ 
          color: '#64ffda', 
          marginBottom: '0.5rem', 
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(100, 255, 218, 0.3)'
        }}>
          🚀 Create New Campaign
        </h2>
        <p style={{ color: '#8892b0', fontSize: '1.1rem' }}>
          Set up a new outreach campaign using your saved templates
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        width: '100%',
        maxWidth: '1400px'
      }}>
        {/* Campaign Form Panel */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            color: '#64ffda', 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '24px',
            margin: '0 0 24px 0'
          }}>
            📝 Campaign Details
          </h3>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Campaign Name Field */}
            <div>
              <label 
                htmlFor="campaignName"
                style={{ 
                  display: 'block',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                Campaign Name *
              </label>
              <input
                id="campaignName"
                name="campaignName"
                type="text"
                value={campaignName}
                onChange={(e) => {
                  setCampaignName(e.target.value);
                  if (errors.campaignName) {
                    setErrors(prev => ({ ...prev, campaignName: '' }));
                  }
                }}
                placeholder="Enter campaign name (e.g., Q1 Sales Outreach)"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(136, 146, 176, 0.1)',
                  border: errors.campaignName ? '1px solid #dc3545' : '1px solid rgba(136, 146, 176, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#64ffda';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.campaignName ? '#dc3545' : 'rgba(136, 146, 176, 0.3)';
                }}
              />
              {errors.campaignName && (
                <p style={{ 
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '4px' }}>⚠️</span>
                  {errors.campaignName}
                </p>
              )}
            </div>

            {/* HTML Template Selection */}
            <div>
              <label 
                htmlFor="selectedHtmlTemplate"
                style={{ 
                  display: 'block',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                Select HTML Template *
              </label>
              
              <select
                id="selectedHtmlTemplate"
                name="selectedHtmlTemplate"
                value={selectedHtmlTemplate}
                onChange={(e) => {
                  setSelectedHtmlTemplate(e.target.value);
                  if (errors.selectedHtmlTemplate) {
                    setErrors(prev => ({ ...prev, selectedHtmlTemplate: '' }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(136, 146, 176, 0.1)',
                  border: errors.selectedHtmlTemplate ? '1px solid #dc3545' : '1px solid rgba(136, 146, 176, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#64ffda';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.selectedHtmlTemplate ? '#dc3545' : 'rgba(136, 146, 176, 0.3)';
                }}
              >
                <option value="">Choose an HTML template...</option>
                {htmlTemplates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name} (📄 HTML Template)
                  </option>
                ))}
              </select>
              {templateSubject && (
                <div style={{ marginTop: '12px', color: '#64ffda', fontWeight: 'bold' }}>
                  Subject: {templateSubject}
                </div>
              )}
              {errors.selectedHtmlTemplate && (
                <p style={{ 
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '4px' }}>⚠️</span>
                  {errors.selectedHtmlTemplate}
                </p>
              )}
            </div>

            {/* Available Leads Information */}
            <div style={{
              background: 'rgba(100, 255, 218, 0.1)',
              border: '1px solid rgba(100, 255, 218, 0.3)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ 
                fontSize: '14px',
                color: '#64ffda',
                marginBottom: '12px',
                fontWeight: 'bold'
              }}>
                📊 Available Leads
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  Pending Leads Available:
                </span>
                <span style={{ 
                  fontSize: '16px', 
                  color: availableLeads.length > 0 ? '#64ffda' : '#dc3545',
                  fontWeight: 'bold'
                }}>
                  {availableLeads.length} leads
                </span>
              </div>
              {availableLeads.length > 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#8892b0',
                  marginTop: '8px'
                }}>
                  These pending leads will be included in your campaign
                </div>
              )}
            </div>

            {/* Leads Error */}
            {errors.leads && (
              <div style={{
                background: 'rgba(220, 53, 69, 0.2)',
                border: '1px solid rgba(220, 53, 69, 0.5)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p style={{ 
                  color: '#dc3545',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  margin: 0
                }}>
                  <span style={{ marginRight: '8px' }}>⚠️</span>
                  {errors.leads}
                </p>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div style={{
                background: 'rgba(220, 53, 69, 0.2)',
                border: '1px solid rgba(220, 53, 69, 0.5)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p style={{ 
                  color: '#dc3545',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  margin: 0
                }}>
                  <span style={{ marginRight: '8px' }}>❌</span>
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(136, 146, 176, 0.3)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(136, 146, 176, 0.5)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(136, 146, 176, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: loading ? 'rgba(136, 146, 176, 0.3)' : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                  color: loading ? '#8892b0' : '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ 
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px',
                      width: '16px',
                      height: '16px'
                    }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Campaign...
                  </span>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Template Preview Panel */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            color: '#64ffda', 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '24px',
            margin: '0 0 24px 0'
          }}>
            👀 Template Preview
          </h3>
          
          {selectedHtmlTemplate ? (() => {
            const template = htmlTemplates.find(t => t.name === selectedHtmlTemplate);
            if (!template) return null;
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Template Info */}
                <div style={{
                  background: 'rgba(100, 255, 218, 0.1)',
                  border: '1px solid rgba(100, 255, 218, 0.3)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ 
                    fontSize: '14px',
                    color: '#64ffda',
                    marginBottom: '12px',
                    fontWeight: 'bold'
                  }}>
                    📋 Template Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#8892b0' }}>Name:</span>
                      <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold' }}>{template.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#8892b0' }}>Type:</span>
                      <span style={{ fontSize: '12px', color: '#64ffda' }}>
                        📧 Email
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#8892b0' }}>Variables:</span>
                      <span style={{ fontSize: '12px', color: '#ffffff' }}>{template.fields.length}</span>
                    </div>
                  </div>
                </div>

                {/* Variables */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(136, 146, 176, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '12px',
                    color: '#8892b0',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    📊 Available Variables:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {template.fields.map((field) => (
                      <span
                        key={field}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(100, 255, 218, 0.2)',
                          border: '1px solid rgba(100, 255, 218, 0.4)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#64ffda',
                          fontWeight: 'bold'
                        }}
                      >
                        {getFieldDisplayName(field)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content Preview */}
                {template.type === 'email' && template.subject && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(136, 146, 176, 0.2)'
                  }}>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#8892b0',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}>
                      📧 Subject Preview:
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        color: '#ffffff',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        {template.subject}
                      </div>
                    </div>
                  </div>
                )}

                {template.body && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(136, 146, 176, 0.2)'
                  }}>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#8892b0',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}>
                      {template.type === 'email' ? '📧' : '💬'} Content Preview:
                    </div>
                    <div style={{
                      background: false 
                        ? 'linear-gradient(135deg, #25D366, #128C7E)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '12px',
                      border: false 
                        ? 'none' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {template.body}
                    </div>
                  </div>
                )}
                {(!template.subject || !template.subject.trim()) && (
                  <div style={{ color: '#dc3545', fontWeight: 'bold', marginTop: '8px' }}>
                    ⚠️ Template must have a subject to proceed
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: '#8892b0',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👀</div>
              <div>Select an HTML template to see preview</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CampaignForm; 