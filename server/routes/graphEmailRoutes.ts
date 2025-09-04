import { Router } from 'express';
import { z } from 'zod';
import { graphEmailService } from '../services/graphEmailService';

const router = Router();

// Test connection endpoint
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await graphEmailService.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Microsoft Graph API connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Microsoft Graph API connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Graph API connection test error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug environment variables endpoint
router.get('/debug-env', async (req, res) => {
  try {
    const config = {
      tenant_id: process.env.AZURE_TENANT_ID ? 'configured' : 'missing',
      client_id: process.env.AZURE_CLIENT_ID ? 'configured' : 'missing',
      client_secret: process.env.AZURE_CLIENT_SECRET ? 'configured' : 'missing',
      from_email: process.env.GRAPH_FROM_EMAIL || 'not_set',
      secret_length: process.env.AZURE_CLIENT_SECRET?.length || 0,
      secret_preview: process.env.AZURE_CLIENT_SECRET ? 
        process.env.AZURE_CLIENT_SECRET.substring(0, 10) + '...' : 'not_set'
    };
    
    res.json(config);
  } catch (error: any) {
    console.error('Debug env error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get environment info'
    });
  }
});

// Send test email endpoint
const sendTestEmailSchema = z.object({
  to: z.string().email('Valid email address required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body content is required'),
});

router.post('/send-test-email', async (req, res) => {
  try {
    const { to, subject, body } = sendTestEmailSchema.parse(req.body);
    
    const result = await graphEmailService.sendEmail({
      to,
      subject,
      body,
      isHtml: true,
    });
    
    if (result) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Send test email error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send test email',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Send template email endpoint
const sendTemplateEmailSchema = z.object({
  to: z.string().email('Valid email address required'),
  templateName: z.string().min(1, 'Template name is required'),
  variables: z.record(z.any()).default({}),
});

router.post('/send-template-email', async (req, res) => {
  try {
    const { to, templateName, variables } = sendTemplateEmailSchema.parse(req.body);
    
    const result = await graphEmailService.sendEmailWithTemplate(
      to,
      templateName,
      variables
    );
    
    if (result) {
      res.json({
        success: true,
        message: `Template email sent successfully to ${to}`,
        template: templateName,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send template email',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Send template email error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send template email',
        timestamp: new Date().toISOString()
      });
    }
  }
});

export default router;