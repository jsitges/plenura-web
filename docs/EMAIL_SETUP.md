# Email Configuration Guide - Plenura

## Overview

Plenura uses two email systems:
1. **Supabase Auth** - For registration confirmation, password reset
2. **Resend** - For transactional emails (booking confirmations, reminders, etc.)

## Quick Fix: Configure Resend SMTP in Supabase

To fix the "confirmation email not sent" issue, configure Supabase to use Resend SMTP:

### Step 1: Get Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `re_`)

### Step 2: Add Domain in Resend

1. Go to [Resend Domains](https://resend.com/domains)
2. Add domain: `plenura.redbroomsoftware.com`
3. Add the DNS records shown (DKIM, SPF)
4. Wait for verification

### Step 3: Configure Supabase SMTP

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vvbiriktnevlcjrejzoy`
3. Navigate to: **Project Settings** > **Authentication** > **SMTP Settings**
4. Enable **Custom SMTP**
5. Enter these settings:

```
Host: smtp.resend.com
Port: 465
Username: resend
Password: [Your RESEND_API_KEY]
Sender email: noreply@plenura.redbroomsoftware.com
Sender name: Plenura
```

### Step 4: Configure Auth URLs

Still in Supabase Dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL**: `https://plenura.redbroomsoftware.com`
3. Add **Redirect URLs**:
   - `https://plenura.redbroomsoftware.com/auth/callback`
   - `http://localhost:5174/auth/callback` (for development)

### Step 5: Update .env

Add your Resend API key to `.env`:

```env
RESEND_API_KEY=re_your_api_key_here
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_abc123...` |
| `PUBLIC_APP_URL` | Production URL for email links | `https://plenura.redbroomsoftware.com` |

## Testing

After configuration:

1. Try registering a new user
2. Check the email inbox
3. Click the confirmation link
4. User should be redirected to `/auth/callback` and then to dashboard

## Troubleshooting

### Email not received
- Check Supabase logs: Dashboard > Logs > Auth
- Verify domain is verified in Resend
- Check spam folder

### Cookie domain error (`dmn_chk_...`)
- Ensure Site URL in Supabase matches your actual domain
- Clear browser cookies and try again

### Rate limiting
- Supabase free tier: 4 emails/hour (with built-in SMTP)
- With custom SMTP (Resend): No Supabase limits, Resend limits apply

## Email Templates

Supabase Auth uses these email templates (customize in Dashboard > Authentication > Email Templates):

- **Confirm signup** - Sent when user registers
- **Reset password** - Sent when user requests password reset
- **Magic link** - Sent for passwordless login
- **Change email** - Sent when user changes email

## Resend Pricing

- **Free tier**: 3,000 emails/month, 100 emails/day
- **Pro**: $20/month for 50,000 emails
