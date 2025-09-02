import type { OfferLetter, Candidate, Job } from "@shared/schema";

export class OfferLetterService {
  
  /**
   * Generate Offer Letter PDF based on the user's exact template
   * This implements the O2F Info Solutions template format exactly as provided
   */
  async generateOfferLetterPDF(offerLetter: OfferLetter, candidate: Candidate, job: Job): Promise<string> {
    try {
      // Template data matching the user's Word document exactly
      const templateData = {
        // Header Date
        date: this.formatDate(offerLetter.offerDate || new Date()),
        
        // Candidate Details
        candidateName: candidate.name,
        candidateLocation: candidate.currentLocation || "Bangalore",
        
        // Job Details
        position: offerLetter.designation,
        joiningDate: this.formatDate(offerLetter.joiningDate),
        validityDate: this.formatDate(offerLetter.joiningDate),
        workLocation: "Hyderabad", // As per template
        
        // Company Details
        companyName: "O2F Info Solutions Pvt Ltd", // Exact match from template
        hrName: offerLetter.hrName,
        
        // Salary Details (All in INR as per template)
        ctc: this.formatIndianCurrency(Number(offerLetter.ctc)),
        basicSalary: this.formatIndianCurrency(Number(offerLetter.basicSalary)),
        hra: this.formatIndianCurrency(Number(offerLetter.hra)),
        specialAllowance: this.formatIndianCurrency(Number(offerLetter.specialAllowance)),
        employerPf: this.formatIndianCurrency(Number(offerLetter.employerPf)),
        employeePf: this.formatIndianCurrency(Number(offerLetter.employeePf)),
        professionalTax: this.formatIndianCurrency(Number(offerLetter.professionalTax)),
        incomeTax: this.formatIndianCurrency(Number(offerLetter.incomeTax)),
        netSalary: this.formatIndianCurrency(Number(offerLetter.netSalary)),
        
        // Insurance Details (From template)
        medicalInsurance: "Rs.5,00,000",
        
        // Banking Details (From template)
        preferredBank: "HDFC Bank",
        
        // Employment Terms (From template)
        noticePeriod: "60 Days",
      };

      // Generate HTML content matching the exact Word template format
      const htmlContent = this.generateHTMLTemplate(templateData);
      
      // TODO: Convert HTML to PDF using a proper PDF generator
      // For now, return a placeholder URL
      const pdfUrl = `/api/offer-letters/${offerLetter.id}/pdf`;
      
      return pdfUrl;
    } catch (error) {
      console.error("Error generating offer letter PDF:", error);
      throw new Error("Failed to generate offer letter PDF");
    }
  }

