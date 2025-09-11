import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertCandidateSchema, insertApplicationSchema, insertInterviewSchema, insertOfferLetterSchema, insertClientSchema, insertClientRequirementSchema, insertCompanyProfileSchema, insertCustomRoleSchema, insertNotificationSchema, insertActivityLogSchema, insertFeedbackSchema, insertDepartmentSchema, type InsertUser } from "@shared/schema";
import { ActivityLogger } from './activityLogger';
import { z } from "zod";
import { validateCandidateTypeFields, uanNumberSchema, aadhaarNumberSchema, linkedinUrlSchema } from "./validationUtils";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// Teams service will be imported dynamically when needed
// emailRoutes removed - functionality consolidated into EmailTemplateService
import graphEmailRoutes from "./routes/graphEmailRoutes";
import emailTemplateRoutes from "./routes/emailTemplateRoutes";
import moduleTemplateRoutes from "./routes/moduleTemplateRoutes";
import { graphEmailService } from './services/graphEmailService';
import { emailTemplateService } from './services/emailTemplateService';
import { authenticateUser, requireRole } from "./auth";
import bcrypt from "bcrypt";
// Remove html-pdf-node import due to compatibility issues

// UNIFIED USER INVITATION SYSTEM - Clean implementation
async function sendPasswordSetupEmail(email: string, firstName: string, lastName: string, setupUrl: string, roleName: string = 'Team Member') {
  try {
    const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px; border-radius: 8px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 28px; margin: 0; color: #2c3e50;">Welcome to {{company.name}}</h1>
    <p style="font-size: 16px; margin: 10px 0; color: #6c757d;">Set up your account to get started</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #e9ecef;">
    <h2 style="font-size: 22px; margin: 0 0 15px 0; color: #2c3e50;">Hello ${firstName},</h2>
    <p style="font-size: 16px; margin: 0; color: #495057; line-height: 1.6;">
      You have been invited to join {{company.name}} as <strong style="color: #0d6efd;">${roleName}</strong>.<br>
      Please set up your password to activate your account.
    </p>
  </div>

  <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
    <h3 style="text-align: center; color: #2c3e50; font-size: 18px; margin: 0 0 20px 0;">Account Setup</h3>
    
    <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #0d6efd;">
      <span style="color: #495057;">1. Click "Set Up Password" below</span>
    </div>
    
    <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;">
      <span style="color: #495057;">2. Create your secure password</span>
    </div>
    
    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #17a2b8;">
      <span style="color: #495057;">3. Login and explore the platform</span>
    </div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${setupUrl}" 
       style="display: inline-block; background: #28a745; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 6px; text-align: center;">
      Set Up Password
    </a>
    <p style="margin: 15px 0 0 0; font-size: 12px; color: #6c757d;">
      This link will expire in 24 hours for security
    </p>
  </div>

  <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #e9ecef;">
    <p style="color: #495057; font-size: 14px; margin: 0;">
      Welcome to our professional recruitment platform
    </p>
  </div>

  <div style="text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
    <p style="color: #6c757d; font-size: 12px; margin: 0 0 8px 0;">
      Need assistance? Reply to this email for support
    </p>
    <p style="color: #2c3e50; font-weight: bold; font-size: 14px; margin: 0;">
      {{company.name}} Team
    </p>
  </div>
  
</div>`;

    console.log(`📧 Sending password setup email to: ${email}`);
    
    // Replace company placeholders in email
    const companyData = await getCompanyData();
    const processedSubject = '🔐 Set Up Your {{company.name}} Account Password'.replace(/\{\{company\.name\}\}/g, companyData.name);
    const processedBody = emailBody.replace(/\{\{company\.name\}\}/g, companyData.name);
    
    await graphEmailService.sendEmail({
      to: email,
      subject: processedSubject,
      body: processedBody,
      isHtml: true,
    });
    
    console.log(`✅ Email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send password setup email to ${email}:`, error);
    return false;
  }
}

// Password reset email function
async function sendPasswordResetEmail(email: string, firstName: string, lastName: string, resetUrl: string) {
  try {
    const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px; border-radius: 8px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 28px; margin: 0; color: #2c3e50;">Password Reset Request</h1>
    <p style="font-size: 16px; margin: 10px 0; color: #6c757d;">Reset your {{company.name}} password</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #e9ecef;">
    <h2 style="font-size: 22px; margin: 0 0 15px 0; color: #2c3e50;">Hello ${firstName},</h2>
    <p style="font-size: 16px; margin: 0; color: #495057; line-height: 1.6;">
      You requested a password reset for your {{company.name}} account.<br>
      Click the button below to create a new password.
    </p>
  </div>

  <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
    <h3 style="text-align: center; color: #2c3e50; font-size: 18px; margin: 0 0 20px 0;">Reset Your Password</h3>
    
    <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #dc3545;">
      <span style="color: #495057;">1. Click "Reset Password" below</span>
    </div>
    
    <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #fd7e14;">
      <span style="color: #495057;">2. Enter your new secure password</span>
    </div>
    
    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;">
      <span style="color: #495057;">3. Login with your new password</span>
    </div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" 
       style="display: inline-block; background: #dc3545; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 6px; text-align: center;">
      Reset Password
    </a>
    <p style="margin: 15px 0 0 0; font-size: 12px; color: #6c757d;">
      This link will expire in 24 hours for security
    </p>
  </div>

  <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #ffeaa7;">
    <p style="color: #856404; font-size: 14px; margin: 0;">
      <strong>Important:</strong> If you didn't request this reset, please ignore this email. Your account remains secure.
    </p>
  </div>

  <div style="text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
    <p style="color: #6c757d; font-size: 12px; margin: 0 0 8px 0;">
      Need assistance? Reply to this email for support
    </p>
    <p style="color: #2c3e50; font-weight: bold; font-size: 14px; margin: 0;">
      {{company.name}} Team
    </p>
  </div>
  
</div>`;

    console.log(`📧 Sending password reset email to: ${email}`);
    
    // Replace company placeholders in email
    const companyData = await getCompanyData();
    const processedSubject = '🔑 Reset Your {{company.name}} Password'.replace(/\{\{company\.name\}\}/g, companyData.name);
    const processedBody = emailBody.replace(/\{\{company\.name\}\}/g, companyData.name);
    
    await graphEmailService.sendEmail({
      to: email,
      subject: processedSubject,
      body: processedBody,
      isHtml: true,
    });
    
    console.log(`✅ Password reset email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    return false;
  }
}

// Get company data for email placeholders
async function getCompanyData() {
  try {
    const profile = await storage.getCompanyProfile();
    return {
      name: profile?.companyName || 'O2F Info Solutions',
      email: profile?.email || 'hr@o2finfosolutions.com',
      website: profile?.website || 'https://o2finfosolutions.com',
      phone: profile?.phone || '+91-40-4855-4855',
      address: profile?.industry || 'Hyderabad, India',
      tagline: 'Building Excellence in IT Solutions'
    };
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return { 
      name: 'O2F Info Solutions',
      email: 'hr@o2finfosolutions.com',
      website: 'https://o2finfosolutions.com',
      phone: '+91-40-4855-4855',
      address: 'Hyderabad, India',
      tagline: 'Building Excellence in IT Solutions'
    };
  }
}

// Email helper function for all modules
async function sendModuleEmail(templateKey: string, recipientEmail: string, data: any, senderEmail?: string) {
  try {
    const template = await storage.getEmailTemplateByKey(templateKey);
    if (!template || !template.isActive || !recipientEmail) {
      return false;
    }

    console.log(`📧 Sending ${templateKey} email to ${recipientEmail}...`);
    
    // Replace placeholders in template
    let emailContent = template.htmlContent;
    let subject = template.subject;
    
    // Replace candidate placeholders
    if (data.candidate && emailContent) {
      emailContent = emailContent.replace(/\{\{candidate\.name\}\}/g, data.candidate.name || 'Candidate');
      subject = subject.replace(/\{\{candidate\.name\}\}/g, data.candidate.name || 'Candidate');
      emailContent = emailContent.replace(/\{\{candidate\.portalLink\}\}/g, 'https://talentflow.tech/portal');
    }
    
    // Replace job placeholders
    if (data.job && emailContent) {
      emailContent = emailContent.replace(/\{\{job\.title\}\}/g, data.job.title || 'Position');
      emailContent = emailContent.replace(/\{\{job\.department\}\}/g, data.job.department || 'Department');
      emailContent = emailContent.replace(/\{\{job\.location\}\}/g, data.job.location || 'Location');
      subject = subject.replace(/\{\{job\.title\}\}/g, data.job.title || 'Position');
    }
    
    // Replace company placeholders
    const companyData = await getCompanyData();
    if (emailContent) {
      emailContent = emailContent.replace(/\{\{company\.name\}\}/g, companyData.name);
      emailContent = emailContent.replace(/\{\{company\.email\}\}/g, companyData.email);
      emailContent = emailContent.replace(/\{\{company\.website\}\}/g, companyData.website);
      emailContent = emailContent.replace(/\{\{company\.phone\}\}/g, companyData.phone);
      emailContent = emailContent.replace(/\{\{company\.address\}\}/g, companyData.address);
      emailContent = emailContent.replace(/\{\{company\.tagline\}\}/g, companyData.tagline);
      subject = subject.replace(/\{\{company\.name\}\}/g, companyData.name);
    }
    
    // Replace application placeholders
    if (data.application && emailContent) {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000';
      emailContent = emailContent.replace(/\{\{application\.submittedAt\}\}/g, new Date().toLocaleDateString());
      emailContent = emailContent.replace(/\{\{application\.referenceId\}\}/g, `O2F-${Date.now()}`);
      emailContent = emailContent.replace(/\{\{application\.trackingLink\}\}/g, `${baseUrl}/candidate-portal/applications`);
      emailContent = emailContent.replace(/\{\{candidatePortal\.link\}\}/g, `${baseUrl}/candidate-portal/dashboard`);
    }
    
    // Replace interview placeholders
    if (data.interview && emailContent) {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000';
      emailContent = emailContent.replace(/\{\{interview\.date\}\}/g, new Date(data.interview.scheduledDate).toLocaleDateString());
      emailContent = emailContent.replace(/\{\{interview\.time\}\}/g, new Date(data.interview.scheduledDate).toLocaleTimeString());
      emailContent = emailContent.replace(/\{\{interview\.type\}\}/g, data.interview.interviewRound || 'Interview');
      emailContent = emailContent.replace(/\{\{interview\.meetingLink\}\}/g, data.interview.meetingLink || '#');
      emailContent = emailContent.replace(/\{\{interview\.location\}\}/g, data.interview.location || 'TBD');
      emailContent = emailContent.replace(/\{\{interview\.confirmationLink\}\}/g, data.interview.confirmationLink || `${baseUrl}/candidate-portal`);
      emailContent = emailContent.replace(/\{\{interview\.duration\}\}/g, '60 minutes');
    }
    
    // Replace interviewer placeholders
    if (data.interviewer && emailContent) {
      emailContent = emailContent.replace(/\{\{interviewer\.name\}\}/g, data.interviewer.name || 'Interviewer');
      emailContent = emailContent.replace(/\{\{interviewer\.email\}\}/g, data.interviewer.email || 'interviewer@company.com');
      subject = subject.replace(/\{\{interviewer\.name\}\}/g, data.interviewer.name || 'Interviewer');
    }
    
    // Replace creator placeholders (for confirmation emails)
    if (data.creator && emailContent) {
      emailContent = emailContent.replace(/\{\{creator\.firstName\}\}/g, data.creator.firstName || data.creator.username || 'User');
      emailContent = emailContent.replace(/\{\{creator\.name\}\}/g, `${data.creator.firstName || ''} ${data.creator.lastName || ''}`.trim() || data.creator.username || 'User');
      subject = subject.replace(/\{\{creator\.firstName\}\}/g, data.creator.firstName || data.creator.username || 'User');
    }
    
    // Replace offer placeholders
    if (data.offer && emailContent) {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000';
      emailContent = emailContent.replace(/\{\{offer\.startDate\}\}/g, new Date().toLocaleDateString());
      emailContent = emailContent.replace(/\{\{offer\.salary\}\}/g, '₹15,00,000 per annum');
      emailContent = emailContent.replace(/\{\{offer\.benefits\}\}/g, 'Health Insurance, Flexible Work, Learning Budget');
      emailContent = emailContent.replace(/\{\{offer\.reportingManager\}\}/g, 'Reporting Manager');
      emailContent = emailContent.replace(/\{\{offer\.responseDeadline\}\}/g, new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString());
      emailContent = emailContent.replace(/\{\{offer\.acceptanceLink\}\}/g, `${baseUrl}/offer-response/${data.application?.id || 'offer'}`);
    }
    
    // Wrap in professional HTML template with dynamic company branding
    const wrappedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; }
        .body-text { margin-bottom: 20px; color: #5a6c7d; line-height: 1.7; }
        .highlight { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .highlight strong { color: #2c3e50; }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
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
            <h1>${companyData.name}</h1>
            <p>${companyData.tagline}</p>
        </div>
        <div class="content">
            ${emailContent}
        </div>
        <div class="footer">
            <p><strong>${companyData.name}</strong></p>
            <div class="company-info">
                ${companyData.address} | ${companyData.website}<br>
                📧 ${companyData.email} | 📞 ${companyData.phone}<br>
                This is an automated message from our Talent Management System
            </div>
        </div>
    </div>
</body>
</html>`;
    
    await graphEmailService.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: wrappedContent,
      isHtml: true,
      senderEmail: senderEmail
    });
    
    console.log(`✅ ${templateKey} email sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error(`Error sending ${templateKey} email:`, error);
    return false;
  }
}

// Helper function to generate offer letter HTML
function generateOfferLetterHTML(offerData: any) {
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    
    const ordinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${month} ${ordinal(day)}, ${year}`;
  };

  const formatINR = (amount: number): string => {
    return amount.toLocaleString('en-IN');
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offer Letter - ${offerData.candidate.name}</title>
  <style>
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 11pt; 
      line-height: 1.6; 
      margin: 0; 
      padding: 0;
      color: black;
    }
    .container { 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 1in; 
      background: white;
    }
    .header-date { 
      text-align: right; 
      margin-bottom: 2em; 
    }
    .address { 
      margin: 2em 0; 
    }
    .title { 
      font-size: 14pt; 
      font-weight: bold; 
      text-align: center; 
      margin: 2em 0 1em 0; 
    }
    .greeting { 
      margin: 2em 0 1em 0; 
    }
    .congratulations { 
      font-weight: bold; 
      text-align: center; 
      margin: 1em 0; 
    }
    .paragraph { 
      margin: 1em 0; 
      text-align: justify; 
    }
    .salary-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 2em 0;
      border: 1px solid black;
    }
    .salary-table th, .salary-table td { 
      border: 1px solid black; 
      padding: 8px; 
      text-align: left; 
    }
    .salary-table th { 
      background-color: #f0f0f0; 
      font-weight: bold;
    }
    .salary-table td:nth-child(2), .salary-table td:nth-child(3) { 
      text-align: right; 
    }
    .total-row { 
      font-weight: bold; 
      background-color: #f9f9f9; 
    }
    .signature-section { 
      margin-top: 3em; 
      display: flex; 
      justify-content: space-between; 
    }
    .signature-left, .signature-right { 
      width: 45%; 
    }
    .signature-line { 
      border-bottom: 1px solid black; 
      width: 200px; 
      height: 50px; 
      margin: 2em 0 0.5em 0; 
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header-date">
      ${formatDate(offerData.offerDate || offerData.createdAt)}
    </div>

    <!-- Candidate Address -->
    <div class="address">
      ${offerData.candidate.name}<br/>
      ${offerData.candidate.currentLocation || 'Bangalore'}
    </div>

    <!-- Title -->
    <div class="title">Offer of Employment</div>

    <!-- Greeting -->
    <div class="greeting">Dear ${offerData.candidate.name},</div>

    <!-- Congratulations -->
    <div class="congratulations">Congratulations!!!</div>

    <!-- Main Content - Complete Template -->
    <p>Please refer to the interview and discussions you had with us recently.</p>

    <p>
      We are pleased to offer you the position of <strong>${offerData.designation}</strong> at <strong>O2F Info Solutions Pvt Ltd</strong> and the joining date would be <strong>${formatDate(offerData.joiningDate)}</strong>.
    </p>

    <p>
      Your employment will be based at Hyderabad, however, based on the position's requirements, you may be required to work anywhere in India and this offer of employment will take effect from the date of your reporting. This offer is valid up to <strong>${formatDate(offerData.joiningDate)}</strong> subject to your joining on or before the given joining date.
    </p>

    <p>
      Your Annual CTC will be Rs. ${formatINR(Number(offerData.ctc))}. This CTC Includes Conveyance and all other allowances and benefits as applicable to you as detailed in Annexure-1. The break-up of your CTC is indicated in the attached annexure.
    </p>

    <p>
      You will be covered under Group Medical Insurance for a sum of Rs.5,00,000. Under Group Medical Insurance, Hospitalization cover can be utilized only by the employee and the benefit is not extended to any other family members.
    </p>

    <p>
      Your compensation details are strictly confidential, and you may discuss it only with the authorized personnel of HR in case of any clarification. It is our hope that your acceptance of this offer will be just the beginning of a mutually rewarding relationship.
    </p>

    <p>
      Salary Payments will be made by 05th of the next calendar month subject to attendance. Net take home salary is subject to Income Tax and other statutory deductions and will be paid into the Bank Account of the Employee. For operating convenience, we encourage all our employees to open a salary account with HDFC Bank after joining the employment with us.
    </p>

    <p>
      <strong>Note:</strong> Alternatively, you can share us your HDFC Bank Account details, if you are already holding an account with HDFC Bank. you are free to provide us your other Bank Account details (For NEFT Transfers) other than HDFC Bank if you do not want to have HDFC Bank as your Banking Partner.
    </p>

    <p>
      You will receive a monthly pay statement detailing gross pay and deductions. Any subsequent changes to your salary will be highlighted on that statement. Income tax liability (TDS) or any other statutory deduction arising as a result of your employment, it should be borne by the employee and company in no event be liable for payment of those taxes and statutory deductions in addition to your CTC either during the period of your employment or after cessation of your employment with O2F.
    </p>

    <p>
      Your employment with O2F Info solutions Pvt Ltd will be governed by the following Terms and conditions. You will also be governed by current O2F's rules, regulations, internal policies, and practices which are subject to change from time to time.
    </p>

    <!-- Complete Annexure-1 Table -->
    <div style="margin: 20px 0;">
      <div style="font-weight: bold; margin-bottom: 10px; text-align: center;">
        Annexure-1: Salary Structure
      </div>
      
      <table class="salary-table">
        <thead>
          <tr>
            <th style="text-align: left;">Particulars</th>
            <th style="text-align: right;">Per Month (Rs.)</th>
            <th style="text-align: right;">Per Year (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="3" style="font-weight: bold; background-color: #f9f9f9;">A. Salary Components:</td></tr>
          <tr>
            <td>Basic Salary</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.basicSalary) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.basicSalary))}</td>
          </tr>
          <tr>
            <td>HRA</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.hra) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.hra))}</td>
          </tr>
          <tr>
            <td>Conveyance</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.conveyanceAllowance) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.conveyanceAllowance))}</td>
          </tr>
          <tr>
            <td>Medical</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.medicalAllowance) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.medicalAllowance))}</td>
          </tr>
          <tr>
            <td>Flexi Pay</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.flexiPay) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.flexiPay))}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f9f9f9;">
            <td>Total A</td>
            <td style="text-align: right;">${formatINR(Math.round((Number(offerData.basicSalary) + Number(offerData.hra) + Number(offerData.conveyanceAllowance) + Number(offerData.medicalAllowance) + Number(offerData.flexiPay)) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.basicSalary) + Number(offerData.hra) + Number(offerData.conveyanceAllowance) + Number(offerData.medicalAllowance) + Number(offerData.flexiPay))}</td>
          </tr>
          
          <tr><td colspan="3" style="font-weight: bold; background-color: #f9f9f9;">B. Company Contribution:</td></tr>
          <tr>
            <td>Employer PF</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.employerPf) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.employerPf))}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f9f9f9;">
            <td>Total B</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.employerPf) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.employerPf))}</td>
          </tr>
          
          <tr style="font-weight: bold; background-color: #e8f4fd;">
            <td>Total Salary (A + B)</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.ctc) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.ctc))}</td>
          </tr>
          
          <tr><td colspan="3" style="font-weight: bold; background-color: #f9f9f9;">C. Deductions:</td></tr>
          <tr>
            <td>Employee PF</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.employeePf) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.employeePf))}</td>
          </tr>
          <tr>
            <td>Professional Tax</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.professionalTax) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.professionalTax))}</td>
          </tr>
          <tr>
            <td>Group Medical Insurance</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.insurance) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.insurance))}</td>
          </tr>
          <tr>
            <td>Income Tax</td>
            <td style="text-align: right;">${formatINR(Math.round(Number(offerData.incomeTax) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.incomeTax))}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f9f9f9;">
            <td>Total Deductions</td>
            <td style="text-align: right;">${formatINR(Math.round((Number(offerData.employeePf) + Number(offerData.professionalTax) + Number(offerData.insurance) + Number(offerData.incomeTax)) / 12))}</td>
            <td style="text-align: right;">${formatINR(Number(offerData.employeePf) + Number(offerData.professionalTax) + Number(offerData.insurance) + Number(offerData.incomeTax))}</td>
          </tr>
          
          <tr style="font-weight: bold; background-color: #d4edda;">
            <td>Net Monthly Salary</td>
            <td style="text-align: right;">${formatINR(Math.round((Number(offerData.ctc) - (Number(offerData.employeePf) + Number(offerData.professionalTax) + Number(offerData.insurance) + Number(offerData.incomeTax))) / 12))}</td>
            <td style="text-align: right;">--</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Terms and Conditions -->
    <div style="font-weight: bold; margin: 14px 0 6px;">Location of work</div>
    <p>
      Your employment will be based in Bangalore and the company reserves the right to Transfer your services to anywhere in India and Overseas or utilize your expertise to any of our projects based in India and Overseas. Relocation or Compensatory allowance applicable to a specific Project / location as per Company's policy will be paid to you.
    </p>

    <div style="font-weight: bold; margin: 14px 0 6px;">Duties and Responsibilities</div>
    <p>
      The Company reserves the right, at any time during your employment, with reasonable notice, to require you to undertake any reasonable, alternative duties which are within your capabilities. You shall not indulge actively/or cause any act likely to affect the discipline that is expected from every employee of this organization or associate with any such activity which may amount to an act subversive of discipline.
    </p>

    <div style="font-weight: bold; margin: 14px 0 6px;">Notice Period / Termination</div>
    <p>
      At the time of tendering resignation, you shall be required to give 60 Days' notice in writing. Your resignation will become effective and final upon acceptance by the Management not withstanding that the communication of the acceptance of resignation has reached you or not. However, it will be the prerogative of the Management to accept or not your resignation. In case of any misconduct on your part, Non-Performance of your services can be terminated with immediate effect without assigning any reason and without giving to you any notice or notice pay in lieu of notice or any compensation in lieu thereof.
    </p>

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-left">
        <div>Employee Acceptance:</div>
        <div class="signature-line"></div>
        <div>${offerData.candidate.name}</div>
        <div>Date: _______________</div>
      </div>
      <div class="signature-right">
        <div>For O2F Info Solutions Pvt Ltd</div>
        <div class="signature-line"></div>
        <div>${offerData.hrName}</div>
        <div>HR Manager</div>
        <div>Date: ${formatDate(offerData.offerDate || offerData.createdAt)}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes

  app.post('/api/auth/logout', async (req, res) => {
    // Clear the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }
    res.json({ message: "Logged out successfully" });
  });

  // User invitation system - send invitation email
  app.post('/api/auth/invite-user', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { email, firstName, lastName, department, roleId } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email address required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      
      // If user exists and already has a proper password, they don't need invitation
      if (existingUser && existingUser.passwordHash && existingUser.passwordHash.length > 20) {
        return res.status(400).json({ message: 'User already has an account and can login directly' });
      }
      
      // If user exists but no proper password (old invite), allow resend
      if (existingUser) {
        console.log(`📧 Resending invitation to existing user: ${email}`);
        
        // Generate new invitation token
        const inviteToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
        
        // Update user with new invitation token
        await storage.updateUser(existingUser.id, {
          passwordHash: inviteToken, // Replace old token
          isActive: false // Still inactive until password is set
        } as Partial<InsertUser>);
        
        // Create the setup URL
        const setupUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/setup-password?token=${inviteToken}`;
        
        // Update/create user journey for resent invitation
        try {
          await storage.createUserJourneyState({
            userId: existingUser.id,
            currentStage: 'invitation_resent',
            invitationSent: true,
            invitationSentAt: new Date(),
            adminActionTaken: 'invitation_resent',
            adminActionAt: new Date()
          });
          console.log(`🔄 User journey updated for resent invitation: ${email}`);
        } catch (journeyError) {
          console.error('Failed to update user journey:', journeyError);
        }

        // Send password setup email
        const emailSent = await sendPasswordSetupEmail(
          email, 
          firstName || existingUser.firstName || email.split('@')[0], 
          lastName || existingUser.lastName || 'User', 
          setupUrl,
          'Team Member'
        );
        
        return res.json({
          message: 'Invitation resent successfully',
          inviteToken: inviteToken,
          setupUrl: setupUrl
        });
      }

      // Generate invitation token
      const inviteToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');

      // Create user with invitation token (no password yet)
      const user = await storage.createUser({
        username: email,
        email: email,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || 'User',
        roleId: null, // Don't set roleId directly - use custom role assignment
        department: department || 'Staff',
        isActive: false, // Will be activated when password is set
        passwordHash: inviteToken, // Temporary store invitation token
      } as InsertUser);

      // Assign custom role if provided (for invited users)
      if (roleId) {
        const currentUser = req.user as any;
        await storage.assignCustomRoleToUser(user.id, roleId, currentUser?.id || user.id);
        console.log(`🔗 Custom role ${roleId} assigned to invited user ${user.id}`);
      }

      console.log(`📧 User invitation created: ${email}`);

      // Create user journey to track the invitation flow
      try {
        await storage.createUserJourneyState({
          userId: user.id,
          currentStage: 'invited',
          invitationSent: true,
          invitationSentAt: new Date(),
          emailDelivered: false,
          passwordSetupCompleted: false,
          adminActionTaken: 'user_created',
          adminActionAt: new Date()
        });
        console.log(`🔄 User journey initialized for: ${email}`);
      } catch (journeyError) {
        console.error('Failed to create user journey:', journeyError);
      }

      // Create the setup URL
      const setupUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/setup-password?token=${inviteToken}`;
      
      // Send password setup email using unified system
      const emailSent = await sendPasswordSetupEmail(
        email, 
        firstName || email.split('@')[0], 
        lastName || 'User', 
        setupUrl,
        'Team Member'
      );

      // Create notification for admin about user invitation
      const currentUser = req.user as any;
      if (currentUser) {
        await storage.createNotification({
          userId: currentUser.id,
          title: "User Invitation Sent",
          message: `Invitation email sent to ${email}. User can now set up their account and login.`,
          type: "success",
          actionUrl: "/settings/user-management"
        });
      }

      res.json({
        message: 'Invitation sent successfully',
        inviteToken: inviteToken,
        setupUrl: setupUrl
      });
    } catch (error) {
      console.error('Invitation error:', error);
      res.status(500).json({ message: 'Failed to send invitation' });
    }
  });

  // Password setup for invited users
  app.post('/api/auth/setup-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      // Find user by invitation token
      const users = await storage.getUsers();
      const user = users.find(u => u.passwordHash === token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired invitation token' });
      }

      // Hash the password and activate account
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);

      await storage.updateUser(user.id, {
        passwordHash: hashedPassword,
        isActive: true
      } as Partial<InsertUser>);

      console.log(`✅ Password set for user: ${user.email}`);

      // Create notification for successful account activation
      await storage.createNotification({
        userId: user.id,
        title: "Welcome to O2F ATS!",
        message: "Your account has been successfully activated. You can now access all features.",
        type: "success",
        actionUrl: "/dashboard"
      });

      res.json({
        message: 'Password set successfully. You can now login.',
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Password setup error:', error);
      res.status(500).json({ message: 'Failed to set password' });
    }
  });


  // Secure login with password authentication
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password using bcrypt - secure comparison
      const bcrypt = await import('bcrypt');
      const isValidPassword = user.passwordHash && await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Set the session properly for the authenticateUser middleware
      if (req.session) {
        (req.session as any).userId = user.id;
      }
      
      // Fetch user's role information
      let roleDetails = null;
      try {
        const userRole = await storage.getUserCustomRole(user.id);
        if (userRole) {
          const roleData = await storage.getCustomRole(userRole.customRoleId);
          if (roleData) {
            roleDetails = { 
              id: roleData.id, 
              name: roleData.name, 
              color: roleData.color 
            };
          }
        }
      } catch (roleError) {
        console.warn('Failed to fetch user role:', roleError);
      }
      
      // Create a simple session token for the frontend
      const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
      
      console.log(`✅ Login successful for: ${user.email} (Role: ${roleDetails?.name || 'No role'})`);
      
      // Include role information in user object
      const userWithRole = {
        ...user,
        role: roleDetails?.name || null,
        roleName: roleDetails?.name || null,
        roleId: roleDetails?.id || null,
        roleColor: roleDetails?.color || null
      };
      
      res.json({ 
        user: userWithRole,
        token,
        message: 'Login successful' 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Forgot password - request reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email address required' });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
      }

      // Generate password reset token
      const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      // Store reset token in passwordHash temporarily (will be overwritten when password is reset)
      await storage.updateUser(user.id, {
        passwordHash: `RESET:${resetToken}` // Prefix to distinguish from regular passwords
      } as Partial<InsertUser>);

      // Create the reset URL
      const resetUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/reset-password?token=${resetToken}`;
      
      // Send password reset email using unified system
      const emailSent = await sendPasswordResetEmail(
        email, 
        user.firstName || email.split('@')[0], 
        user.lastName || 'User', 
        resetUrl
      );

      res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Decode token to get email
      const decoded = Buffer.from(token, 'base64').toString();
      const [email, timestamp] = decoded.split(':');
      
      // Check if token is expired (24 hours)
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (currentTime - tokenTime > oneDay) {
        return res.status(400).json({ message: 'Reset token has expired' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }

      // Verify the reset token matches what we stored
      if (!user.passwordHash || !user.passwordHash.startsWith('RESET:')) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const storedToken = user.passwordHash.replace('RESET:', '');
      if (storedToken !== token) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update user with new password and activate account
      await storage.updateUser(user.id, {
        passwordHash: hashedPassword,
        isActive: true
      } as Partial<InsertUser>);

      console.log(`🔑 Password reset successful for: ${user.email}`);

      res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // User management routes - Protected with authentication and role-based access
  app.get('/api/users', authenticateUser, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get users with their custom roles - This is what the frontend actually calls
  app.get('/api/users-with-custom-roles', authenticateUser, async (req, res) => {
    try {
      const users = await storage.getUsersWithCustomRoles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users with custom roles:", error);
      res.status(500).json({ message: "Failed to fetch users with custom roles" });
    }
  });

  // Get potential interviewers (users who can conduct interviews)
  app.get('/api/users/interviewers', authenticateUser, async (req, res) => {
    try {
      const users = await storage.getUsersWithCustomRoles();
      const interviewers = [];
      
      // Define roles that can conduct interviews
      const interviewerRoles = ['Super Admin', 'Recruiter', 'HR', 'Director', 'Account Manager'];
      
      for (const user of users) {
        if (!user.isActive) continue; // Skip inactive users
        
        if (user.customRole && interviewerRoles.includes(user.customRole.name)) {
          interviewers.push({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.username,
            email: user.email,
            department: user.department,
            role: user.customRole.name,
            roleColor: user.customRole.color
          });
        }
      }
      
      // Sort by role priority and then by name
      const rolePriority: { [key: string]: number } = { 'Super Admin': 1, 'Director': 2, 'Account Manager': 3, 'HR': 4, 'Recruiter': 5 };
      interviewers.sort((a, b) => {
        const priorityDiff = (rolePriority[a.role] || 6) - (rolePriority[b.role] || 6);
        if (priorityDiff !== 0) return priorityDiff;
        return a.name.localeCompare(b.name);
      });
      
      console.log(`📋 Found ${interviewers.length} potential interviewers:`, interviewers.map(i => `${i.name} (${i.role})`));
      res.json(interviewers);
    } catch (error) {
      console.error("Error fetching interviewers:", error);
      res.status(500).json({ message: "Failed to fetch interviewers" });
    }
  });

  app.post('/api/users', authenticateUser, async (req, res) => {
    try {
      const { username, email, firstName, lastName, customRoleId, department, isActive } = req.body;
      
      // Validate required fields
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, first name, and last name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Validate custom role if provided
      if (customRoleId) {
        const customRole = await storage.getCustomRole(customRoleId);
        if (!customRole) {
          return res.status(400).json({ message: "Invalid custom role ID" });
        }
      }

      // Create user  
      const user = await storage.createUser({
        username: username || email,
        email,
        firstName,
        lastName,
        roleId: null, // Don't set roleId directly - use custom role assignment
        department: department || 'Recruitment',
        isActive: isActive !== undefined ? isActive : true
      });

      // Assign custom role if provided (this properly links the role)
      if (customRoleId) {
        await storage.assignCustomRoleToUser(user.id, customRoleId, user.id);
        console.log(`🔗 Custom role ${customRoleId} assigned to user ${user.id}`);
      }

      // Note: This is direct user creation endpoint, not invitation
      // For invitations, use /api/auth/invite-user instead
      console.log(`👤 User created directly: ${email}`);
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id/role', authenticateUser, async (req, res) => {
    try {
      const { customRoleId } = req.body;
      
      // Validate custom role if provided
      if (customRoleId) {
        const customRole = await storage.getCustomRole(customRoleId);
        if (!customRole) {
          return res.status(400).json({ message: "Invalid custom role ID" });
        }
      }

      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use proper custom role assignment methods
      if (customRoleId) {
        await storage.assignCustomRoleToUser(req.params.id, customRoleId, existingUser.id);
      } else {
        // Remove custom role if no role provided
        await storage.removeCustomRoleFromUser(req.params.id);
      }

      // Get updated user data with custom role
      const updatedUser = await storage.getUser(req.params.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Set user password (admin only)
  app.put('/api/users/:id/password', authenticateUser, async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // For now, store password as plain text (should use bcrypt in production)
      await storage.updateUserPassword(req.params.id, password);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Generate random password for user (admin only)
  app.post('/api/users/:id/generate-password', authenticateUser, async (req, res) => {
    try {
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate secure random password
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const password = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      
      await storage.updateUserPassword(req.params.id, password);
      
      res.json({ password, message: "Password generated successfully" });
    } catch (error) {
      console.error("Error generating password:", error);
      res.status(500).json({ message: "Failed to generate password" });
    }
  });

  // Endpoint that the frontend is actually calling
  app.put('/api/users/:id/custom-role', authenticateUser, async (req, res) => {
    try {
      const { customRoleId } = req.body;
      
      // Validate custom role if provided
      if (customRoleId) {
        const customRole = await storage.getCustomRole(customRoleId);
        if (!customRole) {
          return res.status(400).json({ message: "Invalid custom role ID" });
        }
      }

      const existingUser = await storage.getUser(req.params.id);

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use proper custom role assignment methods
      if (customRoleId) {
        await storage.assignCustomRoleToUser(req.params.id, customRoleId, existingUser.id);
      } else {
        // Remove custom role if no role provided
        await storage.removeCustomRoleFromUser(req.params.id);
      }

      // Get updated user data with custom role
      const updatedUser = await storage.getUser(req.params.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user custom role:", error);
      res.status(500).json({ message: "Failed to update user custom role" });
    }
  });

  // REMOVED OLD RESEND INVITATION ENDPOINT - Now handled by frontend calling /api/auth/invite-user

  app.delete('/api/users/:id', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(req.params.id);
      
      // Create notification for user deletion
      await storage.createNotification({
        userId: req.user.id,
        title: "User Deleted",
        message: `User ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email}) has been deleted from the system.`,
        type: "warning",
        actionUrl: "/settings/user-management"
      });
      
      console.log(`🗑️ User deleted: ${existingUser.email} by ${req.user.email}`);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Jobs routes - Protected with role-based access
  app.get('/api/jobs', authenticateUser, async (req, res) => {
    try {
      // Get user's permissions and filter data accordingly
      const user = req.user as any;
      let jobs;
      
      if (user.email === 'itsupport@o2finfosolutions.com') {
        // Super Admin can see all jobs
        jobs = await storage.getJobs();
      } else {
        // Other roles can only see jobs they created or are assigned to
        jobs = await storage.getJobsByUserAccess(user.id);
      }
      
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/jobs/:id', authenticateUser, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post('/api/jobs', authenticateUser, async (req, res) => {
    try {
      const user = req.user as any;
      const jobData = insertJobSchema.parse({
        ...req.body,
        createdById: user.id // Set creator for data ownership
      });
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.put('/api/jobs/:id', authenticateUser, async (req, res) => {
    try {
      const jobData = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(req.params.id, jobData);
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete('/api/jobs/:id', authenticateUser, async (req, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Bulk delete jobs
  app.post('/api/jobs/bulk-delete', authenticateUser, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty job IDs array" });
      }
      
      await storage.bulkDeleteJobs(ids);
      
      res.json({ message: `${ids.length} job${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting jobs:", error);
      res.status(500).json({ message: "Failed to delete jobs" });
    }
  });

  // Candidates routes
  // Dropdown management routes
  app.get("/api/dropdowns/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const options = await storage.getDropdownOptions(category);
      res.json(options);
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
      res.status(500).json({ message: "Failed to fetch dropdown options" });
    }
  });

  app.post("/api/dropdowns", async (req, res) => {
    try {
      const optionData = req.body;
      const newOption = await storage.createDropdownOption(optionData);
      res.status(201).json(newOption);
    } catch (error) {
      console.error("Error creating dropdown option:", error);
      res.status(500).json({ message: "Failed to create dropdown option" });
    }
  });

  app.get('/api/candidates', async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Get available candidates for new applications (only Available status)
  app.get('/api/candidates/available-for-application', async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      // Filter to show only candidates with "Available" status
      const availableCandidates = candidates.filter(candidate => 
        candidate.status === 'Available'
      );
      res.json(availableCandidates);
    } catch (error) {
      console.error("Error fetching available candidates:", error);
      res.status(500).json({ message: "Failed to fetch available candidates" });
    }
  });

  app.get('/api/candidates/:id', async (req, res) => {
    try {
      const candidate = await storage.getCandidate(req.params.id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });

  // Get candidate applications for enhanced profile
  app.get('/api/candidates/:id/applications', async (req, res) => {
    try {
      const candidateId = req.params.id;
      const applications = await storage.getApplicationsByCandidate(candidateId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching candidate applications:", error);
      res.status(500).json({ message: "Failed to fetch candidate applications" });
    }
  });

  // Note: Candidate skills endpoint already exists in skills router at /api/candidates/:candidateId/skills

  // Get candidate timeline/activity for enhanced profile
  app.get('/api/candidates/:id/timeline', async (req, res) => {
    try {
      const candidateId = req.params.id;
      
      // Collect timeline events from various sources
      const timelineEvents = [];
      
      // Add candidate creation event
      const candidate = await storage.getCandidate(candidateId);
      if (candidate) {
        timelineEvents.push({
          id: `candidate-created-${candidate.id}`,
          type: 'candidate_created',
          title: 'Candidate Profile Created',
          description: `${candidate.name} joined the platform`,
          createdAt: candidate.createdAt,
          metadata: { candidateId: candidate.id }
        });
      }
      
      // Add application events
      const applications = await storage.getApplicationsByCandidate(candidateId);
      applications.forEach(app => {
        timelineEvents.push({
          id: `application-${app.id}`,
          type: 'application_submitted',
          title: 'Application Submitted',
          description: `Applied for ${app.job?.title || 'position'}`,
          createdAt: app.createdAt,
          metadata: { 
            applicationId: app.id,
            jobTitle: app.job?.title,
            stage: app.stage
          }
        });
        
        // Add stage change events if feedback exists
        if (app.feedback) {
          timelineEvents.push({
            id: `feedback-${app.id}`,
            type: 'feedback_added',
            title: 'Feedback Added',
            description: app.feedback,
            createdAt: app.updatedAt || app.createdAt,
            metadata: { 
              applicationId: app.id,
              jobTitle: app.job?.title,
              stage: app.stage
            }
          });
        }
      });
      
      // Add interview events
      const interviews = await storage.getInterviews();
      const candidateInterviews = interviews.filter(interview => 
        applications.some(app => app.id === interview.applicationId)
      );
      
      candidateInterviews.forEach(interview => {
        const relatedApp = applications.find(app => app.id === interview.applicationId);
        timelineEvents.push({
          id: `interview-${interview.id}`,
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          description: `Interview scheduled`,
          createdAt: interview.createdAt,
          metadata: { 
            interviewId: interview.id,
            jobTitle: relatedApp?.job?.title,
            scheduledDate: interview.scheduledDate
          }
        });
      });
      
      // Sort timeline events by date (newest first)
      timelineEvents.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(timelineEvents);
    } catch (error) {
      console.error("Error fetching candidate timeline:", error);
      res.status(500).json({ message: "Failed to fetch candidate timeline" });
    }
  });

  app.post('/api/candidates', async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      
      // Enhanced validation for candidate creation
      validateCandidateTypeFields(candidateData.candidateType || 'internal', candidateData);
      
      // Additional field validations for external candidates
      if (candidateData.candidateType === 'external') {
        if (candidateData.uanNumber && candidateData.uanNumber !== '') {
          uanNumberSchema.parse(candidateData.uanNumber);
        }
        if (candidateData.aadhaarNumber && candidateData.aadhaarNumber !== '') {
          aadhaarNumberSchema.parse(candidateData.aadhaarNumber);
        }
        if (candidateData.linkedinUrl && candidateData.linkedinUrl !== '') {
          linkedinUrlSchema.parse(candidateData.linkedinUrl);
        }
      }
      
      // Auto-set registration date for external candidates
      if (candidateData.candidateType === 'external') {
        candidateData.registrationDate = new Date().toISOString();
      }
      
      const candidate = await storage.createCandidate(candidateData);
      
      // Import and trigger automated workflow
      const { candidateWorkflowService } = await import('./candidateWorkflow');
      
      // Send welcome email automatically (don't wait for response)
      candidateWorkflowService.sendCandidateWelcomeEmail(candidate.id)
        .then((emailSent) => {
          if (emailSent) {
            console.log(`✅ Welcome email sent to ${candidate.email}`);
          } else {
            console.log(`❌ Failed to send welcome email to ${candidate.email}`);
          }
        })
        .catch((error) => {
          console.error('Error in email workflow:', error);
        });
      
      // Send candidate registration email
      try {
        const candidateTemplate = await storage.getEmailTemplateByKey('candidate_registered');
        if (candidateTemplate && candidateTemplate.isActive && candidate.email) {
          console.log(`📧 Sending candidate registration email to ${candidate.email}...`);
          
          // Replace placeholders in template
          let emailContent = candidateTemplate.htmlContent;
          let subject = candidateTemplate.subject;
          
          // Replace candidate placeholders
          if (emailContent) {
            emailContent = emailContent.replace(/\{\{candidate\.name\}\}/g, candidate.name || 'Candidate');
            subject = subject.replace(/\{\{candidate\.name\}\}/g, candidate.name || 'Candidate');
          }
          
          // Replace company placeholders
          const companyData = await getCompanyData();
          if (emailContent) {
            emailContent = emailContent.replace(/\{\{company\.name\}\}/g, companyData.name);
          }
          subject = subject.replace(/\{\{company\.name\}\}/g, companyData.name);
          
          // Add other placeholders
          if (emailContent) {
            emailContent = emailContent.replace(/\{\{candidate\.portalLink\}\}/g, 'https://talentflow.tech/portal');
          }
          
          // Wrap in professional HTML template
          const wrappedContent = `
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
            ${emailContent}
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
</html>`;
          
          await graphEmailService.sendEmail({
            to: candidate.email,
            subject: subject,
            body: wrappedContent,
            isHtml: true,
          });
          
          console.log(`✅ Candidate registration email sent successfully to ${candidate.email}`);
        }
      } catch (emailError) {
        console.error('Error sending candidate registration email:', emailError);
        // Don't fail the candidate creation if email fails
      }
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid candidate data", errors: error.errors });
      }
      console.error("Error creating candidate:", error);
      res.status(500).json({ message: "Failed to create candidate" });
    }
  });

  app.put('/api/candidates/:id', async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.partial().parse(req.body);
      const candidate = await storage.updateCandidate(req.params.id, candidateData);
      res.json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid candidate data", errors: error.errors });
      }
      console.error("Error updating candidate:", error);
      res.status(500).json({ message: "Failed to update candidate" });
    }
  });

  app.delete('/api/candidates/:id', async (req, res) => {
    try {
      await storage.deleteCandidate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Resend portal invitation to a candidate
  app.post('/api/candidates/:id/resend-portal-invitation', authenticateUser, async (req, res) => {
    try {
      const candidateId = req.params.id;
      const candidate = await storage.getCandidate(candidateId);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      console.log(`📧 Resending portal invitation to: ${candidate.email}`);

      // Use the existing workflow to create/recreate portal account
      const { applicationWorkflowService } = await import('./applicationWorkflow');
      const result = await applicationWorkflowService.createPortalAccount(candidateId);
      
      if (result.success) {
        console.log(`✅ Portal invitation resent successfully to ${candidate.email}`);
        res.json({ 
          message: `Portal invitation sent successfully to ${candidate.email}`,
          success: true 
        });
      } else {
        console.error(`❌ Failed to resend portal invitation: ${result.message}`);
        res.status(500).json({ 
          message: result.message || "Failed to resend portal invitation",
          success: false 
        });
      }

    } catch (error) {
      console.error("Error resending portal invitation:", error);
      res.status(500).json({ message: "Failed to resend portal invitation" });
    }
  });

  // Bulk delete candidates
  app.post('/api/candidates/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty candidate IDs array" });
      }
      
      await storage.bulkDeleteCandidates(ids);
      
      res.json({ message: `${ids.length} candidate${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting candidates:", error);
      res.status(500).json({ message: "Failed to delete candidates" });
    }
  });

  // Enhanced candidate response endpoints
  app.get('/api/application/respond', async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing token parameter' 
      });
    }

    const { applicationWorkflowService } = await import('./applicationWorkflow');
    const result = await applicationWorkflowService.getResponseJobDetails(token as string);

    res.json(result);
  });

  app.post('/api/application/respond', async (req, res) => {
    const { token, response, feedback, rating } = req.body;
    
    if (!token || !response) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing token or response parameter' 
      });
    }

    const { applicationWorkflowService } = await import('./applicationWorkflow');
    const result = await applicationWorkflowService.handleCandidateResponse(
      token as string, 
      response as 'interested' | 'not_interested',
      feedback,
      rating
    );

    res.json(result);
  });

  // Legacy support for direct email links - redirect to new flow
  app.get('/respond', async (req, res) => {
    const { token, response } = req.query;
    
    if (!token || !response) {
      return res.redirect('/?error=invalid_link');
    }

    // Redirect to new response page
    res.redirect(`/candidate-response?token=${token}&response=${response}`);
  });

  // Resend JD email for application
  app.post('/api/applications/:id/resend-jd-email', async (req, res) => {
    try {
      const applicationId = req.params.id;
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const { applicationWorkflowService } = await import('./applicationWorkflow');
      const emailSent = await applicationWorkflowService.sendJobDescriptionEmail(applicationId);
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "JD email resent successfully" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to resend JD email" 
        });
      }
    } catch (error) {
      console.error('Error resending JD email:', error);
      res.status(500).json({ 
        success: false, 
        message: "Error resending JD email" 
      });
    }
  });

  // Legacy candidate response endpoints for email workflow (deprecated)
  app.get('/api/candidate/respond', async (req, res) => {
    try {
      const { token, response } = req.query;
      
      if (!token || !response) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2>❌ Invalid Request</h2>
              <p>This link appears to be invalid or incomplete.</p>
            </body>
          </html>
        `);
      }

      if (response !== 'interested' && response !== 'not_interested') {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2>❌ Invalid Response</h2>
              <p>Invalid response type provided.</p>
            </body>
          </html>
        `);
      }

      const { candidateWorkflowService } = await import('./candidateWorkflow');
      const result = await candidateWorkflowService.handleCandidateResponse(
        token as string, 
        response as 'interested' | 'not_interested'
      );

      if (result.success) {
        // Show success page with appropriate message
        const isInterested = response === 'interested';
        res.send(`
          <html>
            <head>
              <title>Response Recorded</title>
              <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; margin: 0; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); text-align: center; }
                .success { color: #28a745; }
                .info { color: #17a2b8; }
                h1 { margin-bottom: 30px; }
                p { line-height: 1.6; margin-bottom: 20px; }
                .icon { font-size: 48px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">${isInterested ? '🎉' : '👋'}</div>
                <h1 class="${isInterested ? 'success' : 'info'}">
                  ${isInterested ? 'Thank You for Your Interest!' : 'Thank You for Your Response'}
                </h1>
                <p>${result.message}</p>
                ${isInterested ? `
                  <p><strong>Next Steps:</strong></p>
                  <p>Our recruitment team will review your profile and contact you within 2-3 business days with further details about the position and next steps in the hiring process.</p>
                ` : `
                  <p>We appreciate you taking the time to respond. We'll keep your profile on file for future opportunities that might be a better fit.</p>
                `}
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  TalentFlow Solutions - Building careers, connecting talent
                </p>
              </div>
            </body>
          </html>
        `);
      } else {
        // Show error page
        res.status(400).send(`
          <html>
            <head>
              <title>Response Error</title>
              <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; margin: 0; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); text-align: center; }
                .error { color: #dc3545; }
                h1 { margin-bottom: 30px; }
                p { line-height: 1.6; margin-bottom: 20px; }
                .icon { font-size: 48px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">⚠️</div>
                <h1 class="error">Unable to Process Response</h1>
                <p>${result.message}</p>
                <p>If you believe this is an error, please contact our recruitment team directly.</p>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  TalentFlow Solutions - Building careers, connecting talent
                </p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error handling candidate response:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>❌ Server Error</h2>
            <p>An error occurred while processing your response. Please try again later.</p>
          </body>
        </html>
      `);
    }
  });

  // Get candidate workflow statistics
  app.get('/api/candidates/workflow-stats', async (req, res) => {
    try {
      const { candidateWorkflowService } = await import('./candidateWorkflow');
      const stats = await candidateWorkflowService.getResponseStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      res.status(500).json({ message: 'Failed to fetch workflow statistics' });
    }
  });

  // Stage transition validation helper - updated for Stage Flow Automation
  const validateStageTransition = (currentStage: string, newStage: string): boolean => {
    const transitions: Record<string, string[]> = {
      'Applied': ['L1 Scheduled', 'L2 Scheduled', 'HR Scheduled', 'Final Scheduled', 'Rejected'],
      'L1 Scheduled': ['L2 Scheduled', 'HR Scheduled', 'Final Scheduled', 'Selected', 'Rejected', 'On Hold', 'No Show'],
      'L2 Scheduled': ['HR Scheduled', 'Final Scheduled', 'Selected', 'Rejected', 'On Hold', 'No Show'],
      'HR Scheduled': ['Final Scheduled', 'Selected', 'Rejected', 'On Hold', 'No Show'],
      'Final Scheduled': ['Selected', 'Rejected', 'On Hold', 'No Show'],
      'Selected': ['Offer Released'],
      'Offer Released': ['Joined', 'Rejected'],
      // Terminal states - no further transitions allowed
      'Joined': [],
      'Rejected': [],
      'On Hold': ['L1 Scheduled', 'L2 Scheduled', 'HR Scheduled', 'Final Scheduled', 'Rejected'],
      'No Show': ['L1 Scheduled', 'L2 Scheduled', 'HR Scheduled', 'Final Scheduled', 'Rejected']
    };

    return transitions[currentStage]?.includes(newStage) || false;
  };

  // Applications routes
  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get applications available for interview scheduling (must be above :id route)
  app.get('/api/applications/available-for-interview', async (req, res) => {
    try {
      const applications = await storage.getApplicationsWithRelations();
      const interviews = await storage.getInterviews();
      
      // Filter applications that:
      // 1. Have an active application (already handled by getApplicationsWithRelations)
      // 2. Do NOT already have any interview scheduled in any stage
      // 3. Exclude candidates with problematic interview statuses
      const availableApplications = applications.filter(app => {
        const hasAnyInterview = interviews.some(interview => 
          interview.applicationId === app.id
        );
        return !hasAnyInterview;
      });
      
      res.json(availableApplications);
    } catch (error) {
      console.error("Error fetching available applications:", error);
      res.status(500).json({ message: "Failed to fetch available applications" });
    }
  });

  app.get('/api/applications/:id', async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post('/api/applications', async (req, res) => {
    try {
      // Stage Flow Automation: Auto-set stage to "Applied" when creating application
      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        stage: 'Applied' // Always set to Applied when creating new application
      });
      
      const application = await storage.createApplication(applicationData);
      
      // Candidate Status Automation: Update candidate status from Available → Interviewing
      try {
        await storage.updateCandidate(application.candidateId, { 
          status: 'Interviewing'
        });
      } catch (candidateUpdateError) {
        console.error("Error updating candidate status to Interviewing:", candidateUpdateError);
        // Continue even if candidate status update fails
      }
      
      // Send JD email with response buttons (NEW WORKFLOW)
      try {
        const { applicationWorkflowService } = await import('./applicationWorkflow');
        applicationWorkflowService.sendJobDescriptionEmail(application.id)
          .then((emailSent) => {
            if (emailSent) {
              console.log(`✅ JD email sent for application ${application.id}`);
            } else {
              console.log(`❌ Failed to send JD email for application ${application.id}`);
            }
          })
          .catch((error) => {
            console.error('Error in JD email workflow:', error);
          });
      } catch (emailError) {
        console.error('Error triggering JD email workflow:', emailError);
        // Don't fail application creation if email fails
      }
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put('/api/applications/:id', async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.partial().parse(req.body);
      
      // Validate stage transition if stage is being updated
      if (applicationData.stage) {
        const currentApplication = await storage.getApplication(req.params.id);
        if (!currentApplication) {
          return res.status(404).json({ message: "Application not found" });
        }

        const isValidTransition = validateStageTransition(currentApplication.stage, applicationData.stage);
        if (!isValidTransition) {
          return res.status(400).json({ 
            message: `Invalid stage transition: ${currentApplication.stage} → ${applicationData.stage}`,
            error: "INVALID_STAGE_TRANSITION",
            currentStage: currentApplication.stage,
            requestedStage: applicationData.stage
          });
        }
      }

      const application = await storage.updateApplication(req.params.id, applicationData);
      
      // Stage Flow Automation: Auto-update Candidate status when Application stage changes
      if (applicationData.stage) {
        try {
          const stageToStatusMapping = {
            'L1 Scheduled': 'Interviewing',
            'L2 Scheduled': 'Interviewing', 
            'Selected': 'Interviewing',
            'Offer Released': 'Offered',
            'Joined': 'Placed',
            'Rejected': 'Rejected'
          };
          
          const newCandidateStatus = stageToStatusMapping[applicationData.stage as keyof typeof stageToStatusMapping];
          
          if (newCandidateStatus) {
            await storage.updateCandidate(application.candidateId, { 
              status: newCandidateStatus as any
            });
          }
          
          // Send appropriate email based on stage change
          const candidate = await storage.getCandidate(application.candidateId);
          const job = await storage.getJob(application.jobId);
          
          if (candidate && candidate.email) {
            const emailMappings = {
              'L1 Scheduled': 'interview_scheduled',
              'L2 Scheduled': 'interview_scheduled', 
              'HR Scheduled': 'interview_scheduled',
              'Final Scheduled': 'interview_scheduled',
              'Selected': 'application_shortlisted',
              'Offer Released': 'offer_extended',
              'Joined': 'offer_accepted',
              'Rejected': 'application_rejected',
              'On Hold': null, // No email for on hold
              'No Show': 'interview_feedback_request' // Follow up after no show
            };
            
            const emailTemplate = emailMappings[applicationData.stage as keyof typeof emailMappings];
            if (emailTemplate) {
              await sendModuleEmail(emailTemplate, candidate.email, {
                candidate,
                job,
                application,
                stage: applicationData.stage
              });
              console.log(`📧 Email triggered: ${emailTemplate} → ${candidate.email} (${applicationData.stage})`);
            }
          }
        } catch (automationError) {
          console.error("Error updating candidate status:", automationError);
          // Continue even if candidate status update fails
        }
      }
      
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete('/api/applications/:id', async (req, res) => {
    try {
      await storage.deleteApplication(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Bulk delete applications
  app.post('/api/applications/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty application IDs array" });
      }
      
      await storage.bulkDeleteApplications(ids);
      
      res.json({ message: `${ids.length} application${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting applications:", error);
      res.status(500).json({ message: "Failed to delete applications" });
    }
  });

  // Bulk edit applications
  app.post('/api/applications/bulk-edit', async (req, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty application IDs array" });
      }
      
      await storage.bulkUpdateApplications(ids, updates);
      
      res.json({ message: `${ids.length} application${ids.length !== 1 ? 's' : ''} updated successfully` });
    } catch (error) {
      console.error("Error bulk editing applications:", error);
      res.status(500).json({ message: "Failed to update applications" });
    }
  });

  // Release Offer - Open offer creation form and create draft offer letter
  app.post('/api/applications/:id/release-offer', async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if application is in correct stage and candidate is Offered
      if (application.stage !== 'Selected') {
        return res.status(400).json({ 
          message: "Application must be in 'Selected' stage to release offer" 
        });
      }

      const candidate = await storage.getCandidate(application.candidateId);
      if (!candidate || candidate.status !== 'Offered') {
        return res.status(400).json({ 
          message: "Candidate must have 'Offered' status to release offer" 
        });
      }

      // Return application data for offer creation form
      res.json({ 
        message: "Ready to create offer letter",
        application: application,
        candidate: candidate,
        job: application.job,
        nextAction: "create_offer_form"
      });
    } catch (error) {
      console.error("Error preparing offer release:", error);
      res.status(500).json({ message: "Failed to prepare offer release" });
    }
  });

  // Accept Offer - Move to Joined status
  app.post('/api/applications/:id/accept-offer', async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Update application stage to Joined
      await storage.updateApplication(req.params.id, { 
        stage: 'Joined' as any 
      });
      
      // Update candidate status to Joined
      await storage.updateCandidate(application.candidateId, { 
        status: 'Joined' as any 
      });
      
      // Send offer acceptance confirmation email
      try {
        const candidate = await storage.getCandidate(application.candidateId);
        const job = await storage.getJob(application.jobId);
        if (candidate && candidate.email) {
          await sendModuleEmail('offer_accepted', candidate.email, {
            candidate,
            job,
            application,
            offer: {
              joiningDate: new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString(),
              manager: 'Your Reporting Manager'
            }
          }, req.user?.email);
          console.log(`📧 Offer acceptance confirmation sent to ${candidate.email}`);
        }
      } catch (emailError) {
        console.error('Error sending offer acceptance email:', emailError);
        // Don't fail offer acceptance if email fails
      }
      
      console.log(`Offer accepted for application ${req.params.id} - Application: Joined, Candidate: Joined`);
      
      res.json({ 
        message: "Offer accepted successfully",
        applicationStage: "Joined",
        candidateStatus: "Joined"
      });
    } catch (error) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ message: "Failed to accept offer" });
    }
  });

  // Reject Offer - Move to Not Joined status
  app.post('/api/applications/:id/reject-offer', async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Update application stage to Not Joined
      await storage.updateApplication(req.params.id, { 
        stage: 'Not Joined' as any 
      });
      
      // Update candidate status to Not Joined
      await storage.updateCandidate(application.candidateId, { 
        status: 'Not Joined' as any 
      });
      
      // Send offer declined follow-up email
      try {
        const candidate = await storage.getCandidate(application.candidateId);
        const job = await storage.getJob(application.jobId);
        if (candidate && candidate.email) {
          await sendModuleEmail('offer_declined', candidate.email, {
            candidate,
            job,
            application
          }, req.user?.email);
          console.log(`📧 Offer declined follow-up sent to ${candidate.email}`);
        }
      } catch (emailError) {
        console.error('Error sending offer declined email:', emailError);
        // Don't fail offer rejection if email fails
      }
      
      console.log(`Offer rejected for application ${req.params.id} - Application: Not Joined, Candidate: Not Joined`);
      
      res.json({ 
        message: "Offer rejected",
        applicationStage: "Not Joined",
        candidateStatus: "Not Joined"
      });
    } catch (error) {
      console.error("Error rejecting offer:", error);
      res.status(500).json({ message: "Failed to reject offer" });
    }
  });

  app.get('/api/jobs/:jobId/applications', async (req, res) => {
    try {
      const applications = await storage.getApplicationsByJob(req.params.jobId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  // Interviews routes
  app.get('/api/interviews', async (req, res) => {
    try {
      const interviews = await storage.getInterviews();
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.get('/api/interviews/:id', async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      res.json(interview);
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  // Helper function to map feedback recommendation to interview result
  function mapRecommendationToFeedbackResult(recommendation: string): string {
    const mapping: Record<string, string> = {
      'Hire': 'Selected',
      'Strong Hire': 'Selected', 
      'No Hire': 'Rejected',
      'Maybe': 'On Hold'
    };
    return mapping[recommendation] || 'On Hold';
  }

  // Helper function to apply interview automation rules
  async function applyInterviewAutomation(interview: any) {
    try {
      const application = await storage.getApplication(interview.applicationId);
      if (!application) return;

      let newApplicationStage: string = '';
      let newCandidateStatus: string = '';

      // Rule 1: HR + Completed + Feedback rules (highest priority)
      if (interview.interviewRound === 'HR' && interview.status === 'Completed' && interview.feedbackResult) {
        switch (interview.feedbackResult) {
          case 'Selected':
            newApplicationStage = 'Offer Released';
            newCandidateStatus = 'Offered';
            break;
          case 'Rejected':
            newApplicationStage = 'Rejected';
            newCandidateStatus = 'Rejected';
            break;
          case 'On Hold':
            newApplicationStage = 'On Hold';
            newCandidateStatus = 'Interviewing';
            break;
          case 'No Show':
            newApplicationStage = 'No Show';
            newCandidateStatus = 'Available';
            break;
          default:
            // Fallback for unknown feedback
            newApplicationStage = 'Shortlisted';
            newCandidateStatus = 'Interviewing';
        }
      }
      // Rule 1.5: L1/L2/Final + Completed + Selected → Progress to next stage
      else if (['L1', 'L2', 'Final'].includes(interview.interviewRound) && interview.status === 'Completed' && interview.feedbackResult === 'Selected') {
        if (interview.interviewRound === 'L1') {
          newApplicationStage = 'L2 Scheduled';
        } else if (interview.interviewRound === 'L2') {
          newApplicationStage = 'Selected';
        } else if (interview.interviewRound === 'Final') {
          newApplicationStage = 'Selected';
        }
        newCandidateStatus = 'Interviewing';
      }
      // Rule 1.6: L1/L2/Final + Completed + Rejected → Reject application
      else if (['L1', 'L2', 'Final'].includes(interview.interviewRound) && interview.status === 'Completed' && interview.feedbackResult === 'Rejected') {
        newApplicationStage = 'Rejected';
        newCandidateStatus = 'Rejected';
      }
      // Rule 2: L1/L2/Final rounds (any status) - Update to proper scheduled stage
      else if (['L1', 'L2', 'Final'].includes(interview.interviewRound)) {
        newApplicationStage = `${interview.interviewRound} Scheduled`;
        newCandidateStatus = 'Interviewing';
      }
      // Rule 3: Default fallback for any other scenarios
      else {
        newApplicationStage = 'Shortlisted';
        newCandidateStatus = 'Interviewing';
      }

      // Apply the calculated statuses atomically
      if (newApplicationStage && newCandidateStatus) {
        await storage.updateApplication(interview.applicationId, { 
          stage: newApplicationStage as any 
        });
        await storage.updateCandidate(application.candidateId, { 
          status: newCandidateStatus as any 
        });
      }

      if (newApplicationStage && newCandidateStatus) {
        console.log(`Interview automation applied: ${interview.interviewRound} ${interview.status} ${interview.feedbackResult || ''} → App: ${newApplicationStage}, Candidate: ${newCandidateStatus}`);
      }

    } catch (automationError) {
      console.error("Error in interview automation:", automationError);
      // Don't throw - just log the error to avoid breaking the interview operation
    }
  }

  app.post('/api/interviews', async (req, res) => {
    try {
      // Convert scheduledDate string to Date object if needed
      const requestData = {
        ...req.body,
        scheduledDate: typeof req.body.scheduledDate === 'string' 
          ? new Date(req.body.scheduledDate) 
          : req.body.scheduledDate
      };
      
      const interviewData = insertInterviewSchema.parse(requestData);
      
      // Handle Teams meeting creation for online interviews (Teams and Online modes)
      let teamsDetails = {};
      if (interviewData.mode === 'Teams' || interviewData.mode === 'Online') {
        console.log('📅 Creating Teams meeting for interview...');
        
        try {
          // Get application, candidate, and job details for meeting info
          const application = await storage.getApplication(interviewData.applicationId);
          if (application) {
            const candidate = await storage.getCandidate(application.candidateId);
            const job = await storage.getJob(application.jobId);
            
            if (candidate && job) {
              // Calculate end time (1 hour after start)
              const startTime = new Date(interviewData.scheduledDate);
              const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
              
              // Extract organizer email from interviewer field (format: "Name (email)")
              let organizerEmail = process.env.GRAPH_FROM_EMAIL || 'noreply@o2finfosolutions.com';
              const emailMatch = interviewData.interviewer.match(/\(([^)]+)\)/);
              if (emailMatch && emailMatch[1] && emailMatch[1].includes('@')) {
                organizerEmail = emailMatch[1];
              }

              // Import and create TeamsService dynamically
              const { TeamsService } = await import('./services/teamsService');
              const teamsServiceInstance = new TeamsService();
              
              const teamsmeeting = await teamsServiceInstance.createOnlineMeeting({
                subject: `${interviewData.interviewRound} Interview - ${candidate.name} - ${job.title}`,
                startDateTime: startTime.toISOString(),
                endDateTime: endTime.toISOString(),
                organizerEmail,
                attendeeEmails: candidate.email ? [candidate.email] : [],
                additionalInfo: `Interview for ${job.title} position with ${candidate.name}`
              });

              if (teamsmeeting) {
                teamsDetails = {
                  teamsMeetingId: teamsmeeting.meetingId,
                  teamsMeetingUrl: teamsmeeting.joinUrl,
                  teamsOrganizerEmail: organizerEmail
                };
                console.log(`✅ Teams meeting created: ${teamsmeeting.joinUrl}`);
              } else {
                console.warn('❌ Failed to create Teams meeting - proceeding without it');
              }
            }
          }
        } catch (teamsError) {
          console.error('❌ Teams meeting creation error:', teamsError);
          // Continue with interview creation even if Teams meeting fails
        }
      }

      // Create interview with Teams details if available
      const finalInterviewData = { ...interviewData, ...teamsDetails };
      const interview = await storage.createInterview(finalInterviewData);
      
      // 🚀 Apply centralized workflow automation for interview scheduling
      const { applicationWorkflowService } = await import('./applicationWorkflow');
      await applicationWorkflowService.processInterviewScheduled(interview.id, req.user?.id);
      
      // Send interview scheduled email
      try {
        const application = await storage.getApplication(interview.applicationId);
        if (application) {
          const candidate = await storage.getCandidate(application.candidateId);
          const job = await storage.getJob(application.jobId);
          if (candidate && candidate.email) {
            // Transform interview data to match email template expectations
            const interviewForEmail = {
              ...interview,
              // Transform Teams meeting data to match template placeholders  
              meetingLink: interview.teamsMeetingUrl || 'https://teams.microsoft.com/l/meetup-join/',
              date: new Date(interview.scheduledDate).toLocaleDateString(),
              time: new Date(interview.scheduledDate).toLocaleTimeString(),
              type: interview.interviewRound,
              location: interview.mode === 'Teams' ? 'Microsoft Teams Meeting' :
                       interview.mode === 'Online' ? 'Virtual Meeting' : 
                       'On-site',
              confirmationLink: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/candidate-portal/interviews/${interview.id}/confirm`
            };

            // Send interview invitation to candidate
            await sendModuleEmail('interview_invitation', candidate.email, {
              candidate,
              job,
              application,
              interview: interviewForEmail
            }, req.user?.email);

            // Send interview notification to interviewer
            const emailMatch = interview.interviewer.match(/\(([^)]+)\)/);
            if (emailMatch && emailMatch[1] && emailMatch[1].includes('@')) {
              const interviewerEmail = emailMatch[1];
              await sendModuleEmail('interviewer_notification', interviewerEmail, {
                candidate,
                job,
                application,
                interview: interviewForEmail,
                interviewer: { email: interviewerEmail, name: interview.interviewer.replace(/\s*\([^)]*\)\s*$/, '') }
              }, req.user?.email);
            }

            // Send confirmation to logged-in user (interview creator) if different from interviewer
            if (req.user?.email && req.user.email !== (emailMatch && emailMatch[1])) {
              await sendModuleEmail('interview_scheduled_confirmation', req.user.email, {
                candidate,
                job,
                application,
                interview: interviewForEmail,
                creator: req.user
              }, req.user?.email);
            }
          }
        }
      } catch (emailError) {
        console.error('Error sending interview scheduled email:', emailError);
        // Don't fail interview creation if email fails
      }
      
      res.status(201).json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview data", errors: error.errors });
      }
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });

  app.put('/api/interviews/:id', async (req, res) => {
    try {
      // Get original interview for comparison
      const originalInterview = await storage.getInterview(req.params.id);
      if (!originalInterview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // Convert scheduledDate string to Date object if needed
      const requestData = {
        ...req.body,
        scheduledDate: typeof req.body.scheduledDate === 'string' 
          ? new Date(req.body.scheduledDate) 
          : req.body.scheduledDate
      };
      
      const interviewData = insertInterviewSchema.partial().parse(requestData);
      const interview = await storage.updateInterview(req.params.id, interviewData);
      
      // 🚀 Apply centralized workflow automation based on interview changes
      const { applicationWorkflowService } = await import('./applicationWorkflow');
      
      // If interview status changed to Completed with feedbackResult, process feedback workflow
      if (originalInterview.status !== 'Completed' && interview.status === 'Completed' && interview.feedbackResult) {
        await applicationWorkflowService.processInterviewFeedback(interview.id, req.user?.id);
      } else {
        // Otherwise, handle as scheduling event (date/time/mode changes)
        await applicationWorkflowService.processInterviewScheduled(interview.id, req.user?.id);
      }
      
      // Send appropriate emails based on changes
      try {
        const application = await storage.getApplication(interview.applicationId);
        if (application) {
          const candidate = await storage.getCandidate(application.candidateId);
          const job = await storage.getJob(application.jobId);
          
          if (candidate && candidate.email) {
            // Check if interview status changed to Completed with feedback
            if (originalInterview.status !== 'Completed' && interview.status === 'Completed' && interview.feedbackResult) {
              if (interview.feedbackResult === 'Selected') {
                // Send stage progression emails based on interview round
                if (interview.interviewRound === 'L1') {
                  await sendModuleEmail('application_shortlisted', candidate.email, {
                    candidate, job, application, interview: { ...interview, nextStage: 'L2 Technical Round' }
                  }, req.user?.email);
                } else if (interview.interviewRound === 'L2') {
                  await sendModuleEmail('application_shortlisted', candidate.email, {
                    candidate, job, application, interview: { ...interview, nextStage: 'HR Discussion' }
                  }, req.user?.email);
                } else if (interview.interviewRound === 'HR') {
                  await sendModuleEmail('offer_extended', candidate.email, {
                    candidate, job, application, interview
                  }, req.user?.email);
                } else {
                  await sendModuleEmail('application_shortlisted', candidate.email, {
                    candidate, job, application, interview
                  }, req.user?.email);
                }
              } else if (interview.feedbackResult === 'Rejected') {
                await sendModuleEmail('application_rejected', candidate.email, {
                  candidate, job, application, interview
                }, req.user?.email);
              } else {
                // Send general feedback request for other results
                await sendModuleEmail('interview_feedback_request', candidate.email, {
                  candidate, job, application, interview
                }, req.user?.email);
              }
            }
            // Handle interview rescheduling (date, time, or mode change)
            else if (originalInterview.scheduledDate !== interview.scheduledDate || 
                     originalInterview.mode !== interview.mode ||
                     originalInterview.interviewer !== interview.interviewer) {
              
              console.log('📅 Interview rescheduled, sending notifications and updating Teams meeting...');
              
              // Create/update Teams meeting if mode is Teams or Online
              let teamsJoinUrl = interview.teamsMeetingUrl;
              if (interview.mode === 'Teams' || interview.mode === 'Online') {
                try {
                  const { TeamsService } = await import('./services/teamsService');
                  const teamsService = new TeamsService();
                  
                  // Get organizer email from interviewer field or use logged-in user
                  let organizerEmail = req.user?.email || process.env.GRAPH_FROM_EMAIL || 'noreply@o2finfosolutions.com';
                  const emailMatch = interview.interviewer.match(/\(([^)]+)\)/);
                  if (emailMatch && emailMatch[1] && emailMatch[1].includes('@')) {
                    organizerEmail = emailMatch[1];
                  }
                  
                  console.log(`📧 Using organizer email for Teams meeting: ${organizerEmail}`);
                  
                  if (organizerEmail) {
                    const interviewDate = new Date(interview.scheduledDate);
                    const endDate = new Date(interviewDate.getTime() + 60 * 60 * 1000); // 1 hour duration
                    
                    const teamsOptions = {
                      subject: `Interview: ${candidate.name} for ${job?.title || 'Position'}`,
                      startDateTime: interviewDate.toISOString(),
                      endDateTime: endDate.toISOString(),
                      organizerEmail: organizerEmail,
                      attendeeEmails: [candidate.email!],
                      additionalInfo: `Interview for ${job?.title || 'Position'} position - Round: ${interview.interviewRound}`
                    };
                    
                    const teamsMeeting = await teamsService.createOnlineMeeting(teamsOptions);
                    if (teamsMeeting) {
                      teamsJoinUrl = teamsMeeting.joinUrl;
                      // Update interview with Teams meeting URL
                      await storage.updateInterview(interview.id, { 
                        teamsMeetingUrl: teamsJoinUrl 
                      });
                      console.log('✅ Teams meeting created/updated for rescheduled interview');
                    }
                  }
                } catch (teamsError) {
                  console.error('❌ Failed to create/update Teams meeting:', teamsError);
                }
              }
              
              // Prepare template data with proper timezone handling
              const interviewDate = new Date(interview.scheduledDate);
              const timezone = 'Asia/Kolkata'; // Default timezone
              
              const templateData = {
                candidate: { name: candidate.name },
                job: { title: job?.title || 'Position', company: 'O2F ATS' },
                interview: {
                  date: interviewDate.toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    timeZone: timezone
                  }),
                  time: interviewDate.toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', hour12: true,
                    timeZone: timezone
                  }),
                  interviewer: interview.interviewer,
                  type: interview.mode,
                  location: interview.mode === 'Teams' ? 'Teams Meeting' :
                           interview.mode === 'Online' ? 'Online Meeting' : 'Office location',
                  meetingLink: teamsJoinUrl || '#',
                  confirmationLink: `https://${process.env.REPLIT_DEV_DOMAIN}/candidate-portal/interviews/${interview.id}/confirm`
                },
                company: { name: 'O2F ATS' }
              };
              
              // Send rescheduling notification to candidate
              await emailTemplateService.sendEmail(
                'interview_invitation',
                candidate.email,
                templateData
              );
              
              // Send rescheduling notification to interviewer (extract email from interviewer field)
              const emailMatch = interview.interviewer.match(/\(([^)]+)\)/);
              if (emailMatch && emailMatch[1] && emailMatch[1].includes('@')) {
                const interviewerEmail = emailMatch[1];
                const interviewerName = interview.interviewer.replace(/\s*\([^)]*\)\s*$/, '');
                
                const interviewerTemplateData = {
                  ...templateData,
                  interviewer: { name: interviewerName }
                };
                
                console.log(`📧 Sending rescheduling notification to interviewer: ${interviewerEmail}`);
                await emailTemplateService.sendEmail(
                  'interviewer_notification',
                  interviewerEmail,
                  interviewerTemplateData
                );
              }
              
              // Send confirmation to interview creator (logged-in user) if different from interviewer
              if (req.user?.email && req.user.email !== (emailMatch && emailMatch[1])) {
                const creatorTemplateData = {
                  ...templateData,
                  creator: { 
                    firstName: req.user.firstName || 'User',
                    name: (req.user.firstName || '') + ' ' + (req.user.lastName || '')
                  }
                };
                
                console.log(`📧 Sending rescheduling confirmation to creator: ${req.user.email}`);
                await emailTemplateService.sendEmail(
                  'interview_scheduled_confirmation',
                  req.user.email,
                  creatorTemplateData
                );
              }
              
              console.log('✅ Rescheduling notifications sent to candidate and interviewer');
            }
          }
        }
      } catch (emailError) {
        console.error('Error sending interview update email:', emailError);
        // Don't fail interview update if email fails
      }
      
      res.json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview data", errors: error.errors });
      }
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  app.delete('/api/interviews/:id', async (req, res) => {
    try {
      await storage.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  // Bulk delete interviews
  app.post('/api/interviews/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty interview IDs array" });
      }
      
      await storage.bulkDeleteInterviews(ids);
      
      res.json({ message: `${ids.length} interview${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting interviews:", error);
      res.status(500).json({ message: "Failed to delete interviews" });
    }
  });

  // Bulk delete interviews
  app.post('/api/interviews/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty interview IDs array" });
      }
      
      for (const id of ids) {
        await storage.deleteInterview(id);
      }
      
      res.json({ message: `${ids.length} interview${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting interviews:", error);
      res.status(500).json({ message: "Failed to delete interviews" });
    }
  });

  // Resend interview confirmation email
  app.post('/api/interviews/:id/resend-email', async (req, res) => {
    try {
      const interviewId = req.params.id;
      
      // Get interview details
      const interview = await storage.getInterview(interviewId);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // Get application and related data
      const application = await storage.getApplication(interview.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const candidate = await storage.getCandidate(application.candidateId);
      const job = await storage.getJob(application.jobId);

      if (!candidate || !job) {
        return res.status(404).json({ message: "Candidate or Job not found" });
      }

      // Prepare template data with proper timezone handling
      const interviewDate = new Date(interview.scheduledDate);
      
      // Default timezone
      const timezone = 'Asia/Kolkata';
      
      const templateData = {
        candidate: {
          name: candidate.name
        },
        job: {
          title: job?.title || 'Position',
          company: 'O2F ATS'
        },
        interview: {
          date: interviewDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone
          }),
          time: interviewDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone
          }),
          interviewer: interview.interviewer,
          type: interview.mode,
          location: interview.mode === 'Teams' && interview.teamsMeetingUrl
            ? `Teams Meeting`
            : interview.mode === 'Online' 
            ? 'Online Meeting (details will be shared)'
            : 'Office location (details will be shared)',
          meetingLink: interview.teamsMeetingUrl || '#',
          confirmationLink: `https://${process.env.REPLIT_DEV_DOMAIN}/candidate-portal/interviews/${interviewId}/confirm`
        },
        company: {
          name: 'O2F ATS'
        }
      };

      // Send interview confirmation email to candidate
      const candidateEmailResult = await emailTemplateService.sendEmail(
        'interview_invitation',
        candidate.email,
        templateData
      );

      const recipients = [candidate.email];
      let interviewerEmailResult = { success: true, message: 'No interviewer email found' };
      let creatorEmailResult = { success: true, message: 'No creator email needed' };

      // Send email to interviewer (extract email from interviewer field)
      const emailMatch = interview.interviewer.match(/\(([^)]+)\)/);
      if (emailMatch && emailMatch[1] && emailMatch[1].includes('@')) {
        const interviewerEmail = emailMatch[1];
        const interviewerName = interview.interviewer.replace(/\s*\([^)]*\)\s*$/, '');
        
        const interviewerTemplateData = {
          ...templateData,
          interviewer: { name: interviewerName }
        };
        
        console.log(`📧 Sending resend notification to interviewer: ${interviewerEmail}`);
        interviewerEmailResult = await emailTemplateService.sendEmail(
          'interviewer_notification',
          interviewerEmail,
          interviewerTemplateData
        );
        
        if (interviewerEmailResult.success) {
          recipients.push(interviewerEmail);
        }
      }

      // Send confirmation to interview creator (logged-in user) if different from interviewer
      if (req.user?.email && req.user.email !== (emailMatch && emailMatch[1])) {
        const creatorTemplateData = {
          ...templateData,
          creator: { 
            firstName: req.user.firstName || 'User',
            name: (req.user.firstName || '') + ' ' + (req.user.lastName || '')
          }
        };
        
        console.log(`📧 Sending resend confirmation to creator: ${req.user.email}`);
        creatorEmailResult = await emailTemplateService.sendEmail(
          'interview_scheduled_confirmation',
          req.user.email,
          creatorTemplateData
        );
        
        if (creatorEmailResult.success) {
          recipients.push(req.user.email);
        }
      }

      if (candidateEmailResult.success) {
        res.json({ 
          message: "Interview confirmation emails sent successfully",
          to: recipients,
          candidateEmail: candidateEmailResult.success,
          interviewerEmail: interviewerEmailResult.success,
          creatorEmail: creatorEmailResult.success
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send interview confirmation email to candidate",
          error: candidateEmailResult.error
        });
      }

    } catch (error) {
      console.error("Error resending interview email:", error);
      res.status(500).json({ message: "Failed to resend interview email" });
    }
  });

  // Interview Feedback endpoints
  app.post('/api/interviews/:id/feedback', async (req, res) => {
    try {
      const interviewId = req.params.id;
      const feedbackData = {
        ...req.body,
        interviewId,
        submittedBy: req.user?.id
      };

      const feedback = await storage.createInterviewFeedback(feedbackData);
      
      // Map recommendation to feedback result and update interview status
      const feedbackResult = mapRecommendationToFeedbackResult(feedbackData.overallRecommendation);
      const updatedInterview = await storage.updateInterview(interviewId, { 
        status: 'Completed' as any,
        feedbackResult: feedbackResult as any
      });

      // 🚀 CRITICAL: Apply centralized workflow automation after feedback submission
      const { applicationWorkflowService } = await import('./applicationWorkflow');
      await applicationWorkflowService.processInterviewFeedback(interviewId, req.user?.id);

      console.log(`✅ Interview feedback submitted for interview ${interviewId}`);
      res.json(feedback);
    } catch (error) {
      console.error('Error creating interview feedback:', error);
      res.status(500).json({ error: 'Failed to create interview feedback' });
    }
  });

  app.get('/api/interviews/:id/feedback', async (req, res) => {
    try {
      const interviewId = req.params.id;
      const feedback = await storage.getInterviewFeedback(interviewId);
      res.json(feedback || null);
    } catch (error) {
      console.error('Error fetching interview feedback:', error);
      res.status(500).json({ error: 'Failed to fetch interview feedback' });
    }
  });

  app.put('/api/interviews/:id/feedback', async (req, res) => {
    try {
      const interviewId = req.params.id;
      const feedbackData = {
        ...req.body,
        submittedBy: req.user?.id
      };

      const feedback = await storage.updateInterviewFeedback(interviewId, feedbackData);
      
      // Map recommendation to feedback result and update interview
      const feedbackResult = mapRecommendationToFeedbackResult(feedbackData.overallRecommendation);
      const updatedInterview = await storage.updateInterview(interviewId, { 
        status: 'Completed' as any,
        feedbackResult: feedbackResult as any
      });

      // 🚀 Apply centralized workflow automation after feedback update
      const { applicationWorkflowService } = await import('./applicationWorkflow');
      await applicationWorkflowService.processInterviewFeedback(interviewId, req.user?.id);
      
      console.log(`✅ Interview feedback updated for interview ${interviewId}`);
      res.json(feedback);
    } catch (error) {
      console.error('Error updating interview feedback:', error);
      res.status(500).json({ error: 'Failed to update interview feedback' });
    }
  });

  // Test Teams meeting creation endpoint
  app.post('/api/test-teams-meeting', async (req, res) => {
    try {
      const { TeamsService } = await import('./services/teamsService');
      const teamsService = new TeamsService();
      
      // Test connection first
      const connectionTest = await teamsService.testConnection();
      if (!connectionTest) {
        return res.status(500).json({ 
          message: "Teams service connection failed",
          error: "Cannot connect to Microsoft Graph API"
        });
      }
      
      // Create a test meeting
      const testMeeting = await teamsService.createOnlineMeeting({
        subject: "Test Meeting - Interview System",
        startDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        organizerEmail: process.env.GRAPH_FROM_EMAIL || 'itsupport@o2finfosolutions.com',
        attendeeEmails: ['test@example.com'],
        additionalInfo: 'Test meeting for interview system'
      });
      
      if (testMeeting) {
        res.json({ 
          success: true,
          message: "Teams meeting created successfully",
          meeting: testMeeting
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to create Teams meeting",
          error: "Meeting creation returned null"
        });
      }
    } catch (error: any) {
      console.error("Teams meeting test error:", error);
      res.status(500).json({ 
        success: false,
        message: "Teams meeting test failed",
        error: error.message
      });
    }
  });

  // Object storage routes for resume uploads
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.put("/api/resumes", async (req, res) => {
    try {
      if (!req.body.resumeURL) {
        return res.status(400).json({ message: "resumeURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.resumeURL,
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting resume:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Navigation counts endpoint
  app.get('/api/navigation/counts', async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      const candidates = await storage.getCandidates();
      const applications = await storage.getApplications();
      const interviews = await storage.getInterviews();

      const counts = {
        jobs: jobs.length,
        candidates: candidates.length,
        applications: applications.length,
        interviews: interviews.filter(interview => 
          interview.status === 'Scheduled' || 
          (interview.scheduledDate && new Date(interview.scheduledDate) >= new Date())
        ).length,
      };

      res.json(counts);
    } catch (error) {
      console.error('Error fetching navigation counts:', error);
      res.status(500).json({ message: 'Failed to fetch navigation counts' });
    }
  });

  // Pipeline overview endpoint
  app.get('/api/dashboard/pipeline', async (req, res) => {
    try {
      const applications = await storage.getApplications();
      
      const pipelineStages = [
        {
          name: "New Applications",
          count: applications.filter(app => app.stage === 'Applied').length,
          color: "bg-blue-500",
        },
        {
          name: "In Review",
          count: applications.filter(app => ['Shortlisted', 'L1 Scheduled', 'L2 Scheduled'].includes(app.stage)).length,
          color: "bg-yellow-500",
        },
        {
          name: "Interview Stage", 
          count: applications.filter(app => ['HR Scheduled', 'Final Scheduled'].includes(app.stage)).length,
          color: "bg-green-500",
        },
        {
          name: "Final Stage",
          count: applications.filter(app => ['Selected', 'Offer Released'].includes(app.stage)).length,
          color: "bg-purple-500",
        },
      ];

      // Calculate percentages based on total applications
      const totalApplications = applications.length;
      const stagesWithPercentages = pipelineStages.map(stage => ({
        ...stage,
        percentage: totalApplications > 0 ? Math.round((stage.count / totalApplications) * 100) : 0
      }));

      res.json(stagesWithPercentages);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      res.status(500).json({ message: 'Failed to fetch pipeline data' });
    }
  });

  // Recent activity endpoint
  app.get('/api/dashboard/recent-activity', async (req, res) => {
    try {
      const applications = await storage.getApplications();
      const interviews = await storage.getInterviews();
      const jobs = await storage.getJobs();

      const activities: any[] = [];

      // Recent applications (last 5)
      const recentApplications = applications
        .filter(app => app.createdAt) 
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 5);

      recentApplications.forEach(app => {
        if (app.createdAt) {
          activities.push({
            id: `app-${app.id}`,
            type: "application",
            title: `New application for ${app.job?.title || 'Job'}`,
            time: formatTimeAgo(app.createdAt.toString()),
            icon: "User",
            iconBg: "bg-blue-100",
            iconColor: "text-primary",
          });
        }
      });

      // Recent interviews (last 3)
      const recentInterviews = interviews
        .filter(interview => interview.createdAt)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 3);

      recentInterviews.forEach(interview => {
        if (interview.createdAt) {
          activities.push({
            id: `int-${interview.id}`,
            type: "interview",
            title: `${interview.interviewRound} interview ${interview.status === 'Completed' ? 'completed' : 'scheduled'}`,
            time: formatTimeAgo(interview.createdAt.toString()),
            icon: interview.status === 'Completed' ? "CheckCircle" : "Calendar",
            iconBg: interview.status === 'Completed' ? "bg-green-100" : "bg-purple-100",
            iconColor: interview.status === 'Completed' ? "text-success" : "text-purple-500",
          });
        }
      });

      // Recent jobs (last 2)
      const recentJobs = jobs
        .filter(job => job.createdAt)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 2);

      recentJobs.forEach(job => {
        if (job.createdAt) {
          activities.push({
            id: `job-${job.id}`,
            type: "job",
            title: `New job posted: ${job.title}`,
            time: formatTimeAgo(job.createdAt.toString()),
            icon: "Briefcase",
            iconBg: "bg-yellow-100",
            iconColor: "text-warning",
          });
        }
      });

      // Sort all activities by most recent and limit to 8
      const sortedActivities: any[] = activities
        .sort((a, b) => {
          const timeA = getTimeFromAgo(a.time);
          const timeB = getTimeFromAgo(b.time);
          return timeB - timeA;
        })
        .slice(0, 8);

      res.json(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: 'Failed to fetch recent activity' });
    }
  });

  // Today's interviews endpoint
  app.get('/api/dashboard/today-interviews', async (req, res) => {
    try {
      const interviews = await storage.getInterviews();
      const applications = await storage.getApplications();
      
      const today = new Date();
      const todayInterviews = interviews.filter(interview => {
        const interviewDate = new Date(interview.scheduledDate);
        return interviewDate.toDateString() === today.toDateString() && 
               interview.status === 'Scheduled';
      });

      const formattedInterviews = todayInterviews.map(interview => {
        const application = applications.find(app => app.id === interview.applicationId);
        const interviewTime = new Date(interview.scheduledDate);
        
        return {
          id: interview.id,
          candidateName: application?.candidate?.name || 'Unknown Candidate',
          position: application?.job?.title || 'Unknown Position',
          time: interviewTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          duration: "45 min",
          interviewRound: interview.interviewRound,
          mode: interview.mode,
        };
      });

      res.json(formattedInterviews);
    } catch (error) {
      console.error('Error fetching today interviews:', error);
      res.status(500).json({ message: 'Failed to fetch today interviews' });
    }
  });

  // Helper function to format time ago
  function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  // Helper function to get time from "ago" string for sorting
  function getTimeFromAgo(timeAgo: string): number {
    const now = new Date().getTime();
    const match = timeAgo.match(/(\d+)\s+(second|minute|hour|day)s?\s+ago/);
    if (!match) return now;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'second': return now - (value * 1000);
      case 'minute': return now - (value * 60 * 1000);
      case 'hour': return now - (value * 60 * 60 * 1000);
      case 'day': return now - (value * 24 * 60 * 60 * 1000);
      default: return now;
    }
  }

  // Offer Letters routes
  app.get('/api/offer-letters', async (req, res) => {
    try {
      const offerLetters = await storage.getOfferLetters();
      res.json(offerLetters);
    } catch (error) {
      console.error("Error fetching offer letters:", error);
      res.status(500).json({ message: "Failed to fetch offer letters" });
    }
  });

  app.get('/api/offer-letters/:id', async (req, res) => {
    try {
      const offerLetter = await storage.getOfferLetter(req.params.id);
      if (!offerLetter) {
        return res.status(404).json({ message: "Offer letter not found" });
      }
      res.json(offerLetter);
    } catch (error) {
      console.error("Error fetching offer letter:", error);
      res.status(500).json({ message: "Failed to fetch offer letter" });
    }
  });

  app.post('/api/offer-letters', async (req, res) => {
    try {
      const { candidateId, jobId, applicationId, designation, joiningDate, ctc, hrName } = req.body;
      
      if (!candidateId || !jobId || !applicationId || !designation || !joiningDate || !ctc || !hrName) {
        return res.status(400).json({ 
          message: "Invalid offer letter data", 
          error: "Missing required fields" 
        });
      }

      // Import your comprehensive salary calculator
      const { calcOffer, convertToOfferLetterFields } = await import('./services/salaryCalculator');
      
      // Calculate salary breakdown using your comprehensive logic
      const ctcNumber = parseFloat(ctc);
      const salaryBreakup = calcOffer(ctcNumber, 0); // TDS = 0 for now
      const dbFields = convertToOfferLetterFields(salaryBreakup);

      // Check if offer letter already exists for this application
      const existingOffers = await storage.getOfferLettersByApplication(applicationId);
      if (existingOffers.length > 0) {
        return res.status(400).json({ 
          message: "Offer letter already exists for this application",
          existingOffer: existingOffers[0]
        });
      }

      const offerLetterData = {
        candidateId,
        jobId,
        applicationId,
        designation,
        joiningDate: joiningDate,
        ctc: ctcNumber.toString(),
        hrName,
        companyName: 'O2F Info Solutions Pvt Ltd',
        status: 'draft',
        // Convert all numeric fields to strings to match schema
        basicSalary: dbFields.basicSalary.toString(),
        hra: dbFields.hra.toString(),
        conveyanceAllowance: dbFields.conveyanceAllowance.toString(),
        medicalAllowance: dbFields.medicalAllowance.toString(),
        flexiPay: dbFields.flexiPay.toString(),
        specialAllowance: dbFields.specialAllowance.toString(),
        employerPf: dbFields.employerPf.toString(),
        employeePf: dbFields.employeePf.toString(),
        professionalTax: dbFields.professionalTax.toString(),
        incomeTax: dbFields.incomeTax.toString(),
        otherDeductions: (dbFields.otherDeductions || 0).toString(),
        netSalary: dbFields.netSalary.toString(),
        grossSalary: dbFields.grossSalary.toString(),
        otherBenefits: dbFields.otherBenefits?.toString() || "0"
      };

      const offerLetter = await storage.createOfferLetter(offerLetterData);
      
      // Update application status to Offer Released
      await storage.updateApplication(applicationId, { stage: 'Offer Released' });
      
      // Update candidate status to Offered
      const candidate = await storage.getCandidate(candidateId);
      await storage.updateCandidate(candidateId, { status: 'Offered' });
      
      // Send offer extended email
      try {
        const job = await storage.getJob(jobId);
        if (candidate && candidate.email) {
          await sendModuleEmail('offer_extended', candidate.email, {
            candidate,
            job,
            application: { id: applicationId },
            offer: { 
              ctc: ctc,
              joiningDate: joiningDate,
              designation: designation,
              salary: ctc,
              startDate: joiningDate
            }
          }, req.user?.email);
          console.log(`📧 Offer extended email sent to ${candidate.email}`);
        }
      } catch (emailError) {
        console.error('Error sending offer released email:', emailError);
        // Don't fail offer creation if email fails
      }
      
      res.status(201).json({
        message: "Offer letter created successfully",
        data: offerLetter,
        salaryBreakdown: salaryBreakup // Return detailed breakdown for debugging
      });
    } catch (error) {
      console.error("Error creating offer letter:", error);
      res.status(500).json({ message: "Failed to create offer letter", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/offer-letters/:id', async (req, res) => {
    try {
      const offerLetterData = insertOfferLetterSchema.partial().parse(req.body);
      const offerLetter = await storage.updateOfferLetter(req.params.id, offerLetterData);
      res.json(offerLetter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid offer letter data", errors: error.errors });
      }
      console.error("Error updating offer letter:", error);
      res.status(500).json({ message: "Failed to update offer letter" });
    }
  });

  app.delete('/api/offer-letters/:id', async (req, res) => {
    try {
      await storage.deleteOfferLetter(req.params.id);
      res.json({ message: "Offer letter deleted successfully" });
    } catch (error) {
      console.error("Error deleting offer letter:", error);
      res.status(500).json({ message: "Failed to delete offer letter" });
    }
  });

  // Get offer letters by application
  app.get('/api/applications/:applicationId/offer-letters', async (req, res) => {
    try {
      const offerLetters = await storage.getOfferLettersByApplication(req.params.applicationId);
      res.json(offerLetters);
    } catch (error) {
      console.error("Error fetching offer letters by application:", error);
      res.status(500).json({ message: "Failed to fetch offer letters" });
    }
  });

  // Generate and download PDF offer letter
  app.get('/api/offer-letters/:id/download', async (req, res) => {
    try {
      const offerLetter = await storage.getOfferLetter(req.params.id);
      if (!offerLetter) {
        return res.status(404).json({ message: "Offer letter not found" });
      }

      // Get related candidate and job data
      const candidate = await storage.getCandidate(offerLetter.candidateId);
      const application = await storage.getApplication(offerLetter.applicationId);
      
      if (!candidate || !application?.job) {
        return res.status(404).json({ message: "Related data not found" });
      }

      // TODO: Implement PDF generation service
      // For now return a preview URL
      const pdfUrl = `/api/offer-letters/${offerLetter.id}/preview`;
      
      res.json({ pdfUrl });
    } catch (error) {
      console.error("Error generating offer letter PDF:", error);
      res.status(500).json({ message: "Failed to generate offer letter PDF" });
    }
  });

  // Generate PDF for offer letter
  app.post('/api/offer-letters/:id/generate-pdf', async (req, res) => {
    try {
      const offerLetter = await storage.getOfferLetter(req.params.id);
      if (!offerLetter) {
        return res.status(404).json({ message: "Offer letter not found" });
      }

      const candidate = await storage.getCandidate(offerLetter.candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const application = await storage.getApplication(offerLetter.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Generate HTML content
      const htmlContent = generateOfferLetterHTML({
        ...offerLetter,
        candidate,
        job: application.job
      });

      // Return optimized HTML for browser-based PDF generation
      // This is the most reliable approach for the current environment
      res.set({
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="offer-letter-${candidate.name.replace(/\s+/g, '-')}.html"`
      });

      // Enhanced HTML with better print styles and auto-print functionality
      const printableHtml = htmlContent.replace(
        '</head>',
        `
        <style>
          @media print {
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 0;
              font-family: 'Times New Roman', serif !important;
              font-size: 11pt !important;
              line-height: 1.5 !important;
            }
            .container { 
              margin: 0; 
              padding: 0.5in;
              max-width: none;
            }
            table {
              page-break-inside: avoid;
              width: 100% !important;
            }
            tr {
              page-break-inside: avoid;
            }
            .section-title {
              page-break-after: avoid;
            }
            p {
              orphans: 3;
              widows: 3;
            }
          }
          @page {
            size: A4;
            margin: 1in;
          }
          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
            }
            .container {
              background: white;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        </style>
        <script>
          window.onload = function() {
            // Show a helpful message and auto-open print dialog
            const userAgent = navigator.userAgent;
            const isFirefox = userAgent.indexOf('Firefox') > -1;
            const isChrome = userAgent.indexOf('Chrome') > -1;
            
            setTimeout(() => {
              if (isChrome || isFirefox) {
                // Auto-open print dialog after a short delay
                window.print();
              } else {
                alert('Please use Ctrl+P (or Cmd+P on Mac) to print this offer letter as PDF');
              }
            }, 1500);
          }
        </script>
        </head>`
      );

      res.send(printableHtml);
    } catch (error) {
      console.error("Error generating offer letter PDF:", error);
      res.status(500).json({ message: "Failed to generate offer letter PDF" });
    }
  });

  // Send offer letter via email
  app.post('/api/offer-letters/:id/send-email', async (req, res) => {
    try {
      const offerLetter = await storage.getOfferLetter(req.params.id);
      if (!offerLetter) {
        return res.status(404).json({ message: "Offer letter not found" });
      }

      const candidate = await storage.getCandidate(offerLetter.candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      // TODO: Implement email service  
      // For now just mark as sent
      
      // For now, just mark as email sent - full implementation would generate PDF and send
      await storage.updateOfferLetter(req.params.id, {
        emailSent: true,
        emailSentAt: new Date()
      });

      res.json({ message: "Offer letter email sent successfully" });
    } catch (error) {
      console.error("Error sending offer letter email:", error);
      res.status(500).json({ message: "Failed to send offer letter email" });
    }
  });

  // Offer Letter CRUD routes
  app.get('/api/offer-letters', async (req, res) => {
    try {
      const offerLetters = await storage.getOfferLetters();
      res.json(offerLetters);
    } catch (error) {
      console.error("Error fetching offer letters:", error);
      res.status(500).json({ message: "Failed to fetch offer letters" });
    }
  });

  app.get('/api/offer-letters/:id', async (req, res) => {
    try {
      const offerLetter = await storage.getOfferLetter(req.params.id);
      if (!offerLetter) {
        return res.status(404).json({ message: "Offer letter not found" });
      }
      res.json(offerLetter);
    } catch (error) {
      console.error("Error fetching offer letter:", error);
      res.status(500).json({ message: "Failed to fetch offer letter" });
    }
  });

  app.put('/api/offer-letters/:id', async (req, res) => {
    try {
      const offerLetterData = insertOfferLetterSchema.partial().parse(req.body);
      const offerLetter = await storage.updateOfferLetter(req.params.id, offerLetterData);
      res.json(offerLetter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid offer letter data", errors: error.errors });
      }
      console.error("Error updating offer letter:", error);
      res.status(500).json({ message: "Failed to update offer letter" });
    }
  });

  app.delete('/api/offer-letters/:id', async (req, res) => {
    try {
      await storage.deleteOfferLetter(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting offer letter:", error);
      res.status(500).json({ message: "Failed to delete offer letter" });
    }
  });

  // Bulk delete offer letters
  app.post('/api/offer-letters/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty offer letter IDs array" });
      }
      
      await storage.bulkDeleteOfferLetters(ids);
      
      res.json({ message: `${ids.length} offer letter${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting offer letters:", error);
      res.status(500).json({ message: "Failed to delete offer letters" });
    }
  });

  // Bulk import offer letters
  app.post('/api/offer-letters/bulk-import', async (req, res) => {
    try {
      const { offerLetters: importData } = req.body;
      if (!Array.isArray(importData) || importData.length === 0) {
        return res.status(400).json({ message: "Invalid or empty offer letters array" });
      }
      
      const createdOfferLetters = [];
      for (const data of importData) {
        const offerLetterData = insertOfferLetterSchema.parse(data);
        const offerLetter = await storage.createOfferLetter(offerLetterData);
        createdOfferLetters.push(offerLetter);
      }
      
      res.status(201).json({ 
        message: `${createdOfferLetters.length} offer letter${createdOfferLetters.length !== 1 ? 's' : ''} imported successfully`,
        offerLetters: createdOfferLetters 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid offer letter data", errors: error.errors });
      }
      console.error("Error importing offer letters:", error);
      res.status(500).json({ message: "Failed to import offer letters" });
    }
  });

  // Client APIs
  app.get('/api/clients', async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:id', async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', async (req, res) => {
    try {
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, clientData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id', async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Client Requirements APIs
  app.get('/api/client-requirements', async (req, res) => {
    try {
      const requirements = await storage.getClientRequirements();
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching client requirements:", error);
      res.status(500).json({ message: "Failed to fetch client requirements" });
    }
  });

  app.get('/api/client-requirements/:id', async (req, res) => {
    try {
      const requirement = await storage.getClientRequirement(req.params.id);
      if (!requirement) {
        return res.status(404).json({ message: "Client requirement not found" });
      }
      res.json(requirement);
    } catch (error) {
      console.error("Error fetching client requirement:", error);
      res.status(500).json({ message: "Failed to fetch client requirement" });
    }
  });

  app.post('/api/client-requirements', async (req, res) => {
    try {
      const requirementData = insertClientRequirementSchema.parse(req.body);
      const requirement = await storage.createClientRequirement(requirementData);
      res.status(201).json(requirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client requirement data", errors: error.errors });
      }
      console.error("Error creating client requirement:", error);
      res.status(500).json({ message: "Failed to create client requirement" });
    }
  });

  app.put('/api/client-requirements/:id', async (req, res) => {
    try {
      const requirementData = insertClientRequirementSchema.partial().parse(req.body);
      const requirement = await storage.updateClientRequirement(req.params.id, requirementData);
      res.json(requirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client requirement data", errors: error.errors });
      }
      console.error("Error updating client requirement:", error);
      res.status(500).json({ message: "Failed to update client requirement" });
    }
  });

  app.delete('/api/client-requirements/:id', async (req, res) => {
    try {
      await storage.deleteClientRequirement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client requirement:", error);
      res.status(500).json({ message: "Failed to delete client requirement" });
    }
  });

  // Bulk delete client requirements
  app.post('/api/client-requirements/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty requirement IDs array" });
      }
      
      await storage.bulkDeleteClientRequirements(ids);
      
      res.json({ message: `${ids.length} requirement${ids.length !== 1 ? 's' : ''} deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting client requirements:", error);
      res.status(500).json({ message: "Failed to delete client requirements" });
    }
  });

  // File upload endpoint for client requirement attachments
  app.post('/api/client-requirements/upload', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Company Profile routes - for Settings section
  app.get('/api/company-profile', async (req, res) => {
    try {
      const profile = await storage.getCompanyProfile();
      res.json(profile);
    } catch (error) {
      console.error("Error fetching company profile:", error);
      res.status(500).json({ message: "Failed to fetch company profile" });
    }
  });

  app.post('/api/company-profile', async (req, res) => {
    try {
      const profileData = insertCompanyProfileSchema.parse(req.body);
      const profile = await storage.createCompanyProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company profile data", errors: error.errors });
      }
      console.error("Error creating company profile:", error);
      res.status(500).json({ message: "Failed to create company profile" });
    }
  });

  app.put('/api/company-profile/:id', async (req, res) => {
    try {
      const profileData = insertCompanyProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCompanyProfile(req.params.id, profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company profile data", errors: error.errors });
      }
      console.error("Error updating company profile:", error);
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  // OLD ROLE SYSTEM ENDPOINTS REMOVED - USING CUSTOM ROLES SYSTEM INSTEAD

  // Email service routes
  // /api/emails routes removed - functionality moved to EmailTemplateService
  app.use('/api/graph-email', graphEmailRoutes);
  app.use('/api/email-templates', emailTemplateRoutes);
  app.use('/api/module-templates', moduleTemplateRoutes);

  // Register skills routes
  const { registerSkillsRoutes } = await import("./routes/skills");
  registerSkillsRoutes(app);

  // Candidate Portal routes
  const candidatePortalRoutes = await import('./routes/candidatePortalRoutes');
  app.use('/api/candidate-portal', candidatePortalRoutes.default);
  
  // Public interview confirmation route (no authentication required)
  app.get('/candidate-portal/interviews/:id/confirm', async (req, res) => {
    try {
      const interviewId = req.params.id;
      
      // Get interview details
      const interview = await storage.getInterview(interviewId);
      if (!interview) {
        return res.status(404).send(`
          <html>
            <head><title>Interview Not Found</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <h2 style="color: #dc3545;">Interview Not Found</h2>
              <p>The interview you're trying to confirm could not be found. Please check the link or contact us for assistance.</p>
              <p><a href="/candidate-portal" style="color: #007bff;">Go to Candidate Portal</a></p>
            </body>
          </html>
        `);
      }

      // Get application and candidate details
      const application = await storage.getApplication(interview.applicationId);
      if (!application) {
        return res.status(404).send(`
          <html>
            <head><title>Application Not Found</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <h2 style="color: #dc3545;">Application Not Found</h2>
              <p>The associated application could not be found.</p>
            </body>
          </html>
        `);
      }

      const candidate = await storage.getCandidate(application.candidateId);
      const job = await storage.getJob(application.jobId);

      // Format interview details for display
      const interviewDate = new Date(interview.scheduledDate);
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Generate confirmation page
      const confirmationPage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Confirmation - O2F Info Solutions</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; min-height: 100vh; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 40px; }
            .interview-card { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 30px; margin: 20px 0; }
            .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
            .detail-row { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: 600; color: #374151; display: inline-block; width: 140px; }
            .detail-value { color: #6b7280; }
            .meeting-link { background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center; }
            .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 10px 0; }
            .btn:hover { background: #1d4ed8; }
            .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 30px; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>O2F Info Solutions</h1>
              <p>Interview Confirmation</p>
            </div>
            
            <div class="content">
              <div class="status-badge">✓ Interview Confirmed</div>
              <h2>Your interview details for ${job?.title || 'Position'}</h2>
              
              <div class="interview-card">
                <h3 style="color: #1e40af; margin-top: 0;">Interview Information</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Candidate:</span>
                  <span class="detail-value">${candidate?.name || 'Candidate'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Position:</span>
                  <span class="detail-value">${job?.title || 'Position'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Interview Round:</span>
                  <span class="detail-value">${interview.interviewRound || 'Interview'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${formattedTime}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Interviewer:</span>
                  <span class="detail-value">${interview.interviewer || 'TBD'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Mode:</span>
                  <span class="detail-value">${interview.mode || 'TBD'}</span>
                </div>
              </div>
              
              ${interview.mode === 'Teams' && interview.teamsMeetingUrl ? `
                <div class="meeting-link">
                  <h4 style="margin-top: 0; color: #1e40af;">Microsoft Teams Meeting</h4>
                  <p>Join your interview using the Teams meeting link below:</p>
                  <a href="${interview.teamsMeetingUrl}" class="btn">Join Teams Meeting</a>
                  <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Save this link for your interview</p>
                </div>
              ` : ''}
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h4 style="color: #92400e; margin-top: 0;">Important Reminders:</h4>
                <ul style="color: #92400e; margin-bottom: 0;">
                  <li>Please join the meeting 5 minutes before the scheduled time</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Test your camera and microphone beforehand</li>
                  <li>Have your resume and portfolio ready</li>
                  <li>Prepare questions about the role and company</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="/candidate-portal" class="btn" style="margin-right: 15px;">Go to Portal</a>
                <a href="mailto:hr@o2finfosolutions.com" class="btn" style="background: #6b7280;">Contact HR</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>O2F Info Solutions Private Limited</strong></p>
              <p>Building Excellence in IT Solutions</p>
              <p>For any questions, please contact us at hr@o2finfosolutions.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      res.send(confirmationPage);
    } catch (error) {
      console.error('Interview confirmation error:', error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #dc3545;">Something went wrong</h2>
            <p>We encountered an error processing your request. Please try again later or contact us for assistance.</p>
            <p><a href="mailto:hr@o2finfosolutions.com" style="color: #007bff;">Contact HR</a></p>
          </body>
        </html>
      `);
    }
  });
  
  // Custom Roles API - Primary Role System
  app.get("/api/custom-roles", async (req, res) => {
    try {
      const roles = await storage.getCustomRoles();
      
      // Add user count and permission count for each role
      const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
          const userCount = await storage.getUserCountByCustomRole(role.id);
          const permissions = await storage.getCustomRolePermissions(role.id);
          return {
            ...role,
            userCount: userCount.toString(),
            permissionCount: permissions.length.toString(),
          };
        })
      );
      
      res.json(rolesWithCounts);
    } catch (error) {
      console.error("Error fetching custom roles:", error);
      res.status(500).json({ message: "Failed to fetch custom roles" });
    }
  });

  // Create new custom role - Primary role creation endpoint
  app.post("/api/custom-roles", async (req, res) => {
    try {
      const { name, description, color } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }
      
      const newRole = await storage.createCustomRole({
        name,
        description,
        color: color || "#6366f1",
        isActive: true,
      });
      
      // Create default permissions for all modules
      const modules = [
        'dashboard', 'candidates', 'jobs', 'applications', 'interviews',
        'offer_letters', 'clients', 'client_requirements', 'reports',
        'settings', 'user_management', 'role_management'
      ];
      
      for (const module of modules) {
        await storage.createCustomRolePermission({
          roleId: newRole.id,
          module,
          permissions: {
            view: false,
            add: false,
            edit: false,
            delete: false,
            export: false,
            import: false,
          },
        });
      }
      
      res.status(201).json({
        ...newRole,
        userCount: "0",
      });
    } catch (error) {
      console.error("Error creating custom role:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.message?.includes('unique')) {
        return res.status(409).json({ message: "Role name already exists" });
      }
      res.status(500).json({ message: "Failed to create custom role" });
    }
  });

  app.delete("/api/custom-roles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if any users are assigned to this role
      const userCount = await storage.getUserCountByCustomRole(id);
      if (userCount > 0) {
        return res.status(400).json({ 
          message: "Cannot delete role with assigned users. Remove users first." 
        });
      }
      
      await storage.deleteCustomRole(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom role:", error);
      res.status(500).json({ message: "Failed to delete custom role" });
    }
  });

  app.get("/api/custom-roles/:roleId/permissions", async (req, res) => {
    try {
      const { roleId } = req.params;
      const permissions = await storage.getCustomRolePermissions(roleId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.put("/api/custom-roles/:roleId/permissions", async (req, res) => {
    try {
      const { roleId } = req.params;
      const { module, permissions } = req.body;
      
      if (!module || !permissions) {
        return res.status(400).json({ message: "Module and permissions are required" });
      }
      
      await storage.updateCustomRolePermission(roleId, module, permissions);
      
      // Clear any cached permissions for users with this role
      console.log(`🔄 Permissions updated for role ${roleId} - invalidating user sessions`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // Get current user's permissions
  app.get("/api/user/permissions", authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get user's custom role assignment
      const userRole = await storage.getUserCustomRole(req.user.id);
      if (!userRole) {
        return res.json({ permissions: {}, role: null });
      }

      // Get role details
      const role = await storage.getCustomRole(userRole.customRoleId);
      if (!role) {
        return res.json({ permissions: {}, role: null });
      }

      // Get permissions for the role
      const permissions = await storage.getCustomRolePermissions(userRole.customRoleId);
      
      // Format permissions as a module -> permissions object
      const formattedPermissions = permissions.reduce((acc, perm) => {
        acc[perm.module] = perm.permissions;
        return acc;
      }, {} as Record<string, any>);

      res.json({ 
        permissions: formattedPermissions,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          color: role.color
        }
      });
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // User Role Assignment API
  app.put("/api/users/:userId/custom-role", async (req, res) => {
    try {
      const { userId } = req.params;
      const { customRoleId } = req.body;
      const currentUser = req.user as any;
      
      if (customRoleId) {
        await storage.assignCustomRoleToUser(userId, customRoleId, currentUser.id);
        console.log(`🔗 Role ${customRoleId} assigned to user ${userId}`);
      } else {
        await storage.removeCustomRoleFromUser(userId);
        console.log(`🔗 Custom role removed from user ${userId}`);
      }
      
      // Force permission refresh for this user on next request
      console.log(`🔄 Role assignment changed for user ${userId} - permissions will refresh on next login`);
      
      res.json({ 
        success: true, 
        message: "Role assigned successfully. User should refresh/re-login to see updated permissions.",
        requiresRefresh: true 
      });
    } catch (error) {
      console.error("Error assigning custom role:", error);
      res.status(500).json({ message: "Failed to assign custom role" });
    }
  });

  // Notification routes
  app.get('/api/notifications', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const notifications = await storage.getUnreadNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.get('/api/notifications/unread/count', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  app.put('/api/notifications/:id/read', authenticateUser, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', authenticateUser, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Activity Log routes
  app.get('/api/activity-logs', authenticateUser, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = await storage.getActivityLogs(limit, offset);
      const totalCount = await storage.getActivityLogsCount();
      
      res.json({
        logs,
        totalCount,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.get('/api/activity-logs/user/:userId', authenticateUser, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getActivityLogsByUser(req.params.userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user activity logs:", error);
      res.status(500).json({ message: "Failed to fetch user activity logs" });
    }
  });

  // Batch activity logging endpoint for frontend tracking
  app.post('/api/activity-logs/batch', async (req, res) => {
    try {
      const { events } = req.body;
      
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ message: "Events array is required" });
      }

      let processedCount = 0;
      let errorCount = 0;

      for (const event of events) {
        try {
          // Skip anonymous users to avoid foreign key constraint violations
          if (!event.userId || event.userId === 'anonymous') {
            errorCount++;
            continue;
          }
          
          await ActivityLogger.logCustomActivity(
            event.userId,
            event.action,
            `Frontend activity: ${event.action}`,
            req,
            true,
            event.entityType,
            event.entityId,
            event.metadata
          );
          processedCount++;
        } catch (error) {
          console.error('Failed to process activity event:', error);
          errorCount++;
        }
      }

      res.json({ 
        processed: processedCount, 
        errors: errorCount,
        total: events.length
      });
    } catch (error) {
      console.error("Error processing activity batch:", error);
      res.status(500).json({ message: "Failed to process activity batch" });
    }
  });

  // Admin endpoints for monitoring
  app.get('/api/admin/user-journeys', authenticateUser, async (req, res) => {
    try {
      const userJourneys = await storage.getUserJourneyStates();
      
      // Transform database data to frontend format
      const transformedJourneys = userJourneys.map((journey: any) => {
        // Calculate status based on journey data
        let status = 'pending';
        if (journey.journeyCompleted) status = 'completed';
        else if (journey.isStuck) status = 'stuck';
        else if (journey.firstLoginSuccess) status = 'active';
        else if (journey.invitationSent && !journey.passwordSetupCompleted) status = 'pending';
        
        return {
          id: journey.id,
          userId: journey.userId,
          userEmail: journey.user?.email || 'Unknown',
          currentStage: journey.currentStage || 'invited',
          startedAt: journey.createdAt,
          lastActivity: journey.lastActivityAt || journey.updatedAt,
          status: status,
          invitationSent: journey.invitationSent,
          emailDelivered: journey.emailDelivered,
          emailOpened: journey.emailOpened,
          passwordSetupCompleted: journey.passwordSetupCompleted,
          firstLoginSuccess: journey.firstLoginSuccess,
          totalSessions: journey.totalSessions || 0,
          isStuck: journey.isStuck,
          errorCount: journey.errorCount || 0
        };
      });
      
      res.json(transformedJourneys);
    } catch (error) {
      console.error("Error fetching user journeys:", error);
      res.status(500).json({ message: "Failed to fetch user journeys" });
    }
  });

  app.get('/api/admin/system/metrics', authenticateUser, async (req, res) => {
    try {
      // Mock system metrics - will be enhanced with real system monitoring
      const metrics = {
        status: 'healthy',
        uptime: '2d 4h 15m',
        responseTime: 150,
        database: {
          status: 'connected',
          connections: 5,
          maxConnections: 100,
          queryTime: 25
        },
        server: {
          cpuUsage: 35,
          memoryUsage: 62,
          diskUsage: 45,
          load: [0.5, 0.8, 1.2]
        },
        errors: {
          last24h: 3,
          lastHour: 0,
          trend: 'down'
        },
        performance: {
          avgResponseTime: 180,
          slowQueries: 2,
          cacheHitRate: 95
        }
      };
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.get('/api/admin/system/errors', authenticateUser, async (req, res) => {
    try {
      // Mock error logs - will be enhanced with real error tracking
      const errors = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          severity: 'warning',
          message: 'Database query took longer than expected',
          component: 'Database',
          count: 1,
          userAffected: req.user?.email || 'system'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          severity: 'error',
          message: 'Failed to send email notification',
          component: 'Email Service',
          count: 2,
          userAffected: 'notifications@example.com'
        }
      ];
      res.json(errors);
    } catch (error) {
      console.error("Error fetching system errors:", error);
      res.status(500).json({ message: "Failed to fetch system errors" });
    }
  });

  // Feedback system endpoints
  app.post('/api/feedback', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const feedbackData = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback({
        ...feedbackData,
        userId: req.user.id,
      });

      // Log the feedback submission with comprehensive tracking
      await ActivityLogger.logFeedbackSubmitted(
        req.user.id,
        feedback.id,
        feedbackData.type,
        feedbackData.title,
        feedbackData.priority,
        req
      );

      res.status(201).json(feedback);
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get('/api/feedback', authenticateUser, async (req, res) => {
    try {
      const { status, type, priority } = req.query;
      const filters = { status, type, priority };
      const feedbackList = await storage.getFeedbackList(filters);
      res.json(feedbackList);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.get('/api/feedback/:id', authenticateUser, async (req, res) => {
    try {
      const feedback = await storage.getFeedback(req.params.id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.put('/api/feedback/:id', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const feedbackData = insertFeedbackSchema.partial().parse(req.body);
      const feedback = await storage.updateFeedback(req.params.id, feedbackData);
      
      await ActivityLogger.logFeedbackUpdated(
        req.user.id,
        req.params.id,
        feedback.title,
        feedbackData.status || feedback.status,
        req
      );

      res.json(feedback);
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  app.delete('/api/feedback/:id', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const feedback = await storage.getFeedback(req.params.id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      await storage.deleteFeedback(req.params.id);
      
      // Create notification for feedback deletion
      await storage.createNotification({
        userId: req.user.id,
        title: "Feedback Deleted",
        message: `Feedback item "${feedback.title}" has been successfully deleted.`,
        type: "success",
        actionUrl: "/settings/feedback-management"
      });
      
      await ActivityLogger.logSystemAction(
        req.user.id,
        'status_change',
        `Deleted feedback: ${feedback.title}`,
        req,
        true
      );

      res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({ message: "Failed to delete feedback" });
    }
  });

  // Departments endpoints
  app.get('/api/departments', authenticateUser, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Failed to fetch departments' });
    }
  });

  app.post('/api/departments', authenticateUser, async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error: unknown) {
      console.error('Error creating department:', error);
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid department data', errors: (error as any).errors });
      }
      res.status(500).json({ message: 'Failed to create department' });
    }
  });

  app.get('/api/departments/:id', authenticateUser, async (req, res) => {
    try {
      const department = await storage.getDepartment(req.params.id);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      res.json(department);
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({ message: 'Failed to fetch department' });
    }
  });

  app.put('/api/departments/:id', authenticateUser, async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(req.params.id, departmentData);
      res.json(department);
    } catch (error: unknown) {
      console.error('Error updating department:', error);
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid department data', errors: (error as any).errors });
      }
      res.status(500).json({ message: 'Failed to update department' });
    }
  });

  app.delete('/api/departments/:id', authenticateUser, async (req, res) => {
    try {
      await storage.deleteDepartment(req.params.id);
      res.json({ message: 'Department deleted successfully' });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ message: 'Failed to delete department' });
    }
  });

  // Get users who can be managers (Account Managers, Team Leads)
  app.get('/api/users/managers', authenticateUser, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Filter users who can be managers (you can customize this logic)
      const managers = users.filter(user => user.isActive);
      res.json(managers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      res.status(500).json({ message: 'Failed to fetch managers' });
    }
  });

  // Test notification system endpoint
  app.post('/api/test-notifications', authenticateUser, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Create test notifications directly
      const testNotifications = [
        {
          userId: req.user.id,
          title: "🎉 Welcome Test",
          message: "This is a test success notification to verify the notification system is working!",
          type: "success" as const,
          actionUrl: "/dashboard"
        },
        {
          userId: req.user.id,
          title: "⚠️ System Alert",
          message: "This is a test warning notification. Your profile may need attention.",
          type: "warning" as const,
          actionUrl: "/settings"
        },
        {
          userId: req.user.id,
          title: "📢 New Feature",
          message: "Check out our new candidate tracking feature! Now available in the dashboard.",
          type: "info" as const,
          actionUrl: "/candidates"
        },
        {
          userId: req.user.id,
          title: "⚙️ System Maintenance",
          message: "System maintenance scheduled for tonight. Some features may be temporarily unavailable.",
          type: "system" as const,
          actionUrl: "/system-status"
        }
      ];

      // Create all test notifications
      for (const notification of testNotifications) {
        await storage.createNotification(notification);
      }
      
      console.log(`🔔 Created ${testNotifications.length} test notifications for ${req.user.email}`);
      
      res.json({ 
        success: true,
        count: testNotifications.length,
        message: "Test notifications created successfully! Check your notification bell."
      });
    } catch (error) {
      console.error('Error creating test notifications:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Test email workflow endpoint
  app.post('/api/test-email-workflow', async (req, res) => {
    try {
      const { testCompleteEmailWorkflow } = await import('./test-email-workflow');
      const result = await testCompleteEmailWorkflow();
      res.json(result);
    } catch (error) {
      console.error('Error running email workflow test:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
