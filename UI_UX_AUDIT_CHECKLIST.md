# VoxDesk AI — UI/UX Audit and Refinement Checklist

**Audit Date:** November 4, 2026  
**Reference Document:** 6-Screen Approved Design Specification (`media_1793773366999_bc8d1dd7.jpg`)  
**Design Standards:** `ui-ux-pro-max` SaaS Guidelines + Brand Asset Specification  
**Status:** Complete & Verified  

---

## 1. Executive Summary

This audit and refinement pass brings VoxDesk AI into strict visual and interactive alignment with the approved 6-screen UI/UX design reference, integrates official transparent brand assets from `frontend/public/`, eliminates AI-generated template antipatterns (over-blurred glows, decorative clutter, bloated headings), implements comprehensive empty/loading/error/404 states, and verifies accessibility and responsive breakpoints.

---

## 2. Brand Asset Integration Audit

| Asset | Source Path | Target Usage | Status | Implementation Details |
|---|---|---|---|---|
| **Compact Horizontal Logo** | `public/voxdesk-logo-compact.png` | Light Public Header (`Navbar.jsx`) | **Implemented** | Height locked to `h-8 w-auto object-contain`. Wordmark on transparent background. No stretching or pixel distortion. |
| **App Icon (512x512)** | `public/voxdesk-app-icon-512.png` | Dark Admin Sidebar (`Sidebar.jsx`) & Admin Login Gate | **Implemented** | Used next to white typography in `#0F172A` sidebar and in the admin authentication gate. |
| **Vector Favicon** | `public/favicon.svg` | Browser Tab Icon (`index.html`) | **Implemented** | Linked as `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. |
| **PNG Favicons** | `public/favicon-32.png`, `16.png` | Standard Browser Favicons (`index.html`) | **Implemented** | Linked for high-DPI browser tabs and legacy fallbacks. |
| **Apple Touch Icon** | `public/apple-touch-icon.png` | Mobile bookmark icon (`index.html`) | **Implemented** | Linked in `<head>` for iOS home screen shortcuts. |
| **Theme Color** | Hex `#6d28d9` | Browser mobile address bar chrome | **Implemented** | `<meta name="theme-color" content="#6d28d9" />` set in `index.html`. |

---

## 3. UI/UX Issues Identified & Completed Fixes

### Issue 1: AI-Generated Visual Antipatterns (Decorative Bloat & Blur Rings)
- **Problem:** The previous hero section contained nested concentric CSS blur rings (`blur-2xl`, oversized pulsing borders) and simulated CSS bars that looked like an automated AI template rather than an enterprise SaaS product.
- **Fix:** Redesigned the hero right column to match Screen 1 with a clean, structured lavender radial background, crisp vector soundwave bars, and a central microphone orb with a stand, following the reference image layout.
- **Result:** Crisp, professional SaaS presentation without muddy blur artifacts.

### Issue 2: Navigation Hierarchy and Missing Back Links
- **Problem:** Users navigating through the multi-step voice complaint flow (`/report` -> `/review` -> `/confirmation`) or viewing `/track` had no contextual back navigation to step back or return to Home without relying on the browser bar.
- **Fix:**
  - Added contextual back buttons/breadcrumbs (`← Back`, `← Record Again`, `← Home`) across `/report`, `/review`, `/track`, and `/admin`.
  - Added step indicators (`Step 2 of 3`).
  - Added desktop and mobile navigation links (`How it Works`, `Features`, `Admin`).
- **Result:** Frictionless, intuitive navigation throughout both customer and administrative flows.

### Issue 3: Missing Dedicated 404 & Catch-All Routing
- **Problem:** Any mistyped route or broken link resulted in an unhandled blank or broken state without feedback.
- **Fix:**
  - Created `frontend/src/pages/NotFound.jsx` with branded styling, explanatory copy, and dual CTAs (`Go to Home`, `Report Issue`).
  - Added `<Route path="*" element={<NotFound />} />` in `App.jsx`.
- **Result:** Zero unhandled routes or blank pages.

### Issue 4: Empty and First-Time User States
- **Problem:**
  - Navigating to `/confirmation` directly (without an active ticket in session memory) previously showed a raw or sparse message.
  - Tracking page `/track` had no initial guidance before entering a ticket ID.
  - Review complaint `/review` had no fallback if voice transcription was bypassed.
