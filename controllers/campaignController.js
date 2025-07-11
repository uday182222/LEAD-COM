import emailQueue from '../queue/emailQueue.js';
import { z } from 'zod';

function replaceTemplateVars(html, vars) {
  return html.replace(/{{\s*([\w_]+)\s*}}/g, (_, key) => vars[key] || `{${key}}`);
}

const campaignSchema = z.object({
  campaignId: z.string(),
  templateId: z.string(),
  subject: z.string()
});

export async function startCampaign(req, res) {
  try {
    // Validate campaign input
    const { campaignId, templateId, subject, leads, templateHtml } = req.body;
    campaignSchema.parse({ campaignId, templateId, subject });
    if (!Array.isArray(leads) || !templateHtml) {
      return res.status(400).json({ error: 'Missing leads or templateHtml' });
    }
    // Enqueue jobs for each lead
    for (const lead of leads) {
      const html = replaceTemplateVars(templateHtml, lead);
      await emailQueue.add({
        to: lead.email,
        subject,
        html,
        campaignId,
        templateId,
        variables: lead
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
      });
      console.log(`Enqueued email job for ${lead.email}`);
    }
    res.json({ success: true, message: 'Campaign emails enqueued.' });
  } catch (err) {
    console.error('Failed to enqueue campaign emails:', err);
    res.status(500).json({ error: err.message });
  }
} 