  /**
   * Generate HTML template that matches the exact Word document format
   */
  private generateHTMLTemplate(data: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; margin: 1in; }
        .header { text-align: right; margin-bottom: 2em; }
        .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 2em 0 1em 0; }
        .greeting { margin: 2em 0 1em 0; }
        .congratulations { font-weight: bold; text-align: center; margin: 1em 0; }
        .paragraph { margin: 1em 0; text-align: justify; }
        .salary-details { margin: 1em 0; }
        .terms-section { margin: 2em 0; }
        .section-title { font-weight: bold; margin: 1.5em 0 0.5em 0; }
        .signature-section { margin: 3em 0 1em 0; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        ${data.date}
      </div>

      <!-- Candidate Address -->
      <div style="margin: 2em 0;">
        ${data.candidateName}<br>
        ${data.candidateLocation}
      </div>

      <!-- Title -->
      <div class="title">Offer of Employment</div>

      <!-- Greeting -->
      <div class="greeting">Dear ${data.candidateName},</div>

      <!-- Congratulations -->
      <div class="congratulations">Congratulations!!!</div>

      <!-- Main Content -->
      <div class="paragraph">
        Please refer to the interview and discussions you had with us recently.
      </div>

      <div class="paragraph">
        We are pleased to offer you the position of <strong>${data.position}</strong> at <strong>O2F Info Solutions Pvt Ltd</strong> and the joining date would be <strong>${data.joiningDate}</strong>.
      </div>

      <div class="paragraph">
        Your employment will be based at ${data.workLocation}, however, based on the position's requirements, you may be required to work anywhere in India and this offer of employment will take effect from the date of your reporting. This offer is valid up to <strong>${data.validityDate}</strong> subject to your joining on or before the given joining date.
      </div>

      <!-- Salary Details -->
      <div class="salary-details">
        <div class="paragraph">
          Your Annual CTC will be <strong>${data.ctc}</strong>. This CTC Includes Conveyance and all other allowances and benefits as applicable to you as detailed in Annexure-1. The break-up of your CTC is indicated in the attached annexure.
        </div>
      </div>

      <!-- Medical Insurance -->
      <div class="paragraph">
        You will be covered under Group Medical Insurance for a sum of <strong>${data.medicalInsurance}</strong>. Under Group Medical Insurance, Hospitalization cover can be utilized only by the employee and the benefit is not extended to any other family members.
      </div>

      <!-- Confidentiality -->
      <div class="paragraph">
        Your compensation details are strictly confidential, and you may discuss it only with the authorized personnel of HR in case of any clarification. It is our hope that your acceptance of this offer will be just the beginning of a mutually rewarding relationship.
      </div>

      <!-- Salary Payment Terms -->
      <div class="paragraph">
        Salary Payments will be made by 05th of the next calendar month subject to attendance. Net take home salary is subject to Income Tax and other statutory deductions and will be paid into the Bank Account of the Employee. For operating convenience, we encourage all our employees to open a salary account with <strong>${data.preferredBank}</strong> after joining the employment with us.
      </div>

      <!-- Banking Note -->
      <div class="paragraph">
        <strong>Note:</strong> Alternatively, you can share us your ${data.preferredBank} Account details, if you are already holding an account with ${data.preferredBank}. you are free to provide us your other Bank Account details (For NEFT Transfers) other than ${data.preferredBank} if you do not want to have ${data.preferredBank} as your Banking Partner.
      </div>

      <!-- Pay Statement -->
      <div class="paragraph">
        You will receive a monthly pay statement detailing gross pay and deductions. Any subsequent changes to your salary will be highlighted on that statement.
      </div>

      <!-- Tax Liability -->
      <div class="paragraph">
        Income tax liability (TDS) or any other statutory deduction arising as a result of your employment, it should be borne by the employee and company in no event be liable for payment of those taxes and statutory deductions in addition to your CTC either during the period of your employment or after cessation of your employment with O2F.
      </div>

      <!-- Terms and Conditions -->
      <div class="terms-section">
        <div class="paragraph">
          Your employment with O2F Info solutions Pvt Ltd will be governed by the following Terms and conditions. You will also be governed by current O2F's rules, regulations, internal policies, and practices which are subject to change from time to time.
        </div>

        <!-- Location of Work -->
        <div class="section-title">Location of work</div>
        <div class="paragraph">
          Your employment will be based in Bangalore and the company reserves the right to Transfer your services to anywhere in India and Overseas or utilize your expertise to any of our projects based in India and Overseas. Relocation or Compensatory allowance applicable to a specific Project / location as per Company's policy will be paid to you.
        </div>

        <!-- Duties and Responsibilities -->
        <div class="section-title">Duties and Responsibilities</div>
        <div class="paragraph">
          The Company reserves the right, at any time during your employment, with reasonable notice, to require you to undertake any reasonable, alternative duties which are within your capabilities. You shall not indulge actively/or cause any act likely to affect the discipline that is expected from every employee of this organization or associate with any such activity which may amount to an act subversive of discipline.
        </div>

        <!-- Notice Period -->
        <div class="section-title">Notice Period / Termination</div>
        <div class="paragraph">
          At the time of tendering resignation, you shall be required to give <strong>${data.noticePeriod}</strong> notice in writing.
        </div>
        
        <div class="paragraph">
          Your resignation will become effective and final upon acceptance by the Management not withstanding that the communication of the acceptance of resignation has reached you or not. However, it will be the prerogative of the Management to accept or not your resignation. In case of any misconduct on your part, Non-Performance of your services can be terminated with immediate effect without assigning any reason and without giving to you any notice or notice pay in lieu of notice or any compensation in lieu thereof.
        </div>

        <div class="paragraph">
          Expect where your employment is terminatable on the grounds of Gross Misconduct, Non-Performance and any unexpected business circumstances. You are entitled to a termination without Notice.
        </div>

        <div class="paragraph">
          As per our company norms for termination, the processing of any pending payments will not be carried out. This decision aligns with our commitment to maintaining the integrity and authenticity of our workforce.
        </div>

        <div class="paragraph">
          In the event of the information furnished by you in your application to the company or in the testimonials with regard to your educational qualifications/prior employment and experience history are found incorrect or willfully withheld, you will be liable for termination, or such action as may be deemed fit by the management.
        </div>

        <div class="paragraph">
          You shall inform the Company of any changes in your personal data within 3 days' time. Any notice required to be given to you shall be deemed to have been duly and properly given if delivered to you personally or sent to your email ID or sent by post to you at your address in India, as recorded in the Company.
        </div>
      </div>

      <!-- Page Break for Additional Terms -->
      <div class="page-break"></div>

      <!-- Use of Company Resources -->
      <div class="section-title">Use of Company Resources</div>
      <div class="paragraph">
        You shall be responsible for the safe keeping and in good condition and order of all O2F's and its client's property entrusted to your care and charge. You may use the company resources only for official purpose with utmost honesty and diligence.
      </div>

      <!-- Business Conduct -->
      <div class="section-title">Business Conduct</div>
      <div class="paragraph">
        It is expected that employees appreciate the importance of proper behaviour and appearance in business life and they ensure their dress, grooming and appearance are appropriate to professional business life. Your dress, grooming and appearance should reflect favourably upon other team members in the Company.
      </div>

      <!-- Dual Employment -->
      <div class="section-title">Dual Employment</div>
      <div class="paragraph">
        You will need to devote full time to the work of the company and shall not undertake any other direct/indirect business or work, honorary or remunerative.
      </div>

      <!-- Professional Ethics -->
      <div class="section-title">Professional Ethics</div>
      <div class="paragraph">
        You are required to deal with the O2F's and its client's money, material and documents with utmost honesty and professional Ethics. If you are found guilty at any point of time of moral turpitude or dishonesty in dealing with the Company's and Client material, document or theft or misappropriation regardless of a value involved, your services would be terminated with immediate effect, notwithstanding any other terms and conditions mentioned in the Offer letter.
      </div>

      <!-- Forfeiture -->
      <div class="section-title">Forfeiture</div>
      <div class="paragraph">
        Notwithstanding anything contained herein before, the Company shall be entitled without prejudice to any other remedy available in law, to apply any money due to an employee from the Company towards making good, in full or in part, any loss or damage that the Company may have suffered by reason of his/her default or misconduct.
      </div>

      <!-- Sexual Harassment -->
      <div class="section-title">Sexual Harassment / Discrimination</div>
      <div class="paragraph">
        You are required to familiarize yourself with Harassment policy and comply with it always. Any instances of harassment are regarded as serious issues and non-compliance may lead to disciplinary action being instigated against you as per Law of the Land. Offensive posters/ screen savers/ mails or magazines and books at the work place should be strictly avoided.
      </div>

      <div class="paragraph">
        Every employee of O2F Info solutions Pvt Ltd holding a senior and responsible position at O2F or its client's place shall take all possible steps to ensure a positive work environment free of any form of discrimination.
      </div>

      <!-- Confidentiality and Non-Compete -->
      <div class="section-title">Confidentiality and non-compete clause</div>
      <div class="paragraph">
        You shall during your service with us, devote your whole time and attention to the Company's business entrusted to you, and shall not engage yourself directly or indirectly in any business or service other than Company's business or service.
      </div>

      <div class="paragraph">
        You shall at all times keep the information that may come to your knowledge regarding company's plans, business affairs, operations etc. confidential.
      </div>

      <div class="paragraph">
        You shall be required to keep the information regarding "salary" being offered to you strictly confidential at all times. You shall not divulge any details pertaining to your salary to any friend/colleague or acquaintance either before/during or after the cessation of your employment with us. Divulging such information at any time may lead to either withdrawal of this offer letter or termination of your existing employment with us.
      </div>

      <div class="paragraph">
        You agree not to employ, or solicit or seek to employ, any employee, consultants, customer or associate of the Company during your employment and for a period of one year after your termination / resignation of employment from the company. Upon breach of this Section with respect to a particular employee, consultants, customer or associate of the Company, you will be liable to pay liquidated damages.
      </div>

      <div class="paragraph">
        During the term of this Agreement and for a period of 1 year thereafter, you shall not directly or indirectly approach or in any way assist or be involved with any partners and / or customers of O2F. You cannot directly approach any partners of O2F more particularly, whose work is being undertaken by you or supervised by you due to this employment agreement.
      </div>

      <div class="paragraph">
        You shall not at any time discuss or disclose or forward O2F's or its client's business emails and data (like materials, technical aspects, codes, design documents, study material and any other content that is designed for either internal or external use) to your personal email IDs or to any other emails IDs and shall not publish any personal or confidential information about O2F or its clients in any public forums. The company also has the right to initiate appropriate legal action against such violation of the confidentiality policy.
      </div>

      <!-- Data Protection -->
      <div class="section-title">Data Protection and Confidentiality</div>
      <div class="paragraph">
        You may have access to personal and/or confidential information about the internal business affairs of O2F or its client's organization considered 'commercially sensitive'. It must only be used for the purpose(s) for which it has been authorized. Please read and sign Annexure 3 for more details about Data Protection and Confidentiality Policy. Please note that in addition to what has been mentioned in this appointment letter, no other commitment is being made by the company.
      </div>

      <div class="paragraph">
        To ensure that you have a full understanding of the terms and conditions of your prospective employment with O2F and the benefits available to you there are a number of enclosures to this letter which we hope you will find interesting and informative and have agreed to abide by them in form and substance. On joining you will be able to access Company's Intranet site, which contains comprehensive information regarding all benefits, policies and procedures but, in the meantime, to help you there are a number of documents enclosed with this appointment letter.
      </div>

      <!-- Salary Breakdown Annexure -->
      <div class="page-break"></div>
      <div class="section-title" style="text-align: center; font-size: 14pt;">Annexure - 1: Salary Breakdown</div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 2em 0;">
        <tr style="border: 1px solid black;">
          <th style="border: 1px solid black; padding: 8px; background-color: #f0f0f0;">Component</th>
          <th style="border: 1px solid black; padding: 8px; background-color: #f0f0f0;">Annual Amount (INR)</th>
          <th style="border: 1px solid black; padding: 8px; background-color: #f0f0f0;">Monthly Amount (INR)</th>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;"><strong>EARNINGS</strong></td>
          <td style="border: 1px solid black; padding: 8px;"></td>
          <td style="border: 1px solid black; padding: 8px;"></td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">Basic Salary (40%)</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.basicSalary}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.basicSalary.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">HRA (20%)</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.hra}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.hra.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">Special Allowance (30%)</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.specialAllowance}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.specialAllowance.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">Employer PF (12%)</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.employerPf}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.employerPf.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black; background-color: #f0f0f0;">
          <td style="border: 1px solid black; padding: 8px;"><strong>GROSS CTC</strong></td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;"><strong>${data.ctc}</strong></td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;"><strong>${this.formatIndianCurrency(Number(data.ctc.replace(/[^0-9]/g, '')) / 12)}</strong></td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;"><strong>DEDUCTIONS</strong></td>
          <td style="border: 1px solid black; padding: 8px;"></td>
          <td style="border: 1px solid black; padding: 8px;"></td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">Employee PF (12%)</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.employeePf}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.employeePf.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">Professional Tax</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.professionalTax}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.professionalTax.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 8px;">Income Tax (TDS)</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${data.incomeTax}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;">${this.formatIndianCurrency(Number(data.incomeTax.replace(/[^0-9]/g, '')) / 12)}</td>
        </tr>
        <tr style="border: 1px solid black; background-color: #f0f0f0;">
          <td style="border: 1px solid black; padding: 8px;"><strong>NET TAKE HOME</strong></td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;"><strong>${data.netSalary}</strong></td>
          <td style="border: 1px solid black; padding: 8px; text-align: right;"><strong>${this.formatIndianCurrency(Number(data.netSalary.replace(/[^0-9]/g, '')) / 12)}</strong></td>
        </tr>
      </table>

      <!-- Signature Section -->
      <div class="signature-section" style="margin-top: 3em;">
        <div style="float: left; width: 45%;">
          <div>Employee Acceptance:</div>
          <div style="margin-top: 3em; border-bottom: 1px solid black; width: 200px;"></div>
          <div>${data.candidateName}</div>
          <div>Date: _______________</div>
        </div>
        <div style="float: right; width: 45%;">
          <div>For O2F Info Solutions Pvt Ltd</div>
          <div style="margin-top: 3em; border-bottom: 1px solid black; width: 200px;"></div>
          <div>${data.hrName}</div>
          <div>HR Manager</div>
          <div>Date: ${data.date}</div>
        </div>
        <div style="clear: both;"></div>
      </div>

    </body>
    </html>`;
  }

  /**
   * Format date in Indian format
   */
  private formatDate(date: Date | string): string {
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
  }

  /**
   * Format currency in Indian format
   */
  private formatIndianCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Send offer letter via email
   */
  async sendOfferLetterEmail(offerLetter: OfferLetter, candidate: Candidate, pdfUrl: string): Promise<boolean> {
    try {
      // TODO: Implement actual email sending with SendGrid or similar
      // For now, just log the action
      console.log(`Sending offer letter to ${candidate.email} for position ${offerLetter.designation}`);
      console.log(`PDF URL: ${pdfUrl}`);
      
      return true;
    } catch (error) {
      console.error("Error sending offer letter email:", error);
      return false;
    }
  }
}