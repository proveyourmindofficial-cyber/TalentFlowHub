import { EmailService, ATS_EMAIL_TEMPLATES, type SendEmailRequest, type EmailServiceResult } from './emailService';

export { ATS_EMAIL_TEMPLATES };
import { storage } from '../storage';
import type { Application, Interview, OfferLetter, Candidate, Job } from '@shared/schema';

export interface ATSEmailContext {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  reviewDays?: number;
  interviewDate?: string;
  interviewTime?: string;
  interviewType?: string;
  interviewLocation?: string;
  interviewerName?: string;
  designation?: string;
  ctc?: number;
  joiningDate?: string;
  location?: string;
  [key: string]: any;
}

export class ATSEmailService {
  private emailService: EmailService;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  async sendApplicationReceivedEmail(applicationId: string, customData?: Partial<ATSEmailContext>): Promise<EmailServiceResult> {
    const context = await this.getApplicationContext(applicationId);
    const mergedContext = { ...context, ...customData };

    return await this.emailService.sendEmail({
      to: mergedContext.candidateEmail,
      subject: this.replaceTemplate(ATS_EMAIL_TEMPLATES.APPLICATION_RECEIVED.subject, mergedContext),
      html: this.replaceTemplate(ATS_EMAIL_TEMPLATES.APPLICATION_RECEIVED.html, mergedContext),
      text: this.replaceTemplate(ATS_EMAIL_TEMPLATES.APPLICATION_RECEIVED.text, mergedContext),
      metadata: {
        type: 'application_received',
        applicationId,
        candidateId: context.candidateId,
        jobId: context.jobId,
      },
    });
  }

  async sendInterviewInvitationEmail(interviewId: string, customData?: Partial<ATSEmailContext>): Promise<EmailServiceResult> {
    const context = await this.getInterviewContext(interviewId);
    const mergedContext = { ...context, ...customData };

    return await this.emailService.sendEmail({
      to: mergedContext.candidateEmail,
      subject: this.replaceTemplate(ATS_EMAIL_TEMPLATES.INTERVIEW_INVITATION.subject, mergedContext),
      html: this.replaceTemplate(ATS_EMAIL_TEMPLATES.INTERVIEW_INVITATION.html, mergedContext),
      text: this.replaceTemplate(ATS_EMAIL_TEMPLATES.INTERVIEW_INVITATION.text, mergedContext),
      metadata: {
        type: 'interview_invitation',
        interviewId,
        candidateId: context.candidateId,
        jobId: context.jobId,
        applicationId: context.applicationId,
      },
    });
  }

  async sendOfferLetterEmail(offerLetterId: string, attachmentBuffer?: Buffer, customData?: Partial<ATSEmailContext>): Promise<EmailServiceResult> {
    const context = await this.getOfferLetterContext(offerLetterId);
    const mergedContext = { ...context, ...customData };

    const request: SendEmailRequest = {
      to: mergedContext.candidateEmail,
      subject: this.replaceTemplate(ATS_EMAIL_TEMPLATES.OFFER_LETTER.subject, mergedContext),
      html: this.replaceTemplate(ATS_EMAIL_TEMPLATES.OFFER_LETTER.html, mergedContext),
      text: this.replaceTemplate(ATS_EMAIL_TEMPLATES.OFFER_LETTER.text, mergedContext),
      metadata: {
        type: 'offer_letter',
        offerLetterId,
        candidateId: context.candidateId,
        jobId: context.jobId,
        applicationId: context.applicationId,
      },
    };

    // Add PDF attachment if provided
    if (attachmentBuffer) {
      request.attachments = [{
        filename: `Offer_Letter_${mergedContext.candidateName.replace(/\s+/g, '_')}.pdf`,
        content: attachmentBuffer,
        contentType: 'application/pdf',
      }];
    }

    return await this.emailService.sendEmail(request);
  }

