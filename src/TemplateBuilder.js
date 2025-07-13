import React, { useState, useEffect, useMemo } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const TemplateBuilder = ({ selectedFields, onTemplateComplete }) => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [previewLead, setPreviewLead] = useState(0); // Index of sample lead to preview
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);

  // HTML template state
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

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
      name: 'Dynamic Motion Falcon Promo',
      type: 'html',
      htmlTemplate: `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
 <meta charset="UTF-8" />
 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
 <meta http-equiv="X-UA-Compatible" content="IE=edge" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
 <meta name="x-apple-disable-message-reformatting" />
 <link href="https://fonts.googleapis.com/css?family=Fira+Sans:ital,wght@0,400;0,500;0,700" rel="stylesheet" />
 <title>{headline}</title>
 <style>
   /* ...other styles... */
   .falcon-logo {
     transition: transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s cubic-bezier(.4,2,.6,1);
   }
   .falcon-logo:hover {
     transform: scale(1.08);
     box-shadow: 0 8px 32px #1595e7;
   }
 </style>
</head>
<body class="body pc-font-alt" style="width: 100% !important; min-height: 100% !important; margin: 0 !important; padding: 0 !important; font-weight: normal; color: #2D3A41; mso-line-height-rule: exactly; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-variant-ligatures: normal; text-rendering: optimizeLegibility; -moz-osx-font-smoothing: grayscale; background-color: #f4f4f4;" bgcolor="#f4f4f4">
 <table class="pc-project-body" style="table-layout: fixed; width: 100%; min-width: 600px; background-color: #f4f4f4;" bgcolor="#f4f4f4" border="0" cellspacing="0" cellpadding="0" role="presentation">
  <tr>
   <td align="center" valign="top" style="width:auto;">
    <table class="pc-project-container" align="center" style="width: 600px; max-width: 600px;" border="0" cellpadding="0" cellspacing="0" role="presentation">
     <tr>
      <td style="padding: 20px 0px 20px 0px;" align="left" valign="top">
       <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
        <tr>
         <td valign="top">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td valign="top" class="pc-w520-padding-30-30-30-30 pc-w620-padding-35-35-35-35" style="padding: 40px 40px 40px 40px; height: unset; background-color: #1B1B1B;" bgcolor="#1B1B1B">
             <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
               <td class="pc-w620-spacing-0-0-40-0" align="center" valign="top" style="padding: 0px 0px 60px 0px; height: auto;">
                <a class="pc-font-alt" href="https://postcards.email/" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: top;">
                 <img class="falcon-logo" src="https://cloudfilesdm.com/postcards/Motion_Falcon_Logo_Set-02-0c9c3be2.png" width="102" height="102" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 102px; height: 102px; border: 0; transition: transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s cubic-bezier(.4,2,.6,1);" />
                </a>
               </td>
              </tr>
             </table>
             <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
               <td align="center" valign="top" style="padding: 0px 0px 30px 0px; height: auto;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-right: auto; margin-left: auto;">
                 <tr>
                  <td valign="top" align="center">
                   <div class="pc-font-alt" style="text-decoration: none;">
                    <div style="font-size:32px;line-height:42px;text-align:center;text-align-last:center;color:#ffffff;font-family:'Fira Sans', Arial, Helvetica, sans-serif;letter-spacing:-0.2px;font-weight:700;font-style:normal;">
                     <div style="font-family:'Fira Sans', Arial, Helvetica, sans-serif;"><span style="font-family: 'Fira Sans', Arial, Helvetica, sans-serif; font-size: 32px; line-height: 42px;">{headline}</span>
                     </div>
                    </div>
                   </div>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
             <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
               <td align="center" valign="top" style="padding: 0px 0px 10px 0px; height: auto;">
                <div style="font-size:18px;line-height:24px;text-align:center;color:#64ffda;font-family:'Fira Sans', Arial, Helvetica, sans-serif;font-weight:500;">{subheadline}</div>
               </td>
              </tr>
             </table>
             <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
               <td align="center" valign="top" style="padding: 0px 0px 30px 0px; height: auto;">
                <img src="https://cloudfilesdm.com/postcards/header-2-image-1.jpg" width="285" height="285" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 285px; height: auto; max-width: 100%; border: 0; transition: box-shadow 0.3s; box-shadow: 0 0 0 rgba(0,0,0,0);" />
               </td>
              </tr>
             </table>
             <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
               <td align="center" valign="top" style="padding: 0px 0px 20px 0px; height: auto;">
                <div style="font-size:16px;line-height:24px;text-align:center;color:#ffffff;font-family:'Fira Sans', Arial, Helvetica, sans-serif;font-weight:400;">{content}</div>
               </td>
              </tr>
             </table>
             <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="min-width: 100%;">
              <tr>
               <th valign="top" align="center" style="text-align: center; font-weight: normal;">
                <a style="display: inline-block; box-sizing: border-box; border-radius: 8px; background-color: #1595e7; padding: 15px 17px 15px 17px; vertical-align: top; text-align: center; text-align-last: center; text-decoration: none; -webkit-text-size-adjust: none; transition: background 0.3s;" href="{cta_link}" target="_blank">
                  <span style="font-size:16px;line-height:150%;color:#ffffff;font-family:'Fira Sans', Arial, Helvetica, sans-serif;letter-spacing:-0.2px;font-weight:500;font-style:normal;display:inline-block;vertical-align:top;">
                    <span style="font-family:'Fira Sans', Arial, Helvetica, sans-serif;display:inline-block;">
                      <span style="font-family: 'Fira Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 150%;">{cta_text}</span>
                    </span>
                  </span>
                </a>
               </th>
              </tr>
             </table>
            </td>
           </tr>
          </table>
         </td>
        </tr>
       </table>
      </td>
     </tr>
    </table>
   </td>
  </tr>
 </table>
</body>
</html>`,
    fields: ['headline', 'subheadline', 'content', 'cta_text', 'cta_link', 'company', 'email', 'full_name'],
    isPreset: true
  },
  {
    id: 'preset-4',
    name: 'Professional HTML Template',
    type: 'html',
    htmlTemplate: `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Professional Email</title>\n    <style>body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; } .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); } .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; } .content { padding: 30px; } .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; } .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }</style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <h1>Hello {first_name}!</h1>\n            <p>We're excited to connect with you</p>\n        </div>\n        <div class=\"content\">\n            <p>Hi {first_name},</p>\n            <p>I hope this email finds you well. I wanted to reach out because I believe we can help {company} achieve even greater success.</p>\n            <p>Our team specializes in helping companies like yours optimize their processes and drive growth.</p>\n            <a href=\"{cta_link}\" class=\"button\">{cta_text}</a>\n            <p>Looking forward to connecting with you!</p>\n            <p>Best regards,<br>The Team</p>\n        </div>\n        <div class=\"footer\">\n            <p>© 2024 Your Company. All rights reserved.</p>\n            <p><a href=\"{unsubscribe_link}\" style=\"color: #667eea;\">Unsubscribe</a></p>\n        </div>\n    </div>\n</body>\n</html>`,
    fields: ['first_name', 'company', 'cta_link', 'cta_text', 'unsubscribe_link'],
    isPreset: true
  }
], []);

