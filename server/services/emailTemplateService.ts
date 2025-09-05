import { storage } from '../storage';
import { graphEmailService } from './graphEmailService';
import type { EmailTemplate, InsertEmailTemplate, CompanyProfile } from '@shared/schema';

// Email configuration interface
interface EmailConfig {
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;
  senderName?: string;
  senderEmail?: string;
}

// Default email configuration (fallback values)
const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  primaryColor: '#2563eb',
  companyName: 'ATS System',
  senderName: 'HR Team',
  senderEmail: 'noreply@company.com'
};

// Get company profile data for email configuration
async function getCompanyEmailConfig(): Promise<EmailConfig> {
  try {
    const profile = await storage.getCompanyProfile();
    
    if (!profile) {
      console.warn('No company profile found, using default email config');
      return DEFAULT_EMAIL_CONFIG;
    }
    
    return {
      primaryColor: DEFAULT_EMAIL_CONFIG.primaryColor, // Use default for now
      companyName: profile.companyName,
      senderName: profile.emailFromName || profile.companyName,
      senderEmail: profile.emailFromAddress || DEFAULT_EMAIL_CONFIG.senderEmail,
      logoUrl: profile.companyLogo || undefined
    };
  } catch (error) {
    console.error('Error fetching company profile for email config:', error);
    return DEFAULT_EMAIL_CONFIG;
  }
}

// Template placeholder replacement
export function replacePlaceholders(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split('.');
    let value = data;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value !== undefined ? String(value) : match;
  });
}

// Generate modern responsive HTML email template
export function generateModernEmailHTML(
  subject: string,
  bodyContent: string,
  config: EmailConfig = DEFAULT_EMAIL_CONFIG
): string {
  const primaryColor = config.primaryColor || DEFAULT_EMAIL_CONFIG.primaryColor;
  const logoUrl = config.logoUrl;
  const companyName = config.companyName || DEFAULT_EMAIL_CONFIG.companyName;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background-color: #f8fafc;
            color: #334155;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
        }
        .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 16px;
        }
        .company-name {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 32px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #1e293b;
        }
        .body-text {
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 24px;
        }
        .body-text strong {
            color: #1e293b;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background: ${primaryColor};
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 16px 0;
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            background: ${primaryColor}cc;
            transform: translateY(-1px);
        }
        .footer {
            background: #f8fafc;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
        }
        .highlight {
            background: ${primaryColor}15;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
            margin: 20px 0;
        }
        @media (max-width: 640px) {
            .container { margin: 0; border-radius: 0; }
            .content { padding: 32px 20px; }
            .header { padding: 24px 20px; }
        }
    </style>
</head>
<body>
    <div style="padding: 24px;">
        <div class="container">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo">` : `<div class="company-name">${companyName}</div>`}
            </div>
            <div class="content">
                ${bodyContent}
            </div>
            <div class="footer">
                <div class="footer-text">
                    <strong>${companyName}</strong><br>
                    This email was sent from your recruitment management system.<br>
                    <a href="#" style="color: ${primaryColor};">Unsubscribe</a> | 
                    <a href="#" style="color: ${primaryColor};">Contact Support</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Email Template Service Class
export class EmailTemplateService {
  private config: EmailConfig;

  constructor(config: EmailConfig = DEFAULT_EMAIL_CONFIG) {
    this.config = { ...DEFAULT_EMAIL_CONFIG, ...config };
  }

