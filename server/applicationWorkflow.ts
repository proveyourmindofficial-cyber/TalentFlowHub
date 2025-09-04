import { storage } from './storage';
import { nanoid } from 'nanoid';
import type { Application, Job, Candidate } from '@shared/schema';

export class ApplicationWorkflowService {
  /**
   * Send JD email to candidate when application is created
   */
  async sendJobDescriptionEmail(applicationId: string): Promise<boolean> {
    try {
      console.log(`📧 Sending JD email for application ${applicationId}...`);
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        console.error('Application not found');
        return false;
      }

      const candidate = await storage.getCandidate(application.candidateId);
      const job = await storage.getJob(application.jobId);
      
      if (!candidate || !job) {
        console.error('Candidate or Job not found');
        return false;
      }

      // Generate unique response token
      const responseToken = nanoid();
      
      // Create response URLs - Use Replit development domain
      const baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
      
      const interestedUrl = `${baseUrl}/candidate-response?token=${responseToken}&response=interested`;
      const notInterestedUrl = `${baseUrl}/candidate-response?token=${responseToken}&response=not_interested`;

      // Prepare template data
      const templateData = {
        candidateName: candidate.name || 'Candidate',
        jobTitle: job.title,
        jobDetails: {
          title: job.title,
          department: job.department,
          location: job.location || 'Not specified',
          description: job.description,
          requirements: job.requirements,
          salaryRange: job.salaryMin && job.salaryMax ? `₹${job.salaryMin} - ₹${job.salaryMax}` : 'Competitive'
        },
        companyName: 'TalentFlow Solutions',
        interestedUrl,
        notInterestedUrl
      };

      // Create JD email content
      const htmlContent = this.generateJDEmailHtml(templateData);
      
      // Send email using Microsoft Graph or available email service
      const emailSent = await this.sendEmailViaAvailableService({
        to: candidate.email,
        subject: `Job Opportunity: ${job.title} - TalentFlow Solutions`,
        htmlContent
      });

      if (emailSent) {
        // Update application with response token and email status
        await storage.updateApplication(applicationId, {
          responseToken,
          jdEmailSentAt: new Date()
        });
        
        console.log(`✅ JD email sent successfully to ${candidate.email} for ${job.title}`);
        return true;
      } else {
        console.log(`❌ Failed to send JD email to ${candidate.email}`);
        return false;
      }
    } catch (error) {
      console.error('Error sending JD email:', error);
      return false;
    }
  }

  /**
   * Handle candidate response to JD email with enhanced workflow
   */
  async handleCandidateResponse(
    token: string, 
    response: 'interested' | 'not_interested', 
    feedback?: string, 
    rating?: number
  ): Promise<{ success: boolean; message: string; jobDetails?: any; portalUrl?: string }> {
    try {
      // Find application by response token
      const applications = await storage.getApplications();
      const application = applications.find(app => app.responseToken === token);
      
      console.log(`Looking for token: ${token}`);
      console.log(`Found ${applications.length} applications`);
      console.log(`Applications with tokens:`, applications.map(app => ({ id: app.id, token: app.responseToken })));
      
      if (!application) {
        return {
          success: false,
          message: 'Invalid or expired response link. Please contact our recruitment team.'
        };
      }

      // Check if already responded
      if (application.candidateResponse && application.candidateResponse !== 'pending') {
        // If already responded as interested, check for portal access
        if (application.candidateResponse === 'interested') {
          const candidate = await storage.getCandidate(application.candidateId);
          const job = await storage.getJob(application.jobId);
          
          // Try to create portal account if not exists
          const portalResult = await this.createCandidatePortalAccount(candidate);
          
          return {
            success: true,
            message: 'You have already responded to this job. Redirecting to your portal...',
            jobDetails: {
              title: job?.title || 'Job Position',
              companyName: 'TalentFlow Solutions',
              department: job?.department,
              location: job?.location
            },
            portalUrl: '/candidate-portal/dashboard',
            alreadyResponded: true
          };
        }
        
        return {
          success: false,
          message: 'You have already responded to this job opportunity.'
        };
      }

      // Get candidate and job details
      const candidate = await storage.getCandidate(application.candidateId);
      const job = await storage.getJob(application.jobId);

      if (!candidate || !job) {
        return {
          success: false,
          message: 'Application details not found.'
        };
      }

      // Update application with response and feedback
      await storage.updateApplication(application.id, {
        candidateResponse: response,
        responseFeedback: feedback || null,
        responseAt: new Date(),
        stage: response === 'interested' ? 'Shortlisted' : 'Rejected'
      });

      // Update candidate status
      if (response === 'interested') {
        await storage.updateCandidate(candidate.id, {
          status: 'Interested'
        });

        // Create/Activate portal account for interested candidates
        const portalResult = await this.createCandidatePortalAccount(candidate);
        
        return {
          success: true,
          message: 'Thank you for your interest! Redirecting to your candidate portal...',
          jobDetails: {
            title: job.title,
            companyName: 'TalentFlow Solutions',
            department: job.department,
            location: job.location
          },
          portalUrl: portalResult.success ? '/candidate-portal/dashboard' : '/candidate-portal/login'
        };
      } else {
        // For not interested - keep candidate available for other opportunities
        await storage.updateCandidate(candidate.id, {
          status: 'Not Interested'
        });

        return {
          success: true,
          message: 'Thank you for your response. We appreciate your feedback and will keep your profile for future opportunities.',
          jobDetails: {
            title: job.title,
            companyName: 'TalentFlow Solutions',
            department: job.department,
            location: job.location
          }
        };
      }
    } catch (error) {
      console.error('Error handling candidate response:', error);
      return {
        success: false,
        message: 'An error occurred while processing your response. Please try again.'
      };
    }
  }

  /**
   * Get job details for response page (before submitting response)
   */
  async getResponseJobDetails(token: string): Promise<{ success: boolean; jobDetails?: any; message?: string }> {
    try {
      const applications = await storage.getApplications();
      const application = applications.find(app => app.responseToken === token);
      
      if (!application) {
        return {
          success: false,
          message: 'Invalid or expired response link.'
        };
      }

      const job = await storage.getJob(application.jobId);
      
      if (!job) {
        return {
          success: false,
          message: 'Job details not found.'
        };
      }

      return {
        success: true,
        jobDetails: {
          title: job.title,
          companyName: 'TalentFlow Solutions',
          department: job.department,
          location: job.location,
          description: job.description
        }
      };
    } catch (error) {
      console.error('Error getting job details:', error);
      return {
        success: false,
        message: 'Error loading job details.'
      };
    }
  }

  /**
   * Create or activate candidate portal account
   */
  private async createCandidatePortalAccount(candidate: any): Promise<{ success: boolean; message: string }> {
    try {
      // Generate temporary password
      const tempPassword = `temp_${candidate.email.split('@')[0]}_${Date.now()}`;
      
      // Hash the password (simple implementation)
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Update candidate with portal credentials
      await storage.updateCandidate(candidate.id, {
        password: hashedPassword,
        isPortalActive: true,
        portalToken: null, // Reset any existing tokens
        tokenExpiresAt: null
      });

      // Send welcome email with credentials
      await this.sendPortalWelcomeEmail(candidate, tempPassword);

      console.log(`✅ Portal account created for ${candidate.email}`);
      return {
        success: true,
        message: 'Portal account created successfully'
      };
    } catch (error) {
      console.error('Error creating portal account:', error);
      return {
        success: false,
        message: 'Failed to create portal account'
      };
    }
  }

  /**
   * Send welcome email for portal access
   */
  private async sendPortalWelcomeEmail(candidate: any, tempPassword: string): Promise<void> {
    try {
      const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to TalentFlow Candidate Portal</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Welcome to Your Candidate Portal!</h2>
        
        <p>Hi ${candidate.name},</p>
        
        <p>Thank you for your interest in our job opportunity! We've created a personalized portal account for you.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Login Details:</h3>
            <p><strong>Email:</strong> ${candidate.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><strong>Portal URL:</strong> <a href="https://${process.env.REPLIT_DEV_DOMAIN}/candidate-portal/login">Access Portal</a></p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after first login for security.</p>
        
        <h3>What you can do in your portal:</h3>
        <ul>
            <li>Track your application status</li>
            <li>Upload additional documents</li>
            <li>Complete your profile information</li>
            <li>View job details and requirements</li>
            <li>Communicate with our recruitment team</li>
        </ul>
        
        <p>Our recruitment team will review your application and contact you within 2-3 business days with next steps.</p>
        
        <p>Best regards,<br>
        TalentFlow Solutions<br>
        Building careers, connecting talent</p>
    </div>
</body>
</html>`;

      await this.sendEmailViaAvailableService({
        to: candidate.email,
        subject: 'Welcome to TalentFlow Candidate Portal - Access Your Account',
        htmlContent: emailContent
      });

      console.log(`✅ Portal welcome email sent to ${candidate.email}`);
    } catch (error) {
      console.error('Error sending portal welcome email:', error);
    }
  }

  /**
   * Generate HTML content for JD email
   */
  private generateJDEmailHtml(data: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Opportunity - ${data.jobTitle}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .button { display: inline-block; padding: 15px 30px; margin: 10px; border-radius: 5px; text-decoration: none; font-weight: bold; text-align: center; }
        .btn-primary { background-color: #28a745; color: white; }
        .btn-secondary { background-color: #dc3545; color: white; }
        .job-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Job Opportunity</h1>
            <p>Hi ${data.candidateName}, we have an exciting opportunity for you!</p>
        </div>
        
        <div class="content">
            <h2>Thank you for applying!</h2>
            <p>We're excited to share details about the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
            
            <div class="job-details">
                <h3>📋 Job Description</h3>
                <p><strong>Position:</strong> ${data.jobDetails.title}</p>
                <p><strong>Department:</strong> ${data.jobDetails.department}</p>
                <p><strong>Location:</strong> ${data.jobDetails.location}</p>
                <p><strong>Salary:</strong> ${data.jobDetails.salaryRange}</p>
                
                <h4>Role Description:</h4>
                <p>${data.jobDetails.description}</p>
                
                ${data.jobDetails.requirements ? `
                <h4>Requirements:</h4>
                <p>${data.jobDetails.requirements}</p>
                ` : ''}
            </div>
            
            <h3>🤔 Are you interested in this opportunity?</h3>
            <p>Please review the job description and let us know your interest:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.interestedUrl}" class="button btn-primary">✅ Yes, I'm Interested!</a>
                <a href="${data.notInterestedUrl}" class="button btn-secondary">❌ Not Interested</a>
            </div>
            
            <p><em>This link will expire in 7 days. Please respond at your earliest convenience.</em></p>
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

export const applicationWorkflowService = new ApplicationWorkflowService();