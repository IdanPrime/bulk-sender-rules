# Design Guidelines: Inbox Deliverability Copilot

## Design Approach

**Selected Approach:** Modern SaaS Design System with trust-focused aesthetics

**Justification:** This is a technical B2B tool requiring clarity, trust, and professional credibility. Drawing inspiration from Linear, Vercel, and Stripe's clean, developer-focused interfaces while incorporating status-driven visual feedback from monitoring tools like Datadog.

**Key Principles:**
- Technical precision meets visual clarity
- Trust through transparency and clear status indicators
- Efficiency-first navigation and workflows
- Data visualization that tells a story

---

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Brand Primary: 217 91% 60% (Professional blue - trust and reliability)
- Brand Dark: 217 91% 45% (Hover/active states)

**Status Colors:**
- Success (PASS): 142 76% 36% (Green - DNS records configured correctly)
- Warning (WARN): 38 92% 50% (Amber - Needs attention)
- Error (FAIL): 0 84% 60% (Red - Critical issues)
- Info: 199 89% 48% (Cyan - Informational callouts)

**Neutral Scale (Dark Mode Primary):**
- Background: 222 47% 11% (Rich dark background)
- Surface: 217 33% 17% (Cards, elevated surfaces)
- Border: 217 20% 30% (Subtle dividers)
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Text Muted: 215 16% 47%

**Light Mode (Free Checker Landing):**
- Background: 0 0% 100%
- Surface: 210 20% 98%
- Border: 214 32% 91%
- Text Primary: 222 47% 11%
- Text Secondary: 215 16% 47%

### B. Typography

**Font Families:**
- Primary: 'Inter' (via Google Fonts) - Clean, modern, excellent readability for technical content
- Monospace: 'JetBrains Mono' - DNS records, code snippets, technical values

**Type Scale:**
- Hero Headline: text-5xl font-bold (Landing page)
- Page Title: text-3xl font-bold
- Section Heading: text-2xl font-semibold
- Card Title: text-lg font-semibold
- Body: text-base (16px baseline)
- Caption/Meta: text-sm text-muted
- Code/Technical: text-sm font-mono

**Font Weights:**
- Headings: font-semibold (600) or font-bold (700)
- Body: font-normal (400)
- Emphasis: font-medium (500)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (between related elements): 2, 4
- Component padding: 4, 6, 8
- Section spacing: 12, 16, 20, 24
- Page margins: 8, 12, 16

**Grid System:**
- Dashboard: 12-column grid with gap-6
- Cards: 2-3 column layouts on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Forms: Single column, max-w-2xl centered

**Container Widths:**
- Landing page: max-w-7xl
- Dashboard: max-w-7xl with px-6
- Reports: max-w-5xl (optimal for reading + print)
- Forms: max-w-2xl

### D. Component Library

**Status Badges:**
- PASS: Green background (142 76% 36%) with white text, rounded-full px-3 py-1
- WARN: Amber background (38 92% 50%) with dark text, rounded-full px-3 py-1
- FAIL: Red background (0 84% 60%) with white text, rounded-full px-3 py-1
- Pill style with icon prefix (checkmark, warning triangle, X)

**Cards:**
- Dark surface background with subtle border
- Rounded corners (rounded-lg)
- Padding: p-6
- Hover state: Slight border color intensification
- Shadow: None (flat, modern aesthetic)

**DNS Record Display:**
- Monospace font for technical values
- Copy button with clipboard icon (right-aligned)
- Expandable sections for detailed information
- Color-coded left border matching status

**Navigation:**
- Top navigation bar: Dark background, sticky positioning
- Logo left, user menu right
- Active page: Subtle underline or background highlight
- Mobile: Hamburger menu with slide-out drawer

**Forms:**
- Input fields: Dark surface with lighter border, focus ring in brand blue
- Labels: text-sm font-medium above inputs
- Helper text: text-xs text-muted below inputs
- Buttons: Primary (brand blue), Secondary (outline), Destructive (red)

