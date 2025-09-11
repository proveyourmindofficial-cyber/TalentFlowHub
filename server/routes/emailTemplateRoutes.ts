import express from 'express';
import { z } from 'zod';
import { emailTemplateService, replacePlaceholders } from '../services/emailTemplateService';
import { storage } from '../storage';
import type { EmailTemplate, InsertEmailTemplate } from '../../shared/schema';

const router = express.Router();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await storage.getEmailTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await storage.getEmailTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

// Get template by key
router.get('/key/:key', async (req, res) => {
  try {
    const template = await storage.getEmailTemplateByKey(req.params.key);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

// Create or update template (upsert by key)
const createTemplateSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  category: z.string().default('general'),
  isActive: z.boolean().default(true),
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createTemplateSchema.parse(req.body);
    const template = await emailTemplateService.upsertTemplate(validatedData);
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

// Update template by ID
router.put('/:id', async (req, res) => {
  try {
    const validatedData = createTemplateSchema.partial().parse(req.body);
    const template = await storage.updateEmailTemplate(req.params.id, validatedData);
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

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteEmailTemplate(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

// Send email using template
const sendEmailSchema = z.object({
  templateKey: z.string().min(1),
  to: z.string().email(),
  data: z.record(z.any()).default({}),
  customConfig: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    companyName: z.string().optional(),
  }).optional(),
});

router.post('/send', async (req, res) => {
  try {
    const { templateKey, to, data, customConfig } = sendEmailSchema.parse(req.body);
    
    const result = await emailTemplateService.sendEmail(templateKey, to, data, customConfig);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Email sent successfully to ${to}`,
        messageId: result.messageId 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error: any) {
    console.error('Error sending template email:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
});

// Preview template (replace placeholders with sample data)
const previewSchema = z.object({
  templateId: z.string().optional(),
  templateKey: z.string().optional(),
  data: z.record(z.any()).default({}),
  customConfig: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    companyName: z.string().optional(),
  }).optional(),
}).refine(data => data.templateId || data.templateKey, {
  message: "Either templateId or templateKey must be provided"
});

router.post('/preview', async (req, res) => {
  try {
    const { templateId, templateKey, data, customConfig } = previewSchema.parse(req.body);
    
    let template: EmailTemplate | null = null;
    if (templateId) {
      template = await storage.getEmailTemplate(templateId);
    } else if (templateKey) {
      template = await storage.getEmailTemplateByKey(templateKey);
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Replace placeholders
    const subject = replacePlaceholders(template.subject, data);
    const htmlContent = replacePlaceholders(template.htmlContent || '', data);
    
    // Generate preview with modern email template
    const { generateModernEmailHTML } = await import('../services/emailTemplateService');
    const fullHtml = generateModernEmailHTML(subject, htmlContent, customConfig);
    
    res.json({
      subject,
      htmlContent: fullHtml,
      textContent: template.textContent ? replacePlaceholders(template.textContent, data) : null,
    });
  } catch (error: any) {
    console.error('Error previewing template:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to preview template' });
    }
  }
});

// Initialize default templates
router.post('/init-defaults', async (req, res) => {
  try {
    await emailTemplateService.initializeDefaultTemplates();
    res.json({ success: true, message: 'Default templates initialized successfully' });
  } catch (error) {
    console.error('Error initializing default templates:', error);
    res.status(500).json({ error: 'Failed to initialize default templates' });
  }
});

export default router;