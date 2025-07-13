import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './ThemeContext.js';
import LeadFileUpload from './LeadFileUpload.js';
import FieldSelection from './FieldSelection.js';
import TemplateBuilder from './TemplateBuilder.js';
import CampaignForm from './CampaignForm.js';
import Dashboard from './Dashboard.js';
import SESConfigPanel from './SESConfigPanel.js';
import PendingLeadsManager from './PendingLeadsManager.js';
import './App.css';

function AppContent() {
  const [currentStep, setCurrentStep] = useState('dashboard'); // 'dashboard', 'upload', 'field-selection', 'template-builder', 'campaign-creation', 'pending-leads', or 'ses-config'
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedLeads, setUploadedLeads] = useState([]); // Track uploaded leads throughout workflow
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Fetch available fields from database
  useEffect(() => {
    const fetchAvailableFields = async () => {
      try {
        console.log('Fetching available fields...');
        const response = await fetch(`${API_URL}/api/available-fields`);
        if (response.ok) {
          const data = await response.json();
          console.log('Available fields received:', data);
          setAvailableFields(data.fields);
        } else {
          console.error('Failed to fetch available fields:', response.status);
        }
      } catch (error) {
        console.error('Error fetching available fields:', error);
      }
    };

    fetchAvailableFields();
  }, []);

  // Fetch campaigns from backend
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/campaigns`);
        if (response.ok) {
          const data = await response.json();
          
          // Get templates from localStorage to enrich campaign data
          const savedTemplates = localStorage.getItem('emailTemplates');
          const templates = savedTemplates ? JSON.parse(savedTemplates) : [];
          
          // Enrich campaign data with template information
          const enrichedCampaigns = data.campaigns.map(campaign => {
            const template = templates.find(t => t.id === parseInt(campaign.templateId));
            return {
              ...campaign,
              template_data: template ? {
                name: template.name,
                type: template.type,
                subject: template.subject,
                body: template.body,
                fields: template.fields
              } : null
            };
          });
          
          setCampaigns(enrichedCampaigns || []);
        } else {
          console.error('Failed to fetch campaigns:', response.status);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Fetch pending leads count
  useEffect(() => {
    const fetchPendingLeadsCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pending-leads-count`);
        if (response.ok) {
          const data = await response.json();
          setPendingLeadsCount(data.count || 0);
        } else {
          console.error('Failed to fetch pending leads count:', response.status);
        }
      } catch (error) {
        console.error('Error fetching pending leads count:', error);
      }
    };

    fetchPendingLeadsCount();
  }, []);

  const handleFieldSelection = (fields) => {
    console.log('Selected fields for outreach:', fields);
    
    if (fields && fields.length > 0) {
      // Store selected fields in localStorage for persistence
      localStorage.setItem('selectedOutreachFields', JSON.stringify(fields));
      setSelectedFields(fields);
      
      // Show success notification
      toast.success(`Successfully selected ${fields.length} fields for outreach!`);
      
      // Proceed to template builder
      setCurrentStep('template-builder');
    } else {
      toast.error('Please select at least one field for outreach.');
    }
  };

  const handleUploadComplete = (leadsData) => {
    console.log('Upload completed with leads:', leadsData);
    setUploadedLeads(leadsData || []);
    toast.success('File uploaded successfully!');
    setCurrentStep('field-selection');
  };

  const handleTemplateComplete = (template) => {
    console.log('Template completed:', template);
    toast.success('Template saved successfully!');
    // Proceed to campaign creation
    setCurrentStep('campaign-creation');
  };

  const handleCampaignCreate = async (campaignData) => {
    console.log('Creating campaign:', campaignData);
    
    try {
      // Refresh campaigns from backend after creation
      const response = await fetch(`${API_URL}/api/campaigns`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
      
      // Show success notification
      toast.success(`Campaign "${campaignData.name}" created successfully!`);
      
      // Reset to dashboard
      setCurrentStep('dashboard');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleCampaignCancel = () => {
    setCurrentStep('template-builder');
  };

  const handleProceedToCampaign = () => {
    setCurrentStep('template-builder');
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleLeadsUpdated = () => {
    // Refresh pending leads count
    const fetchPendingLeadsCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pending-leads-count`);
        if (response.ok) {
          const data = await response.json();
          setPendingLeadsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending leads count:', error);
      }
    };
    fetchPendingLeadsCount();
  };

  const startCampaign = async (campaignId) => {
    try {
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_variables: {
            headline: "🚀 Unlock Growth with Motion Falcon",
            subheadline: "AI-powered email marketing for startups",
            content: "We help you reach more leads with smart targeting, personalized content, and automated campaigns.",
            cta_text: "Try It Now",
            cta_link: "https://motionfalcon.com/get-started"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start campaign');
      }

      const result = await response.json();
      
      // Show success notification
      toast.success(`Campaign "${result.campaign.name}" started successfully!`);
      
      // Refresh campaigns list to show updated status
      const campaignsResponse = await fetch(`${API_URL}/api/campaigns`);
      if (campaignsResponse.ok) {
        const data = await campaignsResponse.json();
        
        // Get templates from localStorage to enrich campaign data
        const savedTemplates = localStorage.getItem('emailTemplates');
        const templates = savedTemplates ? JSON.parse(savedTemplates) : [];
        
        // Enrich campaign data with template information
        const enrichedCampaigns = data.campaigns.map(campaign => {
          const template = templates.find(t => t.id === parseInt(campaign.templateId));
          return {
            ...campaign,
            template_data: template ? {
              name: template.name,
              type: template.type,
              subject: template.subject,
              body: template.body,
              whatsappMessage: template.whatsappMessage,
              fields: template.fields
            } : null
          };
        });
        
        setCampaigns(enrichedCampaigns || []);
      }
            } catch (error) {
          console.error('Error starting campaign:', error);
          toast.error(`Failed to start campaign: ${error.message}`);
        }
      };
      
      const stopCampaign = async (campaignId) => {
        try {
          const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/stop`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to stop campaign');
          }
      
          const result = await response.json();
          
          // Show success notification
          toast.success(`Campaign "${result.campaign.name}" stopped successfully!`);
          
          // Refresh campaigns list to show updated status
          const campaignsResponse = await fetch(`${API_URL}/api/campaigns`);
          if (campaignsResponse.ok) {
            const data = await campaignsResponse.json();
            
            // Get templates from localStorage to enrich campaign data
            const savedTemplates = localStorage.getItem('emailTemplates');
            const templates = savedTemplates ? JSON.parse(savedTemplates) : [];
            
            // Enrich campaign data with template information
            const enrichedCampaigns = data.campaigns.map(campaign => {
              const template = templates.find(t => t.id === parseInt(campaign.templateId));
              return {
                ...campaign,
                template_data: template ? {
                  name: template.name,
                  type: template.type,
                  subject: template.subject,
                  body: template.body,
                  fields: template.fields
                } : null
              };
            });
        
        setCampaigns(enrichedCampaigns || []);
      }
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast.error(`Failed to stop campaign: ${error.message}`);
    }
  };

  const renderStepIndicator = () => {
    if (currentStep === 'dashboard') return null;
    
    return (
      <div className="step-indicator" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div className={`step ${currentStep === 'upload' ? 'active' : ''}`} style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: currentStep === 'upload' ? colors.primary : colors.surface,
          color: currentStep === 'upload' ? colors.background : colors.textSecondary,
          border: `1px solid ${colors.border}`,
          fontSize: '0.9rem',
          fontWeight: currentStep === 'upload' ? 'bold' : 'normal'
        }}>
          1. Upload Leads
        </div>
        <div className={`step ${currentStep === 'field-selection' ? 'active' : ''}`} style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: currentStep === 'field-selection' ? colors.primary : colors.surface,
          color: currentStep === 'field-selection' ? colors.background : colors.textSecondary,
          border: `1px solid ${colors.border}`,
          fontSize: '0.9rem',
          fontWeight: currentStep === 'field-selection' ? 'bold' : 'normal'
        }}>
          2. Select Fields
        </div>
        <div className={`step ${currentStep === 'template-builder' ? 'active' : ''}`} style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: currentStep === 'template-builder' ? colors.primary : colors.surface,
          color: currentStep === 'template-builder' ? colors.background : colors.textSecondary,
          border: `1px solid ${colors.border}`,
          fontSize: '0.9rem',
          fontWeight: currentStep === 'template-builder' ? 'bold' : 'normal'
        }}>
          3. Build Templates
        </div>
        <div className={`step ${currentStep === 'campaign-creation' ? 'active' : ''}`} style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: currentStep === 'campaign-creation' ? colors.primary : colors.surface,
          color: currentStep === 'campaign-creation' ? colors.background : colors.textSecondary,
          border: `1px solid ${colors.border}`,
          fontSize: '0.9rem',
          fontWeight: currentStep === 'campaign-creation' ? 'bold' : 'normal'
        }}>
          4. Create Campaign
        </div>
        <div className={`step ${currentStep === 'pending-leads' ? 'active' : ''}`} style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: currentStep === 'pending-leads' ? colors.primary : colors.surface,
          color: currentStep === 'pending-leads' ? colors.background : colors.textSecondary,
          border: `1px solid ${colors.border}`,
          fontSize: '0.9rem',
          fontWeight: currentStep === 'pending-leads' ? 'bold' : 'normal'
        }}>
          5. Manage Pending Leads
        </div>
      </div>
    );
  };

  return (
    <div className="App" style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      {/* Header */}
      <header className="App-header" style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            color: colors.primary, 
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            Lead Management System
          </h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {/* Navigation */}
            <nav style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => setCurrentStep('dashboard')}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentStep === 'dashboard' ? colors.primary : 'transparent',
                  color: currentStep === 'dashboard' ? colors.background : colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentStep !== 'dashboard') {
                    e.target.style.background = colors.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentStep !== 'dashboard') {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentStep('upload')}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentStep === 'upload' ? colors.primary : 'transparent',
                  color: currentStep === 'upload' ? colors.background : colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentStep !== 'upload') {
                    e.target.style.background = colors.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentStep !== 'upload') {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                📁 Upload Leads
              </button>
              {pendingLeadsCount > 0 && (
                <button
                  onClick={() => setCurrentStep('pending-leads')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: currentStep === 'pending-leads' ? colors.primary : 'transparent',
                    color: currentStep === 'pending-leads' ? colors.background : colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (currentStep !== 'pending-leads') {
                      e.target.style.background = colors.surface;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentStep !== 'pending-leads') {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  📋 Pending Leads ({pendingLeadsCount})
                </button>
              )}
              <button
                onClick={() => setCurrentStep('ses-config')}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentStep === 'ses-config' ? colors.primary : 'transparent',
                  color: currentStep === 'ses-config' ? colors.background : colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentStep !== 'ses-config') {
                    e.target.style.background = colors.surface;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentStep !== 'ses-config') {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                ⚙️ SES Config
              </button>
            </nav>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.5rem',
                background: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.primary;
                e.target.style.color = colors.background;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = colors.surface;
                e.target.style.color = colors.text;
              }}
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        {renderStepIndicator()}
      </header>
      
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {currentStep === 'dashboard' && (
          <div>
            <Dashboard />
            {pendingLeadsCount > 0 && (
              <div style={{
                marginTop: '2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  background: colors.surface,
                  borderRadius: '16px',
                  padding: '24px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  <h3 style={{
                    color: colors.primary,
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}>
                    📋 Pending Leads Available
                  </h3>
                  <p style={{
                    color: colors.textSecondary,
                    marginBottom: '20px'
                  }}>
                    You have {pendingLeadsCount} leads ready for campaign creation. 
                    You can manage them or proceed directly to campaign creation.
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setCurrentStep('pending-leads')}
                      style={{
                        padding: '12px 24px',
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: colors.background,
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 6px 16px ${colors.primary}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      📋 Manage Pending Leads
                    </button>
                    <button
                      onClick={() => setCurrentStep('template-builder')}
                      style={{
                        padding: '12px 24px',
                        background: `linear-gradient(135deg, ${colors.success}, #059669)`,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 6px 16px ${colors.success}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      🚀 Create Campaign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 'upload' && (
          <div>
            <LeadFileUpload onUploadComplete={handleUploadComplete} />
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setCurrentStep('field-selection')}
                style={{
                  padding: '12px 24px',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: colors.background,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginRight: '12px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 16px ${colors.primary}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🧪 Test Field Selection (Skip Upload)
              </button>
              <button
                onClick={() => {
                  // Set some default selected fields for testing
                  setSelectedFields(['first_name', 'company', 'job_title', 'email', 'phone']);
                  setCurrentStep('campaign-creation');
                }}
                style={{
                  padding: '12px 24px',
                  background: `linear-gradient(135deg, ${colors.error}, #dc2626)`,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 16px ${colors.error}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🚀 Test Campaign Creation (Skip All)
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 'field-selection' && (
          <div>
            <div className="mb-6 text-center">
              <button
                onClick={() => setCurrentStep('upload')}
                style={{
                  padding: '8px 16px',
                  background: colors.surface,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.color = colors.background;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.surface;
                  e.target.style.color = colors.text;
                }}
              >
                ← Back to Upload
              </button>
            </div>
            <FieldSelection
              availableFields={availableFields}
              onFieldSelection={handleFieldSelection}
            />
          </div>
        )}

        {currentStep === 'template-builder' && (
          <div>
            <div className="mb-6 text-center">
              <button
                onClick={() => setCurrentStep('field-selection')}
                style={{
                  padding: '8px 16px',
                  background: colors.surface,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.color = colors.background;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.surface;
                  e.target.style.color = colors.text;
                }}
              >
                ← Back to Field Selection
              </button>
            </div>
            <TemplateBuilder
              selectedFields={selectedFields}
              onTemplateComplete={handleTemplateComplete}
            />
          </div>
        )}

        {currentStep === 'campaign-creation' && (
          <div>
            <div className="mb-6 text-center">
              <button
                onClick={() => setCurrentStep('template-builder')}
                style={{
                  padding: '8px 16px',
                  background: colors.surface,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.color = colors.background;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.surface;
                  e.target.style.color = colors.text;
                }}
              >
                ← Back to Template Builder
              </button>
            </div>
            <CampaignForm
              onSubmit={handleCampaignCreate}
              onCancel={handleCampaignCancel}
              uploadedLeads={uploadedLeads}
            />
          </div>
        )}

        {currentStep === 'pending-leads' && (
          <PendingLeadsManager
            onProceedToCampaign={handleProceedToCampaign}
            onBackToUpload={handleBackToUpload}
            onLeadsUpdated={handleLeadsUpdated}
          />
        )}
        
        {currentStep === 'ses-config' && (
          <SESConfigPanel />
        )}
      </main>

      {/* Campaigns Summary (if any campaigns exist) */}
      {campaigns.length > 0 && currentStep === 'dashboard' && (
        <div style={{ 
          margin: '2rem auto', 
          maxWidth: '1200px', 
          padding: '0 1rem' 
        }}>
          <div style={{
            background: colors.surface,
            borderRadius: 16,
            padding: '24px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: colors.primary, 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '20px',
              margin: '0 0 20px 0'
            }}>
              📊 Your Campaigns ({campaigns.length})
            </h3>
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: colors.textSecondary
              }}>
                <div style={{ 
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem',
                  width: '32px',
                  height: '32px',
                  border: `3px solid ${colors.border}`,
                  borderTop: `3px solid ${colors.primary}`,
                  borderRadius: '50%',
                  margin: '0 auto 1rem auto'
                }}></div>
                Loading campaigns...
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: colors.background,
                      borderRadius: '12px',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        color: colors.text,
                        fontSize: '16px',
                        marginBottom: '4px'
                      }}>
                        {campaign.name}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: colors.textSecondary
                      }}>
                        Template: {campaign.template_data?.name || 'N/A'} • 
                        Type: 📧 Email • 
                        Leads: {campaign.leadCount || 0} • 
                        Status: <span style={{ 
                          color: campaign.status === 'DRAFT' ? colors.warning : 
                                 campaign.status === 'RUNNING' ? colors.success : 
                                 campaign.status === 'COMPLETED' ? colors.textSecondary : colors.textSecondary,
                          fontWeight: 'bold'
                        }}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                        <div>Template ID: {campaign.templateId || campaign.template_id}</div>
                        {(campaign.template_data?.original_template_id || campaign.original_template_id) && (
                          <div>Cloned from Template ID: {campaign.template_data?.original_template_id || campaign.original_template_id}</div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '8px'
                    }}>
                      <div style={{ 
                        fontSize: '12px',
                        color: colors.textSecondary,
                        textAlign: 'right'
                      }}>
                        Created: {new Date(campaign.createdAt).toLocaleDateString()}
                      </div>
                      
                      {/* Start Campaign Button - only show for DRAFT campaigns */}
                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={() => startCampaign(campaign.id)}
                          style={{
                            padding: '8px 16px',
                            background: `linear-gradient(135deg, ${colors.success}, #059669)`,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = `0 4px 12px ${colors.success}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          🚀 Start Campaign
                        </button>
                      )}
                      
                      {/* Status indicator for RUNNING campaigns */}
                      {campaign.status === 'RUNNING' && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          alignItems: 'flex-end'
                        }}>
                          <div style={{
                            padding: '6px 12px',
                            background: `${colors.success}20`,
                            border: `1px solid ${colors.success}40`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: colors.success,
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ⏳ Running
                          </div>
                          
                          <button
                            onClick={() => stopCampaign(campaign.id)}
                            style={{
                              padding: '8px 16px',
                              background: `linear-gradient(135deg, ${colors.error}, #dc2626)`,
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = `0 4px 12px ${colors.error}40`;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            🛑 Stop Campaign
                          </button>
                        </div>
                      )}
                      
                      {/* Status indicator for COMPLETED campaigns */}
                      {campaign.status === 'COMPLETED' && (
                        <div style={{
                          padding: '6px 12px',
                          background: `${colors.textSecondary}20`,
                          border: `1px solid ${colors.textSecondary}40`,
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: colors.textSecondary,
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ✅ Completed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: colors.surface,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          },
          success: {
            iconTheme: {
              primary: colors.success,
              secondary: colors.background,
            },
          },
          error: {
            iconTheme: {
              primary: colors.error,
              secondary: colors.background,
            },
          },
        }}
      />

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
