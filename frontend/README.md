# VoxDesk AI — Frontend Application

The VoxDesk AI frontend is a modern, responsive single-page application built with **React 18**, **Vite**, and **Tailwind CSS**. It delivers a voice-first grievance recording desk for customers and an administrative support management console.

---

## 🎨 Key Features & User Workflows

### 1. Customer Voice Grievance Desk
- **Voice-First Audio Capture:** Uses the HTML5 `MediaRecorder` API to capture spoken complaints up to 45 seconds (WebM/Opus, ≤ 4 MB).
- **Interactive States:** Idle, Recording (with animated soundwave and countdown timer), Processing (with shimmering skeletons), and Confirmation.
- **Editable Transcript Review:** Before tickets are created, customers can review and edit the speech-to-text transcript returned by Groq Whisper.
- **Spoken AI Confirmation:** Browser `window.speechSynthesis` automatically reads out the registered ticket ID and assigned department for a complete voice-to-voice experience without external TTS costs.
- **Public Ticket Tracking:** Customers can track their ticket progress in real-time (`/track`) by entering their reference ID (e.g. `VD-XXXXXXXX`).

### 2. Admin Console (5 Management Modules)
- **Unified `AdminLayout`:** Viewport-height layout (`100dvh`) with fixed 280px sidebar (collapsible to 76px), sticky topbar with profile menu, and independent inner scroll container (`overflow-y-auto overflow-x-hidden`).
- **Responsive Mobile Drawer:** Slide-out drawer with backdrop blur overlay, body scroll lock, auto-close on selection, and Escape key dismissal on mobile devices.
- **Dashboard Overview (`/admin/dashboard`):** Real-time operational metrics (Total, Open, In Progress, Resolved, Escalated, High Priority), queue distribution, department workloads, and recent activity log.
- **Tickets Management (`/admin/tickets`):**
  - Paginated table with search, multi-filters (Status, Priority, Category, Department), and sorting.
  - Simplified color system: Escalated is the only red badge; all other statuses and priorities use neutral badges with visual dot indicators.
  - **`ActivityTimeline` Component:** Transforms raw JSON logs into human-readable action summaries (Ticket Created, Status Changed, Escalated, Department Reassigned, Admin Note Added).
  - Inline action controls with independent feedback states for status updates, department reassignment, and internal notes.
- **Analytics & Performance (`/admin/analytics`):**
  - In-memory charts (Volume Over Time, Resolution Status, Department Workload, Resolution Time Distribution).
  - Interactive date filters (Last 7 Days, Last 30 Days, Last 90 Days, All Time, Custom Date Range).
  - Accessible data table fallbacks for every chart.
- **Departments (`/admin/departments`):** Workload monitoring, department creation, updating, and safe deletion guards that prevent removing departments with active tickets.
- **Users Directory (`/admin/users`):** Administrator and staff directory, role assignments, status management, and creation modal.

---

## 🏗️ Directory Structure

