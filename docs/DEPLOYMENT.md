# Deployment Guide

This guide covers deploying Lumelia SaaS to production.

## Prerequisites

- Node.js 20+
- PostgreSQL database (Prisma Postgres, Neon, Supabase, or self-hosted)
- Clerk account for authentication
- Twilio account for WhatsApp
- OpenRouter account for AI
- Vercel account (recommended) or other hosting

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/lumelia-saas.git
cd lumelia-saas

# 2. Install dependencies
npm ci

# 3. Copy environment template
cp .env.example .env.local

# 4. Fill in environment variables (see below)

# 5. Generate Prisma client
npx prisma generate

# 6. Run migrations
npx prisma migrate deploy

# 7. Start development server
npm run dev
```

## Environment Setup

### 1. Database

**Option A: Prisma Postgres (Recommended)**
```bash
# Create database at https://console.prisma.io
# Copy connection string to DATABASE_URL
```

**Option B: Neon**
```bash
# Create database at https://neon.tech
# Copy connection string (pooled) to DATABASE_URL
```

**Option C: Supabase**
```bash
# Create project at https://supabase.com
# Use connection pooler URL for DATABASE_URL
```

### 2. Clerk Authentication

1. Create application at https://dashboard.clerk.com
2. Copy Publishable Key to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy Secret Key to `CLERK_SECRET_KEY`
4. Configure webhooks:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.deleted`
   - Copy signing secret to `CLERK_WEBHOOK_SECRET`

### 3. Twilio WhatsApp

1. Create account at https://console.twilio.com
2. Set up WhatsApp sandbox or approved number
3. Copy Account SID to `TWILIO_ACCOUNT_SID`
4. Copy Auth Token to `TWILIO_AUTH_TOKEN`
5. Configure webhook:
   - URL: `https://your-domain.com/api/webhooks/twilio`
   - Method: POST

### 4. OpenRouter AI

1. Create account at https://openrouter.ai
2. Generate API key
3. Copy to `OPENROUTER_API_KEY`

### 5. Encryption Key

Generate a secure 32-byte hex key:
```bash
openssl rand -hex 32
```
Copy to `ENCRYPTION_KEY`

## Vercel Deployment

### Initial Setup

1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

### Environment Variables in Vercel

Add all variables from `.env.example` to your Vercel project:

**Production** (Environment: Production)
- All required variables with production values
- `NODE_ENV=production`

**Preview** (Environment: Preview)
- Same variables but with staging/preview values
- Consider using separate database for previews

### Build Settings

Vercel should auto-detect Next.js. Default settings work:
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`

### Post-Deployment

1. Update Clerk webhook URL to production domain
2. Update Twilio webhook URL to production domain
3. Verify SSL certificates are working
4. Test authentication flow
5. Test WhatsApp messaging

## Manual Deployment

If not using Vercel:

```bash
# Build
npm run build

# Start production server
npm start
```

Ensure:
- PORT environment variable is set
- Database is accessible
- All environment variables are configured

## Database Migrations

Migrations run automatically on Vercel via the build command.

For manual deployments:
```bash
npx prisma migrate deploy
```

See [MIGRATIONS.md](./MIGRATIONS.md) for detailed migration procedures.

## Monitoring

### Health Check

The application exposes a health endpoint:
```
GET /api/health
```

Returns:
- `200 OK` when healthy
- `503 Service Unavailable` when database is unreachable

### Logs

- Vercel: Available in Vercel dashboard
- Self-hosted: Configure log aggregation (stdout is JSON in production)

### Error Tracking

Set up Sentry:
1. Create project at https://sentry.io
2. Run `npx @sentry/wizard@latest -i nextjs`
3. Add `SENTRY_DSN` to environment

## Scaling Considerations

### Database
- Use connection pooling (PgBouncer, Prisma Data Proxy)
- Monitor query performance
- Add indexes as needed

### Caching
- Enable Redis for session caching
- Use SWR for client-side caching
- Leverage Vercel edge caching

### Rate Limiting
- Twilio webhooks have built-in rate limiting
- Consider adding API rate limiting for other endpoints

## Troubleshooting

### Build Failures

1. Check all environment variables are set
2. Verify `SKIP_ENV_VALIDATION=true` is set for builds without DB access
3. Check Prisma schema is valid: `npx prisma validate`

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check network access (IP allowlist)
3. Verify SSL requirements

### Webhook Issues

1. Check URLs are publicly accessible
2. Verify signing secrets match
3. Check logs for signature validation errors

### Auth Issues

1. Verify Clerk keys match environment
2. Check redirect URLs are configured correctly
3. Verify webhook is creating users in database
