import { storage } from './storage';
import { nanoid } from 'nanoid';
import type { Application, Job, Candidate, CompanyProfile } from '@shared/schema';
import { emailTemplateService } from './services/emailTemplateService';

export class ApplicationWorkflowService {
  /**
   * Get company data for email templates
   */
  private async getCompanyData(): Promise<{ name: string }> {
    try {
      const profile = await storage.getCompanyProfile();
      return {
        name: profile?.companyName || 'ATS System'
      };
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return { name: 'ATS System' };
    }
  }
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
        company: await this.getCompanyData(),
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
          const portalResult = await this.createPortalAccount(candidate.id);
          
          return {
            success: true,
            message: 'You have already responded to this job. Redirecting to your portal...',
            jobDetails: {
              title: job?.title || 'Job Position',
              companyName: (await this.getCompanyData()).name,
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
        const portalResult = await this.createPortalAccount(candidate.id);
        
        return {
          success: true,
          message: 'Thank you for your interest! Redirecting to your candidate portal...',
          jobDetails: {
            title: job.title,
            companyName: (await this.getCompanyData()).name,
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
            companyName: (await this.getCompanyData()).name,
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
          companyName: (await this.getCompanyData()).name,
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
  async createPortalAccount(candidateId: string): Promise<{ success: boolean; message: string }> {
    const candidate = await storage.getCandidate(candidateId);
    if (!candidate) {
      return { success: false, message: 'Candidate not found' };
    }
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
   * Send welcome email for portal access with login credentials
   */
  private async sendPortalWelcomeEmail(candidate: any, tempPassword: string): Promise<void> {
    try {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000';
      const portalUrl = `${baseUrl}/candidate-portal/login`;
      
      // Send email using proper credentials template
      const result = await emailTemplateService.sendEmail(
        'candidate_portal_credentials', 
        candidate.email,
        {
          candidate: { 
            name: candidate.name || 'Candidate',
            email: candidate.email,
            tempPassword: tempPassword
          },
          company: await this.getCompanyData(),
          portalUrl: portalUrl
        }
      );

      if (result.success) {
        console.log(`✅ Portal credentials email sent to ${candidate.email}`);
        console.log(`   Login: ${candidate.email} / ${tempPassword}`);
      } else {
        console.error(`❌ Failed to send portal credentials email to ${candidate.email}`);
      }
    } catch (error) {
      console.error('Error sending portal welcome email:', error);
    }
  }


  // 🎯 ============================================
  // INTERVIEW WORKFLOW AUTOMATION ENGINE
  // ============================================

  /**
   * 📋 DECLARATIVE WORKFLOW RULES TABLE
   * Maps interview feedback to next application stage and actions
   */
  private static readonly INTERVIEW_WORKFLOW_RULES = {
    'L1': {
      'Selected': { 
        applicationStage: 'L2 Scheduled', 
        candidateStatus: 'Interviewing',
        nextStageInfo: 'L2 Technical Round'
      },
      'Rejected': { 
        applicationStage: 'Rejected', 
        candidateStatus: 'Rejected'
      },
      'On Hold': { 
        applicationStage: 'On Hold', 
        candidateStatus: 'Interviewing'
      },
      'No Show': { 
        applicationStage: 'No Show', 
        candidateStatus: 'Available'
      }
    },
    'L2': {
      'Selected': { 
        applicationStage: 'Selected', 
        candidateStatus: 'Interviewing',
        nextStageInfo: 'HR Discussion'
      },
      'Rejected': { 
        applicationStage: 'Rejected', 
        candidateStatus: 'Rejected'
      },
      'On Hold': { 
        applicationStage: 'On Hold', 
        candidateStatus: 'Interviewing'
      },
      'No Show': { 
        applicationStage: 'No Show', 
        candidateStatus: 'Available'
      }
    },
    'HR': {
      'Selected': { 
        applicationStage: 'Offer Released', 
        candidateStatus: 'Offered'
      },
      'Rejected': { 
        applicationStage: 'Rejected', 
        candidateStatus: 'Rejected'
      },
      'On Hold': { 
        applicationStage: 'On Hold', 
        candidateStatus: 'Interviewing'
      },
      'No Show': { 
        applicationStage: 'No Show', 
        candidateStatus: 'Available'
      }
    },
    'Final': {
      'Selected': { 
        applicationStage: 'Selected', 
        candidateStatus: 'Interviewing'
      },
      'Rejected': { 
        applicationStage: 'Rejected', 
        candidateStatus: 'Rejected'
      },
      'On Hold': { 
        applicationStage: 'On Hold', 
        candidateStatus: 'Interviewing'
      }
    }
  } as const;

  /**
   * 🎯 Process Interview Feedback Workflow
   * This is the CORE automation engine that drives candidate progression
   */
  async processInterviewFeedback(interviewId: string, userId?: string): Promise<boolean> {
    try {
      console.log(`🎯 Processing interview feedback workflow for interview ${interviewId}`);
      
      const interview = await storage.getInterview(interviewId);
      if (!interview) {
        console.error('Interview not found');
        return false;
      }

      const application = await storage.getApplication(interview.applicationId);
      if (!application) {
        console.error('Application not found');
        return false;
      }

      const candidate = await storage.getCandidate(application.candidateId);
      const job = await storage.getJob(application.jobId);

      // Get workflow rule for this round and feedback result
      const rules = ApplicationWorkflowService.INTERVIEW_WORKFLOW_RULES;
      const rule = rules[interview.interviewRound]?.[interview.feedbackResult];
      
      if (!rule) {
        console.warn(`No workflow rule found for ${interview.interviewRound} + ${interview.feedbackResult}`);
        return false;
      }

      // 📊 Apply Status Changes Atomically
      await Promise.all([
        storage.updateApplication(interview.applicationId, { 
          stage: rule.applicationStage as any 
        }),
        storage.updateCandidate(application.candidateId, { 
          status: rule.candidateStatus as any 
        })
      ]);

      // 📧 Send Progress Email Notifications  
      if (candidate?.email && interview.feedbackResult === 'Selected' && rule.nextStageInfo) {
        try {
          const emailData = {
            candidate: { name: candidate.name || 'Candidate' },
            job: { 
              title: job?.title || 'Position',
              company: (await this.getCompanyData()).name
            },
            application: {},
            interview: { 
              round: interview.interviewRound,
              nextStage: rule.nextStageInfo,
              result: interview.feedbackResult
            }
          };

          await emailTemplateService.sendEmail(
            'application_shortlisted',
            candidate.email,
            emailData
          );

          console.log(`📧 Progress email sent to ${candidate.email}: ${interview.interviewRound} → ${rule.nextStageInfo}`);
        } catch (emailError) {
          console.error(`Failed to send progress email:`, emailError);
        }
      }

      // 📧 Send Rejection Email
      else if (candidate?.email && interview.feedbackResult === 'Rejected') {
        try {
          const emailData = {
            candidate: { name: candidate.name || 'Candidate' },
            job: { 
              title: job?.title || 'Position',
              company: (await this.getCompanyData()).name
            },
            application: {},
            interview: { 
              round: interview.interviewRound,
              result: interview.feedbackResult
            }
          };

          await emailTemplateService.sendEmail(
            'application_rejected',
            candidate.email,
            emailData
          );

          console.log(`📧 Rejection email sent to ${candidate.email}`);
        } catch (emailError) {
          console.error(`Failed to send rejection email:`, emailError);
        }
      }

      console.log(`✅ Interview workflow processed: ${interview.interviewRound} ${interview.feedbackResult} → App: ${rule.applicationStage}, Candidate: ${rule.candidateStatus}`);
      return true;

    } catch (error) {
      console.error('Error processing interview feedback workflow:', error);
      return false;
    }
  }

  /**
   * 🗓️ Process Interview Scheduled Event
   * Updates application stage when interviews are scheduled
   */
  async processInterviewScheduled(interviewId: string, userId?: string): Promise<boolean> {
    try {
      const interview = await storage.getInterview(interviewId);
      if (!interview) return false;

      const application = await storage.getApplication(interview.applicationId);
      if (!application) return false;

      // Update application stage to reflect scheduling
      const scheduledStage = `${interview.interviewRound} Scheduled`;
      await Promise.all([
        storage.updateApplication(interview.applicationId, { 
          stage: scheduledStage as any 
        }),
        storage.updateCandidate(application.candidateId, { 
          status: 'Interviewing' as any 
        })
      ]);

      console.log(`📅 Interview scheduled: ${interview.interviewRound} → Application: ${scheduledStage}, Candidate: Interviewing`);
      return true;

    } catch (error) {
      console.error('Error processing interview scheduled event:', error);
      return false;
    }
  }

  /**
   * 💼 Process Offer Created Event
   */
  async processOfferCreated(applicationId: string, userId?: string): Promise<boolean> {
    try {
      const application = await storage.getApplication(applicationId);
      if (!application) return false;

      await Promise.all([
        storage.updateApplication(applicationId, { 
          stage: 'Offer Released' as any 
        }),
        storage.updateCandidate(application.candidateId, { 
          status: 'Offered' as any 
        })
      ]);

      console.log(`💼 Offer created → Application: Offer Released, Candidate: Offered`);
      return true;

    } catch (error) {
      console.error('Error processing offer created event:', error);
      return false;
    }
  }

  /**
   * 🎉 Process Candidate Joined Event
   */
  async processCandidateJoined(applicationId: string, userId?: string): Promise<boolean> {
    try {
      const application = await storage.getApplication(applicationId);
      if (!application) return false;

      await Promise.all([
        storage.updateApplication(applicationId, { 
          stage: 'Joined' as any 
        }),
        storage.updateCandidate(application.candidateId, { 
          status: 'Joined' as any 
        })
      ]);

      console.log(`🎉 Candidate joined → Application: Joined, Candidate: Joined`);
      return true;

    } catch (error) {
      console.error('Error processing candidate joined event:', error);
      return false;
    }
  }

}

export const applicationWorkflowService = new ApplicationWorkflowService();