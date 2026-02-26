# BBTA SaaS

Production-oriented multi-tenant WhatsApp automation SaaS built with Next.js.

## Demo Video (French)

<video src="./public/demo-fr.mp4" controls width="960">
  Your browser does not support the video tag.
</video>

[Open the demo video directly](./public/demo-fr.mp4)

## What this project demonstrates

- Next.js App Router full-stack architecture
- Multi-tenant data model with Prisma + PostgreSQL
- Twilio WhatsApp webhook ingestion and outbound messaging
- LLM integration (OpenRouter-compatible API) for intent routing and response generation
- Structured conversation flows (booking and lead capture)
- Real-time dashboard updates (SSE)
- CI/CD-ready deployment setup for both Railway and Vercel

## Architecture snapshot

- `src/app/api/webhooks/twilio` receives inbound WhatsApp messages
- `src/lib/webhooks/twilio-processor.ts` handles idempotency, rate-limit, routing, persistence, and replies
- `src/lib/ai/*` implements intent router, responder, and guided flows
- `prisma/schema.prisma` defines tenant, conversation, message, booking, analytics, and integration models
- `src/app/(dashboard)` contains authenticated product UI

## Local setup

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill `.env.local` with your own values.

### 3. Generate Prisma client and apply migrations

```bash
npm run db:generate
npx prisma migrate deploy
```

### 4. Start development server

```bash
npm run dev
```

## Environment variables

Use `.env.example` as the canonical template. Never commit real credentials.

Core required variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Production integrations typically also need:

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- `OPENROUTER_API_KEY`
- `CRON_SECRET`

## Security notes

- Twilio signature bypass is development-only (`TWILIO_SKIP_SIGNATURE_VERIFICATION` is ignored in production).
- Demo admin routes are disabled in production.
- Cron endpoint is bearer-protected and fails closed when `CRON_SECRET` is missing.
- `.env*` files and `.railway/` are ignored by git.

## Known limitations (intentional for this portfolio stage)

- Idempotency/rate-limiting currently use in-memory maps and should be moved to Redis for multi-instance production.
- Some flows and copy are currently French-first because of the target demo domain.

## Deployment

See:

- `docs/DEPLOYMENT.md`
- `docs/MIGRATIONS.md`
