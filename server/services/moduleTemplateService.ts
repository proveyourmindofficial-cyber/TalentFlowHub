import { storage } from '../storage';
import { emailTemplateService } from './emailTemplateService';

// Module and stage definitions
export const MODULE_STAGES = {
  jobs: [
    { key: 'job_posted', name: 'Job Posted', description: 'Notification when a job is posted' },
    { key: 'job_updated', name: 'Job Updated', description: 'Notification when job details are updated' },
    { key: 'job_closed', name: 'Job Closed', description: 'Notification when a job is closed' },
  ],
  candidates: [
    { key: 'candidate_registered', name: 'Candidate Registered', description: 'Welcome email when candidate profile is created' },
    { key: 'candidate_registration', name: 'Candidate Registration Welcome', description: 'Welcome email for candidate registration' },
    { key: 'profile_updated', name: 'Profile Updated', description: 'Confirmation when candidate updates their profile' },
    { key: 'document_requested', name: 'Document Requested', description: 'Request for additional documents' },
  ],
  applications: [
    { key: 'application_received', name: 'Application Received', description: 'Confirmation email when application is submitted' },
    { key: 'application_submission', name: 'Application Received Confirmation', description: 'Alternative application received template' },
    { key: 'application_shortlisted', name: 'Application Shortlisted', description: 'Notification when candidate is shortlisted' },
    { key: 'application_rejected', name: 'Application Rejected', description: 'Rejection email for unsuccessful applications' },
    { key: 'application_on_hold', name: 'Application On Hold', description: 'Notification when application is put on hold' },
  ],
  interviews: [
    { key: 'interview_scheduled', name: 'Interview Scheduled', description: 'Interview invitation with details' },
    { key: 'interview_invitation', name: 'Interview Invitation', description: 'Alternative interview invitation template' },
    { key: 'interview_reminder', name: 'Interview Reminder', description: 'Reminder email before interview' },
    { key: 'interview_rescheduled', name: 'Interview Rescheduled', description: 'Notification when interview is rescheduled' },
    { key: 'interview_cancelled', name: 'Interview Cancelled', description: 'Notification when interview is cancelled' },
    { key: 'interview_feedback_request', name: 'Feedback Request', description: 'Request feedback from interviewer' },
  ],
  offers: [
    { key: 'offer_extended', name: 'Offer Extended', description: 'Job offer letter sent to candidate' },
    { key: 'offer_letter', name: 'Job Offer Letter', description: 'Formal job offer letter template' },
    { key: 'offer_accepted', name: 'Offer Accepted', description: 'Confirmation when offer is accepted' },
    { key: 'offer_declined', name: 'Offer Declined', description: 'Follow-up when offer is declined' },
    { key: 'offer_expired', name: 'Offer Expired', description: 'Notification when offer expires' },
    { key: 'joining_reminder', name: 'Joining Reminder', description: 'Reminder before joining date' },
  ]
};

// Default template content for each stage
const DEFAULT_TEMPLATES = {
  candidate_registered: {
    subject: 'Welcome to {{company.name}} - Your Profile is Active!',
    htmlContent: `
      <div class="greeting">Hi {{candidate.name}}! 👋</div>
      <div class="body-text">
        Welcome to <strong>{{company.name}}</strong>! Your candidate profile has been successfully created in our talent network.
      </div>
      <div class="highlight">
        <strong>🚀 What's Next:</strong><br>
        • Complete your profile with additional details<br>
        • Upload your latest resume and documents<br>
        • Browse and apply for open positions
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{candidate.portalLink}}" class="cta-button">Access Your Portal</a>
      </div>
      <div class="body-text">
        We'll keep you updated on relevant job opportunities. If you have any questions, our support team is here to help!
      </div>
    `
  },
  application_received: {
    subject: 'Application Received - {{job.title}} at {{company.name}}',
    htmlContent: `
      <div class="greeting">Hi {{candidate.name}},</div>
      <div class="body-text">
        Thank you for applying for the <strong>{{job.title}}</strong> position at <strong>{{company.name}}</strong>.
      </div>
      <div class="highlight">
        <strong>📋 Application Details:</strong><br>
        Position: {{job.title}}<br>
        Department: {{job.department}}<br>
        Location: {{job.location}}<br>
        Applied on: {{application.submittedAt}}<br>
        Reference ID: {{application.referenceId}}
      </div>
      <div class="body-text">
        Our recruitment team will carefully review your application. We'll update you on the next steps within 3-5 business days.
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{application.trackingLink}}" class="cta-button">Track Application Status</a>
      </div>
    `
  },
  application_shortlisted: {
    subject: 'Great News! You\'ve Been Shortlisted - {{job.title}}',
    htmlContent: `
      <div class="greeting">Hi {{candidate.name}},</div>
      <div class="body-text">
        Excellent news! Your application for <strong>{{job.title}}</strong> at <strong>{{company.name}}</strong> has been shortlisted.
      </div>
      <div class="highlight">
        <strong>🎉 Congratulations!</strong><br>
        You've successfully passed the initial screening and we're impressed with your profile.
      </div>
      <div class="body-text">
        <strong>What happens next:</strong><br>
        • Our hiring manager will review your application in detail<br>
        • You may be contacted for a preliminary discussion<br>
        • We'll schedule interviews with the relevant team<br>
        • Expected timeline: 5-7 business days
      </div>
      <div class="body-text">
        We'll keep you updated throughout the process. Thank you for your interest in joining our team!
      </div>
    `
  },
  interview_scheduled: {
    subject: 'Interview Invitation - {{job.title}} at {{company.name}}',
    htmlContent: `
      <div class="greeting">Hi {{candidate.name}},</div>
      <div class="body-text">
        We're pleased to invite you for an interview for the <strong>{{job.title}}</strong> position.
      </div>
      <div class="highlight">
        <strong>📅 Interview Details:</strong><br>
        Date: {{interview.date}}<br>
        Time: {{interview.time}}<br>
        Type: {{interview.type}}<br>
        Duration: {{interview.duration}}<br>
        Location: {{interview.location}}<br>
        {{#if interview.meetingLink}}Meeting Link: <a href="{{interview.meetingLink}}">Join Interview</a>{{/if}}
      </div>
      <div class="body-text">
        <strong>Interview Panel:</strong><br>
        {{#each interview.interviewers}}
        • {{name}} - {{title}}<br>
        {{/each}}
      </div>
      <div class="body-text">
        Please confirm your availability and let us know if you need to reschedule at least 24 hours in advance.
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{interview.confirmationLink}}" class="cta-button">Confirm Interview</a>
      </div>
    `
  },
  offer_extended: {
    subject: 'Job Offer - {{job.title}} at {{company.name}} 🎉',
    htmlContent: `
      <div class="greeting">Congratulations {{candidate.name}}! 🎉</div>
      <div class="body-text">
        We're thrilled to offer you the position of <strong>{{job.title}}</strong> at <strong>{{company.name}}</strong>.
      </div>
      <div class="highlight">
        <strong>📋 Offer Summary:</strong><br>
        Position: {{job.title}}<br>
        Department: {{job.department}}<br>
        Start Date: {{offer.startDate}}<br>
        Annual Salary: {{offer.salary}}<br>
        Benefits: {{offer.benefits}}<br>
        Reporting to: {{offer.reportingManager}}
      </div>
      <div class="body-text">
        Please find the detailed offer letter attached. We would appreciate your response by <strong>{{offer.responseDeadline}}</strong>.
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{offer.acceptanceLink}}" class="cta-button">Review & Accept Offer</a>
      </div>
      <div class="body-text">
        If you have any questions about the offer, please don't hesitate to reach out. We're excited about the possibility of you joining our team!
      </div>
    `
  }
};

