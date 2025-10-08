# Inbox Deliverability Copilot

## Overview
A web application that helps businesses comply with Gmail/Yahoo bulk-sender rules by scanning DNS records (SPF, DKIM, DMARC, BIMI, MX), linting email templates for spam triggers, tracking deliverability metrics with 0-100 scoring, and providing comprehensive scan history with change detection.

## Current State
Full-featured application with authentication, persistence, Pro subscriptions via Stripe, and automated daily DNS monitoring with deliverability scoring. The system tracks scan history, compares scans to detect changes, calculates deliverability scores, and provides API access to scan runs and diffs.

## Recent Changes (October 8, 2025 - Major Architecture Refactor)
- **New Database Schema**: Replaced simple scans/alerts tables with comprehensive tracking system
  - `scan_runs`: Individual scan executions with status, timestamps, scores
  - `scan_records`: Normalized DNS record storage (type, selector, hash, verdict)
  - `scan_diffs`: Change detection with added/removed/changed records and severity
  - `alert_prefs`: User notification preferences
  - `alerts`: Triggered alerts linked to runs
  - `email_log`: Audit trail for sent emails
- **Deliverability Scoring Service**: 0-100 point system with breakdown
  - SPF: 10 points for pass + up to 10 for alignment (-all=10, ~all=5)
  - DKIM: 20 points for pass + up to 10 for key strength (2048-bit=10, 1024-bit=5)
  - DMARC: 0/10/20 points based on policy (none=0, quarantine=10, reject=20)
  - BIMI: 5 points for present + 5 for valid
  - MX: 10 points for sane configuration
  - Penalties: -5 per WARN, -10 per FAIL
- **Diff Engine**: Compares scan runs to detect changes
  - Keys records by type+selector, hashes values for comparison
  - Tracks added, removed, and changed records
  - Assigns severity based on current state (info/warn/fail)
- **Scan Runner Service**: Orchestrates complete scanning workflow
  - Creates scan_run, executes DNS scan, stores normalized records
  - Calculates deliverability score with breakdown
  - Compares with previous run and creates diff if changes detected
  - Handles errors and marks runs as failed
- **Daily Monitoring Job**: Replaced 6-hour interval with daily UTC midnight cron
  - Runs at 00:00 UTC with timezone enforcement
  - Idempotency check prevents duplicate scans same day
  - Only scans Pro users with monitoringEnabled=true
  - Logs severity for visibility
- **New API Endpoints**:
  - `GET /api/domains/:id/runs` - Get scan run history with scores (protected)
  - `GET /api/domains/:id/diff/latest` - Get latest diff for domain (protected)
- **Storage Layer**: DbStorage fully implemented with new schema methods, MemStorage stubbed

## Previous Changes (October 7, 2025)
- **Stripe Subscription Integration**: Complete Pro plan upgrade flow with Stripe checkout
- **Webhook Event Handling**: Automated subscription status updates via Stripe webhooks
- **Billing Portal**: Pro users can manage subscriptions through Stripe customer portal
- **Atomic Database Upgrades**: Single-operation user upgrade with stripeCustomerId, stripeSubscriptionId, and isPro
- **Security Enhancements**: Webhook signature verification, session cookies with SameSite=None and Secure flags
- **UI Updates**: Pricing page shows "Manage Billing" button for Pro users
- **Cache Prevention**: Added Cache-Control headers to prevent stale plan data

## Previous Changes (October 6, 2025)
- **Authentication & Persistence**: Added full user authentication using Passport.js with email/password
- **Database Integration**: Migrated from in-memory storage to PostgreSQL persistence
- **User Dashboard**: Created authenticated dashboard showing saved domains and latest scans
- **Save & Share**: Implemented "Save & Share" functionality for authenticated users
- **Protected Routes**: Secured domain management and dashboard endpoints with authentication
- **Navigation Updates**: Added dynamic navigation with login/signup buttons and user menu

## Project Architecture

### Database Schema (PostgreSQL)
**Core Tables:**
- `users`: User accounts (email, passwordHash, stripeCustomerId, stripeSubscriptionId, isPro)
- `domains`: Registered domains (name, userId, monitoringEnabled)
- `reports`: Scan reports with shareable slugs (domainId optional for free scans)

**New Monitoring Tables:**
- `scan_runs`: Scan execution history (domainId, status, startedAt, finishedAt, score, scoreBreakdown, errorText)
- `scan_records`: Normalized DNS records (runId, recordType, selector, valueHash, rawValue, verdict, metaJson)
- `scan_diffs`: Change detection (runId, addedJson, removedJson, changedJson, severity)
- `alert_prefs`: User notification settings (userId, emailEnabled, slackEnabled, threshold)
- `alerts`: Triggered alerts (domainId, runId, type, severity, title, body, sentAt)
- `email_log`: Email audit trail (userId, type, sentAt, metaJson)

**Legacy Tables:**
- `health_points`: Manual deliverability metrics (future removal)
- `template_checks`: Email template lint history

### Backend Services (Express + TypeScript)
**Core Libraries:**
- `server/lib/dns-scanner.ts` - DNS record scanning (SPF, DKIM, DMARC, BIMI, MX)
- `server/lib/template-linter.ts` - Email template spam detection