**Data Visualization:**
- Chart.js line charts for health metrics
- Brand blue for primary data series
- Grid lines: Subtle, low contrast
- Tooltips: Dark background with white text
- Axes labels: text-sm text-muted

**Report Layout:**
- Clean, printable design
- Header with logo and domain name
- Summary section: Status badges in grid layout
- Details sections: Collapsible accordions
- Footer: Generation timestamp, share link

**CTA Buttons:**
- Primary: bg-[217 91% 60%] text-white, rounded-md px-6 py-3, font-medium
- Secondary: border-2 variant with transparent background
- Hover: Subtle brightness increase, no dramatic transformations

**Tables:**
- Striped rows (subtle background alternation)
- Sticky headers on scroll
- Monospace for technical columns
- Action buttons (edit, delete) right-aligned

### E. Animations

**Minimal, Purposeful Only:**
- Page transitions: None (instant)
- Copy confirmation: Brief checkmark animation (200ms)
- Chart loading: Smooth draw-in (400ms ease-out)
- Accordion expand/collapse: 200ms ease
- NO scroll-triggered animations, parallax, or decorative motion

---

## Page-Specific Layouts

**Landing Page (Free Checker):**
- Light mode for accessibility and trust
- Hero: Centered headline + subheadline + domain input form (max-w-4xl)
- Benefits section: 3-column grid showcasing key features (icons + titles + descriptions)
- How it works: 3-step process with numbered icons
- CTA section: "Try the free checker" with large input field
- Footer: Minimal links, social proof ("Trusted by X businesses")

**Dashboard:**
- Sidebar navigation (collapsible on mobile)
- Main content: Domain cards in grid (2-3 columns)
- Each card: Domain name, last scan status, quick actions
- Empty state: Illustration with "Add your first domain" CTA

**DNS Scan Results:**
- Top: Domain header with overall status
- Grid of status cards (SPF, DKIM, DMARC, BIMI, MX)
- Each card: Badge, record value (monospace), issues list, copy button
- Bottom: "Generate Report" CTA

**Public Report:**
- Clean, print-optimized layout
- Header: Logo, domain, generation date
- Summary dashboard: Status badges in prominent grid
- Detailed findings: Accordion sections per record type
- Footer: Shareable link, "Powered by" branding

**Template Lint:**
- Split layout: Input (left) and results (right)
- Subject/body text areas
- Score display: Large circular score (0-100) with color gradient
- Warning list: Itemized with severity icons
- Suggestions: Action-oriented recommendations

**Health Tracker:**
- Chart.js line graph showing trends over time
- Input form: Sent volume, open rate, spam rate, bounces (grid layout)
- Data table: Recent entries with edit/delete actions
- Empty state: Chart placeholder with "Add your first data point"

---

## Images

**Hero Image (Landing Page):**
- Abstract technical illustration showing interconnected mail servers and checkmarks
- Placement: Right side of hero section (40% width on desktop)
- Style: Gradient-colored line art matching brand blue palette
- Alternative: Dashboard preview mockup showing DNS scan results

**Feature Icons:**
- Use Heroicons (outline style) via CDN
- Size: 24px (w-6 h-6) for inline icons, 48px (w-12 h-12) for feature cards
- Color: Brand blue for active, muted for inactive

**Empty States:**
- Custom illustrations for: No domains, no health data, no templates
- Style: Simple line drawings with brand color accents
- Placement: Centered in empty content areas

---

## Accessibility & Quality Standards

- WCAG AA contrast ratios minimum
- Focus indicators: 2px ring in brand blue with offset
- Keyboard navigation: Logical tab order, skip links
- Screen reader labels: Descriptive aria-labels for status badges
- Print styles: Reports render cleanly in grayscale
- Responsive breakpoints: Mobile (< 768px), Tablet (768-1024px), Desktop (> 1024px)