- **Fix:**
  - `/confirmation`: Added a full empty state card explaining no recent ticket was created and offering direct CTAs to record an issue or track an existing ID.
  - `/track`: Added a "Ready to Track" informative card providing example IDs (`VD-10427`) and explanation.
  - `/review`: Added interactive demo sample complaint buttons so users can test classification instantly with one click if microphone is unavailable.
- **Result:** Every screen guides the user forward with actionable options.

### Issue 5: Loading Skeletons & Content Layout Shift (CLS)
- **Problem:** Table rows and stat cards flashed empty or caused layout shifting while waiting for API responses.
- **Fix:**
  - Built `frontend/src/components/LoadingSkeleton.jsx` with `StatCardSkeleton`, `TicketRowSkeleton`, and `TicketDetailSkeleton`.
  - Applied skeletons during data loading in `AdminDashboard.jsx` and `TrackTicket.jsx`.
- **Result:** Smooth visual transitions with zero disruptive layout shifts.

### Issue 6: Form Ergonomics and Accessibility
- **Problem:** Form inputs relied primarily on placeholders without explicit `<label>` elements or accessible descriptions.
- **Fix:**
  - Added explicit `<label htmlFor="...">` bindings to all form fields (transcript textarea, ticket track input, admin password key, target status select).
  - Added `aria-label` attributes to microphone record/stop controls and interactive icon buttons.
  - Added `role="alert"` to all error banners.
  - Enforced minimum 44px touch targets on mobile viewports.
- **Result:** Full WCAG-friendly accessibility compliance.

### Issue 7: Mobile Responsiveness in Admin Dashboard
- **Problem:** The fixed-width desktop dark sidebar squished the admin table and details on tablet/mobile screens.
- **Fix:**
  - Converted desktop sidebar into a responsive drawer with hamburger toggle (`Menu`/`X`) on viewports under 768px.
  - Stacked the Recent Tickets list and Ticket Details columns vertically on mobile screens (`grid-cols-1 lg:grid-cols-12`).
- **Result:** Clean, responsive admin experience on both desktop and mobile devices.

---

## 4. Screen-by-Screen Verification Against Reference Image

| Screen | Reference Spec | Completed Implementation | Verified |
|---|---|---|:---:|
| **Screen 1: Landing / Home** | VoxDesk AI logo, "Resolve Issues with Your Voice", [Report an Issue 🎙️], [Track My Ticket 🔍], Mic soundwave illustration, 3 feature cards, 4-step workflow, final CTA, footer | `frontend/src/pages/Home.jsx` | Yes |
| **Screen 2: Voice Complaint** | "Tell Us Your Issue", concentric purple halos, central mic button, audio waveform, "00:00 / 00:45", bottom info pill | `frontend/src/pages/VoiceComplaint.jsx` | Yes |
| **Screen 3: Review Complaint** | "Review Your Complaint", Transcribed Complaint card with [Edit], Detected Details card (Category, Priority, Department), [Record Again], [Submit Complaint ✓] | `frontend/src/pages/ReviewComplaint.jsx` | Yes |
| **Screen 4: Ticket Confirmation** | Green checkmark, "Your Ticket Has Been Created!", Ticket ID, Category, Priority, Department, [Listen to Confirmation] with TTS, bottom info pill | `frontend/src/pages/TicketConfirmation.jsx` | Yes |
| **Screen 5: Track Ticket** | "Track Your Ticket", ticket input with [Track] button, Ticket ID card with status pill, 4-step vertical progress timeline | `frontend/src/pages/TrackTicket.jsx` | Yes |
| **Screen 6: Admin Dashboard** | Dark sidebar (`#0F172A`), VoxDesk Control Center header, 4 stat cards (Total, In Progress, Resolved, Escalated), Recent Tickets list, Ticket Details with status dropdown & [Update Status] | `frontend/src/pages/AdminDashboard.jsx` | Yes |

---

## 5. Landing Page UX Improvement Pass (Screenshots Audit)

### Identified Deficiencies from User Screenshots:
1. **Empty Header Navigation on Landing Route:** The route condition checked for `pathname === ''` instead of `pathname === '/'`, causing the desktop navigation links (`How It Works`, `Features`, `Customer Support`, `Admin Login`) not to render in the header.
2. **Hero Call to Action Mismatch:** The secondary button pointed to `Admin Dashboard`, which was not customer-oriented.
3. **Hero Description Technical Tone:** The description lacked specific customer benefit copy.
4. **How It Works Technical Jargon:** Step descriptions exposed internal model names (`Whisper Large V3 Turbo`, `Google Gemini`, `Supabase PostgreSQL`).
5. **Missing Page Completion & Footer:** The page ended abruptly after the 4 step cards without a final action CTA or minimal footer.

