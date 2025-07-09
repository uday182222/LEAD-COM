import React, { useState, useMemo } from 'react';

const DEFAULT_HTML = `
<!DOCTYPE html>
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
</html>
`;

const FIELD_DEFS = [
  { name: 'headline', label: 'Headline', default: 'Welcome to Our Service!' },
  { name: 'subheadline', label: 'Subheadline', default: 'We are glad to have you.' },
  { name: 'content', label: 'Content', default: 'This is a sample email content. You can edit this text.' },
  { name: 'cta_text', label: 'CTA Text', default: 'Get Started' },
  { name: 'cta_link', label: 'CTA Link', default: 'https://example.com' },
];

export default function LiveTemplateEditor({ initialHtml = DEFAULT_HTML, initialName = '' }) {
  const [templateName, setTemplateName] = useState(initialName);
  const [htmlTemplate, setHtmlTemplate] = useState(initialHtml);
  const [fields, setFields] = useState(FIELD_DEFS.map(f => f.name));
  const [inputs, setInputs] = useState(
    FIELD_DEFS.reduce((acc, f) => ({ ...acc, [f.name]: f.default }), {})
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Optional: auto/manual toggle (not implemented for brevity)

  // Replace placeholders in HTML with input values (or defaults)
  const renderedHtml = useMemo(() => {
    let html = htmlTemplate;
    FIELD_DEFS.forEach(f => {
      const value = inputs[f.name] || f.default;
      // Replace all occurrences
      html = html.replace(new RegExp(`{${f.name}}`, 'g'), value);
    });
    return html;
  }, [htmlTemplate, inputs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    if (!templateName.trim()) {
      setError('Template name is required.');
      return;
    }
    // Validate all fields are filled
    for (const f of FIELD_DEFS) {
      if (!inputs[f.name] || !inputs[f.name].trim()) {
        setError(`Please fill in the ${f.label}.`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          html_template: htmlTemplate,
          fields,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to save template.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', width: '100%' }}>
      {/* Left: Input Form */}
      <div style={{ flex: 1, maxWidth: 400 }}>
        <h2>Email Template Editor</h2>
        <div style={{ marginBottom: 16 }}>
          <label>
            Template Name:<br />
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
              placeholder="Enter template name"
            />
          </label>
        </div>
        {FIELD_DEFS.map(f => (
          <div key={f.name} style={{ marginBottom: 16 }}>
            <label>
              {f.label}:<br />
              <input
                type="text"
                name={f.name}
                value={inputs[f.name]}
                onChange={handleInputChange}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
                placeholder={f.default}
              />
            </label>
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label>
            HTML Template:<br />
            <textarea
              value={htmlTemplate}
              onChange={e => setHtmlTemplate(e.target.value)}
              rows={8}
              style={{ width: '100%', padding: 8, marginTop: 4, fontFamily: 'monospace' }}
            />
          </label>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', fontWeight: 'bold' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 12 }}>Template saved!</div>}
      </div>
      {/* Right: Live Preview */}
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: 8, padding: 24, background: '#fafbfc', minHeight: 300 }}>
        <h3>Live Preview</h3>
        <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>
    </div>
  );
} 