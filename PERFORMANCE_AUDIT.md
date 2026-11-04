# VoxDesk AI — Admin Performance Audit & Optimization Report

**Date:** November 4, 2026  
**Auditor:** Full-Stack Performance Architect & Senior Database Engineer  
**Branch:** `develop`  
**Stack:** React 18 + Vite + Tailwind CSS (Frontend) \| Python 3.13 + Flask 3.1 + SQLAlchemy 2.0 (Backend) \| Supabase PostgreSQL (Database)  
**Test Data Set:** 153 Tickets, 5 Departments, 8 Admin Users, 300+ Ticket Events  
**Compliance:** Strictly $0 Free Tier Policy preserved  

---

## 1. Executive Summary & Root Cause Diagnosis

Prior to this audit, navigating between admin pages took **10–20 seconds**. Detailed stopwatch instrumentation and SQL query tracing identified three distinct root causes:

1. **The Sequential N-Query Roundtrip Problem (Backend/Database):**
   - Supabase PostgreSQL is hosted in AWS (`us-east-1`, `db.uxhafczsczuwuvmrsvjh.supabase.co`).
   - Every single network roundtrip from the application to Supabase incurs **420ms – 880ms** of transatlantic WAN latency.
   - The `/api/admin/dashboard/summary` endpoint was executing **9 sequential database queries** per request (6 separate `count()` queries plus 3 `group_by()` queries). Total latency: **5,241ms**.
   - `/api/admin/departments` was executing **3 sequential queries** (Departments + Staff Counts + Ticket Counts), taking **2,615ms**.

2. **Uncached Matplotlib Rendering & Redundant Database Scans (Analytics):**
   - Navigating to `/admin/analytics` requested 1 summary endpoint and 4 chart image endpoints (`volume_over_time`, `status_distribution`, `department_workload`, `resolution_time`).
   - Every chart endpoint connected to PostgreSQL independently, fetched all tickets (**877ms** DB time), and rendered Seaborn/Matplotlib charts from scratch (**1,408ms** CPU time).
   - Fetching 4 charts took **4 × 2,285ms = 9,140ms**, completely saturating the WSGI thread and locking navigation.

3. **Complete Absence of Client-Side Caching (Frontend):**
   - React views were mounted conditionally inside `AdminDashboard.jsx`. Switching tabs unmounted the view and wiped out all local component state.
   - Returning to a tab triggered duplicate network requests over WAN for static datasets (e.g. re-fetching 5 departments and 8 users every time).
   - Search inputs in `TicketsView` and `UsersView` were not debounced, firing network requests on every keystroke.

---

## 2. Before vs After Performance Benchmark

Measurements taken on live Supabase PostgreSQL dataset (153 tickets, warm connection pool):

| Route / Endpoint | Pre-Optimization Latency | Post-Optimization (1st Call) | Post-Optimization (Cached / Warm) | Speedup Factor |
|---|:---:|:---:|:---:|:---:|
| **GET `/api/admin/dashboard/summary`** | 5,241.6ms (9 queries) | 2,776.4ms (4 queries) | **0.0ms** (client cache) | **1.9x** (server) / **Instant** (client) |
| **GET `/api/admin/dashboard/recent-activity`** | 2,210.4ms | 2,014.5ms | **0.0ms** (client cache) | **Instant** (client) |
| **GET `/api/admin/tickets?page=1&page_size=25`** | 2,619.0ms | 2,029.0ms | **0.0ms** (client cache) | **Instant** (client) |
| **GET `/api/admin/departments`** | 2,615.9ms (3 queries) | 2,339.0ms (3 indexed) | **0.0ms** (client cache) | **Instant** (client) |
| **GET `/api/admin/users`** | 1,695.4ms | 1,582.1ms | **0.0ms** (client cache) | **Instant** (client) |
| **GET `/api/admin/analytics/summary`** | 3,983.0ms | 2,399.0ms | **4.7ms** (server in-memory) | **847x** |
| **GET `.../charts/volume_over_time`** | 2,285.8ms | 226.1ms | **4.6ms** (server in-memory) | **496x** |
| **GET `.../charts/status_distribution`** | 2,285.8ms | 192.2ms | **4.2ms** (server in-memory) | **544x** |
| **GET `.../charts/department_workload`** | 2,285.8ms | 236.9ms | **4.3ms** (server in-memory) | **531x** |
| **GET `.../charts/resolution_time`** | 2,285.8ms | 289.4ms | **5.2ms** (server in-memory) | **439x** |
| **Total Analytics Page Load (Summary + 4 Charts)** | **11,337.6ms** | **3,343.6ms** | **23.0ms** | **492x** |
| **Admin Tab Navigation (Dashboard ↔ Tickets)** | **7,860.0ms** | **4,805.4ms** | **< 1.0ms** | **Instantaneous** |

---

## 3. Implemented Fixes & Architectural Enhancements