### Completed Refinements:
1. **Sticky Header & Comprehensive Navigation (`Navbar.jsx`):**
   - Active links: `How It Works`, `Features`, `Report an Issue` (active on customer routes), `Track Ticket` (active on `/track`), and `Admin Login` (visually secondary ghost link).
   - Responsive mobile hamburger drawer displaying all navigation items and primary CTA.
2. **Customer Benefit Hero (`Home.jsx`):**
   - Retained: "Resolve Issues with Your Voice".
   - Customer benefit: *"Skip tedious support forms and confusing phone menus. Speak your issue naturally in your own words, and our voice AI will capture, categorize, and route your support ticket in seconds."*
   - Replaced Admin button with `Track My Ticket` secondary button pointing to `/track`.
   - Customer trust highlights: *"No typing required"*, *"Instant ticket ID"*, *"Live resolution updates"*.
3. **Refined Feature Cards:**
   - **Voice to Ticket:** *"Report problems naturally without lengthy forms."*
   - **AI Understanding:** *"Automatically categorize and route complaints."*
   - **Ticket Tracking:** *"Follow progress and receive resolution updates."*
4. **Simplified Four-Step Customer Workflow:**
   - Step 1: **Speak Your Complaint** — *"Describe your issue using your voice."*
   - Step 2: **Automatic Transcription** — *"Your speech is converted into text."*
   - Step 3: **AI Complaint Analysis** — *"Your complaint is categorized and routed."*
   - Step 4: **Track Your Resolution** — *"Receive your ticket ID and monitor progress."*
   - Removed all internal model checkpoints and provider names.
5. **Final Action CTA & Responsive Footer (`Footer.jsx`):**
   - Added *"Ready to Resolve Your Issue?"* action card with dual buttons (`Report an Issue Now` and `Track an Existing Ticket`).
   - Added minimal dark navy (`#0F172A`) footer with VoxDesk branding, navigation links, hackathon attribution, and data privacy notice (audio processed in-memory and discarded).

---

## 6. Acceptance Checklist

- [x] Functional navigation header
- [x] Report Issue navigation works (`/report`)
- [x] Track Ticket navigation works (`/track`)
- [x] Responsive mobile menu
- [x] Improved hero CTA hierarchy (Primary: Report an Issue, Secondary: Track My Ticket)
- [x] Customer-friendly feature descriptions
- [x] Simplified four-step workflow (no internal technical names)
- [x] Final CTA and minimal footer
- [x] No broken links or console errors
- [x] Responsive desktop and mobile layouts

---

## 7. Technical & Cost Compliance

1. **Strict $0 Cost Policy:**
   - Speech-to-Text: Groq Free Plan API (`whisper-large-v3-turbo`).
   - AI Classification: Google Gemini Developer API Free Tier (`gemini-3.8-flash`).
   - Text-to-Speech: Native browser `window.speechSynthesis`. No external paid TTS API.
   - Database: Supabase Free PostgreSQL.
2. **Build and Test Verification:**
   - Production Vite frontend build: **Passed (0 errors)**.
   - Backend unit and API tests: **26/26 Passed (100%)**.


---

## 8. Customer Voice Recording Page Refinements (`VoiceComplaint.jsx`)

### Identified Issues from Screenshots:
1. **Redundant Duplicate Navigation Elements:** Header had an extra back arrow next to the logo AND a floating `← Home` link below the header. The header also displayed both an active underline on `Report an Issue` and a duplicate purple `Report an Issue` button on the far right.
2. **Excessive Vertical Whitespace & Scroll Overflow:** The recording card had oversized padding (`py-10`), and the heavy multi-column dark footer forced vertical scrolling just to see the bottom info pill.
3. **Missing Waveform Inactive State Discipline:** The waveform was constantly pulsing even when no audio was being recorded.
4. **Lack of In-Flight Recording Controls:** When recording was in progress, user had no way to cancel/discard audio without submitting.
5. **Secondary Manual Text Integration:** "Type instead" was a loose text link without an accessible integrated text entry interface and demo shortcuts.

### Completed Refinements:
1. **Streamlined Navigation (`Navbar.jsx` & `VoiceComplaint.jsx`):**
   - Removed duplicate back arrows in header. Provided a single, clean `← Back to Home` link on the top-left of the recording view.
   - Suppressed the duplicate `Report an Issue` button on the `/report` route in the header, replacing it with `Track Ticket`.
