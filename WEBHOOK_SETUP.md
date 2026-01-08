# Twilio Webhook Configuration Guide

**Date**: 2026-01-08
**Status**: ✅ Endpoint Verified - Ready for Real Testing

---

## Current Status

### ✅ What's Working

1. **Webhook Endpoint is Live**
   - URL: `https://your-app-domain.example/api/webhooks/twilio`
   - Status: Responding correctly (401 with invalid signature)
   - Security: Signature verification enabled ✅

2. **Code Implementation**
   - Signature verification: ✅ Implemented
   - Idempotence check: ✅ Implemented
   - Tenant resolution: ✅ Implemented
   - Error handling: ✅ Implemented

3. **Railway Deployment**
   - Deployed and accessible
   - SSL/HTTPS working

---

## Required Environment Variables

These must be configured in **Railway Dashboard** → Your Service → Variables:

```bash
# Twilio Credentials (Required)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886  # Your Twilio WhatsApp Sandbox or Business number

# Webhook Configuration (Required)
TWILIO_WEBHOOK_URL=https://your-app-domain.example/api/webhooks/twilio

# Optional: Skip signature verification (DEV ONLY - DO NOT USE IN PRODUCTION)
# TWILIO_SKIP_SIGNATURE_VERIFICATION=true
```

---

## Twilio Console Configuration

### Step 1: Access WhatsApp Sandbox (Testing)

1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Note your sandbox number: `+14155238886` (or similar)
3. Join the sandbox from your phone:
   - Send: `join <your-code>` to the sandbox number via WhatsApp

### Step 2: Configure Webhook URL

1. Navigate to: **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. Set **"When a message comes in"** to:
   ```
   https://your-app-domain.example/api/webhooks/twilio
   ```
3. Set method to: **HTTP POST**
4. Click **Save**

### Step 3: Configure Status Callbacks (Optional but Recommended)

1. In the same settings page, set **"Status Callback URL"** to:
   ```
   https://your-app-domain.example/api/webhooks/twilio/status
   ```
2. This allows tracking delivery status (sent, delivered, read, failed)

---

## Testing Checklist

### ✅ Phase 1: Endpoint Connectivity (DONE)

- [x] Webhook URL is accessible (200/401 response)
- [x] HTTPS is working
- [x] Signature verification is enabled

### 🔄 Phase 2: Real WhatsApp Test (NEXT)

- [ ] **Join Twilio Sandbox** from your phone
- [ ] **Send test message**: "Bonjour" from WhatsApp
- [ ] **Check Railway logs** for incoming webhook
- [ ] **Verify in database**: Conversation and Message created
- [ ] **Verify tenant resolution**: Correct tenant identified

### ⏳ Phase 3: AI Response Test (After Phase 2)

- [ ] Create 3-5 FAQs for your tenant
- [ ] Send question via WhatsApp
- [ ] Verify AI responds within 5s
- [ ] Check response is in French
- [ ] Verify conversation flow works

---

## How to Test with Real WhatsApp

### Method 1: Use Twilio Sandbox (Recommended for Testing)

```bash
# 1. Join sandbox from your phone
Send: "join <code>" to +14155238886 via WhatsApp

# 2. Send test message
Send: "Bonjour" to +14155238886

# 3. Check Railway logs
railway logs --tail

# Expected log output:
[Twilio] Incoming from whatsapp:+33612345678: Bonjour
[Twilio] Processed in 234ms - {"success":true}
```

### Method 2: Use Production WhatsApp Business Number

1. Buy a WhatsApp Business number from Twilio (costs ~$1.50/month)
2. Complete Meta Business verification (can take 1-3 days)
3. Configure webhook as above
4. Test with real customer numbers

---

## Troubleshooting

### Issue 1: Getting 401 "Invalid Signature"

**Cause**: Twilio signature doesn't match expected value

**Solutions**:
1. ✅ **Verify `TWILIO_WEBHOOK_URL` matches exactly** (including https://, no trailing slash)
2. ✅ **Check `TWILIO_AUTH_TOKEN` is correct** in Railway env vars
3. ⚠️ **Temporary workaround** (DEV ONLY): Set `TWILIO_SKIP_SIGNATURE_VERIFICATION=true`

### Issue 2: Getting 500 "Internal Server Error"

**Cause**: Server error during processing

**Debug steps**:
```bash
# Check Railway logs
railway logs --tail

# Common causes:
- Database connection issue
- Missing env vars (OPENROUTER_API_KEY, etc.)
- Tenant not found for the "To" number
```

### Issue 3: No Response from AI

**Causes**:
- No FAQs created for tenant
- OpenRouter API key not set
- AI router not triggering

**Debug**:
1. Check `/dashboard/faq` - are there FAQs?
2. Check Railway logs for AI errors
3. Verify `OPENROUTER_API_KEY` is set

### Issue 4: Message not appearing in dashboard

**Causes**:
- Tenant resolution failed
- SSE not connected
- Database write failed

**Debug**:
1. Check Railway logs: `[Twilio] No tenant for: +14155238886`
2. Verify tenant has `whatsappNumber` set in database
3. Check browser console for SSE errors

---

## Database Requirements

### Ensure Tenant has WhatsApp Number

```sql
-- Check if tenant exists with WhatsApp number
SELECT id, name, "whatsappNumber" FROM "Tenant" WHERE "whatsappNumber" = '+14155238886';

-- If not exists, update your tenant
UPDATE "Tenant"
SET "whatsappNumber" = '+14155238886'  -- Your Twilio number
WHERE id = 'your_tenant_id';
```

### Create Test FAQs

```sql
-- Insert test FAQs for your tenant
INSERT INTO "FAQ" ("tenantId", question, answer, category, keywords, enabled)
VALUES
  ('your_tenant_id', 'Quels sont vos horaires ?', 'Nous sommes ouverts du lundi au vendredi de 9h à 18h.', 'GENERAL', ARRAY['horaires', 'ouverture', 'heures'], true),
  ('your_tenant_id', 'Où êtes-vous situé ?', 'Nous sommes situés au 123 Rue de Paris, 75001 Paris.', 'GENERAL', ARRAY['adresse', 'localisation', 'où'], true),
  ('your_tenant_id', 'Comment prendre rendez-vous ?', 'Vous pouvez prendre rendez-vous en disant "Je voudrais un rendez-vous".', 'BOOKING', ARRAY['rendez-vous', 'rdv', 'réserver'], true);
```

---

## Next Steps

1. ✅ **Endpoint verified** - webhook is live and secure
2. 🔄 **Join Twilio Sandbox** from your phone
3. 🔄 **Send "Bonjour"** via WhatsApp to test
4. 🔄 **Check Railway logs** and verify DB
5. ⏳ **Create FAQs** and test AI responses
6. ⏳ **Test conversation flows** (booking, lead capture)

---

## Success Criteria (P1.1)

- [x] Webhook endpoint responds (200 or 401)
- [x] Signature verification working
- [ ] Real WhatsApp message received → conversation in DB
- [ ] Logs show processing time <5s
- [ ] Tenant correctly identified
- [ ] No 500 errors

**Current Progress**: 2/6 complete (33%)

---

## Support Resources

- **Twilio Console**: https://console.twilio.com
- **Railway Dashboard**: https://railway.app/dashboard
- **Webhook Test Script**: `./test-twilio-webhook.sh`
- **Logs**: `railway logs --tail` (if Railway CLI installed)

---

*Last updated: 2026-01-08 - P1.1 Webhook Testing*
