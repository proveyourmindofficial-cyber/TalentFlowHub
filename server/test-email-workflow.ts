import { storage } from './storage';
import { graphEmailService } from './services/graphEmailService';
import { emailTemplateService } from './services/emailTemplateService';

const TEST_EMAIL = 'nakkasandeepgoud@gmail.com';

// Test data for the complete workflow
const testData = {
  job: {
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Hyderabad, India',
    description: 'We are looking for a talented Senior Software Engineer to join our dynamic team.',
    requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience in React/Node.js',
    responsibilities: 'Lead development projects, mentor junior developers, architect scalable solutions',
    salaryMin: 1200000,
    salaryMax: 1800000,
    jobType: 'full_time' as const,
    status: 'active' as const,
    priority: 'high' as const,
    experienceLevel: 'Senior',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    benefits: 'Health insurance, flexible working, learning budget, performance bonus',
    applicationDeadline: new Date('2025-09-15'),
    isRemoteAvailable: true,
  },
  candidate: {
    name: 'Sandeep Nakka',
    email: TEST_EMAIL,
    phone: '+91-9876543210',
    primarySkill: 'Full Stack Development',
    totalExperience: 5.5,
    relevantExperience: 4.0,
    currentCompany: 'TechCorp Solutions',
    currentLocation: 'Hyderabad',
    preferredLocation: 'Hyderabad',
    currentCtc: 1100000,
    expectedCtc: 1500000,
    noticePeriod: '60 days',
    tentativeDoj: new Date('2025-10-01'),
    notes: 'Strong full-stack developer with React and Node.js expertise',
    status: 'Available' as const,
  },
  company: {
    name: 'TalentFlow Technologies',
    address: 'Hitech City, Hyderabad',
    website: 'https://talentflow.tech',
  }
};

// Helper function to replace template placeholders
function replacePlaceholders(template: string, data: any): string {
  let result = template;
  
  // Replace candidate placeholders
  result = result.replace(/\{\{candidate\.name\}\}/g, data.candidate?.name || 'Candidate');
  result = result.replace(/\{\{candidate\.email\}\}/g, data.candidate?.email || '');
  result = result.replace(/\{\{candidate\.portalLink\}\}/g, 'https://talentflow.tech/portal');
  
  // Replace job placeholders
  result = result.replace(/\{\{job\.title\}\}/g, data.job?.title || 'Position');
  result = result.replace(/\{\{job\.department\}\}/g, data.job?.department || 'Department');
  result = result.replace(/\{\{job\.location\}\}/g, data.job?.location || 'Location');
  
  // Replace company placeholders
  result = result.replace(/\{\{company\.name\}\}/g, data.company?.name || 'Company');
  
  // Replace application placeholders
  result = result.replace(/\{\{application\.submittedAt\}\}/g, new Date().toLocaleDateString());
  result = result.replace(/\{\{application\.referenceId\}\}/g, 'TFT-2025-001');
  result = result.replace(/\{\{application\.trackingLink\}\}/g, 'https://talentflow.tech/track/TFT-2025-001');
  
  // Replace interview placeholders
  result = result.replace(/\{\{interview\.date\}\}/g, '25th August 2025');
  result = result.replace(/\{\{interview\.time\}\}/g, '10:00 AM IST');
  result = result.replace(/\{\{interview\.type\}\}/g, 'Technical Round');
  result = result.replace(/\{\{interview\.duration\}\}/g, '90 minutes');
  result = result.replace(/\{\{interview\.location\}\}/g, 'Virtual Meeting');
  result = result.replace(/\{\{interview\.meetingLink\}\}/g, 'https://meet.google.com/abc-defg-hij');
  result = result.replace(/\{\{interview\.confirmationLink\}\}/g, 'https://talentflow.tech/confirm-interview');
  
  // Replace offer placeholders
  result = result.replace(/\{\{offer\.startDate\}\}/g, '1st October 2025');
  result = result.replace(/\{\{offer\.salary\}\}/g, '₹15,00,000 per annum');
  result = result.replace(/\{\{offer\.benefits\}\}/g, 'Health Insurance, Flexible Work, Learning Budget');
  result = result.replace(/\{\{offer\.reportingManager\}\}/g, 'Rajesh Kumar, VP Engineering');
  result = result.replace(/\{\{offer\.responseDeadline\}\}/g, '30th August 2025');
  result = result.replace(/\{\{offer\.acceptanceLink\}\}/g, 'https://talentflow.tech/accept-offer');
  
  return result;
}

