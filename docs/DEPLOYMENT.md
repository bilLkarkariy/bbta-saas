# Deployment Guide

This project supports deployment on both Railway and Vercel.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Clerk project
- Twilio account (WhatsApp sender configured)
- OpenRouter-compatible API key

## Environment configuration

1. Copy `.env.example` and fill production values.
2. Add the same variables in your hosting provider dashboard.
3. Set `NEXT_PUBLIC_APP_URL` to your public app URL.

Minimum production variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `OPENROUTER_API_KEY`
- `CRON_SECRET`

## Twilio webhooks

Configure these endpoints in Twilio:

- Inbound webhook: `https://<your-domain>/api/webhooks/twilio`
- Status webhook: `https://<your-domain>/api/webhooks/twilio/status`

`TWILIO_SKIP_SIGNATURE_VERIFICATION` must remain `false` in production.

## Railway deployment

1. Create Railway project and Postgres service.
2. Set all required environment variables.
3. Deploy from GitHub or Railway CLI.
4. Run migrations:

```bash
npx prisma migrate deploy
```

5. Verify health endpoint:

```bash
curl https://<your-domain>/api/health
```

## Vercel deployment

1. Import repository into Vercel.
2. Configure production environment variables.
3. Deploy.
4. Run migrations in your release workflow (recommended) or one-off job:

```bash
npx prisma migrate deploy
```

5. Validate webhook and auth flows after deployment.

## Scheduled booking reminders

`/api/cron/booking-reminders` requires:

- `Authorization: Bearer <CRON_SECRET>`
- `CRON_SECRET` defined on server

You can trigger reminders with:

- Vercel Cron (`vercel.json`)
- GitHub Actions schedule
- Any secure external scheduler

## Post-deploy verification checklist

- App loads and authentication works
- Twilio webhooks return valid responses
- Inbound messages create conversations/messages
- AI responses are generated
- Cron endpoint responds `401` without token and `200` with valid token
- Demo admin endpoints are not accessible in production

