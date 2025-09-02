import express from 'express';
import { z } from 'zod';
import { moduleTemplateService } from '../services/moduleTemplateService';

const router = express.Router();

// Get all modules with their template status
router.get('/', async (req, res) => {
  try {
    const modules = await moduleTemplateService.getModuleTemplates();
    res.json(modules);
  } catch (error) {
    console.error('Error fetching module templates:', error);
    res.status(500).json({ error: 'Failed to fetch module templates' });
  }
});

// Initialize default template for a stage
router.post('/stages/:stageKey/initialize', async (req, res) => {
  try {
    const { stageKey } = req.params;
    const template = await moduleTemplateService.initializeStageTemplate(stageKey);
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error initializing template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle template active status
router.patch('/stages/:stageKey/toggle', async (req, res) => {
  try {
    const { stageKey } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const template = await moduleTemplateService.toggleTemplate(stageKey, isActive);
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error toggling template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get template for editing
router.get('/stages/:stageKey', async (req, res) => {
  try {
    const { stageKey } = req.params;
    const template = await moduleTemplateService.getTemplate(stageKey);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update template content
const updateTemplateSchema = z.object({
  subject: z.string().optional(),
  htmlContent: z.string().optional(),
});

router.put('/stages/:stageKey', async (req, res) => {
  try {
    const { stageKey } = req.params;
    const updates = updateTemplateSchema.parse(req.body);
    
    const template = await moduleTemplateService.updateTemplate(stageKey, updates);
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Initialize all default templates
router.post('/initialize-all', async (req, res) => {
  try {
    const results = await moduleTemplateService.initializeAllDefaults();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error initializing all templates:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;