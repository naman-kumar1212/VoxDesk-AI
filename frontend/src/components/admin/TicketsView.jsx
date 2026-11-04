import React, { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../StatusBadge';
import ActivityTimeline from './ActivityTimeline';
import { TicketRowSkeleton, TicketDetailSkeleton } from '../LoadingSkeleton';
import { api } from '../../services/api';
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FileText,
  History,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Tag,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────── */
function formatDate(ts, opts = { month: 'short', day: 'numeric' }) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, opts);
}

function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketsView({ authToken }) {
  /* ── Data states ───────────────────────────────────────────────────── */
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 25, total_pages: 1 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketEvents, setSelectedTicketEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [feedback, setFeedback] = useState(null);

  /* ── Filter states ─────────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load departments list for filtering & reassignment
  useEffect(() => {
    if (!authToken) return;
    api.getDepartments(authToken)
      .then((res) => setDepartments(res?.departments || []))
      .catch((err) => console.error('Failed to load departments in TicketsView:', err));
  }, [authToken]);

  // Load Tickets table
  const fetchTickets = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const params = {
        page,
        page_size: 25,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (departmentFilter !== 'ALL') params.department_id = departmentFilter;

      const data = await api.getTickets(authToken, params);
      setTickets(data?.tickets || []);
      setPagination(data?.pagination || { total: 0, page: 1, page_size: 25, total_pages: 1 });
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to load tickets table.' });
    } finally {
      setIsLoading(false);
    }
  }, [authToken, page, debouncedSearch, statusFilter, priorityFilter, categoryFilter, departmentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Select Ticket & Fetch Chronological Events
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setIsLoadingEvents(true);
    try {
      const data = await api.getTicket(ticket.ticket_number);
      if (data && data.ticket) {
        setSelectedTicket(data.ticket);
        setSelectedTicketEvents(data.ticket.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Status & Assignment Actions
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket || isUpdating) return;
    setIsUpdating(true);
    try {
      await api.updateTicket(authToken, selectedTicket.id, { status: newStatus });
      setFeedback({ type: 'success', message: `Status updated to ${newStatus}.` });
      handleSelectTicket(selectedTicket);
      fetchTickets();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update ticket status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReassignDepartment = async (deptId) => {
    if (!selectedTicket || isUpdating) return;
    setIsUpdating(true);
    try {
      await api.updateTicket(authToken, selectedTicket.id, { department_id: deptId });
      setFeedback({ type: 'success', message: 'Department successfully reassigned.' });
      handleSelectTicket(selectedTicket);
      fetchTickets();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reassign department.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header & Quick Controls */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            Tickets Management
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Enterprise grievance records, server-side pagination, and real-time status transitions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTickets()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-medium text-slate-700 hover:bg-surface-subtle transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Structured Search & Filter Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, transcript, customer name..."
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-input text-xs text-primary-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Department */}
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Sort */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-input text-secondary-text hover:text-primary-text transition cursor-pointer"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Main Data Workspace: Table + Detail Drawer/Panel */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tickets Table (8 cols on large screens, 12 if no selection) */}
        <div className={`${selectedTicket ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} bg-surface border border-border rounded-card shadow-xs overflow-hidden transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-subtle text-muted-text font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-3">Ticket ID</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(6)].map((_, i) => <TicketRowSkeleton key={i} />)
                ) : tickets.length > 0 ? (
                  tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`hover:bg-surface-subtle/70 transition cursor-pointer ${
                          isSelected ? 'bg-brand-subtle/50 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-primary-text">
                          {t.ticket_number}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge type="status" value={t.status} />
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge type="priority" value={t.priority} />
                        </td>
                        <td className="py-3 px-3 text-secondary-text capitalize">
                          {t.category || 'Support'}
                        </td>
                        <td className="py-3 px-3 text-secondary-text">
                          {t.department?.name || t.department_name || 'General Support'}
                        </td>
                        <td className="py-3 px-3 text-muted-text whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-muted-text">
                      No matching tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          <div className="p-3.5 border-t border-border flex items-center justify-between text-xs bg-surface-subtle">
            <span className="text-muted-text">
              Showing page <span className="font-semibold text-primary-text">{pagination.page}</span> of{' '}
              <span className="font-semibold text-primary-text">{pagination.total_pages || 1}</span> ({pagination.total} tickets)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-btn bg-surface border border-border disabled:opacity-40 hover:bg-surface-muted transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-btn bg-surface border border-border disabled:opacity-40 hover:bg-surface-muted transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Ticket Details Drawer (5 cols on large screens) */}
        {selectedTicket && (
          <div className="lg:col-span-5 xl:col-span-4 bg-surface border border-border rounded-card p-5 shadow-xs space-y-5 animate-in fade-in duration-150 sticky top-20">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-semibold text-muted-text uppercase tracking-wider block">
                  Ticket Inspector
                </span>
                <span className="font-mono text-lg font-bold text-primary-text">
                  {selectedTicket.ticket_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-btn transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status & Priority Transitions */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-primary-text block">
                Manage Ticket Status
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['open', 'in_progress', 'resolved', 'escalated'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(st)}
                    disabled={isUpdating || selectedTicket.status === st}
                    className={`py-1.5 px-2.5 rounded-btn border text-center font-medium capitalize transition cursor-pointer ${
                      selectedTicket.status === st
                        ? 'bg-brand text-white border-brand'
                        : 'bg-surface border-border text-secondary-text hover:bg-surface-subtle'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Reassignment Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary-text block">
                Assigned Department
              </label>
              <select
                value={selectedTicket.department_id || ''}
                onChange={(e) => handleReassignDepartment(e.target.value)}
                disabled={isUpdating}
                className="w-full p-2 bg-surface border border-border rounded-input text-xs text-primary-text focus:border-brand outline-none cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Transcript & Summary */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-primary-text block">Customer Transcript</span>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border text-secondary-text leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {selectedTicket.transcript || 'No transcript record available.'}
              </div>
            </div>

            {/* Chronological Audit Events */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-primary-text block">
                Audit Timeline Events
              </span>
              {isLoadingEvents ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin text-brand mx-auto" />
                </div>
              ) : (
                <ActivityTimeline events={selectedTicketEvents} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
