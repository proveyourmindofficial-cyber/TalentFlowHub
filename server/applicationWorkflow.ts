import { storage } from './storage';
import { nanoid } from 'nanoid';
import type { Application, Job, Candidate } from '@shared/schema';
import { emailTemplateService } from './services/emailTemplateService';

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

      // Prepare template data for database template
      const templateData = {
        candidate: {
          name: candidate.name || 'Candidate'
        },
        job: {
          title: job.title,
          department: job.department || 'Not specified',
          location: job.location || 'Not specified',
          description: job.description || 'Job description not provided',
          requirements: job.requirements || 'Requirements not specified',
          salaryRange: job.salaryMin && job.salaryMax ? `₹${job.salaryMin} - ₹${job.salaryMax}` : 'Competitive'
        },
        company: {
          name: 'TalentFlow Solutions'
        },
        application: {
          interestedUrl,
          notInterestedUrl
        }
      };
      
      // Send email using database template through EmailTemplateService
      const emailResult = await emailTemplateService.sendEmail(
        'job_description',
        candidate.email,
        templateData
      );
      
      const emailSent = emailResult.success;

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
  ): Promise<{ success: boolean; message: string; jobDetails?: any; portalUrl?: string; alreadyResponded?: boolean }> {
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

      // Send via EmailTemplateService for consistency
      const result = await emailTemplateService.sendEmail(
        'candidate_registration', 
        candidate.email,
        {
          candidate: { name: candidate.name || 'Candidate' },
          company: { name: 'TalentFlow Solutions' },
          candidate: { portalLink: 'https://talentflow.tech/portal' }
        }
      );

      console.log(`✅ Portal welcome email sent to ${candidate.email}`);
    } catch (error) {
      console.error('Error sending portal welcome email:', error);
    }
  }


}

export const applicationWorkflowService = new ApplicationWorkflowService();