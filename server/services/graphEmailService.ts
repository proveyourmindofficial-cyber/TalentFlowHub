import { ConfidentialClientApplication, ClientCredentialRequest } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

interface GraphEmailConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  fromEmail?: string;
  isHtml?: boolean;
}

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  variables?: Record<string, string>;
}

class ClientCredentialAuthProvider implements AuthenticationProvider {
  private msalInstance: ConfidentialClientApplication;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: GraphEmailConfig) {
    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    });
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid (with 5-minute buffer)
    if (this.accessToken && now < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    try {
      const clientCredentialRequest: ClientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await this.msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (response?.accessToken) {
        this.accessToken = response.accessToken;
        this.tokenExpiry = response.expiresOn?.getTime() || (now + 3600000); // 1 hour fallback
        return this.accessToken;
      }

      throw new Error('Failed to acquire access token');
    } catch (error) {
      console.error('Error acquiring access token:', error);
      throw new Error(`Authentication failed: ${error}`);
    }
  }
}

export class GraphEmailService {
  private authProvider: ClientCredentialAuthProvider | null = null;
  private graphClient: Client | null = null;
  private config: GraphEmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      tenantId: process.env.AZURE_TENANT_ID || '',
      clientId: process.env.AZURE_CLIENT_ID || '',
      clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    };

    // Only initialize if all required credentials are present
    this.isConfigured = this.checkConfiguration();
    if (this.isConfigured) {
      try {
        this.authProvider = new ClientCredentialAuthProvider(this.config);
        this.graphClient = Client.initWithMiddleware({
          authProvider: this.authProvider,
        });
      } catch (error) {
        console.warn('Failed to initialize Graph Email Service:', error);
        this.isConfigured = false;
      }
    }
  }

  private checkConfiguration(): boolean {
    const required = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(
        `Microsoft Graph Email Service not configured. Missing: ${missing.join(', ')}. ` +
        `Email functionality will be disabled until these environment variables are set.`
      );
      return false;
    }
    return true;
  }

  private validateConfig(): void {
    const required = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        `Please set these in your .env file for Microsoft Graph API integration.`
      );
    }
  }

  async sendEmail(emailData: EmailMessage): Promise<boolean> {
    if (!this.isConfigured || !this.graphClient) {
      console.warn('Microsoft Graph Email Service is not configured. Email not sent.');
      return false;
    }

    try {
      const { to, subject, body, fromEmail, isHtml = false } = emailData;

      // Default from email (you can customize this based on your domain)
      const fromAddress = fromEmail || process.env.GRAPH_FROM_EMAIL || 'noreply@yourdomain.com';

      const message = {
        message: {
          subject: subject,
          body: {
            contentType: isHtml ? 'HTML' : 'Text',
            content: body,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
          from: {
            emailAddress: {
              address: fromAddress,
            },
          },
        },
      };

      // Send email using Graph API with proper endpoint for application permissions
      // Use /users/{user-id}/sendMail for application permissions instead of /me/sendMail
      const userEmail = fromAddress;
      await this.graphClient.api(`/users/${userEmail}/sendMail`).post(message);

      console.log(`Email sent successfully to: ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending email via Graph API:', error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async sendEmailWithTemplate(
    to: string,
    templateName: string,
    variables: Record<string, string> = {},
    fromEmail?: string
  ): Promise<boolean> {
    try {
      // This will be integrated with your email templates later
      const template = await this.getEmailTemplate(templateName);
      
      let subject = template.subject;
      let body = template.body;

      // Replace variables in template
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      });

      return await this.sendEmail({
        to,
        subject,
        body,
        fromEmail,
        isHtml: true,
      });
    } catch (error) {
      console.error('Error sending templated email:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.authProvider) {
      console.warn('Microsoft Graph Email Service is not configured.');
      return false;
    }

    try {
      const token = await this.authProvider.getAccessToken();
      return !!token;
    } catch (error) {
      console.error('Graph API connection test failed:', error);
      return false;
    }
  }

  private async getEmailTemplate(templateName: string): Promise<EmailTemplate> {
    // Placeholder for template integration
    // This will be connected to your database email templates later
    const defaultTemplates: Record<string, EmailTemplate> = {
      'test': {
        name: 'Test Email',
        subject: 'Test Email from ATS System',
        body: `
          <h2>Test Email</h2>
          <p>This is a test email from your ATS system using Microsoft Graph API.</p>
          <p>If you received this email, the integration is working correctly!</p>
          <br>
          <p>Best regards,<br>Your ATS System</p>
        `,
      },
      'application_received': {
        name: 'Application Received',
        subject: 'New Application: {{jobTitle}} - {{candidateName}}',
        body: `
          <h2>New Application Received</h2>
          <p><strong>Position:</strong> {{jobTitle}}</p>
          <p><strong>Candidate:</strong> {{candidateName}}</p>
          <p><strong>Email:</strong> {{candidateEmail}}</p>
          <p>Please review the application in the ATS system.</p>
        `,
      },
      'interview_scheduled': {
        name: 'Interview Scheduled',
        subject: 'Interview Scheduled - {{jobTitle}}',
        body: `
          <h2>Interview Scheduled</h2>
          <p>Dear {{candidateName}},</p>
          <p>We have scheduled an interview for the {{jobTitle}} position.</p>
          <p><strong>Date:</strong> {{interviewDate}}</p>
          <p><strong>Time:</strong> {{interviewTime}}</p>
          <p><strong>Location:</strong> {{interviewLocation}}</p>
          <p>We look forward to speaking with you!</p>
        `,
      },
    };

    const template = defaultTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    return template;
  }
}

// Export singleton instance
export const graphEmailService = new GraphEmailService();