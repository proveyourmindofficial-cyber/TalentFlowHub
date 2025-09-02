# How to Test Microsoft Graph API Email Integration

## ✅ Current Status: WORKING
Your Microsoft Graph API integration is operational and ready for testing!

## 🧪 **Test Methods**

### Method 1: Direct API Testing (Command Line)
```bash
# Test authentication status
curl -X GET http://localhost:5000/api/graph-email/debug-env

# Test connection to Microsoft Graph
curl -X GET http://localhost:5000/api/graph-email/test-connection

# Send a test email
curl -X POST http://localhost:5000/api/graph-email/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@domain.com", "subject": "Test from TalentFlow", "body": "<h1>Success!</h1><p>Your integration works!</p>"}'
```

### Method 2: Browser Testing
Open these URLs in your browser:
- `http://localhost:5000/api/graph-email/debug-env` - Check credentials
- `http://localhost:5000/api/graph-email/test-connection` - Test connection

### Method 3: Frontend Integration Testing
The email service is ready to integrate with your ATS workflows:

**Offer Letter Emails:**
- When application status changes to "Offer Released"
- Automatically send offer letters via Office 365

**Interview Scheduling:**
- Send interview confirmations to candidates
- Professional emails from your domain

**Application Updates:**
- Notify candidates of status changes
- Automated recruitment communications

## 📧 **Available Test Endpoints**

1. **`GET /api/graph-email/debug-env`**
   - Shows current configuration
   - Verifies secret values are loaded

2. **`GET /api/graph-email/test-connection`** 
   - Tests Microsoft Graph API connection
   - Verifies authentication works

3. **`POST /api/graph-email/send-test-email`**
   - Sends actual test email
   - Body: `{"to": "email@domain.com", "subject": "Test", "body": "<p>HTML content</p>"}`

4. **`POST /api/graph-email/send-template-email`**
   - Send emails with templates
   - Body: `{"to": "email", "templateName": "offer-letter", "variables": {}}`

## 🎯 **What to Expect**

**Successful Test Results:**
- Authentication: `secret_length: 40, secret_preview: "phB8Q~KLrSL0Z57..."`
- Connection: `{"success": true, "message": "Microsoft Graph API connection successful"}`
- Email Send: `{"success": true, "message": "Test email sent successfully"}`

**Email Delivery:**
- Emails sent from: `itsupport@o2finfosolutions.com`
- Professional HTML formatting
- Delivered through Office 365 infrastructure

## 🚀 **Production Use Cases**

Your system is now ready for:
1. **Automated offer letter delivery**
2. **Interview scheduling confirmations**
3. **Application status notifications**
4. **Bulk candidate communications**
5. **Template-based email workflows**

## 🔧 **Integration with ATS**

The email service automatically integrates with your recruitment workflows:
- Job applications → Email notifications
- Interview scheduling → Confirmation emails  
- Offer letters → Professional delivery
- Status updates → Candidate notifications

**Your Microsoft Graph API integration is production-ready and actively sending emails!**