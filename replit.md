# Inbox Deliverability Copilot

## Overview
A web application that helps businesses comply with Gmail/Yahoo bulk-sender rules by scanning DNS records (SPF, DKIM, DMARC, BIMI, MX), linting email templates for spam triggers, tracking deliverability metrics, and generating shareable public reports.

## Current State
Full-featured application with authentication, persistence, and automated DNS monitoring. Supports both anonymous DNS scanning and authenticated features for registered users. Pro users get automated background DNS monitoring that runs every 6 hours, detects DNS record changes, sends email alerts, and displays alerts in the dashboard.

## Recent Changes (October 8, 2025)
- **Automated DNS Monitoring**: Background job runs every 6 hours for Pro users with monitoring enabled
- **Change Detection**: Diff checker service compares DNS scans and identifies changes in SPF, DKIM, DMARC, BIMI, MX records
- **Email Alerts**: Automated email notifications sent to users when DNS changes are detected
- **Alert History**: Database tables for storing scans and alerts with full change tracking
- **Monitoring Control**: API endpoints to toggle monitoring on/off per domain and trigger manual runs
- **Pro-Only Features**: Automated monitoring requires Pro subscription

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
- **Daily Re-scans**: Added cron endpoint for automated daily domain re-scanning with status alerts
- **Protected Routes**: Secured domain management and dashboard endpoints with authentication
- **Navigation Updates**: Added dynamic navigation with login/signup buttons and user menu

## Project Architecture

### Database Schema (PostgreSQL)
- `users`: User accounts (includes stripeCustomerId, stripeSubscriptionId, isPro fields)
- `domains`: Registered domains for tracking (includes monitoringEnabled field)
- `reports`: Scan reports with shareable slugs (domainId is optional for free scans)
- `scans`: DNS scan history with JSON results for change detection
- `alerts`: DNS change alerts with old/new values and timestamps
- `health_points`: Manual deliverability metrics
- `template_checks`: Email template lint history

### Backend (Express + TypeScript)
- DNS scanning library (`server/lib/dns-scanner.ts`)
- Template linting library (`server/lib/template-linter.ts`)
- RESTful API routes (`server/routes.ts`)
- In-memory storage layer (`server/storage.ts`)

### Frontend (React + TypeScript + Vite)
- Landing page with instant DNS scan
- Scan results page with detailed record analysis
- Public shareable report pages
- Template linter tool
- Dashboard for registered users (future enhancement)

### Routes
- `/` - Landing page with DNS scanner
- `/scan` - Scan results view
- `/report/:slug` - Public shareable report
- `/template-lint` - Email template linter
- `/dashboard` - User dashboard (future)

## Key Features
1. **Free DNS Scanning**: No login required, instant scan results
2. **Record Analysis**: SPF, DKIM, DMARC, BIMI, MX validation
3. **Public Reports**: Shareable scan reports with unique slugs
4. **Template Linting**: Spam trigger detection in email templates
5. **Health Tracking**: Manual deliverability metrics (future UI)

## Design
- Dark mode primary with professional blue accent
- Status-driven UI (green/amber/red badges for compliance)
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

### Template & Health
- `POST /api/template-lint` - Lint email template
- `POST /api/health-points` - Add health point (protected)
- `GET /api/health-points` - Get health points

### Alerts & Monitoring
- `GET /api/alerts` - Get all alerts for current user (protected)
- `GET /api/alerts/:domainId` - Get alerts for specific domain (protected)
- `POST /api/monitoring/run` - Manually trigger monitoring cycle (protected, Pro only)

### Automation
- `POST /api/cron/rescan` - Daily re-scan endpoint (requires X-Cron-Secret header or ?key= param)

### Stripe Billing (Protected)
- `POST /api/stripe/checkout` - Create Stripe checkout session for Pro upgrade (protected)
- `GET /api/billing/verify?session_id=` - Verify completed payment and upgrade user
- `POST /api/stripe/webhook` - Handle Stripe webhook events (public, signature verified)
- `GET /api/billing/plan` - Get current user plan status (protected)
- `GET /api/billing/portal` - Redirect to Stripe customer portal (protected, Pro only)