// Fetch templates from backend API on mount
useEffect(() => {
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };
  fetchTemplates();
}, []);

// Add state for preset variable values
const [presetVars, setPresetVars] = useState({});
const [clonedFields, setClonedFields] = useState(null);
const [fields, setFields] = useState([]);
// Add subject state
const [subject, setSubject] = useState('');

// When a preset is selected, initialize presetVars with default or empty values for its fields
const handlePresetSelect = (preset) => {
  openTemplateModal(preset);
};

// When opening the modal for edit, clone, or create
const openTemplateModal = (template, isClone = false) => {
  setCurrentTemplate(isClone ? null : template);
  setTemplateName(template?.name ? (isClone ? template.name + ' (Copy)' : template.name) : '');
  setHtmlTemplate(template?.htmlTemplate || template?.html_template || '');
  setSubject((template?.subject && template.subject.trim()) || 'Your Email Subject');
  let templateFields = template?.fields;
  if (!templateFields || templateFields.length === 0) {
    templateFields = extractVariablesFromHTML(template?.htmlTemplate || template?.html_template || '');
  }
  setFields(templateFields);
  setShowTemplateModal(true);
};

// Update generatePreview to use mapped lead data for email/full_name
const generatePreview = (content) => {
  let preview = content;
  const vars = currentTemplate && currentTemplate.fields ? presetVars : {};
  Object.keys(vars).forEach(field => {
    const placeholder = `{${field}}`;
    let value = vars[field] || `[${field}]`;
    if ((field === 'email' || field === 'full_name') && value && sampleLeads[previewLead]) {
      value = sampleLeads[previewLead][value] || `[${field}]`;
    }
    preview = preview.replace(new RegExp(placeholder, 'g'), value);
  });
  return preview;
};

