import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { EmailService } from '../services/emailService';
import { createATSEmailService, ATS_EMAIL_TEMPLATES } from '../services/atsEmailService';
import { insertEmailProviderSchema, insertEmailTemplateSchema } from '@shared/schema';

const router = Router();

// Email Providers Routes
router.get('/providers', async (req, res) => {
  try {
    const providers = await storage.getEmailProviders();
    res.json(providers);
  } catch (error) {
    console.error('Error fetching email providers:', error);
    res.status(500).json({ error: 'Failed to fetch email providers' });
  }
});

router.post('/providers', async (req, res) => {
  try {
    const validatedData = insertEmailProviderSchema.parse(req.body);
    const provider = await storage.createEmailProvider(validatedData);
    res.status(201).json(provider);
  } catch (error: any) {
    console.error('Error creating email provider:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create email provider' });
    }
  }
});

router.put('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertEmailProviderSchema.partial().parse(req.body);
    const provider = await storage.updateEmailProvider(id, validatedData);
    res.json(provider);
  } catch (error: any) {
    console.error('Error updating email provider:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update email provider' });
    }
  }
});

router.delete('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteEmailProvider(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email provider:', error);
    res.status(500).json({ error: 'Failed to delete email provider' });
  }
});

// Test email provider connection
router.post('/providers/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const emailService = await EmailService.createFromConfig(id);
    const isConnected = await emailService.testConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error testing email provider:', error);
    res.status(500).json({ error: 'Failed to test email provider connection' });
  }
});

// Email Templates Routes
router.get('/templates', async (req, res) => {
  try {
    const templates = await storage.getEmailTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const validatedData = insertEmailTemplateSchema.parse(req.body);
    const template = await storage.createEmailTemplate(validatedData);
    res.status(201).json(template);
  } catch (error: any) {
    console.error('Error creating email template:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create email template' });
    }
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
    const template = await storage.updateEmailTemplate(id, validatedData);
    res.json(template);
  } catch (error: any) {
    console.error('Error updating email template:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update email template' });
    }
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteEmailTemplate(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

// Get built-in ATS templates
router.get('/templates/ats', async (req, res) => {
  try {
    res.json(ATS_EMAIL_TEMPLATES);
  } catch (error) {
    console.error('Error fetching ATS templates:', error);
    res.status(500).json({ error: 'Failed to fetch ATS templates' });
  }
});

// Email Logs Routes
router.get('/logs', async (req, res) => {
  try {
    const logs = await storage.getEmailLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// ATS Email Workflow Routes
const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  configId: z.string().optional(),
});

router.post('/send', async (req, res) => {
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    const atsEmailService = await createATSEmailService(validatedData.configId);
    
    const result = await atsEmailService.sendCustomEmail(
      validatedData.to,
      validatedData.subject,
      validatedData.html || validatedData.text || '',
      !!validatedData.html
    );

    if (result.success) {
      res.json({ success: true, messageId: result.messageId, logId: result.logId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
});

// ATS specific email sending routes
router.post('/send/application-received/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { configId, customData } = req.body;
    
    const atsEmailService = await createATSEmailService(configId);
    const result = await atsEmailService.sendApplicationReceivedEmail(applicationId, customData);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId, logId: result.logId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending application received email:', error);
    res.status(500).json({ error: 'Failed to send application received email' });
  }
});

router.post('/send/interview-invitation/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { configId, customData } = req.body;
    
    const atsEmailService = await createATSEmailService(configId);
    const result = await atsEmailService.sendInterviewInvitationEmail(interviewId, customData);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId, logId: result.logId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending interview invitation email:', error);
    res.status(500).json({ error: 'Failed to send interview invitation email' });
  }
});

router.post('/send/offer-letter/:offerLetterId', async (req, res) => {
  try {
    const { offerLetterId } = req.params;
    const { configId, customData, attachmentBuffer } = req.body;
    
    const atsEmailService = await createATSEmailService(configId);
    const result = await atsEmailService.sendOfferLetterEmail(
      offerLetterId, 
      attachmentBuffer ? Buffer.from(attachmentBuffer, 'base64') : undefined,
      customData
    );

    if (result.success) {
      res.json({ success: true, messageId: result.messageId, logId: result.logId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending offer letter email:', error);
    res.status(500).json({ error: 'Failed to send offer letter email' });
  }
});

router.post('/send/application-rejected/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { configId, customData } = req.body;
    
    const atsEmailService = await createATSEmailService(configId);
    const result = await atsEmailService.sendApplicationRejectionEmail(applicationId, customData);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId, logId: result.logId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending application rejection email:', error);
    res.status(500).json({ error: 'Failed to send application rejection email' });
  }
});

export default router;