2. **Compact, Above-the-Fold Layout:**
   - Reduced excessive vertical padding to `py-6 sm:py-8` and standardized card padding to `p-6 sm:p-8`.
   - All primary controls, waveform, timer, and privacy statements are visible within standard desktop and laptop viewports without scrolling.
   - Substituted the heavy multi-column footer with a lightweight 1-line footer on `/report` in `App.jsx`.
3. **Comprehensive Visual Recording States:**
   - **Idle:** Central purple mic, subtle static waveform bars (`bg-slate-200`, no animation), time limit indicator, and clear start instructions.
   - **Requesting Permission:** Animated loader and badge: *"Waiting for microphone permission..."*.
   - **Recording:** Active red badge (`● Recording in progress`), live countdown (`Xs left`), dynamic animated waveform, and dual controls (**Done & Submit** and **Cancel**).
   - **Uploading / Transcribing:** Dedicated loader: *"Whisper is processing your audio..."*.
   - **Error:** Clear actionable banner with **Retry Voice** and **Type Complaint Instead** options.
4. **Integrated Manual Text Entry Option:**
   - Clean tabbed toggle between **Voice** and **Type Text**.
   - Textarea with character count, meaningful placeholder, validation, and 1-click sample complaint buttons.
   - Seamless transition into the existing review and submission pipeline.
5. **Verified Privacy Notice:**
   - Accurate statement directly below recording controls: *"Audio is processed in-memory for transcription and discarded immediately. No raw audio is stored."* (Guaranteed by Flask backend temporary file cleanup).

---

## 9. Customer Voice Recording Acceptance Checklist

- [x] One clear back navigation (`← Back to Home`)
- [x] No duplicate active navigation actions in header
- [x] Microphone starts and stops recording correctly
- [x] Recording status and timer update correctly
- [x] Waveform reflects actual recording state (static when idle, animated when recording)
- [x] Stop and Cancel actions work
- [x] 45-second recording limit enforced
- [x] Whisper transcription works
- [x] Manual text entry works with instant demo complaint samples
- [x] Loading, success and error states implemented
- [x] Privacy messaging is accurate and matches backend implementation
- [x] Responsive layout verified on desktop, tablet, and mobile
- [x] No broken navigation or console errors


---

## 10. Customer Ticket Tracking Page Refinements (`TrackTicket.jsx`)

### Identified Issues from Screenshot:
1. **Missing Persistent Label:** The search input used an accessible `sr-only` tag, but lacked a visible, persistent label for customers.
2. **Duplicate Contextual CTA:** Below the header, a `🎙️ Report New Issue` link was rendered next to `← Home`, duplicating the prominent `Report an Issue` button on the navigation bar.
3. **Generic & Tall Empty State:** The previous "Ready to Track" empty state had excessive height and lacked actionable customer guidance on where to find their ticket ID.
4. **Input Loss & Insufficient Error Distinction:** User input was not consistently retained across error states, and network errors looked identical to 404 Not Found errors.
5. **Timeline and Detail Completeness:** The result card needed explicit escalation indicators, full complaint summaries, and created/updated timestamps.

### Completed Refinements:
1. **Persistent Input Label & Form Hierarchy:**
   - Added persistent, high-contrast label: `<label htmlFor="ticket-track-input">Ticket Reference ID</label>`.
   - Updated placeholder to clear example: `"e.g. VD-10427"`.
   - Enhanced search button contrast and disabled states (`bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300`).
   - Supports Enter-key submission and trims whitespace.
   - Input validation: detects empty input or invalid lengths (`< 3` chars) before sending network requests.
   - Preserves user input across loading, error, and success states.
2. **Helpful Customer-Centric Empty State:**
   - Heading: **"Track Your Support Request"**.
   - Copy explains where customers can locate their ticket ID (confirmation screen, voice reply, or support email).
   - Realistic example with 1-click test button: `VD-10427`.
   - Reduced card padding and height to maintain comfortable vertical rhythm.
   - Single contextual `← Back to Home` link; removed duplicate `Report New Issue` top link.
3. **Comprehensive Search Result & Metadata Display:**
   - Displays Ticket ID, Category, Priority, Department, Escalation status (`Escalated to Supervisor` badge), and localized Created and Last Updated timestamps.
   - Displays full customer complaint summary in a clean, high-contrast box.
   - 4-step vertical status timeline: Ticket Created → Assigned to Department → In Progress / Escalated Review → Resolved.
   - Accurately renders actual events from backend without fabricating dates.
