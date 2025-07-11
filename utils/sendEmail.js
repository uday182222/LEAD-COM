import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Nodemailer with SES
const transporter = nodemailer.createTransport({
  host: process.env.AWS_SES_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.AWS_SES_ACCESS_KEY,
    pass: process.env.AWS_SES_SECRET_KEY,
  },
});

// Helper to load and render an HTML template
async function renderTemplate(templateName, variables) {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
  let html = await fs.readFile(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value ?? '');
  }
  return html;
}

/**
 * Send an email to a lead using Amazon SES via Nodemailer.
 * @param {Object} lead - The lead object containing email, name, etc.
 * @param {string} lead.email - Recipient email address.
 * @param {string} lead.first_name - Lead's first name.
 * @param {string} lead.last_name - Lead's last name.
 * @param {string} lead.company - Lead's company.
 * @param {string} [lead.templateName='welcome'] - The template to use.
 * @returns {Promise<Object>} - The result from Nodemailer.
 */
export async function sendEmailToLead(lead) {
  const {
    email,
    first_name,
    last_name,
    company,
    templateName = 'welcome',
    ...rest
  } = lead;

  if (!email) throw new Error('Lead is missing an email address');

  // Prepare variables for template rendering
  const variables = {
    first_name,
    last_name,
    company,
    ...rest,
  };

  // Render HTML email
  const html = await renderTemplate(templateName, variables);

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: `Hello ${first_name || ''} from ${company || ''}`,
    html,
  };

  // Send email
  const result = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${email}: ${result.messageId}`);
  return result;
} 