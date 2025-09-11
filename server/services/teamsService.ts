import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication, type ClientCredentialRequest } from '@azure/msal-node';
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
    // Check if we can reuse the GraphEmailService configuration
    this.isConfigured = this.checkConfiguration();
    
    if (!this.isConfigured) {
      console.warn('⚠️ Microsoft Teams Service not configured. Microsoft Graph API credentials required.');
      return;
    }

    this.setupGraphClient();
  }

  private setupGraphClient(): void {
    try {
      // Create our own Graph client using the same configuration
      const msalInstance = new ConfidentialClientApplication({
        auth: {
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        },
      });

      // Create custom auth provider for Teams service
      const authProvider = {
        getAccessToken: async () => {
          const clientCredentialRequest: ClientCredentialRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
          };
          const response = await msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
          return response?.accessToken || '';
        }
      };

      this.graphClient = Client.initWithMiddleware({ authProvider });
      console.log('✅ Microsoft Teams Service initialized with own Graph client');
    } catch (error: any) {
      console.error('❌ Failed to initialize Microsoft Teams Service:', error.message);
      this.isConfigured = false;
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

    console.log(`📅 Creating REAL Teams meeting: ${options.subject}`);

    try {
      // Create actual Teams meeting using Microsoft Graph API
      const meetingRequest = {
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime
      };

      console.log(`🔍 Creating REAL Teams meeting via Calendar API...`);
      
      // Create calendar event with Teams meeting using user's calendar
      const meeting = await this.graphClient
        .api(`/users/${options.organizerEmail}/events`)
        .post({
          subject: options.subject,
          start: {
            dateTime: options.startDateTime,
            timeZone: 'UTC'
          },
          end: {
            dateTime: options.endDateTime,
            timeZone: 'UTC'
          },
          isOnlineMeeting: true,
          onlineMeetingProvider: 'teamsForBusiness',
          attendees: options.attendeeEmails.map(email => ({
            emailAddress: {
              address: email,
              name: email.split('@')[0]
            }
          }))
        });

      console.log(`✅ REAL Teams meeting created! Join URL generated successfully`);

      return {
        id: meeting.id,
        joinUrl: meeting.onlineMeeting?.joinUrl || meeting.webLink,
        meetingId: meeting.id,
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime,
        organizerEmail: options.organizerEmail,
        attendeeEmails: options.attendeeEmails,
        createdAt: new Date().toISOString(),
      };

    } catch (error: any) {
      console.error('❌ Failed to create REAL Teams meeting:', error?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // HARD FAIL - no fake URLs!
      return null;
    }
  }

  // Removed fake URL generation - we only create REAL Teams meetings now

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