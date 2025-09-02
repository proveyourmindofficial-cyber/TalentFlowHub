import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import { storage } from '../storage';
import type { EmailTemplate, EmailProvider, EmailLog, InsertEmailLog } from '@shared/schema';

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'outlook' | 'gmail';
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EmailServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId?: string;
}

export class EmailService {
  private transporter: any;
  private sendGridService?: MailService;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize() {
    switch (this.config.provider) {
      case 'sendgrid':
        if (!this.config.apiKey) {
          throw new Error('SendGrid API key is required');
        }
        this.sendGridService = new MailService();
        this.sendGridService.setApiKey(this.config.apiKey);
        break;

      case 'smtp':
      case 'outlook':
      case 'gmail':
        if (!this.config.host || !this.config.username || !this.config.password) {
          throw new Error('SMTP configuration is incomplete');
        }
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port || 587,
          secure: this.config.secure || false,
          auth: {
            user: this.config.username,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        break;

      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  async sendEmail(request: SendEmailRequest): Promise<EmailServiceResult> {
    try {
      let messageId: string | undefined;
      let html = request.html;
      let text = request.text;

      // Process template if provided
      if (request.templateId && request.templateData) {
        const processedTemplate = await this.processTemplate(request.templateId, request.templateData);
        html = processedTemplate.html;
        text = processedTemplate.text;
      }

      // Send email based on provider
      if (this.config.provider === 'sendgrid' && this.sendGridService) {
        const result = await this.sendWithSendGrid({
          ...request,
          html,
          text,
        });
        messageId = result.messageId;
      } else if (this.transporter) {
        const result = await this.sendWithSMTP({
          ...request,
          html,
          text,
        });
        messageId = result.messageId;
      } else {
        throw new Error('Email service not properly initialized');
      }

      // Log the email
      const logId = await this.logEmail({
        to: Array.isArray(request.to) ? request.to.join(', ') : request.to,
        cc: request.cc ? (Array.isArray(request.cc) ? request.cc.join(', ') : request.cc) : null,
        bcc: request.bcc ? (Array.isArray(request.bcc) ? request.bcc.join(', ') : request.bcc) : null,
        subject: request.subject,
        htmlContent: html || null,
        textContent: text || null,
        templateId: request.templateId || null,
        templateData: request.templateData ? JSON.stringify(request.templateData) : null,
        provider: this.config.provider,
        messageId: messageId || null,
        status: 'sent',
        metadata: request.metadata ? JSON.stringify(request.metadata) : null,
        sentAt: new Date(),
      });

      return {
        success: true,
        messageId,
        logId,
      };
    } catch (error: any) {
      console.error('Email send error:', error);

      // Log the failed email
      await this.logEmail({
        to: Array.isArray(request.to) ? request.to.join(', ') : request.to,
        cc: request.cc ? (Array.isArray(request.cc) ? request.cc.join(', ') : request.cc) : null,
        bcc: request.bcc ? (Array.isArray(request.bcc) ? request.bcc.join(', ') : request.bcc) : null,
        subject: request.subject,
        htmlContent: request.html || null,
        textContent: request.text || null,
        templateId: request.templateId || null,
        templateData: request.templateData ? JSON.stringify(request.templateData) : null,
        provider: this.config.provider,
        messageId: null,
        status: 'failed',
        errorMessage: error.message,
        metadata: request.metadata ? JSON.stringify(request.metadata) : null,
        sentAt: new Date(),
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendWithSendGrid(request: SendEmailRequest): Promise<{ messageId?: string }> {
    if (!this.sendGridService) {
      throw new Error('SendGrid service not initialized');
    }

    const emailData: any = {
      to: request.to,
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      subject: request.subject,
      html: request.html,
      text: request.text,
    };

    if (request.cc) emailData.cc = request.cc;
    if (request.bcc) emailData.bcc = request.bcc;
    if (request.attachments) {
      emailData.attachments = request.attachments.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment',
      }));
    }

    const [response] = await this.sendGridService.send(emailData);
    return { messageId: response.headers['x-message-id'] };
  }

  private async sendWithSMTP(request: SendEmailRequest): Promise<{ messageId?: string }> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const emailData = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      subject: request.subject,
      html: request.html,
      text: request.text,
      attachments: request.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    };

    const info = await this.transporter.sendMail(emailData);
    return { messageId: info.messageId };
  }

  private async processTemplate(templateId: string, data: Record<string, any>): Promise<{ html?: string; text?: string }> {
    const template = await storage.getEmailTemplate(templateId);
    if (!template) {
      throw new Error(`Email template not found: ${templateId}`);
    }

    const html = this.replaceTemplatePlaceholders(template.htmlContent || '', data);
    const text = this.replaceTemplatePlaceholders(template.textContent || '', data);

    return { html, text };
  }

  private replaceTemplatePlaceholders(content: string, data: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private async logEmail(logData: InsertEmailLog): Promise<string> {
    const log = await storage.createEmailLog(logData);
    return log.id;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.config.provider === 'sendgrid' && this.sendGridService) {
        // SendGrid doesn't have a direct test method, so we'll just verify API key format
        return !!this.config.apiKey && this.config.apiKey.startsWith('SG.');
      } else if (this.transporter) {
        await this.transporter.verify();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  static async createFromConfig(configId?: string): Promise<EmailService> {
    let config: EmailConfig;

    if (configId) {
      // Load from database
      const provider = await storage.getEmailProvider(configId);
      if (!provider) {
        throw new Error(`Email provider configuration not found: ${configId}`);
      }
      config = {
        provider: provider.provider as any,
        host: provider.smtpHost || undefined,
        port: provider.smtpPort || undefined,
        secure: provider.smtpSecure || false,
        username: provider.smtpUsername || undefined,
        password: provider.smtpPassword || undefined,
        apiKey: provider.apiKey || undefined,
        fromEmail: provider.fromEmail,
        fromName: provider.fromName,
      };
    } else {
      // Load from environment variables
      const provider = process.env.EMAIL_PROVIDER || 'smtp';
      config = {
        provider: provider as any,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.FROM_NAME || 'ATS System',
      };
    }

    return new EmailService(config);
  }
}

// Email templates for ATS workflows
export const ATS_EMAIL_TEMPLATES = {
  APPLICATION_RECEIVED: {
    subject: 'Application Received - {{jobTitle}}',
    html: `
      <h2>Thank you for your application!</h2>
      <p>Dear {{candidateName}},</p>
      <p>We have received your application for the position of <strong>{{jobTitle}}</strong>.</p>
      <p>We will review your application and get back to you within {{reviewDays}} business days.</p>
      <p>Best regards,<br>{{companyName}} Recruiting Team</p>
    `,
    text: `
      Thank you for your application!
      
      Dear {{candidateName}},
      
      We have received your application for the position of {{jobTitle}}.
      We will review your application and get back to you within {{reviewDays}} business days.
      
      Best regards,
      {{companyName}} Recruiting Team
    `,
  },
  INTERVIEW_INVITATION: {
    subject: 'Interview Invitation - {{jobTitle}}',
    html: `
      <h2>Interview Invitation</h2>
      <p>Dear {{candidateName}},</p>
      <p>We are pleased to invite you for an interview for the position of <strong>{{jobTitle}}</strong>.</p>
      <h3>Interview Details:</h3>
      <ul>
        <li><strong>Date:</strong> {{interviewDate}}</li>
        <li><strong>Time:</strong> {{interviewTime}}</li>
        <li><strong>Type:</strong> {{interviewType}}</li>
        <li><strong>Location/Link:</strong> {{interviewLocation}}</li>
        <li><strong>Interviewer:</strong> {{interviewerName}}</li>
      </ul>
      <p>Please confirm your attendance by replying to this email.</p>
      <p>Best regards,<br>{{companyName}} Recruiting Team</p>
    `,
    text: `
      Interview Invitation
      
      Dear {{candidateName}},
      
      We are pleased to invite you for an interview for the position of {{jobTitle}}.
      
      Interview Details:
      - Date: {{interviewDate}}
      - Time: {{interviewTime}}
      - Type: {{interviewType}}
      - Location/Link: {{interviewLocation}}
      - Interviewer: {{interviewerName}}
      
      Please confirm your attendance by replying to this email.
      
      Best regards,
      {{companyName}} Recruiting Team
    `,
  },
  OFFER_LETTER: {
    subject: 'Job Offer - {{jobTitle}}',
    html: `
      <h2>Congratulations! Job Offer</h2>
      <p>Dear {{candidateName}},</p>
      <p>We are delighted to extend an offer of employment for the position of <strong>{{jobTitle}}</strong>.</p>
      <h3>Offer Details:</h3>
      <ul>
        <li><strong>Position:</strong> {{designation}}</li>
        <li><strong>Annual CTC:</strong> ₹{{ctc}}</li>
        <li><strong>Joining Date:</strong> {{joiningDate}}</li>
        <li><strong>Location:</strong> {{location}}</li>
      </ul>
      <p>Please find the detailed offer letter attached to this email.</p>
      <p>We look forward to welcoming you to our team!</p>
      <p>Best regards,<br>{{companyName}} HR Team</p>
    `,
    text: `
      Congratulations! Job Offer
      
      Dear {{candidateName}},
      
      We are delighted to extend an offer of employment for the position of {{jobTitle}}.
      
      Offer Details:
      - Position: {{designation}}
      - Annual CTC: ₹{{ctc}}
      - Joining Date: {{joiningDate}}
      - Location: {{location}}
      
      Please find the detailed offer letter attached to this email.
      
      We look forward to welcoming you to our team!
      
      Best regards,
      {{companyName}} HR Team
    `,
  },
  APPLICATION_REJECTED: {
    subject: 'Application Update - {{jobTitle}}',
    html: `
      <h2>Application Update</h2>
      <p>Dear {{candidateName}},</p>
      <p>Thank you for your interest in the position of <strong>{{jobTitle}}</strong>.</p>
      <p>After careful consideration, we have decided to move forward with other candidates who more closely match our current requirements.</p>
      <p>We encourage you to apply for future positions that match your qualifications.</p>
      <p>Thank you for your time and interest in {{companyName}}.</p>
      <p>Best regards,<br>{{companyName}} Recruiting Team</p>
    `,
    text: `
      Application Update
      
      Dear {{candidateName}},
      
      Thank you for your interest in the position of {{jobTitle}}.
      
      After careful consideration, we have decided to move forward with other candidates who more closely match our current requirements.
      
      We encourage you to apply for future positions that match your qualifications.
      
      Thank you for your time and interest in {{companyName}}.
      
      Best regards,
      {{companyName}} Recruiting Team
    `,
  },
};