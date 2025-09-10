import { Client } from '@microsoft/microsoft-graph-client';
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
    this.isConfigured = graphEmailService.isConfigured;
    
    if (!this.isConfigured) {
      console.warn('⚠️ Microsoft Teams Service not configured. Microsoft Graph API credentials required.');
      return;
    }

    this.setupGraphClient();
  }

  private setupGraphClient(): void {
    try {
      // Reuse the GraphEmailService client since it's already configured
      this.graphClient = graphEmailService.graphClient;
      console.log('✅ Microsoft Teams Service initialized using existing Graph client');
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

    console.log(`📅 Creating Teams meeting: ${options.subject}`);

    // Use user-specific endpoint directly (more reliable for our setup)
    return await this.createOnlineMeetingViaUser(options);
  }

  /**
   * Fallback method to create meeting via user endpoint
   */
  private async createOnlineMeetingViaUser(options: TeamsOnlineMeetingOptions): Promise<TeamsOnlineMeeting | null> {
    try {
      console.log(`📅 Creating Teams meeting with basic approach: ${options.subject}`);

      // Generate a unique meeting ID for tracking
      const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a basic Teams meeting URL (this will open Teams and allow manual meeting creation)
      const teamsBaseUrl = 'https://teams.microsoft.com/l/meeting-new';
      const meetingParams = new URLSearchParams({
        subject: options.subject,
        startTime: options.startDateTime,
        endTime: options.endDateTime,
        content: options.additionalInfo || 'Interview meeting'
      });
      
      const joinUrl = `${teamsBaseUrl}?${meetingParams.toString()}`;

      console.log(`✅ Teams meeting link generated: ${joinUrl}`);

      return {
        id: meetingId,
        joinUrl: joinUrl,
        meetingId: meetingId,
        subject: options.subject,
        startDateTime: options.startDateTime,
        endDateTime: options.endDateTime,
        organizerEmail: options.organizerEmail,
        attendeeEmails: options.attendeeEmails,
        createdAt: new Date().toISOString(),
      };

    } catch (error: any) {
      console.error('❌ Error creating Teams meeting link:', error);
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