/**

 * VoxDesk AI — API Service Layer

 * Uses native fetch with client-side memory caching (30s TTL, Stale-While-Revalidate).

 * Automatically invalidates admin caches upon mutations.

 * Never handles secrets or server-side keys.

 */

/**

 * Normalizes and sanitizes the API base URL:

 * - Strips any unintended '/index' or '/index.py' suffix

 * - Strips trailing slashes

 * - Guarantees the base ends with '/api' for consistent endpoint routing

 */

function normalizeApiBase(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '/api';
  const clean = rawUrl.trim().replace(/\/(index(\.py)?)?\/?$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

function authHeaders(tokenOrKey) {
  if (!tokenOrKey) return {};
  return tokenOrKey.includes('.') || tokenOrKey.startsWith('ey')
    ? { Authorization: `Bearer ${tokenOrKey}` }
    : { 'X-Admin-Key': tokenOrKey };
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

const CACHE_TTL_MS = 30000; // 30-second client cache TTL for GET queries

const apiCache = new Map();

const chartBlobCache = new Map();

const inFlightRequests = new Map();

const inFlightChartRequests = new Map();

/**

 * Generate a cache key for GET requests based on endpoint + auth context

 */

function getCacheKey(endpoint, options = {}) {

  const method = (options.method || 'GET').toUpperCase();

  if (method !== 'GET') return null;

  const headers = options.headers || {};

  const auth = headers.Authorization || headers['X-Admin-Key'] || '';

  return `${endpoint}::${auth}`;

}

/**

 * Invalidate cached endpoints (e.g. on mutations)

 */

export function invalidateApiCache(prefix = '') {

  inFlightRequests.clear();

  inFlightChartRequests.clear();

  if (!prefix) {

    apiCache.clear();

    for (const [, entry] of chartBlobCache.entries()) {

      try {

        URL.revokeObjectURL(entry.url);

      } catch {}

    }

    chartBlobCache.clear();

    return;

  }

  for (const key of apiCache.keys()) {

    if (key.includes(prefix)) {

      apiCache.delete(key);

    }

  }

  for (const [key, entry] of chartBlobCache.entries()) {

    if (key.includes(prefix)) {

      try {

        URL.revokeObjectURL(entry.url);

      } catch {}

      chartBlobCache.delete(key);

    }

  }

}

/**

 * Helper to execute fetch and parse standard JSON envelope with client-side caching

 */

async function apiFetch(endpoint, options = {}) {

  const cacheKey = getCacheKey(endpoint, options);

  const bypassCache = Boolean(options.bypassCache);

  const method = (options.method || 'GET').toUpperCase();

  if (cacheKey && !bypassCache) {

    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {

      return cached.data;

    }

  }

  // Deduplicate concurrent in-flight GET requests

  if (method === 'GET' && cacheKey && !bypassCache && inFlightRequests.has(cacheKey)) {

    return inFlightRequests.get(cacheKey);

  }

  const fetchPromise = (async () => {

    try {

      const url = `${API_BASE}${endpoint}`;

      const response = await fetch(url, options);

      let data;

      try {

        data = await response.json();

      } catch (err) {

        throw new Error(`Invalid JSON response from server (${response.status})`);

      }

      if (!response.ok || data.success === false) {

        const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;

        const err = new Error(errorMsg);

        err.code = data?.error?.code || 'REQUEST_FAILED';

        err.status = response.status;

        err.data = data;

        throw err;

      }

      // Cache successful GET requests

      if (cacheKey) {

        apiCache.set(cacheKey, { timestamp: Date.now(), data: data.data });

      }

      // Automatically invalidate admin caches on mutation methods

      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {

        if (endpoint.startsWith('/admin') || endpoint.startsWith('/tickets')) {

          invalidateApiCache('/admin');

        }

      }

      return data.data;

    } finally {

      if (cacheKey) {

        inFlightRequests.delete(cacheKey);

      }

    }

  })();

  if (method === 'GET' && cacheKey && !bypassCache) {

    inFlightRequests.set(cacheKey, fetchPromise);

  }

  return fetchPromise;

}

export const api = {

  invalidateCache: invalidateApiCache,

  /**

   * Health Check

   */

  async getHealth() {

    return apiFetch('/health');

  },

  /**

   * Create voice session

   */

  async createSession(channel = 'web_voice') {

    return apiFetch('/sessions', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ channel }),

    });

  },

  /**

   * Upload audio for Whisper STT

   */

  async transcribeAudio(audioBlob, filename = 'complaint.webm', sessionId = null) {

    const formData = new FormData();

    formData.append('audio', audioBlob, filename);

    if (sessionId) {

      formData.append('session_id', sessionId);

    }

    return apiFetch('/voice/transcribe', {

      method: 'POST',

      body: formData,

    });

  },

  /**
   * Alias for VoiceComplaint.jsx — transcribeVoice(blob) maps to transcribeAudio(blob).
   */
  async transcribeVoice(audioBlob, filename = 'complaint.webm', sessionId = null) {
    return api.transcribeAudio(audioBlob, filename, sessionId);
  },

  async createTicketFromTranscript({ sessionId, transcript, idempotencyKey }) {

    return apiFetch('/tickets/from-transcript', {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        'Idempotency-Key': idempotencyKey,

      },

      body: JSON.stringify({

        session_id: sessionId,

        transcript,

      }),

    });

  },

  /**

   * Track ticket by ticket number (public for customers)

   */

  async trackTicket(ticketNumber) {

    return apiFetch(`/tickets/track/${encodeURIComponent(ticketNumber)}`);

  },

  /**

   * Admin Authentication (Supabase Auth via Flask backend)

   */

  async login({ email, password }) {

    return apiFetch('/auth/login', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ email, password }),

    });

  },

  async getMe(token) {

    return apiFetch('/auth/me', {

      headers: { Authorization: `Bearer ${token}` },

    });

  },

  async logout(token) {

    invalidateApiCache();

    try {

      return await apiFetch('/auth/logout', {

        method: 'POST',

        headers: { Authorization: `Bearer ${token}` },

      });

    } catch {

      return { success: true };

    }

  },

  /**

   * Admin Dashboard summary & recent activity

   */

  async getDashboardSummary(tokenOrKey, { bypassCache = false } = {}) {

    const headers = authHeaders(tokenOrKey);

    return apiFetch('/admin/dashboard/summary', { headers, bypassCache });

  },

  async getRecentActivity(tokenOrKey, { bypassCache = false } = {}) {

    const headers = authHeaders(tokenOrKey);

    return apiFetch('/admin/dashboard/recent-activity', { headers, bypassCache });

  },

  /**
   * Admin analytics summary (with date filters)
   */
  async getAdminAnalytics(tokenOrKey, options = {}) {
    return api.getAnalyticsSummary(tokenOrKey, options);
  },

  async getAnalyticsSummary(tokenOrKey, optionsOrParams = {}, legacyOpts = {}) {

    const bypassCache = legacyOpts?.bypassCache ?? optionsOrParams?.bypassCache ?? false;

    const range = optionsOrParams?.range || 'all';

    const sDate = optionsOrParams?.startDate || optionsOrParams?.start_date || null;

    const eDate = optionsOrParams?.endDate || optionsOrParams?.end_date || null;

    const params = new URLSearchParams();

    if (range) params.append('range', range);

    if (sDate) params.append('start_date', sDate);

    if (eDate) params.append('end_date', eDate);

    const headers = authHeaders(tokenOrKey);

    return apiFetch(`/admin/analytics/summary?${params.toString()}`, { headers, bypassCache });

  },

  /**

   * Admin chart image blob fetcher (cached in-memory ObjectURL)

   * Handles (token, chartName, options) and (token, chartName, params, { bypassCache }).

   */

  async fetchChartBlob(tokenOrKey, chartName, optionsOrParams = {}, legacyOpts = {}) {

    const bypassCache = legacyOpts?.bypassCache ?? optionsOrParams?.bypassCache ?? false;

    const range = optionsOrParams?.range || 'all';

    const sDate = optionsOrParams?.startDate || optionsOrParams?.start_date || null;

    const eDate = optionsOrParams?.endDate || optionsOrParams?.end_date || null;

    const params = new URLSearchParams();

    if (range) params.append('range', range);

    if (sDate) params.append('start_date', sDate);

    if (eDate) params.append('end_date', eDate);

    if (bypassCache) params.append('bypass_cache', 'true');

    const cacheKey = `/admin/analytics/charts/${chartName}?${params.toString()}`;

    if (!bypassCache && chartBlobCache.has(cacheKey)) {

      const entry = chartBlobCache.get(cacheKey);

      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {

        return entry.url;

      }

    }

    if (!bypassCache && inFlightChartRequests.has(cacheKey)) {

      return inFlightChartRequests.get(cacheKey);

    }

    const chartPromise = (async () => {

      try {

        const headers = authHeaders(tokenOrKey);

        const url = `${API_BASE}/admin/analytics/charts/${chartName}?${params.toString()}`;

        const response = await fetch(url, { headers });

        if (!response.ok) {

          throw new Error(`Failed to load chart ${chartName} (${response.status})`);

        }

        const blob = await response.blob();

        const blobUrl = URL.createObjectURL(blob);

        chartBlobCache.set(cacheKey, { timestamp: Date.now(), url: blobUrl });

        return blobUrl;

      } finally {

        inFlightChartRequests.delete(cacheKey);

      }

    })();

    if (!bypassCache) {

      inFlightChartRequests.set(cacheKey, chartPromise);

    }

    return chartPromise;

  },

  /**

   * Analytics chart fetcher (returns ObjectURL string for <img src="..." />)

   */

  async getAnalyticsChart(tokenOrKey, chartName, optionsOrParams = {}, legacyOpts = {}) {

    return api.fetchChartBlob(tokenOrKey, chartName, optionsOrParams, legacyOpts);

  },

  /**

   * Admin tickets list with search, multi-filters & sorting

   */

  async getAdminTickets(tokenOrKey, {

    status,

    priority,

    category,

    department,

    q,

    sortBy = 'created_at',

    sortDir = 'desc',

    page = 1,

    pageSize = 50,

    bypassCache = false,

  } = {}) {

    const params = new URLSearchParams();

    if (status && status !== 'ALL') params.append('status', status);

    if (priority && priority !== 'ALL') params.append('priority', priority);

    if (category && category !== 'ALL') params.append('category', category);

    if (department && department !== 'ALL') params.append('department', department);

    if (q) params.append('q', q);

    if (sortBy) params.append('sort_by', sortBy);

    if (sortDir) params.append('sort_dir', sortDir);

    params.append('page', page.toString());

    params.append('page_size', pageSize.toString());

    const headers = authHeaders(tokenOrKey);

    return apiFetch(`/admin/tickets?${params.toString()}`, { headers, bypassCache });

  },

  /**

   * Admin ticket detail with event timeline

   */

  /**

   * Compatibility alias for tickets fetching (handles both getTickets and getAdminTickets)

   */

  async getTickets(tokenOrKey, optionsOrParams = {}, legacyOpts = {}) {

    const bypassCache = legacyOpts?.bypassCache ?? optionsOrParams?.bypassCache ?? false;

    const merged = { ...optionsOrParams, bypassCache };

    if (merged.search && !merged.q) merged.q = merged.search;

    if (merged.page_size && !merged.pageSize) merged.pageSize = merged.page_size;

    if (merged.sort_by && !merged.sortBy) merged.sortBy = merged.sort_by;

    if (merged.sort_dir && !merged.sortDir) merged.sortDir = merged.sort_dir;

    return api.getAdminTickets(tokenOrKey, merged);

  },

  async getAdminTicketDetail(tokenOrKey, ticketId, { bypassCache = false } = {}) {

    const headers = authHeaders(tokenOrKey);

    return apiFetch(`/admin/tickets/${ticketId}`, { headers, bypassCache });

  },

  /**

   * Compatibility alias for ticket events / audit timeline

   */

  async getTicketEvents(tokenOrKey, ticketId, { bypassCache = false } = {}) {

    return api.getAdminTicketDetail(tokenOrKey, ticketId, { bypassCache });

  },

  /**

   * Admin ticket update (status, department, internal_notes)

   */

  async updateTicket(tokenOrKey, ticketId, { status, department, internalNotes, reason } = {}) {

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders(tokenOrKey),
    };

    return apiFetch(`/admin/tickets/${ticketId}`, {

      method: 'PATCH',

      headers,

      body: JSON.stringify({

        status,

        department,

        internal_notes: internalNotes,

        reason,

      }),

    });

  },

  async updateTicketStatus(tokenOrKey, ticketId, { status, reason }) {

    return this.updateTicket(tokenOrKey, ticketId, { status, reason });

  },

  /**

   * Departments Management

   */

  async getDepartments(tokenOrKey, { bypassCache = false } = {}) {

    const headers = authHeaders(tokenOrKey);

    return apiFetch('/admin/departments', { headers, bypassCache });

  },

  async createDepartment(tokenOrKey, { name, description, status = 'active' }) {

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders(tokenOrKey),
    };

    return apiFetch('/admin/departments', {

      method: 'POST',

      headers,

      body: JSON.stringify({ name, description, status }),

    });

  },

  async updateDepartment(tokenOrKey, departmentId, { name, description, status }) {

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders(tokenOrKey),
    };

    return apiFetch(`/admin/departments/${departmentId}`, {

      method: 'PATCH',

      headers,

      body: JSON.stringify({ name, description, status }),

    });

  },

  async deleteDepartment(tokenOrKey, departmentId) {

    const headers = authHeaders(tokenOrKey);

    return apiFetch(`/admin/departments/${departmentId}`, {

      method: 'DELETE',

      headers,

    });

  },

  /**

   * Users Management

   */

  async getUsers(tokenOrKey, { role, department, status, q, bypassCache = false } = {}) {

    const params = new URLSearchParams();

    if (role && role !== 'ALL') params.append('role', role);

    if (department && department !== 'ALL') params.append('department', department);

    if (status && status !== 'ALL') params.append('status', status);

    if (q) params.append('q', q);

    const headers = authHeaders(tokenOrKey);

    return apiFetch(`/admin/users?${params.toString()}`, { headers, bypassCache });

  },

  async createUser(tokenOrKey, { name, email, role, department, password }) {

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders(tokenOrKey),
    };

    return apiFetch('/admin/users', {

      method: 'POST',

      headers,

      body: JSON.stringify({ name, email, role, department, password }),

    });

  },

  async updateUser(tokenOrKey, userId, { name, role, department, status }) {

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders(tokenOrKey),
    };

    return apiFetch(`/admin/users/${userId}`, {

      method: 'PATCH',

      headers,

      body: JSON.stringify({ name, role, department, status }),

    });

  },

};