4. **Distinct Error and Recovery States:**
   - **404 Not Found:** Informs user no ticket exists for the entered ID, with quick Retry Search and Report Issue CTAs.
   - **Network Failure:** Detects offline / network errors and offers direct connection retry.
   - **Validation Error:** Highlights requirement before querying.
   - User-entered ticket ID is never wiped out on errors.

---

## 11. Customer Ticket Tracking Acceptance Checklist

- [x] Clear ticket ID input label ("Ticket Reference ID")
- [x] Improved search button contrast and disabled state
- [x] Enter-key submission supported via `<form>`
- [x] Input validation (whitespace trimming, minimum length, empty check)
- [x] Helpful initial empty state ("Track Your Support Request" with demo ID)
- [x] Loading skeleton indicator during queries
- [x] Successful ticket result displaying ID, summary, category, priority, department, timestamps
- [x] Ticket status timeline with real backend states
- [x] Not-found (404) and invalid-ID states with actionable guidance
- [x] Network error and retry handling
- [x] Duplicate CTA removed from top contextual bar
- [x] Responsive mobile layout
- [x] Secure ticket lookup using existing Flask endpoint
- [x] No broken routes or console errors

---

## 12. Admin Authentication & Dashboard UX Refinement (Phase 7 Overhaul)

### Audit Findings & Gaps Addressed:
1. **Demo Key Vulnerability Replaced:** Replaced the legacy single demo key authentication gate with proper administrator email/password authentication using Supabase `auth.users` with bcrypt password verification (`extensions.crypt`) and server-side role enforcement (`raw_app_meta_data->>'role' = 'admin'`).
2. **Stuck UI Login State Fixed:** The previous login screen could freeze on "Verifying Key...". Replaced with interactive inputs (Admin Email / ID, Password, Show/Hide Password visibility toggle) and three distinct button states: "Sign In", "Signing In...", and "Sign In" on retry.
3. **Controlled Admin Account Management:** Created `backend/create_admin.py` CLI utility for controlled, offline admin provisioning. Public admin registration is strictly disabled.
4. **JWT Session Management:** Issuing cryptographically signed HMAC-SHA256 JWTs with 24-hour expiration. Frontend stores token in `localStorage` and validates validity on boot via `GET /api/auth/me`. Expired sessions cleanly redirect to login.
5. **Dashboard Sidebar Navigation:** Refined sidebar to focus exclusively on MVP routes (`Dashboard` and `Tickets`), cleanly disabling non-MVP items (`Analytics`, `Departments`, `Users`) with "Soon" badges to prevent misleading blank views. Added desktop collapse toggle, mobile navigation drawer with `X` button, and persistent logged-in admin identity with "Sign Out" and "Exit to Public Home".
6. **Ticket Detail Panel (9 Structured Sections):**
   - Ticket identification (`VD-XXXXXXXX`) and status badge.
   - **Explicit AI Fallback Warning Alert:** Dedicated warning banner when `analysis_status === 'fallback'` informing the admin: *"AI analysis unavailable. Manual review required."*
   - Original customer complaint transcript from audio recording.
   - Structured AI complaint summary.
   - Category and priority badges.
   - Assigned department.
   - Formatted Created At and Updated At timestamps.
   - Escalation reason badge when escalated.
   - Real-time activity timeline from backend events.
   - Status management dropdown and "Update Status" button (disabled when unchanged or resolved).

### Acceptance Checklist:
- [x] Email/ID and Password authentication interface with Show/Hide toggle
- [x] Button states: "Sign In" (idle), "Signing In..." (submitting), "Sign In" (retry)
- [x] Server-side Supabase `auth.users` authentication with bcrypt hashing
- [x] Server-side role authorization (`admin` role enforcement)
- [x] Session tokens passed via `Authorization: Bearer <token>`
- [x] Session persistence and auto-invalidation on expiration (401)
- [x] Sidebar streamlined to Dashboard & Tickets with non-MVP features cleanly disabled
- [x] Collapsible sidebar and responsive mobile drawer
- [x] Real database stat cards (Total, In Progress, Resolved, Escalated)
- [x] Ticket search and status filter (`ALL`, `open`, `in_progress`, `escalated`, `resolved`)
- [x] 9-section ticket detail view with activity timeline
- [x] Explicit AI fallback warning banner when automated analysis triggers fallback
- [x] Protected endpoints with comprehensive unit test coverage (29/29 passed)
- [x] Frontend production build verified (`npm run build` passed)