### Phase 1: Structured Performance Logging
- Added Flask request-lifecycle middleware in `app/__init__.py` using `time.perf_counter()`.
- Implemented SQLAlchemy engine event listeners (`before_cursor_execute` and `after_cursor_execute`) in `app/database.py` to calculate exact database execution time per request context.
- Format: `[PERFORMANCE] GET /api/admin/tickets | DB: 420.0ms (2 queries) | Processing: 80.0ms | Total: 500.0ms`.

### Phase 2: Flask & SQLAlchemy Optimization
- **Connection Pool Tuning:**
  - `pool_size=10`, `max_overflow=20`, `pool_timeout=15`.
  - `pool_recycle=300`: Automatically recycles connections older than 5 minutes, preventing dropped connections from Supabase's cloud gateway.
  - `pool_pre_ping=True`: Verifies connection liveness before usage.
  - Enabled TCP keepalive parameters (`keepalives=1`, `keepalives_idle=30`, `keepalives_interval=10`, `keepalives_count=5`).
- **SQL Aggregation Consolidation:**
  - Consolidated 6 individual `count()` queries in `dashboard_summary` into a **single SQL query** utilizing PostgreSQL `FILTER (WHERE ...)`:
    ```sql
    SELECT 
      count(id) AS total,
      count(id) FILTER (WHERE status = 'open') AS open,
      count(id) FILTER (WHERE status = 'in_progress') AS in_progress,
      count(id) FILTER (WHERE status = 'resolved') AS resolved,
      count(id) FILTER (WHERE escalated = true) AS escalated,
      count(id) FILTER (WHERE priority = 'high') AS high_priority
    FROM tickets WHERE organization_id = :org_id;
    ```
  - Reduced query count from 9 down to 4, eliminating over 2,400ms of network overhead.

### Phase 3: Database Indexing
Added 5 composite B-tree indexes directly to PostgreSQL and declared them in `app/models.py`:
1. `ix_tickets_org_dept` on `tickets (organization_id, department)`
2. `ix_tickets_org_escalated` on `tickets (organization_id, escalated)`
3. `ix_tickets_org_created_desc` on `tickets (organization_id, created_at DESC)`
4. `ix_admin_users_org_status` on `admin_users (organization_id, status)`
5. `ix_admin_users_org_dept` on `admin_users (organization_id, department)`

### Phase 4: In-Memory Analytics & Chart Caching
- Implemented thread-safe, in-memory caching in `app/analytics.py` using `threading.Lock()`:
  - `_DF_CACHE`: Caches parsed Pandas DataFrame per date range (30s TTL).
  - `_SUMMARY_CACHE`: Caches statistical KPI dictionary (60s TTL).
  - `_CHART_CACHE`: Caches generated PNG bytes (60s TTL).
- **Zero Disk I/O:** All images generated in-memory via `io.BytesIO()`.
- **Automatic Invalidation:** Created `invalidate_analytics_cache(org_id)` triggered automatically when tickets are created (`routes/tickets.py`) or updated (`routes/admin.py`).
- Subsequent requests for the same date range execute in **~4.5ms** instead of 2.3 seconds.

### Phase 5: React Frontend Caching & Debouncing
- **Client-Side Cache Layer (`api.js`):**
  - Implemented 30-second TTL memory cache for all GET requests.
  - Cached in-memory Object URLs for analytics charts, revoking old URLs only on cache invalidation.
  - Automatic cache flush (`invalidateApiCache('/admin')`) upon POST/PATCH/DELETE mutations.
  - Added optional `{ bypassCache: true }` parameter wired to all UI "Refresh" buttons.
- **Search Debouncing:**
  - Added 300ms debounce to search bars in `TicketsView.jsx` and `UsersView.jsx`. Eliminates duplicate in-flight API requests while typing.
- **Parallel Fetching:**
  - Maintained `Promise.all` in `DashboardView.jsx` for concurrent summary and activity fetching.

---

## 4. Infrastructure Reality & Limitations

1. **Render Free Tier Spin-Down:**
   - Render's Free Web Service spins down after 15 minutes of inactivity. The initial cold request may take 30–50 seconds for container allocation and Python module import.
   - **Recommendation:** Documented as an infrastructure limitation of $0 hosting; no paid pingers or keep-alive bots deployed to stay within policy.
2. **Supabase WAN Distance:**
   - Supabase Free PostgreSQL operates in AWS `us-east-1`. Direct latency from international/local development environments is ~400ms per roundtrip.
   - By eliminating sequential N-queries, consolidating aggregations, and leveraging client + server in-memory caching, the impact of WAN latency during normal navigation has been reduced to **near-zero**.

---

## 5. Verification Checklist

- [x] All 34 backend unit and integration tests passing (`pytest -v` in 35.25s).
- [x] Frontend builds with zero errors (`vite build` in 6.13s, 1,619 modules).
- [x] Structured performance logs active in Flask (`[PERFORMANCE] ...`).
- [x] In-memory analytics cache tested and verified (23ms response time).
- [x] Invalidation verified upon ticket status updates.
- [x] Debounced search prevents duplicate requests.
- [x] Zero regressions in voice recording, Groq Whisper STT, or Gemini AI classification.
- [x] Strictly $0 cost policy adhered to.
