# Inbox Deliverability Copilot

> **Ensure your emails reach the inbox**, not the spam folder. A comprehensive deliverability monitoring platform helping businesses comply with Gmail, Yahoo, and other bulk-sender requirements.

## Overview

Inbox Deliverability Copilot scans DNS records (SPF, DKIM, DMARC, BIMI, MX), lints email templates for spam triggers, and provides a 0-100 deliverability score with actionable insights. Track changes over time, receive alerts when issues arise, and share reports with your team.

### Key Capabilities
- **Free DNS Scanning** - Instant deliverability checks without signup
- **Automated Monitoring** - Daily scans with change detection and alerts
- **Subscription Tiers** - Free, Pro, and Agency plans with Stripe integration
- **Team Collaboration** - Role-based access control (owner/admin/viewer)
- **Notifications** - Slack and webhook integrations with per-domain preferences
- **Audit Logging** - Complete event tracking for compliance
- **Public Reports** - Shareable scan results with unique links
- **Branded PDF Exports** - White-label reports (Agency tier)
- **Admin Analytics** - Platform-wide metrics and event tracking

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Stripe account (for subscriptions)
- SMTP server (for email notifications)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd inbox-deliverability-copilot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

---

## Configuration

All configuration is done via environment variables. See `.env.example` for a complete list with detailed comments.

### Critical Environment Variables

| Variable | Purpose | How to Get |
|----------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection | Auto-provided by Replit or your hosting provider |
| `SESSION_SECRET` | Cookie signing secret | Generate: `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | Stripe API key | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Stripe Dashboard > Developers > Webhooks |
| `SMTP_HOST` | Email server | Your email provider (e.g., smtp.gmail.com) |
| `SMTP_USER` / `SMTP_PASS` | Email credentials | Your email account or app password |
| `CRON_SECRET` | Cron job auth | Generate: `openssl rand -hex 32` |

**⚠️ Security Note**: Never commit `.env` to version control. Use `.env.example` as a template.

---

## Features

### Feature Matrix by Tier

| Feature | Free | Pro | Agency |
|---------|------|-----|--------|
| **Domains** | 1 | 10 | Unlimited |
| **DNS Scanning** | ✅ | ✅ | ✅ |
| **Deliverability Score** | ✅ | ✅ | ✅ |
| **Scan History** | ✅ | ✅ | ✅ |
| **Daily Monitoring** | ❌ | ✅ | ✅ |
| **Slack/Webhook Alerts** | ❌ | ✅ | ✅ |
| **Weekly Email Digest** | ❌ | ✅ | ✅ |
| **Teams & Collaboration** | ❌ | ❌ | ✅ |
| **Branded PDF Exports** | ❌ | ❌ | ✅ |
| **Admin Metrics Dashboard** | ❌ | ❌ | ✅ |

### Core Features

#### DNS Record Scanning
- **SPF** - Sender Policy Framework validation
- **DKIM** - DomainKeys Identified Mail verification
- **DMARC** - Domain-based Message Authentication, Reporting & Conformance
- **BIMI** - Brand Indicators for Message Identification
- **MX** - Mail Exchange record checks

#### Deliverability Scoring
- 0-100 point system with detailed breakdown
- Penalties for warnings and failures
- Historical trend tracking with sparklines
- Change detection between scans

#### Monitoring & Alerts
- Automated daily scans at midnight UTC
- Configurable per-domain alert preferences
- Severity thresholds (info/warn/fail)
- Slack and webhook delivery channels

#### Team Collaboration (Agency)
- Role-based access control (owner/admin/viewer)
- Shared domain access
- Audit logging for all actions
- Team branding (logo + color)

#### Reporting
- Public shareable links with optional expiration
- Branded PDF exports with team logo/color (Agency)
- Weekly email digests with PDF attachments
- Change history and diff tracking

---

## Architecture

### Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe (checkout, subscriptions, webhooks)
- **Auth**: Passport.js (local strategy)
- **Email**: Nodemailer with SMTP
- **PDF Generation**: Playwright
- **Charts**: Recharts

### Database Schema
20+ tables including:
- Core: `users`, `domains`, `reports`
- Monitoring: `scan_runs`, `scan_records`, `scan_diffs`, `alerts`
- Enterprise: `teams`, `team_members`, `destinations`, `audit_log`
- Billing: Stripe integration via user fields
- Analytics: `app_events`, `email_log`

### Key Services
- `services/scoring.ts` - Deliverability calculation
- `services/diffEngine.ts` - Scan comparison
- `services/scanRunner.ts` - Complete scan workflow
- `services/notifications.ts` - Slack/webhook delivery
- `services/pdfExport.ts` - Branded PDF generation
- `services/analytics.ts` - Event tracking

---

## Deployment

### Development

```bash
# Start dev server with hot reload
npm run dev

# Run database push (sync schema changes)
npm run db:push

