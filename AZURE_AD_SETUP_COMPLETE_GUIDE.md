# Complete Azure AD Setup Guide for Microsoft Graph API

## Issue Diagnosis

The error you're seeing indicates that your Azure AD app needs proper configuration. Here's the complete setup process:

## Step 1: Azure AD App Registration

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate**: Azure Active Directory → App registrations → New registration
3. **Configure Application**:
   - **Name**: `TalentFlow ATS Email Service`
   - **Supported account types**: `Accounts in this organizational directory only (O2F Info Solutions only - Single tenant)`
   - **Redirect URI**: Leave blank for now (we're using client credentials flow)

## Step 2: Required API Permissions

In your Azure AD app, go to **API permissions** and add:

### Microsoft Graph Application Permissions (NOT Delegated):
- `Mail.Send` - Allows the app to send mail as any user
- `User.Read.All` - Allows reading user profiles (optional)

**CRITICAL**: After adding permissions, click **"Grant admin consent for [Your Organization]"**

## Step 3: Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `ATS Email Service`
4. Expires: Choose your preference (12 months recommended)
5. **Copy the SECRET VALUE** (not the ID)

## Step 4: Get Your IDs

From the **Overview** section, copy:
- **Directory (tenant) ID**
- **Application (client) ID**

## Step 5: Verify Your Credentials

Your credentials should look like this:
- `AZURE_TENANT_ID`: Something like `12345678-1234-1234-1234-123456789012`
- `AZURE_CLIENT_ID`: Something like `87654321-4321-4321-4321-210987654321`
- `AZURE_CLIENT_SECRET`: Something like `abcDEF123~ghiJKL456_mnoP789`
- `GRAPH_FROM_EMAIL`: Your actual Office 365 email like `youremail@yourcompany.com`

## Step 6: Test Setup

Use these PowerShell commands to verify your app registration:

```powershell
# Install Microsoft Graph PowerShell if not already installed
Install-Module Microsoft.Graph -Force -AllowClobber

# Connect using your app credentials
$clientId = "your-client-id"
$tenantId = "your-tenant-id" 
$clientSecret = "your-client-secret"

$body = @{
    client_id = $clientId
    client_secret = $clientSecret
    scope = "https://graph.microsoft.com/.default"
    grant_type = "client_credentials"
}

$response = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" -Method Post -Body $body
Write-Host "Access Token Retrieved: $($response.access_token.Substring(0,50))..."
```

## Common Issues & Solutions

### Issue: "Application not found in directory"
**Solution**: 
- Verify your `AZURE_TENANT_ID` matches your organization's tenant
- Ensure the app is created in the correct directory
- Double-check the `AZURE_CLIENT_ID` is correct

### Issue: "Insufficient privileges"
**Solution**:
- Add `Mail.Send` as **Application permission** (not Delegated)
- Click "Grant admin consent"
- Wait 5-10 minutes for permissions to propagate

### Issue: "Invalid client secret"
**Solution**:
- Generate a new client secret
- Copy the **Value** not the **Secret ID**
- Update your `AZURE_CLIENT_SECRET` environment variable

### Issue: "Forbidden" when sending email
**Solution**:
- Ensure your `GRAPH_FROM_EMAIL` is a valid user in your tenant
- The user must have a mailbox (not just an Azure AD account)
- Try using your admin email first to test

## Security Best Practices

1. **Minimal Permissions**: Only grant `Mail.Send` permission
2. **Secret Rotation**: Rotate client secrets regularly
3. **Environment Variables**: Never hardcode secrets in code
4. **Monitoring**: Monitor the email logs for suspicious activity

## Testing Commands

After setup, test with:

```bash
# Test connection
curl -X GET http://localhost:5000/api/graph-email/test-connection

# Test email (replace with your email)
curl -X POST http://localhost:5000/api/graph-email/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@yourcompany.com", "subject": "Test", "body": "Hello World!"}'
```

## Next Steps

1. **Complete the Azure AD setup** following this guide exactly
2. **Update your Replit Secrets** with the correct values
3. **Test the connection** using the test endpoints
4. **Verify email sending** works with your domain
5. **Integration will be ready** for your ATS workflow

The system is designed to work seamlessly once the Azure AD app is properly configured with the right permissions and credentials.