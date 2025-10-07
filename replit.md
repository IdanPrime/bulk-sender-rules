# Inbox Deliverability Copilot

## Overview
A web application that helps businesses comply with Gmail/Yahoo bulk-sender rules by scanning DNS records (SPF, DKIM, DMARC, BIMI, MX), linting email templates for spam triggers, tracking deliverability metrics, and generating shareable public reports.

## Current State
Full-featured application with authentication, persistence, and automated monitoring capabilities. Supports both anonymous DNS scanning and authenticated features for registered users including saved scans, dashboard, and daily re-scan monitoring.

## Recent Changes (October 7, 2025)
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
- `domains`: Registered domains for tracking
- `reports`: Scan reports with shareable slugs (domainId is optional for free scans)
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

### Template & Health
- `POST /api/template-lint` - Lint email template
- `POST /api/health-points` - Add health point (protected)
- `GET /api/health-points` - Get health points

### Automation
- `POST /api/cron/rescan` - Daily re-scan endpoint (requires X-Cron-Secret header or ?key= param)

### Stripe Billing (Protected)
- `POST /api/stripe/checkout` - Create Stripe checkout session for Pro upgrade (protected)
- `GET /api/billing/verify?session_id=` - Verify completed payment and upgrade user
- `POST /api/stripe/webhook` - Handle Stripe webhook events (public, signature verified)
- `GET /api/billing/plan` - Get current user plan status (protected)
- `GET /api/billing/portal` - Redirect to Stripe customer portal (protected, Pro only)
