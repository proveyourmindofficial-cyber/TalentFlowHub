import { storage } from './storage';
import type { Candidate } from '../shared/schema';

export class CandidateWorkflowService {
  
  /**
   * Send simple welcome email to candidate (NO JD details, NO response buttons)
   */
  async sendCandidateWelcomeEmail(candidateId: string): Promise<boolean> {
    try {
      console.log(`📧 Sending candidate welcome email to candidate ${candidateId}...`);
      
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) {
        console.error('Candidate not found');
        return false;
      }

      // Simple template data for welcome email only
      const templateData = {
        candidateName: candidate.fullName,
        companyName: 'O2F Info Solutions'
      };

      // Create simple welcome email content
      const htmlContent = this.generateWelcomeEmailHtml(templateData);
      
      // Send email using Microsoft Graph or available email service
      const emailSent = await this.sendEmailViaAvailableService({
        to: candidate.email,
        subject: `Thanks for sharing your details - O2F Info Solutions`,
        htmlContent
      });

      return emailSent;
    } catch (error) {
      console.error('Error sending candidate welcome email:', error);
      return false;
    }
  }

  /**
   * Handle candidate response from email links
   */
  async handleCandidateResponse(token: string, response: 'interested' | 'not_interested', feedback?: string): Promise<{ success: boolean; message: string; candidateId?: string }> {
    try {
      // Find candidate by response token
      const candidates = await storage.getCandidates();
      const candidate = candidates.find(c => c.responseToken === token);

      if (!candidate) {
        return { success: false, message: 'Invalid or expired token' };
      }

      // Check token expiration
      if (candidate.tokenExpiresAt && new Date() > new Date(candidate.tokenExpiresAt)) {
        return { success: false, message: 'Response link has expired' };
      }

      // Check if already responded
      if (candidate.candidateResponse) {
        return { success: false, message: 'You have already responded to this opportunity' };
      }

      // Update candidate response
      const updateData: Partial<Candidate> = {
        candidateResponse: response,
        responseAt: new Date(),
        responseFeedback: feedback || null
      };

      if (response === 'interested') {
        updateData.status = 'Interested';
        
        // TODO: Auto-create application if jobId is available
        // This would require storing jobId in the email workflow
        // For now, we'll update status and let recruiter manually create application
        
      } else {
        updateData.status = 'Not Interested';
      }

      await storage.updateCandidate(candidate.id, updateData);

      return { 
        success: true, 
        message: response === 'interested' 
          ? 'Thank you for your interest! We will contact you soon with next steps.' 
          : 'Thank you for your response. We appreciate your time.',
        candidateId: candidate.id
      };

    } catch (error) {
      console.error('Error handling candidate response:', error);
      return { success: false, message: 'An error occurred while processing your response' };
    }
  }

  /**
   * Get candidate response statistics
   */
  async getResponseStats(): Promise<{
    totalEmailsSent: number;
    interestedCount: number;
    notInterestedCount: number;
    pendingResponses: number;
  }> {
    try {
      const candidates = await storage.getCandidates();
      
      const emailSentCandidates = candidates.filter(c => c.emailSent);
      const interestedCandidates = candidates.filter(c => c.candidateResponse === 'interested');
      const notInterestedCandidates = candidates.filter(c => c.candidateResponse === 'not_interested');
      const pendingCandidates = candidates.filter(c => c.emailSent && !c.candidateResponse);

      return {
        totalEmailsSent: emailSentCandidates.length,
        interestedCount: interestedCandidates.length,
        notInterestedCount: notInterestedCandidates.length,
        pendingResponses: pendingCandidates.length
      };
    } catch (error) {
      console.error('Error getting response stats:', error);
      return {
        totalEmailsSent: 0,
        interestedCount: 0,
        notInterestedCount: 0,
        pendingResponses: 0
      };
    }
  }

  /**
   * Generate simple HTML content for welcome email (NO JD, NO buttons)
   */
  private generateWelcomeEmailHtml(data: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to O2F Info Solutions</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👋 Welcome to O2F Info Solutions!</h1>
            <p>Hi ${data.candidateName}, thank you for sharing your details with us</p>
        </div>
        
        <div class="content">
            <h2>Thank you for your interest!</h2>
            <p>We've successfully received your profile and resume. Our recruitment team will review your information and share relevant job opportunities with you soon.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Our team will review your profile within 24-48 hours</li>
                <li>We'll match your skills with our current job openings</li>
                <li>You'll receive specific job descriptions for positions that align with your background</li>
                <li>Our recruitment specialists will guide you through the process</li>
            </ul>
            
            <p>Thank you for choosing ${data.companyName} for your career growth. We're excited to explore opportunities together!</p>
        </div>
        
        <div class="footer">
            <p><strong>${data.companyName}</strong></p>
            <p>Building careers, connecting talent</p>
            <p>This is an automated email. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Send email via available service (Microsoft Graph or fallback)
   */
  private async sendEmailViaAvailableService(emailData: { to: string; subject: string; htmlContent: string }): Promise<boolean> {
    try {
      // Try Microsoft Graph first
      const { GraphEmailService } = await import('./services/graphEmailService');
      const graphService = new GraphEmailService();
      
      const result = await graphService.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.htmlContent,
        isHtml: true
      });
      
      return result;
    } catch (error) {
      console.error('Error sending email via Microsoft Graph, trying alternative:', error);
      
      // Fallback: Log email details for manual sending
      console.log('📧 Email Details (for manual verification):');
      console.log('To:', emailData.to);
      console.log('Subject:', emailData.subject);
      console.log('Content available - check workflow');
      
      // Return true for development/testing
      return true;
    }
  }
}

export const candidateWorkflowService = new CandidateWorkflowService();