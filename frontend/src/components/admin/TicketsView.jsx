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
  StickyNote,
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [feedback, setFeedback] = useState(null);

  /* ── Filter & Search states ────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load departments once
  useEffect(() => {
    if (!authToken) return;
    api.getDepartments(authToken)
      .then((data) => setDepartments(data?.departments || []))
      .catch((err) => console.error('Failed to load departments:', err));
  }, [authToken]);

  // Load tickets list from API
  const loadTickets = useCallback(async (bypassCache = false) => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const data = await api.getAdminTickets(authToken, {
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        department: departmentFilter,
        q: debouncedSearch,
        sortBy,
        sortDir,
        page: currentPage,
        pageSize: 25,
        bypassCache,
      });

      const list = data?.tickets || [];
      setTickets(list);
      setPagination(data?.pagination || { total: 0, page: 1, page_size: 25, total_pages: 1 });

      // Refresh selected ticket from list if currently open
      if (selectedTicket) {
        const found = list.find((t) => t.id === selectedTicket.id);
        if (found) {
          setSelectedTicket(found);
          setInternalNotesInput(found.internal_notes || '');
        }
      }
    } catch (err) {
      console.error('Failed to query tickets:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to load tickets table.' });
    } finally {
      setIsLoading(false);
    }
  }, [authToken, statusFilter, priorityFilter, categoryFilter, departmentFilter, debouncedSearch, sortBy, sortDir, currentPage, selectedTicket]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Select ticket & load chronological event history
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setInternalNotesInput(ticket.internal_notes || '');
    setIsLoadingEvents(true);

    try {
      const data = await api.getAdminTicketDetail(authToken, ticket.id);
      if (data?.ticket) {
        setSelectedTicket(data.ticket);
        setInternalNotesInput(data.ticket.internal_notes || '');
      }
      setSelectedTicketEvents(data?.events || []);
    } catch (err) {
      console.error('Failed to load ticket events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Status transition action
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        status: newStatus,
        reason: 'Updated from Tickets Management',
      });
      setFeedback({ type: 'success', message: `Status updated to ${newStatus.replace(/_/g, ' ')}.` });
      await loadTickets(true);
      await handleSelectTicket({ ...selectedTicket, status: newStatus });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Status transition denied.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Department reassignment action
  const handleReassignDepartment = async (targetDeptName) => {
    if (!selectedTicket || isUpdatingDept || !targetDeptName) return;
    setIsUpdatingDept(true);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        department: targetDeptName,
        reason: `Reassigned to ${targetDeptName}`,
      });
      setFeedback({ type: 'success', message: `Reassigned to ${targetDeptName}.` });
      await loadTickets(true);
      await handleSelectTicket({ ...selectedTicket, department: targetDeptName });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Department reassignment failed.' });
    } finally {
      setIsUpdatingDept(false);
    }
  };

  // Save internal notes
  const handleSaveNotes = async () => {
    if (!selectedTicket || isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        internalNotes: internalNotesInput,
      });
      setFeedback({ type: 'success', message: 'Admin notes saved.' });
      await loadTickets(true);
      await handleSelectTicket({ ...selectedTicket, internal_notes: internalNotesInput });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save notes.' });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Auto clear feedback after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

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
          onClick={() => loadTickets(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-medium text-slate-700 hover:bg-surface-subtle transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, transcript, customer name..."
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-input text-xs text-primary-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-input text-secondary-text hover:text-primary-text transition cursor-pointer"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Main Data Workspace: Table + Detail Drawer */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tickets Table (8 cols on large screens when drawer is open, 12 when closed) */}
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
                          {t.department || t.department_name || 'General Support'}
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-btn bg-surface border border-border disabled:opacity-40 hover:bg-surface-muted transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-btn bg-surface border border-border disabled:opacity-40 hover:bg-surface-muted transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Ticket Details Drawer (5 cols on large screens) */}
        {selectedTicket && (
          <div className="lg:col-span-5 xl:col-span-4 bg-surface border border-border rounded-card p-5 shadow-xs space-y-5 animate-in fade-in duration-150 sticky top-0 self-start">
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

            {/* Quick Status Transitions */}
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
                    disabled={isUpdatingStatus || selectedTicket.status === st}
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
                value={selectedTicket.department || ''}
                onChange={(e) => handleReassignDepartment(e.target.value)}
                disabled={isUpdatingDept}
                className="w-full p-2 bg-surface border border-border rounded-input text-xs text-primary-text focus:border-brand outline-none cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-primary-text block flex items-center justify-between">
                <span>Internal Admin Notes</span>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || internalNotesInput === (selectedTicket.internal_notes || '')}
                  className="text-brand hover:text-brand-hover font-semibold cursor-pointer disabled:opacity-40"
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </label>
              <textarea
                rows={2}
                value={internalNotesInput}
                onChange={(e) => setInternalNotesInput(e.target.value)}
                placeholder="Add internal notes or instructions..."
                className="w-full text-xs p-2.5 bg-surface border border-border rounded-input outline-none focus:border-brand transition resize-none"
              />
            </div>

            {/* Transcript Quote */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-primary-text block">Customer Transcript</span>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border text-secondary-text leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                {selectedTicket.transcript || 'No transcript record available.'}
              </div>
            </div>

            {/* Chronological Audit Events */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-primary-text block">
                Audit Timeline Events
              </span>
              <ActivityTimeline events={selectedTicketEvents} isLoading={isLoadingEvents} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
