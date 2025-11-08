# 📧 Email Setup Guide - WorkZen HRMS

## 🎯 Overview

This guide shows you how to configure email sending for auto-generated employee credentials.

---

## 🚀 Quick Setup (Gmail)

### Step 1: Get Gmail App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Step Verification** (if not already enabled)
   - Click "2-Step Verification"
   - Follow the setup process

3. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Or search for "App passwords" in Google Account settings
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **WorkZen HRMS**
   - Click **Generate**
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update `.env` File

Open `backend/.env` and add:

```env
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=WorkZen HRMS <noreply@workzen.com>
FRONTEND_URL=http://localhost:8080
```

**Replace:**
- `your-email@gmail.com` → Your Gmail address
- `abcdefghijklmnop` → Your 16-character app password (no spaces!)

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

### Step 4: Test Email

Create a new employee via API or frontend. You should see:

```bash
✅ Email transporter configured
✅ Email sent successfully to employee@example.com
Message ID: <...>
```

---

## 📧 Email Providers

### Gmail (Recommended for Testing)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Limits:** 500 emails/day

---

### Outlook / Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

---

### Yahoo Mail

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

---

### Custom SMTP Server

```env
EMAIL_HOST=smtp.yourcompany.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourcompany.com
EMAIL_PASSWORD=your-password
```

---

### SendGrid (Production)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

---

### AWS SES (Production)

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
```

---

## 🔧 Configuration Options

### All Environment Variables

```env
# Required
EMAIL_HOST=smtp.gmail.com          # SMTP server hostname
EMAIL_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com    # SMTP username (usually your email)
EMAIL_PASSWORD=your-app-password   # SMTP password or app password

# Optional
EMAIL_FROM=WorkZen HRMS <noreply@workzen.com>  # From address
FRONTEND_URL=http://localhost:8080              # Login link in emails
```

---

## 🧪 Testing

### Test Email Sending

1. **Create a test employee:**

```bash
curl -X POST http://localhost:4000/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Employee",
    "email": "test@example.com",
    "role": "employee",
    "department": "Engineering"
  }'
```

2. **Check console output:**

```bash
✅ Email transporter configured
✅ Credentials email sent to test@example.com
✅ Email sent successfully to test@example.com
Message ID: <abc123@gmail.com>
```

3. **Check employee's inbox** for welcome email

---

## 🐛 Troubleshooting

### Issue: "Email not configured" warning

**Problem:** Environment variables not set

**Solution:**
```bash
# Check if .env file exists
ls backend/.env

# Verify EMAIL_* variables are set
cat backend/.env | grep EMAIL
```

---

### Issue: "Invalid login" error

**Problem:** Wrong credentials or app password not generated

**Solution:**
1. Use **App Password**, not your regular Gmail password
2. Remove spaces from app password
3. Enable 2-Step Verification first

---

### Issue: "Connection timeout"

**Problem:** Firewall or wrong port

**Solution:**
- Try port `465` with `secure: true`
- Check firewall settings
- Verify SMTP server address

---

### Issue: Emails go to spam

**Solution:**
1. **Use a real domain** for `EMAIL_FROM`
2. **Set up SPF/DKIM** records
3. **Use a professional email service** (SendGrid, AWS SES)

---

## 📊 Email Logs

### Success Log

```bash
✅ Email transporter configured
✅ Credentials email sent to john@company.com
✅ Email sent successfully to john@company.com
Message ID: <abc123@gmail.com>
```

### Not Configured (Development)

```bash
⚠️  Email not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env
📧 Email would be sent (not configured):
To: john@company.com
Subject: Welcome to WorkZen HRMS - Your Account Credentials
---
```

### Error Log

```bash
❌ Failed to send email: Error: Invalid login
```

---

## 🔐 Security Best Practices

### ✅ DO

- ✅ Use **App Passwords** for Gmail
- ✅ Store credentials in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment-specific configs
- ✅ Rotate passwords regularly

### ❌ DON'T

- ❌ Commit `.env` to Git
- ❌ Use your main email password
- ❌ Share app passwords
- ❌ Hardcode credentials in code

---

## 📈 Production Setup

### Recommended: SendGrid

1. **Sign up:** https://sendgrid.com
2. **Get API Key**
3. **Configure:**

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key-here
EMAIL_FROM=noreply@yourcompany.com
```

**Benefits:**
- 100 emails/day free
- Better deliverability
- Email analytics
- No spam issues

---

### Recommended: AWS SES

1. **Set up AWS SES**
2. **Verify domain**
3. **Get SMTP credentials**
4. **Configure:**

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-username
EMAIL_PASSWORD=your-ses-password
```

**Benefits:**
- $0.10 per 1000 emails
- High deliverability
- Scalable
- AWS integration

---

## 📧 Email Template Customization

### Modify Email Content

Edit `backend/src/services/mailer.service.ts`:

```typescript
export async function sendEmployeeCredentials(data: {
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}) {
  const subject = 'Welcome to WorkZen HRMS - Your Account Credentials';
  
  const html = `
    <!-- Your custom HTML template -->
  `;
  
  // ...
}
```

---

## 🎯 Quick Reference

### Gmail App Password Steps

1. Google Account → Security
2. Enable 2-Step Verification
3. App Passwords → Generate
4. Copy 16-character password
5. Add to `.env` (no spaces!)

### Environment Variables

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=WorkZen HRMS <noreply@workzen.com>
FRONTEND_URL=http://localhost:8080
```

### Test Command

```bash
# Restart backend
npm run dev

# Create employee (auto-sends email)
# Check console for success message
```

---

## 📚 Additional Resources

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)

---

## ✅ Checklist

- [ ] Gmail 2-Step Verification enabled
- [ ] App Password generated
- [ ] `.env` file updated with credentials
- [ ] Backend restarted
- [ ] Test employee created
- [ ] Email received successfully
- [ ] Credentials work for login

---

**Status:** 🟢 **Ready for Email Sending!**

Once configured, every new employee will automatically receive a beautiful welcome email with their login credentials!
