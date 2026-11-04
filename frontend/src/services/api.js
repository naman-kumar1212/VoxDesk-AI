/**
 * VoxDesk AI — API Service Layer
 * Uses native fetch for zero external bloat.
 * Never handles secrets or server-side keys.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to execute fetch and parse standard JSON envelope
 */
async function apiFetch(endpoint, options = {}) {
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

  return data.data;
}

export const api = {
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
   * Note: Do NOT set Content-Type header on FormData fetch
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
   * Submit confirmed transcript to Gemini AI and create ticket
   */
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
    try {
      return await apiFetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // Local clean up continues even if backend logout is best-effort
      return { success: true };
    }
  },

  /**
   * Admin Dashboard summary & recent activity
   */
  async getDashboardSummary(tokenOrKey) {
    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch('/admin/dashboard/summary', { headers });
  },

  async getRecentActivity(tokenOrKey) {
    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch('/admin/dashboard/recent-activity', { headers });
  },

  /**
   * Admin analytics summary (with date filters)
   */
  async getAdminAnalytics(tokenOrKey, { range = 'all', startDate = null, endDate = null } = {}) {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch(`/admin/analytics/summary?${params.toString()}`, { headers });
  },

  /**
   * Admin chart image blob fetcher (in-memory PNG bytes)
   */
  async fetchChartBlob(tokenOrKey, chartName, { range = 'all', startDate = null, endDate = null } = {}) {
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };

    const url = `${API_BASE}/admin/analytics/charts/${chartName}?${params.toString()}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to load chart ${chartName} (${response.status})`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
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

    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };

    return apiFetch(`/admin/tickets?${params.toString()}`, { headers });
  },

  /**
   * Admin ticket detail with event timeline
   */
  async getAdminTicketDetail(tokenOrKey, ticketId) {
    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch(`/admin/tickets/${ticketId}`, { headers });
  },

  /**
   * Admin ticket update (status, department, internal_notes)
   */
  async updateTicket(tokenOrKey, ticketId, { status, department, internalNotes, reason } = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
        ? { Authorization: `Bearer ${tokenOrKey}` }
        : { 'X-Admin-Key': tokenOrKey }),
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

  /**
   * Backwards-compatible status update alias
   */
  async updateTicketStatus(tokenOrKey, ticketId, { status, reason }) {
    return this.updateTicket(tokenOrKey, ticketId, { status, reason });
  },

  /**
   * Departments Management
   */
  async getDepartments(tokenOrKey) {
    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch('/admin/departments', { headers });
  },

  async createDepartment(tokenOrKey, { name, description, status = 'active' }) {
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
        ? { Authorization: `Bearer ${tokenOrKey}` }
        : { 'X-Admin-Key': tokenOrKey }),
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
      ...(tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
        ? { Authorization: `Bearer ${tokenOrKey}` }
        : { 'X-Admin-Key': tokenOrKey }),
    };
    return apiFetch(`/admin/departments/${departmentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name, description, status }),
    });
  },

  async deleteDepartment(tokenOrKey, departmentId) {
    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch(`/admin/departments/${departmentId}`, {
      method: 'DELETE',
      headers,
    });
  },

  /**
   * Users Management
   */
  async getUsers(tokenOrKey, { role, department, status, q } = {}) {
    const params = new URLSearchParams();
    if (role && role !== 'ALL') params.append('role', role);
    if (department && department !== 'ALL') params.append('department', department);
    if (status && status !== 'ALL') params.append('status', status);
    if (q) params.append('q', q);

    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch(`/admin/users?${params.toString()}`, { headers });
  },

  async createUser(tokenOrKey, { name, email, role, department, password }) {
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
        ? { Authorization: `Bearer ${tokenOrKey}` }
        : { 'X-Admin-Key': tokenOrKey }),
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
      ...(tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
        ? { Authorization: `Bearer ${tokenOrKey}` }
        : { 'X-Admin-Key': tokenOrKey }),
    };
    return apiFetch(`/admin/users/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name, role, department, status }),
    });
  },
};

