Your URL: https://your-app-domain.example

  Final Steps (5 minutes):

  1. Run Database Migrations (Railway Dashboard):

  Open the Railway shell and run:
  npx prisma migrate deploy
  npx tsx prisma/seed-bbta.ts

  How to access Railway shell:
  - https://railway.com/project/REDACTED_RAILWAY_PROJECT_ID
  - Click "web" service → "Shell" tab

  2. Configure Twilio Webhook:

  Twilio Console: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox

  Set webhook URL:
  https://your-app-domain.example/api/webhooks/twilio
  Method: POST

  3. Test with WhatsApp! 🎉

  1. Join Twilio Sandbox:
    - WhatsApp to: +1 415 523 8886
    - Send: join <your-code>
  2. Send test message:
  Quels sont vos horaires ?
  3. Get AI response! ✅

  ---
  What's Deployed:

  ✅ Next.js app
  ✅ PostgreSQL database
  ✅ All environment variables
  ✅ Twilio webhook endpoint
  ✅ Clerk authentication
  ✅ OpenRouter AI

  Permanent URL: https://your-app-domain.example