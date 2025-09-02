# Office 365 Email Setup Guide for ATS

## The Hardware Token Issue

When Microsoft asks for a "Hardware token" during app password setup, it means your organization has **Multi-Factor Authentication (MFA) enforced** with hardware security keys. This is a security policy set by your IT administrator.

## Solutions for Office 365 Email Setup

### Option 1: Contact Your IT Administrator (Recommended)
- **What to ask**: "I need an app password for email integration in our ATS system. Can you help me generate one?"
- **Why this helps**: Your IT admin can either:
  - Generate an app password for you directly
  - Temporarily adjust MFA settings for app password generation
  - Provide you with the hardware token access you need

### Option 2: Alternative Email Setup Methods

#### A. Use Your Personal Email (Temporary Solution)
- Set up the ATS with your personal Gmail/Yahoo account first
- Test the system functionality
- Later switch to the corporate Office 365 account

#### B. Ask IT for a Dedicated Service Account
- Request a dedicated "service account" email for the ATS
- This account can be configured with app passwords more easily
- Format: `ats-noreply@yourcompany.com`

### Option 3: If You Have Access to App Passwords

If you can access Microsoft Account Security settings without hardware token:

1. **Go to Microsoft Account Security Page**:
   - Visit: https://account.microsoft.com/security
   - Sign in with your Office 365 account

2. **Navigate to Advanced Security Options**:
   - Look for "Advanced security options" or "App passwords"
   - Click "Create a new app password"

3. **Create App Password**:
   - Choose "Mail" as the app type
   - Copy the generated password (it looks like: `abcd-efgh-ijkl-mnop`)

4. **Use These Settings in the ATS**:
   ```
   Provider Type: Outlook
   Provider Name: "Office 365 - [Your Name]"
   SMTP Host: smtp.office365.com
   SMTP Port: 587
   Username: your-full-email@company.com
   Password: [The app password you generated]
   From Email: your-full-email@company.com
   From Name: "Your Company ATS"
   Enable SSL/TLS: ✅ (checked)
   ```

## Testing Your Setup

After configuration:
1. Click "Test" button next to your provider
2. Send a test email to yourself
3. Check if the email arrives properly

## Troubleshooting

### Common Issues:
- **"Authentication failed"**: Usually means wrong app password
- **"Connection timeout"**: Check SMTP host and port
- **"SSL/TLS error"**: Ensure SSL/TLS is enabled

### Alternative SMTP Settings:
If Office 365 doesn't work, try:
```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587 or 993
```

## Need Help?

If you're still stuck:
1. Contact your IT department with this guide
2. Ask them to set up email integration for the ATS system
3. They can provide the proper authentication method for your organization

---

**Important**: Never share your app passwords or regular passwords. App passwords are specifically designed for this type of integration and are safer than using your regular login credentials.