```
frontend/
├── public/                  # Favicons, Apple Touch icons, SVG logos & brand assets
├── src/
│   ├── components/
│   │   ├── Navbar.jsx       # Public navigation bar with transparent logo & responsive menu
│   │   ├── Footer.jsx       # Public footer with privacy, navigation, and admin links
│   │   ├── StatusBadge.jsx  # Simplified status badge with neutral priority dots & red escalation
│   │   ├── StatCard.jsx     # Metric KPI card component
│   │   ├── LoadingSkeleton.jsx # Shimmer skeletons for cards, rows, and details
│   │   └── admin/
│   │       ├── AdminLayout.jsx      # Shared root layout managing collapse & mobile drawer
│   │       ├── AdminSidebar.jsx     # Viewport-height sidebar with pinned header & footer
│   │       ├── AdminTopbar.jsx      # Sticky topbar with breadcrumbs & user profile menu
│   │       ├── AdminMainContent.jsx # Isolated scrollable content wrapper
│   │       ├── DashboardView.jsx    # Operational metrics & workload overview
│   │       ├── TicketsView.jsx      # Paginated ticket log & details drawer
│   │       ├── ActivityTimeline.jsx # Human-readable event timeline
│   │       ├── AnalyticsView.jsx    # Statistical analytics & chart visualizer
│   │       ├── DepartmentsView.jsx  # Department CRUD & deletion guards
│   │       └── UsersView.jsx        # Admin & staff user management
│   ├── pages/
│   │   ├── Home.jsx         # Landing page hero, how it works, and features
│   │   ├── VoiceDesk.jsx    # Step 1: Voice recording & audio upload
│   │   ├── Review.jsx       # Step 2: Transcript review & confirmation
│   │   ├── Confirmation.jsx # Step 3: Success state with audio voice playback
│   │   ├── TrackTicket.jsx  # Public ticket status tracking
│   │   ├── AdminDashboard.jsx # Protected admin console with URL tab routing
│   │   └── NotFound.jsx     # Accessible 404 page
│   ├── services/
│   │   └── api.js           # Native fetch service with client-side 30s TTL SWR memory cache
│   ├── App.jsx              # Client-side router configuration (/admin, /admin/:tab)
│   ├── index.css            # Tailwind CSS directives & custom scrollbars
│   └── main.jsx             # React DOM root entrypoint
├── index.html               # HTML5 document with meta tags & favicons
├── package.json             # NPM dependencies & scripts
├── tailwind.config.js       # Custom design system tokens & colors
├── vercel.json              # Vercel SPA rewrites & security headers
└── vite.config.js           # Vite build & local proxy configuration
```

---

## ⚡ Client-Side Performance & Optimization

1. **In-Memory SWR Cache (`api.js`):**
   - Automatically caches GET responses in memory for 30 seconds.
   - Switching between admin tabs is **instantaneous (< 1ms)** without redundant network roundtrips.
   - Automatically flushes cache on POST, PATCH, and DELETE operations.
   - Manual "Refresh" buttons pass `{ bypassCache: true }` to fetch fresh server data on demand.
2. **Search Input Debouncing:**
   - 300ms debounce timer on search inputs in `TicketsView` and `UsersView` prevents firing API calls on every keystroke.
3. **Blob URL Lifecycle Management:**
   - Chart image blobs are cached in memory. Previous Object URLs are safely revoked upon cache invalidation to prevent memory leaks.
4. **Accessible Loading Skeletons:**
   - Visual skeletons occupy exact component dimensions to eliminate Cumulative Layout Shift (CLS).

---

## 📸 Product Walkthrough & Asset Generation

The frontend visual experience, user interactions, and responsive states are recorded automatically using Playwright Chromium:

\ash
# Generate 1440×900 @ 2x video walkthrough and high-resolution screenshots
node scripts/demo.mjs
\\r

- **Walkthrough Video**: demo-assets/voxdesk-demo.webm (30–45s interactive walkthrough)
- **Animated GIF**: demo-assets/voxdesk-demo.gif (optimally compressed preview)
- **UI Screenshots**: demo-assets/hero.png, demo-assets/active-workflow.png, demo-assets/result-state.png, demo-assets/dashboard.png, demo-assets/mobile-viewport.png\r

---

## 🚀 Setup & Local Execution

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
*(If omitted, defaults to `/api` for local Vite proxy or single-domain deployments).*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build
```bash
npm run build
```
Generates production-optimized assets in `dist/` verified with zero errors.

---

## 🌐 Production Deployment (Vercel)

The frontend is ready for immediate deployment on Vercel:
1. Connect your GitHub repository to Vercel.
2. Select the `frontend` folder as the **Root Directory**.
3. Set the Environment Variable:
   - `VITE_API_BASE_URL`: The URL of your deployed Flask backend (e.g., `https://api.voxdesk.ai/api`).
4. Vercel automatically applies `vercel.json` for SPA routing and asset caching headers.