// Enhanced HTML template wrapper
function wrapEmailContent(content: string, subject: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; }
        .body-text { margin-bottom: 20px; color: #5a6c7d; line-height: 1.7; }
        .highlight { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .highlight strong { color: #2c3e50; }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            font-size: 16px;
            transition: transform 0.2s ease;
        }
        .cta-button:hover { transform: translateY(-2px); }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 0; color: #6c757d; font-size: 14px; }
        .company-info { margin-top: 15px; color: #6c757d; font-size: 13px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TalentFlow Technologies</h1>
            <p>Building Tomorrow's Tech Teams</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>TalentFlow Technologies</strong></p>
            <div class="company-info">
                Hitech City, Hyderabad | www.talentflow.tech<br>
                This is an automated message from our Talent Management System
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export async function testCompleteEmailWorkflow() {
  console.log('🚀 Starting complete email workflow test...');
  
  try {
    // Step 1: Create job
    console.log('📝 Step 1: Creating job...');
    const job = await storage.createJob(testData.job);
    console.log(`✅ Job created: ${job.title} (ID: ${job.id})`);
    
    // Step 2: Create candidate
    console.log('👤 Step 2: Creating candidate...');
    const candidate = await storage.createCandidate(testData.candidate);
    console.log(`✅ Candidate created: ${candidate.name} (ID: ${candidate.id})`);
    
    // Send candidate registration email
    const candidateTemplate = await storage.getEmailTemplateByKey('candidate_registered');
    if (candidateTemplate && candidateTemplate.isActive) {
      console.log('📧 Sending candidate registration email...');
      const emailContent = replacePlaceholders(candidateTemplate.htmlContent, { candidate, company: testData.company });
      const subject = replacePlaceholders(candidateTemplate.subject, { candidate, company: testData.company });
      
      await graphEmailService.sendEmail({
        to: TEST_EMAIL,
        subject: subject,
        body: wrapEmailContent(emailContent, subject),
        isHtml: true,
      });
      console.log('✅ Candidate registration email sent');
    }
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Create application
    console.log('📋 Step 3: Creating application...');
    const application = await storage.createApplication({
      jobId: job.id,
      candidateId: candidate.id,
      stage: 'Applied',
    });
    console.log(`✅ Application created (ID: ${application.id})`);
    
    // Send application received email
    const appTemplate = await storage.getEmailTemplateByKey('application_received');
    if (appTemplate && appTemplate.isActive) {
      console.log('📧 Sending application received email...');
      const emailContent = replacePlaceholders(appTemplate.htmlContent, { 
        candidate, 
        job, 
        application, 
        company: testData.company 
      });
      const subject = replacePlaceholders(appTemplate.subject, { candidate, job, company: testData.company });
      
      await graphEmailService.sendEmail({
        to: TEST_EMAIL,
        subject: subject,
        body: wrapEmailContent(emailContent, subject),
        isHtml: true,
      });
      console.log('✅ Application received email sent');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Update application to shortlisted
    console.log('🎯 Step 4: Shortlisting application...');
    await storage.updateApplication(application.id, { stage: 'Shortlisted' });
    
    // Send shortlisted email
    const shortlistTemplate = await storage.getEmailTemplateByKey('application_shortlisted');
    if (shortlistTemplate && shortlistTemplate.isActive) {
      console.log('📧 Sending application shortlisted email...');
      const emailContent = replacePlaceholders(shortlistTemplate.htmlContent, { 
        candidate, 
        job, 
        application, 
        company: testData.company 
      });
      const subject = replacePlaceholders(shortlistTemplate.subject, { candidate, job, company: testData.company });
      
      await graphEmailService.sendEmail({
        to: TEST_EMAIL,
        subject: subject,
        body: wrapEmailContent(emailContent, subject),
        isHtml: true,
      });
      console.log('✅ Application shortlisted email sent');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Create interview
    console.log('🎤 Step 5: Scheduling interview...');
    const interview = await storage.createInterview({
      applicationId: application.id,
      interviewRound: 'Technical',
      interviewer: 'Rajesh Kumar, VP Engineering',
      mode: 'video_call',
      scheduledDate: new Date('2025-08-25T10:00:00Z'),
      notes: 'Technical round focusing on React and system design',
      status: 'Scheduled',
    });
    console.log(`✅ Interview scheduled (ID: ${interview.id})`);
    
    // Send interview scheduled email
    const interviewTemplate = await storage.getEmailTemplateByKey('interview_scheduled');
    if (interviewTemplate && interviewTemplate.isActive) {
      console.log('📧 Sending interview scheduled email...');
      const emailContent = replacePlaceholders(interviewTemplate.htmlContent, { 
        candidate, 
        job, 
        interview, 
        company: testData.company 
      });
      const subject = replacePlaceholders(interviewTemplate.subject, { candidate, job, company: testData.company });
      
      await graphEmailService.sendEmail({
        to: TEST_EMAIL,
        subject: subject,
        body: wrapEmailContent(emailContent, subject),
        isHtml: true,
      });
      console.log('✅ Interview scheduled email sent');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 6: Update interview feedback and create offer
    console.log('💼 Step 6: Creating job offer...');
    await storage.updateInterview(interview.id, { 
      feedbackResult: 'Selected',
      notes: 'Excellent technical skills, strong problem-solving ability, great cultural fit'
    });
    
    // Send offer extended email
    const offerTemplate = await storage.getEmailTemplateByKey('offer_extended');
    if (offerTemplate && offerTemplate.isActive) {
      console.log('📧 Sending job offer email...');
      const emailContent = replacePlaceholders(offerTemplate.htmlContent, { 
        candidate, 
        job, 
        company: testData.company 
      });
      const subject = replacePlaceholders(offerTemplate.subject, { candidate, job, company: testData.company });
      
      await graphEmailService.sendEmail({
        to: TEST_EMAIL,
        subject: subject,
        body: wrapEmailContent(emailContent, subject),
        isHtml: true,
      });
      console.log('✅ Job offer email sent');
    }
    
    console.log('🎉 Complete email workflow test completed successfully!');
    console.log(`📧 All emails sent to: ${TEST_EMAIL}`);
    console.log('📝 Check your inbox for the complete recruitment journey:');
    console.log('   1. Candidate Registration Welcome');
    console.log('   2. Application Received Confirmation');
    console.log('   3. Application Shortlisted Notification');
    console.log('   4. Interview Invitation');
    console.log('   5. Job Offer Letter');
    
    return {
      success: true,
      jobId: job.id,
      candidateId: candidate.id,
      applicationId: application.id,
      interviewId: interview.id,
      emailsSent: 5
    };
    
  } catch (error) {
    console.error('❌ Error in workflow test:', error);
    return { success: false, error: error.message };
  }
}