  // Get or create template (no duplicates)
  async upsertTemplate(templateData: {
    key: string;
    name: string;
    subject: string;
    htmlContent: string;
    category?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate> {
    const existing = await storage.getEmailTemplateByKey(templateData.key);
    
    if (existing) {
      // Update existing template
      return await storage.updateEmailTemplate(existing.id, {
        ...templateData,
        updatedAt: new Date(),
      });
    } else {
      // Create new template
      return await storage.createEmailTemplate({
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Get template by key
  async getTemplate(key: string): Promise<EmailTemplate | null> {
    const template = await storage.getEmailTemplateByKey(key);
    return template || null;
  }

  // Send email using template
  async sendEmail(
    templateKey: string,
    to: string,
    data: Record<string, any>,
    customConfig?: Partial<EmailConfig>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = await this.getTemplate(templateKey);
      if (!template) {
        return { success: false, error: `Template '${templateKey}' not found` };
      }

      // Get company profile data for branding
      const companyConfig = await getCompanyEmailConfig();

      // Replace placeholders in subject and body
      const subject = replacePlaceholders(template.subject, data);
      const bodyContent = replacePlaceholders(template.htmlContent || '', data);

      // Use company config merged with custom config if provided
      const emailConfig = customConfig ? { ...companyConfig, ...customConfig } : companyConfig;

      // Generate HTML email
      const htmlContent = generateModernEmailHTML(subject, bodyContent, emailConfig);

      // Send via Microsoft Graph API
      const result = await graphEmailService.sendEmail({
        to,
        subject,
        body: htmlContent,
        isHtml: true,
      });

      return { success: result, messageId: undefined, error: result ? undefined : 'Failed to send email' };
    } catch (error) {
      console.error('Error sending template email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  // Initialize default templates (seed data)
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        key: 'candidate_registration',
        name: 'Candidate Registration Welcome',
        subject: 'Welcome to {{company.name}} – Your Profile is Created 🎉',
        htmlContent: `
          <div class="greeting">Hi {{candidate.name}}! 👋</div>
          <div class="body-text">
            Welcome to <strong>{{company.name}}</strong>! Your candidate profile has been successfully created.
          </div>
          <div class="highlight">
            <strong>🚀 Next Step:</strong><br>
            Please log in to your candidate portal and complete your profile by uploading your documents.
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{candidatePortal.link}}" class="cta-button">Access Your Portal</a>
          </div>
          <div class="body-text">
            If you have any questions, feel free to contact our support team.
          </div>
        `,
        category: 'onboarding',
        isActive: true,
      },
      {
        key: 'application_submission',
        name: 'Application Received Confirmation',
        subject: 'Application Received – {{job.title}} at {{company.name}}',
        htmlContent: `
          <div class="greeting">Hi {{candidate.name}},</div>
          <div class="body-text">
            Thank you for applying for the role of <strong>{{job.title}}</strong> at <strong>{{company.name}}</strong>.
          </div>
          <div class="highlight">
            <strong>📋 Application Details:</strong><br>
            Position: {{job.title}}<br>
            Company: {{company.name}}<br>
            Applied on: {{application.submittedAt}}<br>
            Reference ID: {{application.id}}
          </div>
          <div class="body-text">
            Our recruitment team will carefully review your profile and update you on the next steps within 3-5 business days.
          </div>
          <div class="body-text">
            In the meantime, you can track your application status in your candidate portal.
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{candidatePortal.link}}" class="cta-button">Track Application</a>
          </div>
        `,
        category: 'application',
        isActive: true,
      },
      {
        key: 'interview_invitation',
        name: 'Interview Invitation',
        subject: 'Interview Invitation – {{job.title}} at {{company.name}}',
        htmlContent: `
          <div class="greeting">Hi {{candidate.name}},</div>
          <div class="body-text">
            Great news! We'd like to invite you for an interview for the <strong>{{job.title}}</strong> position at <strong>{{company.name}}</strong>.
          </div>
          <div class="highlight">
            <strong>📅 Interview Details:</strong><br>
            Date: {{interview.date}}<br>
            Time: {{interview.time}}<br>
            Type: {{interview.type}}<br>
            Location: {{interview.location}}<br>
            Meeting Link: <a href="{{interview.meetingLink}}" style="color: ${this.config.primaryColor};">Join Interview</a>
          </div>
          <div class="body-text">
            Please confirm your availability by clicking the button below. If you need to reschedule, please contact us at least 24 hours in advance.
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{interview.confirmationLink}}" class="cta-button">Confirm Interview</a>
          </div>
          <div class="body-text">
            We look forward to speaking with you!
          </div>
        `,
        category: 'interview',
        isActive: true,
      },
      {
        key: 'offer_letter',
        name: 'Job Offer Letter',
        subject: 'Job Offer – {{job.title}} at {{company.name}} 🎉',
        htmlContent: `
          <div class="greeting">Congratulations {{candidate.name}}! 🎉</div>
          <div class="body-text">
            We are excited to offer you the position of <strong>{{job.title}}</strong> at <strong>{{company.name}}</strong>.
          </div>
          <div class="highlight">
            <strong>📋 Offer Summary:</strong><br>
            Position: {{job.title}}<br>
            Company: {{company.name}}<br>
            Start Date: {{offer.startDate}}<br>
            Annual Salary: {{offer.salary}}<br>
            Benefits: {{offer.benefits}}
          </div>
          <div class="body-text">
            Please find the detailed offer letter attached to this email. We would appreciate your response within 5 business days.
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{offer.acceptanceLink}}" class="cta-button">Review & Accept Offer</a>
          </div>
          <div class="body-text">
            If you have any questions about the offer, please don't hesitate to reach out to us.
          </div>
        `,
        category: 'offer',
        isActive: true,
      },
    ];

    // Create/update all default templates
    for (const template of defaultTemplates) {
      await this.upsertTemplate(template);
    }
  }
}

// Create singleton instance
export const emailTemplateService = new EmailTemplateService();

// Initialize default templates on service start
emailTemplateService.initializeDefaultTemplates().catch(console.error);