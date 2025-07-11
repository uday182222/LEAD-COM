import 'dotenv/config';
import emailQueue from './queue/emailQueue.js';

const subject = 'Test Campaign';
const htmlTemplate = '<h1>Hello {{name}}</h1><p>Welcome to {{company}}!</p>';
const leads = [
  { name: 'Uday', company: 'Motion Falcon', email: 'uday@motionfalcon.com' },
  { name: 'John', company: 'Falcon Labs', email: 'john@example.com' }
];

function replaceTemplateVars(html, vars) {
  return html.replace(/{{\s*([\w_]+)\s*}}/g, (_, key) => vars[key] || `{${key}}`);
}

(async () => {
  let enqueued = 0;
  try {
    for (const lead of leads) {
      const personalizedHtml = replaceTemplateVars(htmlTemplate, lead);
      await emailQueue.add('sendEmail', {
        to: lead.email,
        subject,
        html: personalizedHtml,
        campaignId: 'test-campaign-id',
        templateId: 'test-template-id',
        variables: lead
      });
      enqueued++;
      console.log(`📤 Enqueued email to ${lead.email}`);
    }
    console.log(`✅ Total jobs enqueued: ${enqueued}`);
  } catch (err) {
    console.error('❌ Failed to enqueue campaign jobs:', err);
  } finally {
    process.exit(0);
  }
})(); 