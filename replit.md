# Inbox Deliverability Copilot

## Overview
A web application that helps businesses comply with Gmail/Yahoo bulk-sender rules by scanning DNS records (SPF, DKIM, DMARC, BIMI, MX), linting email templates for spam triggers, tracking deliverability metrics, and generating shareable public reports.

## Current State
MVP implementation complete with full backend API and frontend integration. The application supports free DNS scanning without login and includes authenticated features for registered users.

## Recent Changes (October 3, 2025)
- Fixed critical bug where report generation failed due to domainId validation
- Made domainId nullable in reports table to support free scans
- Added proper error handling for API mutations
- Implemented DNS scanning with SPF, DKIM, DMARC, BIMI, and MX record parsing
- Built template linter with spam trigger detection
- Created health tracking API for manual deliverability metrics

## Project Architecture

### Database Schema (PostgreSQL)
- `users`: User accounts
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
- `POST /api/scan` - Scan DNS records for a domain
- `POST /api/report` - Generate shareable report
- `GET /api/report/:slug` - Retrieve public report
- `POST /api/template-lint` - Lint email template
- Domain CRUD: GET/POST/DELETE `/api/domains`
- Health tracking: GET/POST `/api/health-points`