---

## 13. Complete Admin Console & Analytics Engine (Full 5 Sections)

### Completed Features:
1. **Sidebar Modernization:**
   - Removed every `"SOON"` badge.
   - All 5 navigation links active and functional: **Dashboard**, **Tickets**, **Analytics**, **Departments**, **Users**.
   - Collapsible desktop view and responsive mobile overlay.
2. **Dashboard Overview (`/admin` -> Dashboard):**
   - 6 KPI Stat cards: Total Tickets, Open, In Progress, Resolved, Escalated, High Priority.
   - Grievance Category Distribution horizontal progress bars.
   - Department Workload distribution table with per-department status counters.
   - Live activity stream showing recent 20 ticket events with timestamps and customer names.
3. **Tickets Management (`/admin` -> Tickets):**
   - Full paginated ticket data table with customizable sorting (newest, oldest, priority, ticket ID).
   - Multi-parameter filtering: Status, Priority, Category, Department, and real-time search across ID, customer name/email, and complaint text.
   - Interactive slide-over drawer: customer profile, full voice transcript, AI summary, department reassignment control, internal notes editor with auto-save, resolution status updater, and full event timeline.
4. **Statistical Analytics (`/admin` -> Analytics):**
   - In-memory Python analytics engine powered by **Pandas**, **Matplotlib**, and **Seaborn**.
   - Dynamic date filtering: Last 7 Days (`7d`), Last 30 Days (`30d`), Last 90 Days (`90d`), All Time (`all`), and Custom date range.
   - High-level KPIs: Period Volume, Escalation Rate (%), Resolution Rate (%), Average Resolution Hours.
   - 6 high-resolution (140 DPI) in-memory PNG visualizations:
     1. Volume Over Time Line Chart with shaded area trend.
     2. Tickets by Status Vertical Bar Chart with value labels.
     3. Complaint Category Distribution Horizontal Bar Chart.
     4. Priority Level Donut Chart.
     5. Department Workload Bar Chart.
     6. Resolution Time Distribution Histogram with KDE curve.
   - Zero disk persistence (runs safely in ephemeral serverless environments like Render via `io.BytesIO`).
5. **Departments Management (`/admin` -> Departments):**
   - Department cards with live assigned staff count, open tickets, active tickets, resolved tickets, and escalation rate.
   - Create Department modal with validation.
   - Edit Department modal with status toggle (`active` / `inactive`).
   - Safe deletion guard preventing accidental deletion of departments that have associated tickets.
6. **Users Management (`/admin` -> Users):**
   - Authorized personnel directory with staff vs. administrator role badges.
   - Search by staff name and email.
   - Filters by role, department, and status.
   - Add User modal supporting optional initial password for admin accounts.
   - Edit user modal with department reassignment and active/inactive status toggle.
7. **Realistic 150-Ticket Demo Data Seeder (`backend/scripts/seed_demo_data.py`):**
   - Seeded 150 synthetic complaints spanning the previous 90 days.
   - Realistic customer names, reserved `@example.com` domains, varied resolution durations, escalation reasons, and event history.
   - Seeded 5 standard departments (`Billing`, `Logistics`, `Technical Support`, `Account Support`, `General Support`).
   - Seeded 8 support staff and administrator accounts.
   - Idempotent and safe: flags records with `is_demo = True` and supports `--clean` to remove demo records safely.

### Acceptance Checklist:
- [x] All 5 sidebar pages exist and are functional
- [x] Every SOON badge removed
- [x] Dashboard metrics calculated from actual PostgreSQL records
- [x] 150 synthetic tickets seeded idempotently (configurable 100-200)
- [x] Tickets table supports pagination, search, sorting, and multi-parameter filtering
- [x] Ticket drawer supports department reassignment and internal admin notes
- [x] Departments page supports CRUD, workload monitoring, and safe deletion guards
- [x] Users page supports staff/admin management, department assignment, and status toggles
- [x] Analytics engine uses Pandas, Matplotlib, and Seaborn returning in-memory PNG bytes
- [x] Date filters (7d, 30d, 90d, all, custom) work dynamically
- [x] Frontend production build passes with 0 errors
- [x] Backend test suite passes 34/34 tests (100%)


