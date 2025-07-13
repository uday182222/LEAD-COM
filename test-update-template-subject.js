const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = process.env.API_URL || 'http://localhost:5001';

async function testUpdateTemplateSubject() {
  // 1. Fetch all templates
  const res = await fetch(`${API_URL}/api/email-templates`);
  const data = await res.json();
  if (!data.success || !data.templates.length) {
    console.error('No templates found!');
    return;
  }

  // 2. Pick the first template (or set your own ID)
  const template = data.templates[0];
  const templateId = template.id;
  const newSubject = `Test Subject ${Date.now()}`;

  // 3. Update the subject
  const updateRes = await fetch(`${API_URL}/api/email-templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: template.name,
      html_template: template.html_template,
      fields: template.fields,
      subject: newSubject,
      type: template.type,
    }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success) {
    console.error('Update failed:', updateData.error);
    return;
  }
  console.log('Update response:', updateData.template);

  // 4. Fetch the template again to verify
  const verifyRes = await fetch(`${API_URL}/api/email-templates/${templateId}`);
  const verifyData = await verifyRes.json();
  if (verifyData.template.subject === newSubject) {
    console.log('✅ Subject updated successfully:', verifyData.template.subject);
  } else {
    console.error('❌ Subject update failed. Current subject:', verifyData.template.subject);
  }
}

testUpdateTemplateSubject(); 