# Microsoft Graph API Email Integration Setup

## Overview

Your ATS now supports sending emails through Microsoft Graph API instead of traditional SMTP. This provides better integration with Office 365 and avoids the need for app passwords.

## Azure AD App Registration

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate**: Azure Active Directory → App registrations → New registration
3. **Configure App**:
   - Name: `TalentFlow ATS Email Service`
   - Supported account types: `Single tenant`
   - Redirect URI: `https://localhost:3000/auth/callback` (for testing)

## Required Permissions

In your Azure AD app, add these API permissions:

### Microsoft Graph Permissions:
- `Mail.Send` (Application permission) - Required to send emails
- `User.Read` (Delegated permission) - Basic user info

**Important**: After adding permissions, click "Grant admin consent" for your organization.

## Get Your Credentials

From your Azure AD app registration, collect:

1. **Directory (tenant) ID**: Found in "Overview" section
2. **Application (client) ID**: Found in "Overview" section  
3. **Client Secret**: 
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret VALUE (not ID)

## Environment Variables

Add these to your Replit Secrets or .env file:

```env
AZURE_TENANT_ID=your-directory-tenant-id
AZURE_CLIENT_ID=your-application-client-id
AZURE_CLIENT_SECRET=your-client-secret-value
GRAPH_FROM_EMAIL=youremail@yourcompany.com
```

## Testing the Integration

### Method 1: Test Connection
```bash
GET /api/graph-email/test-connection
```

### Method 2: Send Test Email
```bash
POST /api/graph-email/send-test-email
Content-Type: application/json

{
  "to": "test@example.com",
  "subject": "Test from ATS",
  "body": "Hello from Microsoft Graph API!"
}
```

## Features Available

✅ **OAuth2 Authentication** - Secure token-based authentication
✅ **Domain-based Sending** - Emails sent from your Office 365 domain
✅ **HTML Email Support** - Rich formatting and templates
✅ **Template System** - Ready for offer letters and interview invites
✅ **Error Logging** - All email attempts logged in database
✅ **Token Caching** - Automatic token refresh and caching

## Common Issues

### Authentication Errors
- **"Authentication failed"**: Check your tenant ID, client ID, and secret
- **"Insufficient privileges"**: Ensure Mail.Send permission is granted and admin consented

### Permission Errors
- **"Forbidden"**: Your app needs admin consent for Mail.Send permission
- **"Invalid scope"**: Double-check the scopes in the application

### Sending Errors
- **"Invalid recipient"**: Check email address format
- **"Mailbox not found"**: Ensure your GRAPH_FROM_EMAIL exists in your tenant

## Next Steps

1. **Configure your credentials** in Replit Secrets
2. **Test the connection** using the test endpoint
3. **Send a test email** to verify everything works
4. **Integration is ready** for your ATS workflow automation

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your Azure AD app permissions
3. Ensure all environment variables are set correctly
4. Test with a simple email first before using templates

The system is now ready to send automated emails for your recruitment workflow!