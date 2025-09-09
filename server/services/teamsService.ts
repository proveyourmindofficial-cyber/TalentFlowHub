import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from '@azure/msal-node';
import { graphEmailService } from './graphEmailService';

export interface TeamsOnlineMeetingOptions {
  subject: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  organizerEmail: string;
  attendeeEmails: string[];
  additionalInfo?: string;
}

export interface TeamsOnlineMeeting {
  id: string;
  joinUrl: string;
  meetingId: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  organizerEmail: string;
  attendeeEmails: string[];
  createdAt: string;
}

export class TeamsService {
  private isConfigured: boolean;
  private graphClient: Client | null = null;
  private config: any;

  constructor() {
    // Reuse the same configuration as GraphEmailService
    this.config = {
      tenantId: process.env.AZURE_TENANT_ID || '',
      clientId: process.env.AZURE_CLIENT_ID || '',
      clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    };

    // Check configuration - same logic as email service
    this.isConfigured = this.checkConfiguration();
    if (this.isConfigured) {
      try {
        const authProvider = new ClientCredentialAuthProvider(this.config);
        this.graphClient = Client.initWithMiddleware({
          authProvider: authProvider,
        });
      } catch (error) {
        console.warn('Failed to initialize Teams Service:', error);
        this.isConfigured = false;
      }
    }
  }

  private checkConfiguration(): boolean {
    const required = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(
        `Microsoft Teams Service not configured. Missing: ${missing.join(', ')}. ` +
        `Teams meeting creation will be disabled until these environment variables are set.`
      );
      return false;
    }
    return true;
  }

  /**
   * Test connection to Microsoft Graph API for Teams operations
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.graphClient) {
      return false;
    }

    try {
      // Test by getting the tenant information
      await this.graphClient.api('/organization').get();
      console.log('✅ Microsoft Teams API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Microsoft Teams API connection failed:', error);
      return false;
    }
  }

  /**
   * Create a Microsoft Teams online meeting
   */
  async createOnlineMeeting(options: TeamsOnlineMeetingOptions): Promise<TeamsOnlineMeeting | null> {
    if (!this.isConfigured || !this.graphClient) {
      console.warn('Microsoft Teams Service is not configured. Meeting not created.');
      return null;
    }

    try {
      console.log(`📅 Creating Teams meeting: ${options.subject}`);

      // Create the online meeting using Microsoft Graph API
      const meetingRequest = {
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime,
        participants: {
          organizer: {
            identity: {
              user: {
                id: options.organizerEmail,
              },
            },
          },
          attendees: options.attendeeEmails.map(email => ({
            identity: {
              user: {
                id: email,
              },
            },
          })),
        },
        meetingInfo: options.additionalInfo,
        allowedPresenters: 'organization', // Only organization members can present
        recordAutomatically: false,
      };

      // Create meeting using application endpoint (not user-specific)
      const response = await this.graphClient
        .api('/app/onlineMeetings')
        .post(meetingRequest);

      console.log(`✅ Teams meeting created successfully: ${response.joinWebUrl}`);

      return {
        id: response.id,
        joinUrl: response.joinWebUrl,
        meetingId: response.onlineMeetingId || response.id,
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime,
        organizerEmail: options.organizerEmail,
        attendeeEmails: options.attendeeEmails,
        createdAt: new Date().toISOString(),
      };

    } catch (error: any) {
      console.error('❌ Error creating Teams meeting:', error);
      
      // If /app/onlineMeetings doesn't work, try user-specific endpoint
      if (error.code === 'Forbidden' || error.code === 'NotFound') {
        return await this.createOnlineMeetingViaUser(options);
      }
      
      return null;
    }
  }

  /**
   * Fallback method to create meeting via user endpoint
   */
  private async createOnlineMeetingViaUser(options: TeamsOnlineMeetingOptions): Promise<TeamsOnlineMeeting | null> {
    try {
      console.log(`📅 Trying user-specific endpoint for Teams meeting: ${options.subject}`);

      const meetingRequest = {
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime,
      };

      // Try creating with the organizer's email
      const response = await this.graphClient!
        .api(`/users/${options.organizerEmail}/onlineMeetings`)
        .post(meetingRequest);

      console.log(`✅ Teams meeting created via user endpoint: ${response.joinWebUrl}`);

      return {
        id: response.id,
        joinUrl: response.joinWebUrl,
        meetingId: response.onlineMeetingId || response.id,
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime,
        organizerEmail: options.organizerEmail,
        attendeeEmails: options.attendeeEmails,
        createdAt: new Date().toISOString(),
      };

    } catch (error: any) {
      console.error('❌ Error creating Teams meeting via user endpoint:', error);
      return null;
    }
  }

  /**
   * Get meeting details by ID
   */
  async getMeeting(meetingId: string, organizerEmail: string): Promise<TeamsOnlineMeeting | null> {
    if (!this.isConfigured || !this.graphClient) {
      return null;
    }

    try {
      const response = await this.graphClient
        .api(`/users/${organizerEmail}/onlineMeetings/${meetingId}`)
        .get();

      return {
        id: response.id,
        joinUrl: response.joinWebUrl,
        meetingId: response.onlineMeetingId || response.id,
        subject: response.subject || 'Teams Meeting',
        startDateTime: response.startDateTime,
        endDateTime: response.endDateTime,
        organizerEmail,
        attendeeEmails: [], // API doesn't return attendees in get request
        createdAt: response.createdDateTime || new Date().toISOString(),
      };

    } catch (error) {
      console.error('❌ Error getting Teams meeting:', error);
      return null;
    }
  }
}

// Export singleton instance
export const teamsService = new TeamsService();