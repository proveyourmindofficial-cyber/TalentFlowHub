import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertCandidateSchema, insertApplicationSchema, insertInterviewSchema, insertOfferLetterSchema, insertClientSchema, insertClientRequirementSchema, insertCompanyProfileSchema } from "@shared/schema";
import { z } from "zod";
import { validateCandidateTypeFields, uanNumberSchema, aadhaarNumberSchema, linkedinUrlSchema } from "./validationUtils";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import emailRoutes from "./routes/emailRoutes";
import graphEmailRoutes from "./routes/graphEmailRoutes";
import emailTemplateRoutes from "./routes/emailTemplateRoutes";
import moduleTemplateRoutes from "./routes/moduleTemplateRoutes";
import { graphEmailService } from './services/graphEmailService';
import { authenticateOffice365, authenticateUser, optionalAuth, requireRole } from "./auth";
// Remove html-pdf-node import due to compatibility issues

// User invitation email function
async function sendUserInvitationEmail(email: string, firstName: string, lastName: string, customRoleId?: string) {
  try {
    let roleName = 'Team Member';
    if (customRoleId) {
      const customRole = await storage.getCustomRole(customRoleId);
      roleName = customRole?.name || 'Team Member';
    }

    const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px; border-radius: 8px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 28px; margin: 0; color: #2c3e50;">Welcome to TalentFlowHub</h1>
    <p style="font-size: 16px; margin: 10px 0; color: #6c757d;">Your account has been created successfully</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #e9ecef;">
    <h2 style="font-size: 22px; margin: 0 0 15px 0; color: #2c3e50;">Hello ${firstName},</h2>
    <p style="font-size: 16px; margin: 0; color: #495057; line-height: 1.6;">
      You have been assigned the role of <strong style="color: #0d6efd;">${roleName}</strong>.<br>
      Please access the platform to get started.
    </p>
  </div>

  <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
    <h3 style="text-align: center; color: #2c3e50; font-size: 18px; margin: 0 0 20px 0;">Getting Started</h3>
    
    <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #0d6efd;">
      <span style="color: #495057;">1. Click the access button below</span>
    </div>
    
    <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;">
      <span style="color: #495057;">2. Sign in with your email: ${email}</span>
    </div>
    
    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #17a2b8;">
      <span style="color: #495057;">3. Complete your profile setup</span>
    </div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://3a768656-1b58-4ca5-99eb-6aeac124d635-00-nc308u1dc0mp.riker.replit.dev" 
       style="display: inline-block; background: #0d6efd; color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 12px 24px; border-radius: 6px; text-align: center;">
      Access Dashboard
    </a>
    <p style="margin: 15px 0 0 0; font-size: 12px; color: #6c757d;">
      Click the button above to access your account
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
      TalentFlowHub Team
    </p>
  </div>
  
</div>`;

    await graphEmailService.sendEmail({
      to: email,
      subject: '🎉 Welcome to TalentFlowHub - Your Gen-Z Account is Ready!',
      body: emailBody,
      isHtml: true,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send user invitation email:', error);
    return false;
  }
}

// Email helper function for all modules
async function sendModuleEmail(templateKey: string, recipientEmail: string, data: any) {
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
    if (emailContent) {
      emailContent = emailContent.replace(/\{\{company\.name\}\}/g, 'TalentFlow Technologies');
      subject = subject.replace(/\{\{company\.name\}\}/g, 'TalentFlow Technologies');
    }
    
    // Replace application placeholders
    if (data.application) {
      emailContent = emailContent.replace(/\{\{application\.submittedAt\}\}/g, new Date().toLocaleDateString());
      emailContent = emailContent.replace(/\{\{application\.referenceId\}\}/g, `TFT-${Date.now()}`);
      emailContent = emailContent.replace(/\{\{application\.trackingLink\}\}/g, 'https://talentflow.tech/track');
    }
    
    // Replace interview placeholders
    if (data.interview) {
      emailContent = emailContent.replace(/\{\{interview\.date\}\}/g, new Date(data.interview.scheduledDate).toLocaleDateString());
      emailContent = emailContent.replace(/\{\{interview\.time\}\}/g, new Date(data.interview.scheduledDate).toLocaleTimeString());
      emailContent = emailContent.replace(/\{\{interview\.type\}\}/g, data.interview.interviewRound || 'Interview');
      emailContent = emailContent.replace(/\{\{interview\.duration\}\}/g, '60 minutes');
      emailContent = emailContent.replace(/\{\{interview\.location\}\}/g, data.interview.mode === 'video_call' ? 'Virtual Meeting' : 'Office');
      emailContent = emailContent.replace(/\{\{interview\.meetingLink\}\}/g, 'https://meet.google.com/abc-defg-hij');
      emailContent = emailContent.replace(/\{\{interview\.confirmationLink\}\}/g, 'https://talentflow.tech/confirm-interview');
    }
    
    // Replace offer placeholders
    if (data.offer) {
      emailContent = emailContent.replace(/\{\{offer\.startDate\}\}/g, new Date().toLocaleDateString());
      emailContent = emailContent.replace(/\{\{offer\.salary\}\}/g, '₹15,00,000 per annum');
      emailContent = emailContent.replace(/\{\{offer\.benefits\}\}/g, 'Health Insurance, Flexible Work, Learning Budget');
      emailContent = emailContent.replace(/\{\{offer\.reportingManager\}\}/g, 'Reporting Manager');
      emailContent = emailContent.replace(/\{\{offer\.responseDeadline\}\}/g, new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString());
      emailContent = emailContent.replace(/\{\{offer\.acceptanceLink\}\}/g, 'https://talentflow.tech/accept-offer');
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
      to: recipientEmail,
      subject: subject,
      body: wrappedContent,
      isHtml: true,
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
  app.get('/api/auth/user', authenticateOffice365, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user information" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    res.json({ 
      message: "Please authenticate with Office 365",
      authUrl: "Use your organization's Office 365 login"
    });
  });

  app.post('/api/auth/logout', async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Simple login for development (bypass Office 365 issues)
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found. Please contact admin to create your account.' });
      }

      // Create a simple session token
      const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
      
      res.json({ 
        user,
        token,
        message: 'Login successful' 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // User management routes - Allow public access for now until authentication is setup
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get users with their custom roles - This is what the frontend actually calls
  app.get('/api/users-with-custom-roles', async (req, res) => {
    try {
      const users = await storage.getUsersWithCustomRoles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users with custom roles:", error);
      res.status(500).json({ message: "Failed to fetch users with custom roles" });
    }
  });

  app.post('/api/users', async (req, res) => {
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

      // Create user with custom role  
      const user = await storage.createUser({
        username: username || email,
        email,
        firstName,
        lastName,
        roleId: customRoleId || null,
        department: department || 'Recruitment',
        isActive: isActive !== undefined ? isActive : true
      });

      // Send welcome email invitation
      try {
        await sendUserInvitationEmail(email, firstName, lastName, customRoleId);
        console.log(`📧 Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id/role', async (req, res) => {
    try {
      const { customRoleId } = req.body;
      
      // Validate custom role if provided
      if (customRoleId) {
        const customRole = await storage.getCustomRole(customRoleId);
        if (!customRole) {
          return res.status(400).json({ message: "Invalid custom role ID" });
        }
      }

      // Prevent changing super admin role
      const existingUser = await storage.getUser(req.params.id);
      if (existingUser?.email === 'itsupport@o2finfosolutions.com') {
        return res.status(403).json({ message: "Cannot change super admin role" });
      }
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

  // Endpoint that the frontend is actually calling
  app.put('/api/users/:id/custom-role', async (req, res) => {
    try {
      const { customRoleId } = req.body;
      
      // Validate custom role if provided
      if (customRoleId) {
        const customRole = await storage.getCustomRole(customRoleId);
        if (!customRole) {
          return res.status(400).json({ message: "Invalid custom role ID" });
        }
      }

      // Prevent changing super admin role
      const existingUser = await storage.getUser(req.params.id);
      if (existingUser?.email === 'itsupport@o2finfosolutions.com') {
        return res.status(403).json({ message: "Cannot change super admin role" });
      }

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

  // Resend invitation email endpoint
  app.post('/api/users/:id/resend-invitation', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Send invitation email
      const success = await sendUserInvitationEmail(
        user.email || '', 
        user.firstName || '', 
        user.lastName || '', 
        user.roleId || undefined
      );

      if (success) {
        res.json({ message: "Invitation email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send invitation email" });
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      // Prevent deleting super admin
      const existingUser = await storage.getUser(req.params.id);
      if (existingUser?.email === 'itsupport@o2finfosolutions.com') {
        return res.status(403).json({ message: "Cannot delete super admin account" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Jobs routes
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
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

  app.post('/api/jobs', async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
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

  app.put('/api/jobs/:id', async (req, res) => {
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

  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Bulk delete jobs
  app.post('/api/jobs/bulk-delete', async (req, res) => {
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

  // Bulk delete jobs
  app.post('/api/jobs/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty job IDs array" });
      }
      
      for (const id of ids) {
        await storage.deleteJob(id);
      }
      
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
        candidateData.registrationDate = new Date();
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
          emailContent = emailContent.replace(/\{\{candidate\.name\}\}/g, candidate.name || 'Candidate');
          subject = subject.replace(/\{\{candidate\.name\}\}/g, candidate.name || 'Candidate');
          
          // Replace company placeholders
          emailContent = emailContent.replace(/\{\{company\.name\}\}/g, 'TalentFlow Technologies');
          subject = subject.replace(/\{\{company\.name\}\}/g, 'TalentFlow Technologies');
          
          // Add other placeholders
          emailContent = emailContent.replace(/\{\{candidate\.portalLink\}\}/g, 'https://talentflow.tech/portal');
          
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
          });
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
          });
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

  // Helper function to apply interview automation rules
  async function applyInterviewAutomation(interview: any) {
    try {
      const application = await storage.getApplication(interview.applicationId);
      if (!application) return;

      let newApplicationStage: string;
      let newCandidateStatus: string;

      // Rule 1: HR + Completed + Feedback rules (highest priority)
      if (interview.interviewRound === 'HR' && interview.status === 'Completed' && interview.feedbackResult) {
        switch (interview.feedbackResult) {
          case 'Selected':
            newApplicationStage = 'Selected';
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
      // Rule 2: L1/L2/Final rounds (any status) - Reset to interviewing state
      else if (['L1', 'L2', 'Final'].includes(interview.interviewRound)) {
        newApplicationStage = 'Shortlisted';
        newCandidateStatus = 'Interviewing';
      }
      // Rule 3: Default fallback for any other scenarios
      else {
        newApplicationStage = 'Shortlisted';
        newCandidateStatus = 'Interviewing';
      }

      // Apply the calculated statuses atomically
      await storage.updateApplication(interview.applicationId, { 
        stage: newApplicationStage as any 
      });
      await storage.updateCandidate(application.candidateId, { 
        status: newCandidateStatus as any 
      });

      console.log(`Interview automation applied: ${interview.interviewRound} ${interview.status} ${interview.feedbackResult || ''} → App: ${newApplicationStage}, Candidate: ${newCandidateStatus}`);

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
      const interview = await storage.createInterview(interviewData);
      
      // Apply comprehensive interview automation
      await applyInterviewAutomation(interview);
      
      // Send interview scheduled email
      try {
        const application = await storage.getApplication(interview.applicationId);
        if (application) {
          const candidate = await storage.getCandidate(application.candidateId);
          const job = await storage.getJob(application.jobId);
          if (candidate && candidate.email) {
            await sendModuleEmail('interview_scheduled', candidate.email, {
              candidate,
              job,
              application,
              interview
            });
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
      
      // Apply comprehensive interview automation (ALWAYS recalculate fresh)
      await applyInterviewAutomation(interview);
      
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
                await sendModuleEmail('application_shortlisted', candidate.email, {
                  candidate, job, application, interview
                });
              } else if (interview.feedbackResult === 'Rejected') {
                await sendModuleEmail('application_rejected', candidate.email, {
                  candidate, job, application, interview
                });
              } else {
                // Send general feedback request for other results
                await sendModuleEmail('interview_feedback_request', candidate.email, {
                  candidate, job, application, interview
                });
              }
            }
            // Send reminder if interview date changed and is tomorrow
            else if (originalInterview.scheduledDate !== interview.scheduledDate) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const interviewDate = new Date(interview.scheduledDate);
              
              if (interviewDate.toDateString() === tomorrow.toDateString()) {
                await sendModuleEmail('interview_reminder', candidate.email, {
                  candidate, job, application, interview
                });
              }
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
          });
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

  // Role Management API endpoints
  app.get("/api/roles", requireRole(['director']), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", requireRole(['director']), async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", requireRole(['director']), async (req, res) => {
    try {
      const roleData = insertRoleSchema.partial().parse(req.body);
      const role = await storage.updateRole(req.params.id, roleData);
      res.json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", requireRole(['director']), async (req, res) => {
    try {
      await storage.deleteRole(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  app.get("/api/permissions", requireRole(['director']), async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/roles/:id/permissions", requireRole(['director']), async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.put("/api/roles/:id/permissions", requireRole(['director']), async (req, res) => {
    try {
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ message: "permissionIds must be an array" });
      }

      // Get current permissions for the role
      const currentPermissions = await storage.getRolePermissions(req.params.id);
      const currentPermissionIds = currentPermissions.map(p => p.id);

      // Determine what to add and remove
      const toAdd = permissionIds.filter(id => !currentPermissionIds.includes(id));
      const toRemove = currentPermissionIds.filter(id => !permissionIds.includes(id));

      // Update permissions
      if (toRemove.length > 0) {
        await storage.removeRolePermissions(req.params.id, toRemove);
      }
      if (toAdd.length > 0) {
        await storage.assignRolePermissions(req.params.id, toAdd);
      }

      // Return updated permissions
      const updatedPermissions = await storage.getRolePermissions(req.params.id);
      res.json(updatedPermissions);
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // Email service routes
  app.use('/api/emails', emailRoutes);
  app.use('/api/graph-email', graphEmailRoutes);
  app.use('/api/email-templates', emailTemplateRoutes);
  app.use('/api/module-templates', moduleTemplateRoutes);

  // Register skills routes
  const { registerSkillsRoutes } = await import("./routes/skills");
  registerSkillsRoutes(app);

  // Candidate Portal routes
  const candidatePortalRoutes = await import('./routes/candidatePortalRoutes');
  app.use('/api/candidate-portal', candidatePortalRoutes.default);
  
  // Custom Roles API - Primary Role System
  app.get("/api/custom-roles", async (req, res) => {
    try {
      const roles = await storage.getCustomRoles();
      
      // Add user count for each role
      const rolesWithCounts = await Promise.all(
        roles.map(async (role) => {
          const userCount = await storage.getUserCountByCustomRole(role.id);
          return {
            ...role,
            userCount: userCount.toString(),
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
      console.error("Error creating custom role:", error);
      if (error.message?.includes('unique')) {
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
      } else {
        await storage.removeCustomRoleFromUser(userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning custom role:", error);
      res.status(500).json({ message: "Failed to assign custom role" });
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
