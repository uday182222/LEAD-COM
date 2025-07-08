const express = require('express');
const { sendHTMLEmail, sendTextEmail, testSESConnection, getSESStatus } = require('./email-service');

const router = express.Router();

/**
 * @route   POST /api/email/send-html
 * @desc    Send HTML email using template
 * @access  Public
 */
router.post('/send-html', async (req, res) => {
  try {
    const { to, subject, templatePath, templateData } = req.body;

    // Validate required fields
    if (!to || !subject || !templatePath) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email, subject, and template path are required'
      });
    }

    // Send HTML email
    const result = await sendHTMLEmail(to, subject, templatePath, templateData);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'HTML email sent successfully',
        data: {
          messageId: result.messageId,
          to: result.to,
          from: result.from,
          templatePath: result.templatePath
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

  } catch (error) {
    console.error('Error in send-html route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/email/status
 * @desc    Get SES configuration status
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const status = getSESStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in status route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/email/test-connection
 * @desc    Test SES connection
 * @access  Public
 */
router.post('/test-connection', async (req, res) => {
  try {
    const isConnected = await testSESConnection();
    
    res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected ? 'SES API connection successful' : 'SES API connection failed'
      }
    });
  } catch (error) {
    console.error('Error in test-connection route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/email/send-welcome
 * @desc    Send welcome email using predefined template
 * @access  Public
 */
router.post('/send-welcome', async (req, res) => {
  try {
    const { to, name } = req.body;

    // Validate required fields
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }

    const subject = `Welcome to Lead-Com${name ? `, ${name}` : ''}!`;
    const templatePath = 'templates/welcome.html';

    // Send welcome email
    const result = await sendHTMLEmail(to, subject, templatePath, { name });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        data: {
          messageId: result.messageId,
          to: result.to,
          from: result.from,
          templatePath: result.templatePath
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

  } catch (error) {
    console.error('Error in send-welcome route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 