**New Services:**
- `server/services/scoring.ts` - Deliverability score calculation (0-100 with breakdown)
- `server/services/diffEngine.ts` - Scan comparison and change detection
- `server/services/scanRunner.ts` - Complete scan workflow orchestration

**Jobs:**
- `server/jobs/monitor.ts` - Daily UTC midnight cron for Pro user domains

**Storage:**
- `server/db-storage.ts` - PostgreSQL implementation (production)
- `server/storage.ts` - Interface + MemStorage (testing)

**Routes:**
- `server/routes.ts` - Main API routes
- `server/auth-routes.ts` - Authentication endpoints
- `server/stripe-routes.ts` - Billing and webhooks
- `server/routes/alerts.ts` - Alert management

### Frontend (React + TypeScript + Vite)
- Landing page with instant DNS scan
- Scan results page with detailed record analysis
- Public shareable report pages
- Template linter tool
- Dashboard for registered users
- Pricing page with Stripe integration

### Routes
- `/` - Landing page with DNS scanner
- `/scan` - Scan results view
- `/report/:slug` - Public shareable report
- `/template-lint` - Email template linter
- `/dashboard` - User dashboard
- `/pricing` - Pro subscription plans

## Key Features
1. **Free DNS Scanning**: No login required, instant scan results
2. **Deliverability Scoring**: 0-100 point system with detailed breakdown
3. **Scan History**: Complete audit trail of all scans with timestamps
4. **Change Detection**: Automated diff between scans showing added/removed/changed records
5. **Daily Monitoring**: Pro users get automated daily scans at midnight UTC
6. **Public Reports**: Shareable scan reports with unique slugs
7. **Template Linting**: Spam trigger detection in email templates
8. **Pro Subscriptions**: Stripe-powered billing with automated monitoring

## Deliverability Scoring Formula
Base: 100 points
- SPF Pass: +10, Alignment: +10 (-all) or +5 (~all)
- DKIM Pass: +20, Key Strength: +10 (2048-bit) or +5 (1024-bit)
- DMARC Policy: +20 (reject), +10 (quarantine), +0 (none)
- BIMI Present: +5, Valid: +5
- MX Sane: +10
- Penalties: -5 per WARN, -10 per FAIL
- Final Score: max(0, base + components - penalties)

## Design
- Dark mode primary with professional blue accent
- Status-driven UI (green/amber/red badges for compliance)
- Score badges and sparklines for trend visualization
- Inter font for UI, JetBrains Mono for technical content
- Inspired by Linear/Vercel aesthetics

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/session` - Get current session status

### Scanning & Reports
- `POST /api/scan` - Scan DNS records (supports `save: true` for authenticated users)
- `POST /api/report` - Generate shareable report (anonymous)
- `GET /api/report/:slug` - Retrieve public report
- `GET /api/dashboard` - Get user's domains and latest scans (protected)

### Domain Management
- `POST /api/domain` - Add domain (protected)
- `GET /api/domain/:id` - Get domain details
- `GET /api/domains` - List all domains
- `DELETE /api/domain/:id` - Delete domain (protected)
- `PATCH /api/domain/:id/monitoring` - Toggle monitoring on/off (protected, Pro only)
- `GET /api/domains/:id/runs` - Get scan run history with scores (protected)
- `GET /api/domains/:id/diff/latest` - Get latest diff for domain (protected)

### Template & Health
- `POST /api/template-lint` - Lint email template
- `POST /api/health-points` - Add health point (protected)
- `GET /api/health-points` - Get health points

### Alerts & Monitoring
- `GET /api/alerts` - Get all alerts for current user (protected)
- `GET /api/alerts/:domainId` - Get alerts for specific domain (protected)
- `POST /api/monitoring/run` - Manually trigger monitoring cycle (protected, Pro only)

### Automation
- `POST /api/cron/rescan` - Legacy re-scan endpoint (requires X-Cron-Secret)

### Stripe Billing (Protected)
- `POST /api/stripe/checkout` - Create Stripe checkout session for Pro upgrade
- `GET /api/billing/verify?session_id=` - Verify completed payment and upgrade user
- `POST /api/stripe/webhook` - Handle Stripe webhook events (public, signature verified)
- `GET /api/billing/plan` - Get current user plan status
- `GET /api/billing/portal` - Redirect to Stripe customer portal (Pro only)

## Implementation Status

### ✅ Completed
- Database schema with comprehensive tracking tables
- Deliverability scoring service (0-100 with breakdown)
- Diff engine for change detection
- Scan runner service (orchestrates complete workflow)
- Daily monitoring cron (UTC midnight with idempotency)
- Storage layer (DbStorage fully implemented)
- API endpoints for runs and diffs
- Authentication and Stripe integration

### ⏸️ Deferred (Not Critical for Core Functionality)
- Alert service with email notifications
- Weekly digest emails
- UI components for displaying scores, runs, and diffs
- Frontend dashboard integration with new endpoints

## Notes for Future Development
- Consider migrating from `health_points` table to scan-based metrics
- Alert email service needs nodemailer configuration
- Weekly digest requires cron job and email templating
- Frontend needs score badges, sparklines, and diff visualization components
- Consider adding webhook for real-time scan updates
