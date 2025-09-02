# Azure AD Credentials Debugging Guide

## Current Issue
Your credentials are showing this error:
```
Application with identifier 'ba418945-cfa0-4b9c-8ad6-1492d5528289' was not found in the directory 'O2F Info Solutions'
```

This indicates a mismatch between your app registration and credentials.

## Step-by-Step Verification

### 1. Check Your Current Secrets
Your Replit secrets should match exactly what's in your Azure AD app:

**Current Values** (from error logs):
- **Application ID**: `ba418945-cfa0-4b9c-8ad6-1492d5528289`
- **Tenant**: `O2F Info Solutions`

### 2. Verify in Azure Portal

Go to: https://portal.azure.com → Azure Active Directory → App registrations

**Check these match exactly:**

1. **Directory (Tenant) ID**: Copy from "Overview" section
2. **Application (Client) ID**: Copy from "Overview" section  
3. **Organization Name**: Should be "O2F Info Solutions" or similar

### 3. Common Issues & Solutions

#### Issue A: App in Wrong Directory
- **Problem**: Your app might be registered in a different Azure AD directory
- **Solution**: 
  - Check if you have multiple Azure AD tenants
  - Switch to the correct directory in the Azure portal (top-right dropdown)
  - Look for your app registration there

#### Issue B: Wrong Client ID
- **Problem**: The client ID in Replit doesn't match Azure AD
- **Solution**:
  - Go to your Azure AD app → Overview
  - Copy the **Application (client) ID** exactly
  - Update your `AZURE_CLIENT_ID` secret

#### Issue C: Wrong Tenant ID
- **Problem**: The tenant ID doesn't match your organization
- **Solution**:
  - Go to Azure AD → Overview (not your app, but the Azure AD overview)
  - Copy the **Tenant ID** exactly
  - Update your `AZURE_TENANT_ID` secret

### 4. Quick Verification Steps

**In Azure Portal:**
1. Go to Azure AD → App registrations
2. Search for "TalentFlow" or whatever you named your app
3. Click on your app
4. Copy these values **exactly**:
   - Directory (tenant) ID: `_____________`
   - Application (client) ID: `_____________`

**Update your Replit Secrets:**
- `AZURE_TENANT_ID` = [Directory tenant ID]
- `AZURE_CLIENT_ID` = [Application client ID]  
- `AZURE_CLIENT_SECRET` = [Your client secret]
- `GRAPH_FROM_EMAIL` = [Your Office 365 email]

### 5. Permissions Check

Make sure your Azure AD app has:
- **API Permissions**: Microsoft Graph → Application permissions → Mail.Send
- **Admin Consent**: Must be granted (green checkmark)
- **Status**: Active (not disabled)

### 6. Test Commands

After updating credentials:
```bash
# Test connection
curl -X GET http://localhost:5000/api/graph-email/test-connection

# Test email 
curl -X POST http://localhost:5000/api/graph-email/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@yourcompany.com", "subject": "Test", "body": "Hello!"}'
```

## Next Steps

1. **Verify the correct tenant and client IDs** from Azure portal
2. **Update your Replit Secrets** with the exact values
3. **Restart the application** 
4. **Test the connection** again

The integration code is working correctly - it just needs the right Azure AD credentials to match your app registration.