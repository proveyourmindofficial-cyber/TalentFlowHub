# How Your ATS Email System Works

## Single Sender Configuration

When you configure an email provider, you're setting up **ONE sending email address** that will be used for ALL automated system emails.

### What You're Configuring:

**Email Provider Setup**:
- **Provider Name**: "Office 365 - Admin" (just a label for you)
- **From Email**: `youremail@company.com` (the actual sender address)
- **From Name**: "TalentFlow ATS" or "Your Company HR" (display name)

### What Emails Will Be Sent Automatically:

1. **New Application Alerts** → To HR team
   - "New application received for Senior Developer position"
   - From: youremail@company.com
   - To: HR team members

2. **Interview Confirmations** → To candidates & interviewers
   - "Interview scheduled for tomorrow at 2 PM"
   - From: youremail@company.com
   - To: candidate@email.com, interviewer@company.com

3. **Offer Letter Delivery** → To candidates
   - "Your offer letter is ready"
   - From: youremail@company.com
   - To: candidate@email.com

4. **Status Updates** → To relevant people
   - "Application moved to next stage"
   - From: youremail@company.com

## Recommended Configurations:

### Option 1: Your Admin Email (Most Common)
```
From Email: youremail@company.com
From Name: "TalentFlow ATS"
```
**Pros**: Personal touch, easy to set up
**Cons**: All emails appear from your personal account

### Option 2: Dedicated ATS Email (Most Professional)
```
From Email: ats@company.com
From Name: "Company Name Recruitment"
```
**Pros**: Professional, separate from personal email
**Cons**: Need to create new email account

### Option 3: HR Department Email
```
From Email: hr@company.com
From Name: "Human Resources"
```
**Pros**: Department-wide approach
**Cons**: Need HR department email access

## Technical Setup Process:

1. **Choose Your Sender Email**: Decide which email will send all ATS emails
2. **Get Email Credentials**: Obtain app password for that email
3. **Configure in ATS**: Add SMTP settings for that email
4. **Test**: Send test email to verify everything works
5. **Activate**: All ATS emails will now be sent from this address

## Email Flow Example:

When someone applies for a job:
1. ATS detects new application
2. ATS uses your configured email (`youremail@company.com`)
3. Sends notification to HR: "New application from John Doe for Developer role"
4. Email appears as: From "TalentFlow ATS <youremail@company.com>"

## Important Notes:

- **One Email = All System Emails**: Everything comes from the same address
- **Professional Appearance**: Recipients see the "From Name" you configure
- **Reply Handling**: Replies go to the configured email address
- **Deliverability**: Using your company domain ensures better delivery rates

## Next Steps:

1. Decide which email approach you want
2. If using your admin email, get the Office 365 app password
3. Configure the provider in the ATS
4. Test with a sample email
5. Activate for production use

The system is designed to be simple - one email configuration handles all ATS communications!