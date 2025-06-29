import React, { useState, useEffect, useMemo } from 'react';

const TemplateBuilder = ({ selectedFields, onTemplateComplete }) => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateType, setTemplateType] = useState('email'); // 'email' or 'whatsapp'
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [previewLead, setPreviewLead] = useState(0); // Index of sample lead to preview

  // Email template state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // WhatsApp template state
  const [whatsappMessage, setWhatsappMessage] = useState('');

  // Sample data for preview - memoized to prevent unnecessary re-renders
  const sampleLeads = useMemo(() => [
    {
      first_name: 'John',
      last_name: 'Doe',
      company: 'Tech Corp',
      job_title: 'Manager',
      industry: 'Technology',
      phone: '9876543210',
      email: 'john.doe@techcorp.com',
      website: 'www.techcorp.com',
      linkedin_url: 'linkedin.com/in/johndoe',
      city: 'Mumbai',
      state: 'Maharashtra'
    },
    {
      first_name: 'Sarah',
      last_name: 'Smith',
      company: 'Digital Solutions',
      job_title: 'Director',
      industry: 'Marketing',
      phone: '8765432109',
      email: 'sarah.smith@digitalsolutions.com',
      website: 'www.digitalsolutions.com',
      linkedin_url: 'linkedin.com/in/sarahsmith',
      city: 'Delhi',
      state: 'Delhi'
    },
    {
      first_name: 'Michael',
      last_name: 'Johnson',
      company: 'Innovation Labs',
      job_title: 'CEO',
      industry: 'Startup',
      phone: '7654321098',
      email: 'michael.johnson@innovationlabs.com',
      website: 'www.innovationlabs.com',
      linkedin_url: 'linkedin.com/in/michaeljohnson',
      city: 'Bangalore',
      state: 'Karnataka'
    }
  ], []);

  // Preset templates
  const presetTemplates = useMemo(() => [
    {
      id: 'preset-1',
      name: 'Introduction – Basic',
      type: 'email',
      subject: 'Quick hello from {company}',
      body: `Hi {first_name},

I came across your profile and wanted to introduce myself. I'm reaching out from {company} because I believe we can add value to your work.

Let me know if you're open to a quick chat!

Regards,
{your_name}`,
      fields: ['first_name', 'company', 'your_name'],
      isPreset: true
    },
    {
      id: 'preset-2',
      name: 'Sales Outreach – Offer',
      type: 'email',
      subject: 'A custom solution for {company}',
      body: `Hi {first_name},

I noticed {company} is doing exciting work in your space. We help businesses like yours improve [your product/service offering] by up to 30%.

Would you be open to a 15-minute call this week to explore how we can help?

Looking forward to your reply!

Best,
{your_name}`,
      fields: ['first_name', 'company', 'your_name'],
      isPreset: true
    },
    {
      id: 'preset-3',
      name: 'Follow-up After No Response',
      type: 'email',
      subject: 'Just checking in, {first_name}',
      body: `Hi {first_name},

Just wanted to follow up on my earlier message. I'd love to understand if there's any way {company} is currently addressing [the problem your product solves].

Let me know if you'd like to see a quick demo or have any questions!

Cheers,
{your_name}`,
      fields: ['first_name', 'company', 'your_name'],
      isPreset: true
    },
    {
      id: 'preset-4',
      name: 'Friendly Intro',
      type: 'whatsapp',
      message: `Hi {first_name}, this is {your_name} from {company}.
I just wanted to connect with you regarding a quick idea that could help with {company}'s growth.
Would this be a good time to chat?`,
      fields: ['first_name', 'your_name', 'company'],
      isPreset: true
    },
    {
      id: 'preset-5',
      name: 'Meeting Request',
      type: 'whatsapp',
      message: `Hey {first_name}, hope you're doing well!
I'm reaching out from {company} — we work with businesses like yours.
Can I send over a quick summary or schedule a 10-minute call this week?`,
      fields: ['first_name', 'company'],
      isPreset: true
    },
    {
      id: 'preset-6',
      name: 'Lead Nurture',
      type: 'whatsapp',
      message: `Hi {first_name}, just following up from last time.
Let me know if you had a chance to consider our offer — we'd love to support {company} with [short pitch].
I'm here if you have questions!`,
      fields: ['first_name', 'company'],
      isPreset: true
    }
  ], []);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('emailTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem('emailTemplates', JSON.stringify(templates));
  }, [templates]);

  // Generate preview content with variable replacement
  const generatePreview = (content) => {
    let preview = content;
    const currentLead = sampleLeads[previewLead];
    
    selectedFields.forEach(field => {
      const placeholder = `{${field}}`;
      const value = currentLead[field] || `[${field}]`;
      preview = preview.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return preview;
  };

  const insertVariable = (variable) => {
    const placeholder = `{${variable}}`;
    
    if (templateType === 'email') {
      // For email, we need to determine if we're editing subject or body
      const activeElement = document.activeElement;
      if (activeElement && activeElement.name === 'emailSubject') {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const newValue = emailSubject.substring(0, start) + placeholder + emailSubject.substring(end);
        setEmailSubject(newValue);
        // Set cursor position after inserted variable
        setTimeout(() => {
          activeElement.setSelectionRange(start + placeholder.length, start + placeholder.length);
          activeElement.focus();
        }, 0);
      } else {
        // Default to body
        const start = document.querySelector('[name="emailBody"]')?.selectionStart || 0;
        const end = document.querySelector('[name="emailBody"]')?.selectionEnd || 0;
        const newValue = emailBody.substring(0, start) + placeholder + emailBody.substring(end);
        setEmailBody(newValue);
        // Set cursor position after inserted variable
        setTimeout(() => {
          const bodyElement = document.querySelector('[name="emailBody"]');
          if (bodyElement) {
            bodyElement.setSelectionRange(start + placeholder.length, start + placeholder.length);
            bodyElement.focus();
          }
        }, 0);
      }
    } else {
      // WhatsApp
      const start = document.querySelector('[name="whatsappMessage"]')?.selectionStart || 0;
      const end = document.querySelector('[name="whatsappMessage"]')?.selectionEnd || 0;
      const newValue = whatsappMessage.substring(0, start) + placeholder + whatsappMessage.substring(end);
      setWhatsappMessage(newValue);
      // Set cursor position after inserted variable
      setTimeout(() => {
        const messageElement = document.querySelector('[name="whatsappMessage"]');
        if (messageElement) {
          messageElement.setSelectionRange(start + placeholder.length, start + placeholder.length);
          messageElement.focus();
        }
      }, 0);
    }
  };

  const loadPresetTemplate = (preset) => {
    setTemplateType(preset.type);
    setEmailSubject(preset.subject || '');
    setEmailBody(preset.body || '');
    setWhatsappMessage(preset.message || '');
    setTemplateName(preset.name);
    setShowTemplateModal(true);
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    
    const templateData = {
      id: currentTemplate ? currentTemplate.id : Date.now(),
      name: templateName,
      type: templateType,
      subject: emailSubject,
      body: emailBody,
      whatsappMessage: whatsappMessage,
      fields: selectedFields,
      createdAt: currentTemplate ? currentTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    let updatedTemplates;
    if (currentTemplate) {
      // Update existing template
      updatedTemplates = templates.map(t => t.id === currentTemplate.id ? templateData : t);
    } else {
      // Add new template
      updatedTemplates = [...templates, templateData];
    }
    
    setTemplates(updatedTemplates);
    setTemplateName('');
    setShowTemplateModal(false);
    setCurrentTemplate(null);
  };

  const loadTemplate = (template) => {
    setCurrentTemplate(template);
    setTemplateType(template.type);
    setEmailSubject(template.subject || '');
    setEmailBody(template.body || '');
    setWhatsappMessage(template.whatsappMessage || '');
    setTemplateName(template.name);
    setShowTemplateModal(true);
  };

  const deleteTemplate = (templateId) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
  };

  const createNewTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setEmailSubject('');
    setEmailBody('');
    setWhatsappMessage('');
    setShowTemplateModal(true);
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
      source: 'Source',
      your_name: 'Your Name'
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
          📝 Template Builder
        </h2>
        <p style={{ color: '#8892b0', fontSize: '1.1rem' }}>
          Create personalized email and WhatsApp templates for your outreach campaigns
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        width: '100%',
        maxWidth: '1400px'
      }}>
        {/* Template Builder Panel */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.9)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(100, 255, 218, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              color: '#64ffda', 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0
            }}>
              🛠️ Template Editor
            </h3>
            <button
              onClick={createNewTemplate}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              + New Template
            </button>
          </div>

          {/* Preset Templates Section */}
          <div style={{
            background: 'rgba(100, 255, 218, 0.05)',
            border: '1px solid rgba(100, 255, 218, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              fontSize: '14px',
              color: '#64ffda',
              marginBottom: '12px',
              fontWeight: 'bold'
            }}>
              🎯 Professional Preset Templates:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {presetTemplates.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPresetTemplate(preset)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(100, 255, 218, 0.1)',
                    border: '1px solid rgba(100, 255, 218, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#64ffda',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(100, 255, 218, 0.2)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(100, 255, 218, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {preset.type === 'email' ? '📧' : '💬'} {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Template Type Selector */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setTemplateType('email')}
              style={{
                padding: '12px 24px',
                background: templateType === 'email' ? 'linear-gradient(135deg, #64ffda, #4cd8b2)' : 'rgba(136, 146, 176, 0.2)',
                color: templateType === 'email' ? '#1a1a2e' : '#8892b0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📧 Email Template
            </button>
            <button
              onClick={() => setTemplateType('whatsapp')}
              style={{
                padding: '12px 24px',
                background: templateType === 'whatsapp' ? 'linear-gradient(135deg, #64ffda, #4cd8b2)' : 'rgba(136, 146, 176, 0.2)',
                color: templateType === 'whatsapp' ? '#1a1a2e' : '#8892b0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              💬 WhatsApp Template
            </button>
          </div>

          {/* Variable Insertion Panel */}
          <div style={{
            background: 'rgba(100, 255, 218, 0.1)',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              fontSize: '14px',
              color: '#64ffda',
              marginBottom: '12px',
              fontWeight: 'bold'
            }}>
              📋 Available Variables (Click to Insert):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedFields.map((field) => (
                <button
                  key={field}
                  onClick={() => insertVariable(field)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(100, 255, 218, 0.2)',
                    border: '1px solid rgba(100, 255, 218, 0.4)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#64ffda',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(100, 255, 218, 0.3)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(100, 255, 218, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {getFieldDisplayName(field)}
                </button>
              ))}
            </div>
          </div>

          {/* Email Template Editor */}
          {templateType === 'email' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Subject Line:
                </label>
                <input
                  type="text"
                  name="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(136, 146, 176, 0.1)',
                    border: '1px solid rgba(136, 146, 176, 0.3)',
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
                    e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Email Body:
                </label>
                <textarea
                  name="emailBody"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter email body content..."
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(136, 146, 176, 0.1)',
                    border: '1px solid rgba(136, 146, 176, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#64ffda';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
                  }}
                />
              </div>
            </div>
          )}

          {/* WhatsApp Template Editor */}
          {templateType === 'whatsapp' && (
            <div>
              <label style={{ 
                display: 'block',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                WhatsApp Message:
              </label>
              <textarea
                name="whatsappMessage"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Enter WhatsApp message content..."
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(136, 146, 176, 0.1)',
                  border: '1px solid rgba(136, 146, 176, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#64ffda';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
                }}
              />
            </div>
          )}

          {/* Template Management */}
          <div style={{ 
            borderTop: '1px solid rgba(136, 146, 176, 0.2)',
            paddingTop: '24px',
            marginTop: '24px'
          }}>
            <h4 style={{ 
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              💾 Saved Templates
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(136, 146, 176, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(136, 146, 176, 0.2)'
                  }}
                >
                  <div>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      {template.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#8892b0'
                    }}>
                      {template.type === 'email' ? '📧 Email' : '💬 WhatsApp'} • {template.fields.length} variables
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => loadTemplate(template)}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #4cd8b2, #64ffda)',
                        color: '#1a1a2e',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(100, 255, 218, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(220, 53, 69, 0.8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(220, 53, 69, 1)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(220, 53, 69, 0.8)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div style={{ 
                  color: '#8892b0',
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '16px',
                  fontStyle: 'italic'
                }}>
                  No saved templates yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
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
            👀 Live Preview
          </h3>
          
          {/* Sample Lead Selector */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid rgba(136, 146, 176, 0.2)'
          }}>
            <div style={{ 
              fontSize: '12px',
              color: '#8892b0',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Sample Lead:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {sampleLeads.map((lead, index) => (
                <button
                  key={index}
                  onClick={() => setPreviewLead(index)}
                  style={{
                    padding: '6px 12px',
                    background: previewLead === index ? 'linear-gradient(135deg, #64ffda, #4cd8b2)' : 'rgba(136, 146, 176, 0.2)',
                    color: previewLead === index ? '#1a1a2e' : '#8892b0',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {lead.first_name} {lead.last_name}
                </button>
              ))}
            </div>
          </div>

          {/* Email Preview */}
          {templateType === 'email' && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(136, 146, 176, 0.2)',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '12px',
                color: '#8892b0',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                📧 Email Preview:
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Subject: {generatePreview(emailSubject)}
                </div>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  color: '#ffffff',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  {generatePreview(emailBody)}
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Preview */}
          {templateType === 'whatsapp' && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(136, 146, 176, 0.2)',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '12px',
                color: '#8892b0',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                💬 WhatsApp Preview:
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                borderRadius: '12px',
                padding: '12px',
                color: '#ffffff',
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {generatePreview(whatsappMessage)}
              </div>
            </div>
          )}

          {/* Sample Lead Data */}
          <div style={{
            background: 'rgba(100, 255, 218, 0.1)',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ 
              fontSize: '12px',
              color: '#64ffda',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              📊 Current Sample Lead Data:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedFields.map((field) => (
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
                  {getFieldDisplayName(field)}: {sampleLeads[previewLead][field] || 'N/A'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'rgba(26, 26, 46, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ 
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#64ffda',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              {currentTemplate ? 'Edit Template' : 'Save Template'}
            </h3>
            <input
              type="text"
              placeholder="Enter template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(136, 146, 176, 0.1)',
                border: '1px solid rgba(136, 146, 176, 0.3)',
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
                e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={saveTemplate}
                disabled={!templateName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !templateName.trim() ? 'rgba(136, 146, 176, 0.3)' : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                  color: !templateName.trim() ? '#8892b0' : '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: !templateName.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (templateName.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(100, 255, 218, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (templateName.trim()) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {currentTemplate ? 'Update' : 'Save'}
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder; 