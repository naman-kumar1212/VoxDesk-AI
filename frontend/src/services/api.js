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
   * Admin analytics summary
   */
  async getAdminAnalytics(tokenOrKey) {
    const headers = tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
      ? { Authorization: `Bearer ${tokenOrKey}` }
      : { 'X-Admin-Key': tokenOrKey };
    return apiFetch('/admin/analytics/summary', { headers });
  },

  /**
   * Admin tickets list with filters
   */
  async getAdminTickets(tokenOrKey, { status, priority, category, page = 1, pageSize = 50 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (category) params.append('category', category);
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
   * Admin status update
   */
  async updateTicketStatus(tokenOrKey, ticketId, { status, reason }) {
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenOrKey && (tokenOrKey.includes('.') || tokenOrKey.startsWith('ey'))
        ? { Authorization: `Bearer ${tokenOrKey}` }
        : { 'X-Admin-Key': tokenOrKey }),
    };
    return apiFetch(`/admin/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, reason }),
    });
  },
};

