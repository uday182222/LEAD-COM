import React, { useState, useEffect } from 'react';

const CampaignForm = ({ onSubmit, onCancel }) => {
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch saved templates from localStorage (since templates are stored there)
  useEffect(() => {
    const savedTemplates = localStorage.getItem('emailTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Fetch available leads from backend
  useEffect(() => {
    const fetchAvailableLeads = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/available-leads');
        if (response.ok) {
          const data = await response.json();
          setAvailableLeads(data.leads || []);
        } else {
          console.error('Failed to fetch available leads:', response.status);
        }
      } catch (error) {
        console.error('Error fetching available leads:', error);
      }
    };

    fetchAvailableLeads();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Validate campaign name
    if (!campaignName.trim()) {
      newErrors.campaignName = 'Campaign name is required';
    } else if (campaignName.trim().length < 3) {
      newErrors.campaignName = 'Campaign name must be at least 3 characters';
    }

    // Validate template selection
    if (!selectedTemplate) {
      newErrors.selectedTemplate = 'Please select a template';
    }

    // Validate available leads
    if (availableLeads.length === 0) {
      newErrors.leads = 'No leads available for campaign. Please upload leads first.';
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
      const selectedTemplateData = templates.find(t => t.id === parseInt(selectedTemplate));
      
      // Get lead IDs from available leads
      const leadIds = availableLeads.map(lead => lead.id);
      
      const campaignData = {
        name: campaignName.trim(),
        templateId: parseInt(selectedTemplate),
        leadIds: leadIds,
        scheduledAt: null // Optional, can be set later
      };

      // Call backend API to create campaign
      const response = await fetch('http://localhost:5001/api/campaigns', {
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
        createdAt: new Date().toISOString()
      });
      
      // Reset form on successful submission
      setCampaignName('');
      setSelectedTemplate('');
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

            {/* Template Selection Field */}
            <div>
              <label 
                style={{ 
                  display: 'block',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                Select Template *
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  if (errors.selectedTemplate) {
                    setErrors(prev => ({ ...prev, selectedTemplate: '' }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(136, 146, 176, 0.1)',
                  border: errors.selectedTemplate ? '1px solid #dc3545' : '1px solid rgba(136, 146, 176, 0.3)',
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
                  e.target.style.borderColor = errors.selectedTemplate ? '#dc3545' : 'rgba(136, 146, 176, 0.3)';
                }}
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.type === 'email' ? '📧 Email' : '💬 WhatsApp'} • {template.fields.length} variables)
                  </option>
                ))}
              </select>
              {errors.selectedTemplate && (
                <p style={{ 
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '4px' }}>⚠️</span>
                  {errors.selectedTemplate}
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
                  Total Leads Available:
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
                  These leads will be included in your campaign
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
          
          {selectedTemplate ? (
            (() => {
              const template = templates.find(t => t.id === parseInt(selectedTemplate));
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
                          {template.type === 'email' ? '📧 Email' : '💬 WhatsApp'}
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

                  {(template.body || template.whatsappMessage) && (
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
                        background: template.type === 'whatsapp' 
                          ? 'linear-gradient(135deg, #25D366, #128C7E)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '12px',
                        border: template.type === 'whatsapp' 
                          ? 'none' 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {template.body || template.whatsappMessage}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
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
              <div>Select a template to see preview</div>
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