export class ModuleTemplateService {
  
  // Get all modules with their stages and template status
  async getModuleTemplates() {
    const result = {};
    
    for (const [moduleKey, stages] of Object.entries(MODULE_STAGES)) {
      result[moduleKey] = {
        name: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
        stages: []
      };
      
      for (const stage of stages) {
        const template = await storage.getEmailTemplateByKey(stage.key);
        result[moduleKey].stages.push({
          ...stage,
          hasTemplate: !!template,
          isActive: template?.isActive ?? false,
          template: template || null
        });
      }
    }
    
    return result;
  }

  // Initialize default template for a specific stage
  async initializeStageTemplate(stageKey: string) {
    const defaultTemplate = DEFAULT_TEMPLATES[stageKey];
    if (!defaultTemplate) {
      throw new Error(`No default template found for stage: ${stageKey}`);
    }

    // Find the stage info
    let stageInfo = null;
    for (const stages of Object.values(MODULE_STAGES)) {
      const found = stages.find(s => s.key === stageKey);
      if (found) {
        stageInfo = found;
        break;
      }
    }

    if (!stageInfo) {
      throw new Error(`Stage not found: ${stageKey}`);
    }

    // Create or update the template
    const templateData = {
      key: stageKey,
      name: stageInfo.name,
      subject: defaultTemplate.subject,
      htmlContent: defaultTemplate.htmlContent,
      category: this.getModuleForStage(stageKey),
      isActive: true,
    };

    return await emailTemplateService.upsertTemplate(templateData);
  }

  // Toggle template active status
  async toggleTemplate(stageKey: string, isActive: boolean) {
    const template = await storage.getEmailTemplateByKey(stageKey);
    if (!template) {
      throw new Error(`Template not found for stage: ${stageKey}`);
    }

    return await storage.updateEmailTemplate(template.id, { isActive });
  }

  // Update template content
  async updateTemplate(stageKey: string, updates: { subject?: string; htmlContent?: string }) {
    const template = await storage.getEmailTemplateByKey(stageKey);
    if (!template) {
      throw new Error(`Template not found for stage: ${stageKey}`);
    }

    return await storage.updateEmailTemplate(template.id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  // Get template content for editing
  async getTemplate(stageKey: string) {
    return await storage.getEmailTemplateByKey(stageKey);
  }

  // Initialize all default templates
  async initializeAllDefaults() {
    const results = [];
    for (const stageKey of Object.keys(DEFAULT_TEMPLATES)) {
      try {
        const template = await this.initializeStageTemplate(stageKey);
        results.push({ stageKey, success: true, template });
      } catch (error) {
        results.push({ stageKey, success: false, error: error.message });
      }
    }
    return results;
  }

  // Helper to get module for a stage
  private getModuleForStage(stageKey: string): string {
    for (const [moduleKey, stages] of Object.entries(MODULE_STAGES)) {
      if (stages.some(s => s.key === stageKey)) {
        return moduleKey;
      }
    }
    return 'general';
  }
}

export const moduleTemplateService = new ModuleTemplateService();