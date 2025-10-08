# Inbox Deliverability Copilot

## Overview
The Inbox Deliverability Copilot is a web application designed to help businesses comply with bulk-sender rules for email providers like Gmail and Yahoo. It achieves this by scanning DNS records (SPF, DKIM, DMARC, BIMI, MX), linting email templates for potential spam triggers, and tracking email deliverability metrics with a 0-100 scoring system. The application provides a comprehensive history of scans, including change detection, to ensure continuous compliance and deliverability. The project's ambition is to offer a full-featured solution with authentication, persistence, subscription management (via Stripe), automated daily monitoring, and an API for accessing scan data and diffs.

## User Preferences
I prefer simple language. I want iterative development. Ask before making major changes. I prefer detailed explanations.

## Recent Changes (October 8, 2025)
### Enterprise Features Expansion
- **Multi-Tier Plans**: Added Free/Pro/Agency tiers with enforced domain limits (1/10/unlimited)
  - New tables: `plan_limits`, plan-aware middleware for capacity checking
- **Teams & Collaboration**: Complete ACL system with owner/admin/viewer roles
  - New tables: `teams`, `team_members`, `team_domains`
  - Access control middleware for permission checks
- **Slack/Webhook Notifications**: User-configurable alert destinations
  - New table: `destinations` with URL validation and SSRF protection
  - Notification service delivers alerts to enabled channels
- **Per-Domain Alert Preferences**: Override global settings per domain
  - New table: `domain_alert_prefs` with field-by-field merging
  - Threshold filtering (info/warn/fail) before alert creation
- **Audit Logging**: Comprehensive event tracking across all operations
  - New table: `audit_log` records all events with actor, resource, metadata
  - Events: DOMAIN_CREATED, ALERT_SENT, TEAM_CREATED, MEMBER_ADDED, etc.
- **Public Share Links**: Shareable scan reports with expiration support
  - New table: `public_reports` with UUID-based anonymous access
- **Admin Metrics**: Platform-wide statistics dashboard
  - New routes: `/api/admin/metrics` for user/domain/scan/alert counts
- **Monitoring Job Updates**: Smart alerting with preference-aware notifications
  - Loads domain + user preferences, merges field-by-field
  - Filters channels, checks thresholds, only logs when actually sent
- **Branded PDF Exports (Agency Tier)**: White-label PDF deliverability reports
  - New tables: `report_exports`, `app_events`; added `brandLogo` and `brandColor` to teams
  - Service: `services/pdfExport.ts` using Playwright for high-quality PDF generation
  - Route: `POST /api/reports/:token/export` with auth, plan, and team membership validation
  - UI: Download button on public reports (only visible to Agency users with pdf feature)
  - Features: A4 format, team branding (logo/color), accurate file metadata, audit logging

## System Architecture

### UI/UX Decisions
The application features a dark mode primary theme with a professional blue accent. The UI is status-driven, utilizing green, amber, and red badges to indicate compliance levels. Deliverability scores are displayed with badges and sparklines for trend visualization. The Inter font is used for general UI elements, while JetBrains Mono is used for technical content, drawing inspiration from the aesthetics of Linear and Vercel.

### Technical Implementations
The application is built with a React frontend (TypeScript, Vite) and an Express.js backend (TypeScript). It uses PostgreSQL for data persistence.

**Key Features:**
- **Free DNS Scanning**: Instant scan results without requiring a login.
- **Deliverability Scoring**: A 0-100 point system with a detailed breakdown based on SPF, DKIM, DMARC, BIMI, and MX records, including penalties for warnings and failures.
- **Scan History & Change Detection**: Stores a complete audit trail of all scans and automatically detects changes between runs, categorizing them by severity (info/warn/fail).
- **Daily Monitoring**: For Pro users, automated daily scans are performed at midnight UTC.
- **Public Reports**: Shareable scan reports with unique slugs for easy collaboration.
- **Template Linting**: Identifies spam triggers within email templates.
- **Subscription Management**: Integrated with Stripe for Pro, Agency, and Free tiers, enforcing plan limits and feature access.
- **Teams & Access Control**: Collaboration features with role-based permissions (owner/admin/viewer) and shared domain access.
- **Notifications**: Configurable Slack/webhook notifications with per-domain alert preferences and severity thresholds.
- **Audit Logging**: Comprehensive event tracking for all operations.

### System Design Choices
- **Database Schema**: Comprehensive PostgreSQL schema with 20+ tables
  - Core: users, domains, reports
  - Monitoring: scan_runs, scan_records, scan_diffs, alerts
  - Enterprise: plan_limits, teams, team_members, team_domains, destinations, domain_alert_prefs, public_reports, audit_log
- **Backend Services**: 
  - `services/scoring.ts`: Deliverability score calculation (0-100 with breakdown)
  - `services/diffEngine.ts`: Scan comparison and change detection
  - `services/scanRunner.ts`: Complete scan workflow orchestration  
  - `services/auditLog.ts`: Event tracking across all operations
  - `services/notifications.ts`: Slack/webhook delivery with channel filtering
  - `services/pdfExport.ts`: Branded PDF generation using Playwright (Agency tier only)
- **Middleware**: 
  - `middleware/planLimits.ts`: Domain capacity and feature enforcement
  - `middleware/accessControl.ts`: Team-based permission checking
- **Routes**: Modular API structure
  - `routes.ts`: Core domains, scans, reports, alert prefs, audit
  - `routes/destinations.ts`: Slack/webhook destination CRUD
  - `routes/publicReports.ts`: Public share links
  - `routes/teams.ts`: Team management and ACL
  - `routes/admin.ts`: Admin metrics dashboard
- **Jobs**: `jobs/monitor.ts` - Daily UTC midnight cron with:
  - Field-by-field preference merging (domain overrides user)
  - Severity threshold checking before alert creation
  - Channel filtering based on enablement flags
  - Accurate audit logging (only logs when notifications sent)

## External Dependencies
- **PostgreSQL**: Primary database for all persistent data.
- **Stripe**: For subscription management, checkout, and webhook event handling.
- **Passport.js**: Used for user authentication (email/password).
- **Nodemailer**: (Planned) for email notifications and weekly digests.
- **Slack Webhooks**: For sending notifications to Slack channels.
- **Generic HTTP Webhooks**: For sending notifications to custom endpoints.