  async sendApplicationRejectionEmail(applicationId: string, customData?: Partial<ATSEmailContext>): Promise<EmailServiceResult> {
    const context = await this.getApplicationContext(applicationId);
    const mergedContext = { ...context, ...customData };

    return await this.emailService.sendEmail({
      to: mergedContext.candidateEmail,
      subject: this.replaceTemplate(ATS_EMAIL_TEMPLATES.APPLICATION_REJECTED.subject, mergedContext),
      html: this.replaceTemplate(ATS_EMAIL_TEMPLATES.APPLICATION_REJECTED.html, mergedContext),
      text: this.replaceTemplate(ATS_EMAIL_TEMPLATES.APPLICATION_REJECTED.text, mergedContext),
      metadata: {
        type: 'application_rejected',
        applicationId,
        candidateId: context.candidateId,
        jobId: context.jobId,
      },
    });
  }

  async sendCustomEmail(
    to: string | string[],
    subject: string,
    content: string,
    isHtml: boolean = true,
    metadata?: Record<string, any>
  ): Promise<EmailServiceResult> {
    const request: SendEmailRequest = {
      to,
      subject,
      metadata,
    };

    if (isHtml) {
      request.html = content;
    } else {
      request.text = content;
    }

    return await this.emailService.sendEmail(request);
  }

  private async getApplicationContext(applicationId: string): Promise<ATSEmailContext & { candidateId: string; jobId: string; applicationId: string }> {
    const application = await storage.getApplicationWithRelations(applicationId);
    if (!application) {
      throw new Error(`Application not found: ${applicationId}`);
    }

    return {
      candidateId: application.candidateId,
      jobId: application.jobId,
      applicationId: application.id,
      candidateName: application.candidate?.name || 'Candidate',
      candidateEmail: application.candidate?.email || '',
      jobTitle: application.job?.title || 'Position',
      companyName: process.env.COMPANY_NAME || 'Our Company',
      reviewDays: 5,
    };
  }

  private async getInterviewContext(interviewId: string): Promise<ATSEmailContext & { candidateId: string; jobId: string; applicationId: string }> {
    const interview = await storage.getInterviewWithRelations(interviewId);
    if (!interview) {
      throw new Error(`Interview not found: ${interviewId}`);
    }

    const application = await storage.getApplicationWithRelations(interview.applicationId);
    if (!application) {
      throw new Error(`Application not found for interview: ${interview.applicationId}`);
    }

    return {
      candidateId: interview.candidateId,
      jobId: application.jobId,
      applicationId: interview.applicationId,
      candidateName: interview.candidate?.name || 'Candidate',
      candidateEmail: interview.candidate?.email || '',
      jobTitle: application.job?.title || 'Position',
      companyName: process.env.COMPANY_NAME || 'Our Company',
      interviewDate: interview.scheduledDate.toLocaleDateString(),
      interviewTime: interview.scheduledDate.toLocaleTimeString(),
      interviewType: interview.type,
      interviewLocation: interview.location || 'TBD',
      interviewerName: interview.interviewer || 'Hiring Team',
    };
  }

  private async getOfferLetterContext(offerLetterId: string): Promise<ATSEmailContext & { candidateId: string; jobId: string; applicationId: string }> {
    const offerLetter = await storage.getOfferLetterWithRelations(offerLetterId);
    if (!offerLetter) {
      throw new Error(`Offer letter not found: ${offerLetterId}`);
    }

    const application = await storage.getApplicationWithRelations(offerLetter.applicationId);
    if (!application) {
      throw new Error(`Application not found for offer letter: ${offerLetter.applicationId}`);
    }

    return {
      candidateId: offerLetter.candidateId,
      jobId: application.jobId,
      applicationId: offerLetter.applicationId,
      candidateName: offerLetter.candidate?.name || 'Candidate',
      candidateEmail: offerLetter.candidate?.email || '',
      jobTitle: application.job?.title || 'Position',
      companyName: process.env.COMPANY_NAME || 'Our Company',
      designation: offerLetter.designation,
      ctc: offerLetter.ctc,
      joiningDate: offerLetter.joiningDate.toLocaleDateString(),
      location: application.job?.location || 'Office',
    };
  }

  private replaceTemplate(template: string, context: ATSEmailContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(context[key] || match);
    });
  }
}

// Factory function to create ATS Email Service
export async function createATSEmailService(configId?: string): Promise<ATSEmailService> {
  const emailService = await EmailService.createFromConfig(configId);
  return new ATSEmailService(emailService);
}