# View database in Drizzle Studio
npm run db:studio
```

### Production

#### Pre-Deployment Checklist
1. ✅ Set `NODE_ENV=production` in environment
2. ✅ Use production Stripe keys (live mode)
3. ✅ Configure production SMTP credentials
4. ✅ Generate secure `SESSION_SECRET` (32+ characters)
5. ✅ Generate secure `CRON_SECRET`
6. ✅ Point `DATABASE_URL` to production database
7. ✅ Configure Stripe webhooks to production URL
8. ✅ Verify email delivery works
9. ✅ Test cron jobs are running

#### Deployment Steps

```bash
# 1. Build frontend
npm run build

# 2. Push database schema
npm run db:push --force

# 3. Start production server
npm start
```

#### Stripe Webhook Configuration
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Cron Job Security
Automated jobs (monitoring, weekly digest) require `CRON_SECRET` in headers:
```
Authorization: Bearer <CRON_SECRET>
```

Set this in your cron scheduling service (e.g., cron-job.org, EasyCron):
- Daily monitoring: `POST /api/monitoring/run` at 00:00 UTC
- Weekly digest: `POST /api/weekly-digest/send` on Mondays at 09:00 UTC

---

## Operations

### Monitoring System
- **Daily Scans**: Automated at midnight UTC for Pro+ users
- **Change Detection**: Compares scans and categorizes changes
- **Alert Delivery**: Sends to enabled Slack/webhook destinations
- **Preference Merging**: Domain settings override user defaults

### Email Digest
- **Schedule**: Mondays at 9:00 UTC
- **Content**: Domain summaries with scores and issues
- **Attachments**: PDF scan reports via Playwright
- **Logging**: Tracked in `email_log` table

### PDF Export (Agency Only)
- **Branding**: Team logo and primary color
- **Generation**: Playwright for high-quality rendering
- **Access Control**: Plan + team membership validation
- **Audit Trail**: Events logged to `app_events`

### Analytics Tracking
Events tracked:
- User registration/login
- Domain add/delete
- Scan initiation/completion
- Alert delivery
- PDF exports
- Subscription changes

Admin dashboard shows:
- Event counts by type
- 30-day timeline chart
- User distribution by plan
- Platform-wide metrics

---

## Troubleshooting

### Authentication Issues

**Problem**: Getting 401 errors or session not persisting

**Solutions**:
- Verify `SESSION_SECRET` is set in environment
- Check that cookies are enabled in browser
- Ensure `NODE_ENV` matches your environment
- For production, verify domain/SSL configuration

### Stripe Webhook Failures

**Problem**: Webhook events not processing

**Solutions**:
- Verify `STRIPE_WEBHOOK_SECRET` is correctly set
- Check webhook URL in Stripe dashboard matches your deployment
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:5000/api/stripe/webhook`
- Check server logs for signature verification errors

### Email Delivery Issues

**Problem**: Emails not sending or timing out

**Solutions**:
- Verify SMTP credentials (`SMTP_USER`, `SMTP_PASS`)
- Check SMTP port (587 for TLS, 465 for SSL)
- For Gmail: use App Password, not regular password
- Enable "Less secure apps" or 2FA + App Password
- Check firewall rules allow outbound SMTP traffic

### Cron Jobs Not Running

**Problem**: Monitoring or digest emails not triggering

**Solutions**:
- Verify `CRON_SECRET` matches in environment and cron service
- Check cron schedule is correct (UTC timezone)
- Manually test endpoint: `curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/monitoring/run`
- Check server logs for cron execution

### PDF Export Failures

**Problem**: PDF downloads fail or timeout (Agency tier)

**Solutions**:
- Ensure Playwright dependencies installed: `npx playwright install chromium`
- For Replit: Chromium auto-installed, check available disk space
- Verify team has `brandLogo` or `brandColor` configured
- Check server memory limits (PDF generation is memory-intensive)
- Review logs for Playwright browser launch errors

### Database Migration Errors

**Problem**: Schema changes fail to apply

**Solutions**:
- Use `npm run db:push --force` to force schema sync
- **Never** manually alter ID column types (serial ↔ varchar)
- Check `DATABASE_URL` is correct and accessible
- Verify database user has CREATE/ALTER permissions
- Backup before major schema changes

### High Memory Usage

**Problem**: Server runs out of memory

**Solutions**:
- PDF generation is memory-intensive - consider queue system for high volume
- Check for memory leaks in monitoring cron (should release resources after run)
- Increase server memory allocation
- Monitor `app_events` table growth, archive old events if needed

---

## Additional Resources

### Documentation
- [Stripe API Docs](https://stripe.com/docs/api)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Playwright Docs](https://playwright.dev/)

### Development Commands

```bash
# Database
npm run db:push          # Sync schema to database
npm run db:push --force  # Force sync (use for conflicts)
npm run db:studio        # Open Drizzle Studio

# Development
npm run dev              # Start dev server with HMR

# Production
npm run build            # Build frontend
npm start                # Start production server
```

### Support

For issues not covered in this guide:
1. Check server logs for detailed error messages
2. Review `.env.example` for configuration requirements
3. Verify all prerequisites are installed and configured
4. Test individual components (database, SMTP, Stripe) separately

---

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