// Email testing functionality
const sendTestEmail = async () => {
  if (!testEmail.trim()) {
    setTestResult({ success: false, message: 'Please enter a test email address' });
    return;
  }

  setIsSendingTest(true);
  setTestResult(null);

  try {
    // Use the current values from the input boxes for all template fields
    const templateData = {};
    if (currentTemplate && currentTemplate.fields) {
      currentTemplate.fields.forEach(field => {
        templateData[field] = presetVars[field] || '';
      });
    }

    // Use headline variable as subject if available, else templateName or default
    let subject = '';
    if (presetVars.headline && presetVars.headline.trim()) {
      subject = presetVars.headline.trim();
    } else if (templateName && templateName.trim()) {
      subject = templateName.trim();
    } else {
      subject = 'Test Email';
    }

    const response = await fetch(`${API_URL}/api/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: testEmail,
        subject,
        templateType: 'html',
        templateData: templateData,
        htmlTemplate: htmlTemplate,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      setTestResult({ success: true, message: 'Test email sent successfully!' });
    } else {
      setTestResult({ success: false, message: result.error || 'Failed to send test email' });
    }
  } catch (error) {
    setTestResult({ success: false, message: 'Network error: ' + error.message });
  } finally {
    setIsSendingTest(false);
  }
};

// Utility to extract unique variable names in double curly braces
function extractVariablesFromHTML(html) {
  const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const variables = new Set();
  let match;
  while ((match = regex.exec(html)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

// Helper to check if a template is a DB template (numeric ID)
const isDbTemplate = (template) => template && typeof template.id === 'number';

// Save or update template via API
const saveTemplate = async () => {
  if (!templateName.trim()) return;
  if (!subject.trim()) {
    alert('Please enter a subject for the email template.');
    return;
  }
  setSavingTemplate(true);
  try {
    const templateData = {
      name: templateName,
      html_template: htmlTemplate,
      fields: fields,
      subject: subject.trim(),
      type: 'email',
    };
    console.log("📝 [Frontend] Saving template with subject:", templateData.subject);
    let response, data, newTemplate;
    if (currentTemplate && isDbTemplate(currentTemplate)) {
      // Update existing template
      response = await fetch(`${API_URL}/api/email-templates/${currentTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      data = await response.json();
      if (data.success) {
        newTemplate = data.template;
        setTemplates(templates.map(t => t.id === newTemplate.id ? newTemplate : t));
      }
    } else if (!currentTemplate) {
      // Create new template
      response = await fetch(`${API_URL}/api/email-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      data = await response.json();
      if (data.success) {
        newTemplate = data.template;
        setTemplates([newTemplate, ...templates]);
      }
    } else {
      // Preset template, do not allow editing
      alert('Preset templates cannot be edited or saved.');
      setSavingTemplate(false);
      return;
    }
    setTemplateName('');
    setSubject('');
    setShowTemplateModal(false);
    setCurrentTemplate(null);
    setClonedFields(null); // Reset after save
    if (onTemplateComplete && newTemplate) {
      onTemplateComplete(newTemplate);
    }
  } catch (error) {
    // Optionally show error
  } finally {
    setSavingTemplate(false);
  }
};

const createCampaign = () => {
  if (!htmlTemplate.trim()) {
    alert('Please add an HTML template before creating a campaign.');
    return;
  }

  // Create a temporary template for campaign creation
  const templateData = {
    id: Date.now(),
    name: `Campaign Template ${Date.now()}`,
    type: 'html',
    htmlTemplate: htmlTemplate,
    fields: selectedFields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Call onTemplateComplete to proceed to campaign creation
  if (onTemplateComplete) {
    onTemplateComplete(templateData);
  }
};

const loadTemplate = (template) => {
  openTemplateModal(template);
};

// Delete template via API
const deleteTemplate = async (templateId) => {
  const template = templates.find(t => t.id === templateId);
  if (!isDbTemplate(template)) {
    alert('Preset templates cannot be deleted.');
    return;
  }
  setDeletingTemplateId(templateId);
  try {
    const response = await fetch(`${API_URL}/api/email-templates/${templateId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.success) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  } catch (error) {
    // Optionally show error
  } finally {
    setDeletingTemplateId(null);
  }
};

const createNewTemplate = () => {
  openTemplateModal({}, false);
};

// Add this function to clone a preset template
const cloneTemplate = (template) => {
  // Ensure subject is copied, with fallback
  const cloned = {
    ...template,
    subject: template.subject || 'Your Email Subject',
  };
  openTemplateModal(cloned, true);
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

// Add 'content' to the preset fields if not present
if (currentTemplate && currentTemplate.fields && !currentTemplate.fields.includes('content')) {
  currentTemplate.fields.push('content');
}

// Combine presetTemplates and user templates for management list
const allTemplates = [...presetTemplates, ...templates];

// useEffect to update fields live as htmlTemplate changes (if fields are not manually set)
useEffect(() => {
  if (!currentTemplate || !currentTemplate.fields || currentTemplate.fields.length === 0) {
    setFields(extractVariablesFromHTML(htmlTemplate));
  }
}, [htmlTemplate]);

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
        Create personalized HTML templates for your outreach campaigns
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
                onClick={() => handlePresetSelect(preset)}
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
                {preset.name}
              </button>
            ))}
          </div>
          {/* Always show variable input boxes after preset selection */}
          {currentTemplate && currentTemplate.fields && (
            <div style={{ margin: '24px 0', padding: '16px', background: 'rgba(100,255,218,0.05)', borderRadius: 12 }}>
              <h4 style={{ color: '#64ffda', marginBottom: 12 }}>Template Variables</h4>
              {currentTemplate.fields.map(field => (
                <div key={field} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: field === 'content' ? 'center' : 'flex-start' }}>
                  <label htmlFor={field} style={{ color: '#fff', fontWeight: 'bold', marginRight: 8, textAlign: field === 'content' ? 'center' : 'left', width: field === 'content' ? '100%' : undefined }}>{getFieldDisplayName(field)}:</label>
                  {field === 'content' ? (
                    <textarea
                      id={field}
                      name={field}
                      value={presetVars[field] || ''}
                      onChange={e => setPresetVars({ ...presetVars, [field]: e.target.value })}
                      rows={5}
                      style={{ padding: '12px', borderRadius: 8, border: '1px solid #64ffda', width: 400, textAlign: 'center', fontSize: '15px', margin: '0 auto', display: 'block', background: '#222', color: '#fff' }}
                      placeholder="Enter main content for the website/email..."
                    />
                  ) : ['email', 'full_name'].includes(field) ? (
                    <select
                      id={field}
                      name={field}
                      value={presetVars[field] || ''}
                      onChange={e => setPresetVars({ ...presetVars, [field]: e.target.value })}
                      style={{ padding: '8px', borderRadius: 6, border: '1px solid #64ffda', width: 300 }}
                    >
                      <option value="">-- Select Lead Field --</option>
                      {Object.keys(sampleLeads[previewLead] || {}).map(leadField => (
                        <option key={leadField} value={leadField}>{getFieldDisplayName(leadField)}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field}
                      name={field}
                      type="text"
                      value={presetVars[field] || ''}
                      onChange={e => setPresetVars({ ...presetVars, [field]: e.target.value })}
                      style={{ padding: '8px', borderRadius: 6, border: '1px solid #64ffda', width: 300 }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HTML Template Editor */}
        <div>
          <div>
            <label style={{ 
              display: 'block',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }} htmlFor="htmlTemplate">
              HTML Template:
            </label>
            <textarea
              id="htmlTemplate"
              name="htmlTemplate"
              value={htmlTemplate}
              onChange={(e) => setHtmlTemplate(e.target.value)}
              placeholder="Enter your HTML template here... Use {variable_name} to insert dynamic content."
              rows={15}
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
                fontFamily: 'monospace'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#64ffda';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(136, 146, 176, 0.3)';
              }}
            />
          </div>
          {/* Add subject input field */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }} htmlFor="subject">
              Subject:
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #64ffda',
                marginBottom: '16px',
                fontSize: '15px',
                background: '#222',
                color: '#fff'
              }}
            />
          </div>
          <button
            onClick={saveTemplate}
            style={{
              marginTop: '18px',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(100, 255, 218, 0.15)'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(100, 255, 218, 0.25)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(100, 255, 218, 0.15)';
            }}
          >
            💾 Save Template
          </button>
        </div>

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
            {loadingTemplates ? (
              <div style={{ color: '#8892b0', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Loading templates...</div>
            ) : allTemplates.length === 0 ? (
              <div style={{ 
                color: '#8892b0',
                fontSize: '14px',
                textAlign: 'center',
                padding: '16px',
                fontStyle: 'italic'
              }}>
                No saved templates yet
              </div>
            ) : (
              allTemplates.map((template) => (
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
                      {template.type === 'html' ? '🌐' : '📧'} {template.type === 'html' ? 'HTML' : 'Email'} • {template.fields.length} variables
                    </div>
                    {template.subject && (
                      <div style={{ fontSize: '12px', color: '#64ffda', marginTop: '2px' }}>
                        Subject: {template.subject}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Only show Clone for presets (non-numeric IDs) */}
                    {typeof template.id !== 'number' && (
                      <button
                        onClick={() => cloneTemplate(template)}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                          color: '#1a1a2e',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Clone
                      </button>
                    )}
                    {/* Existing Edit/Delete for DB templates */}
                    {typeof template.id === 'number' && (
                      <>
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
                            background: deletingTemplateId === template.id ? 'rgba(220, 53, 69, 1)' : 'rgba(220, 53, 69, 0.8)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (deletingTemplateId === template.id) {
                              e.target.style.background = 'rgba(220, 53, 69, 1)';
                              e.target.style.transform = 'translateY(-1px)';
                            } else {
                              e.target.style.background = 'rgba(220, 53, 69, 0.8)';
                              e.target.style.transform = 'translateY(0)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deletingTemplateId === template.id) {
                              e.target.style.background = 'rgba(220, 53, 69, 1)';
                              e.target.style.transform = 'translateY(0)';
                            } else {
                              e.target.style.background = 'rgba(220, 53, 69, 0.8)';
                              e.target.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {deletingTemplateId === template.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Campaign Button */}
        <div style={{
          background: 'rgba(100, 255, 218, 0.1)',
          border: '2px solid rgba(100, 255, 218, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <h4 style={{ 
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#64ffda',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            🚀 Ready to Launch Your Campaign?
          </h4>
          <p style={{ 
            color: '#8892b0',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            Your HTML template is ready! Click below to create a campaign and start sending emails.
          </p>
          <button
            onClick={createCampaign}
            disabled={!htmlTemplate.trim()}
            style={{
              padding: '16px 32px',
              background: !htmlTemplate.trim() ? 'rgba(136, 146, 176, 0.3)' : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
              color: !htmlTemplate.trim() ? '#8892b0' : '#1a1a2e',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: !htmlTemplate.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (htmlTemplate.trim()) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 32px rgba(100, 255, 218, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (htmlTemplate.trim()) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            🎯 Create Campaign & Start Sending
          </button>
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

        {/* HTML Template Preview */}
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
            🌐 HTML Template Preview:
          </div>
          {/* Rendered HTML Preview */}
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #eee',
            maxHeight: '300px',
            overflow: 'auto',
            marginBottom: '12px',
            color: '#222',
            fontFamily: currentTemplate && currentTemplate.id === 'preset-1' ? "'Fira Sans', Arial, Helvetica, sans-serif" : 'inherit',
            backgroundColor: currentTemplate && currentTemplate.id === 'preset-1' ? '#23272f' : '#fff',
            boxShadow: currentTemplate && currentTemplate.id === 'preset-1' ? '0 0 24px #1595e733' : undefined,
            position: 'relative'
          }}>
            {currentTemplate && currentTemplate.id === 'preset-1' && (
              <link href="https://fonts.googleapis.com/css?family=Fira+Sans:ital,wght@0,400;0,500;0,700" rel="stylesheet" />
            )}
            <div
              style={{
                fontFamily: currentTemplate && currentTemplate.id === 'preset-1' ? "'Fira Sans', Arial, Helvetica, sans-serif" : 'inherit',
                color: currentTemplate && currentTemplate.id === 'preset-1' ? '#f4f4f4' : '#222',
                minHeight: 200
              }}
              dangerouslySetInnerHTML={{ __html: generatePreview(htmlTemplate) || '<div style="color:#bbb">No HTML template content</div>' }}
            />
          </div>
        </div>

        {/* Email Testing Section */}
        <div style={{
          background: 'rgba(100, 255, 218, 0.1)',
          border: '1px solid rgba(100, 255, 218, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '12px',
            color: '#64ffda',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            🧪 Test Email:
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="email"
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(136, 146, 176, 0.3)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px'
              }}
            />
            <button
              onClick={sendTestEmail}
              disabled={isSendingTest || !testEmail.trim()}
              style={{
                padding: '8px 16px',
                background: isSendingTest || !testEmail.trim() 
                  ? 'rgba(136, 146, 176, 0.3)' 
                  : 'linear-gradient(135deg, #64ffda, #4cd8b2)',
                color: isSendingTest || !testEmail.trim() 
                  ? '#8892b0' 
                  : '#1a1a2e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: isSendingTest || !testEmail.trim() 
                  ? 'not-allowed' 
                  : 'pointer'
              }}
            >
              {isSendingTest ? 'Sending...' : 'Send Test'}
            </button>
          </div>
          {testResult && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: testResult.success 
                ? 'rgba(100, 255, 218, 0.2)' 
                : 'rgba(255, 100, 100, 0.2)',
              color: testResult.success ? '#64ffda' : '#ff6464',
              border: testResult.success ? '1px solid rgba(100, 255, 218, 0.4)' : '1px solid rgba(255, 100, 100, 0.4)'
            }}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default TemplateBuilder;