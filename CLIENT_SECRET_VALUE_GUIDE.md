# Client Secret Value Guide

## What You Provided
You shared the **Secret ID**: `b4cf4f37-d325-414b-add1-91e30564aae9`

## What I Need
I need the **Secret VALUE** - this is a longer string that looks like:
- `abc123~def456_ghi789` 
- `XyZ9Q~R5zfQVbf5e5q1CtmBGKDgAWvagfMGPM`

## Where to Find It
In your Azure AD app → Certificates & secrets:

```
Description: [Your description]
Expires: [Date]
Value: [LONG STRING WITH SPECIAL CHARACTERS] ← This is what I need
Secret ID: b4cf4f37-d325-414b-add1-91e30564aae9 ← This is what you provided
```

## Important Notes
- The **Value** is only shown **once** when you create the secret
- If you've already navigated away, you'll need to create another new secret
- The **Secret ID** (GUID format) cannot be used for authentication

## Next Steps
Please provide the **Value** from your new client secret, and I'll update the AZURE_CLIENT_SECRET to complete the Microsoft Graph API integration.