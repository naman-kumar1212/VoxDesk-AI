import { createPortal } from 'react-dom';
import React, { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../StatusBadge';
import ActivityTimeline from './ActivityTimeline';
import { TicketRowSkeleton } from '../LoadingSkeleton';
import { api } from '../../services/api';
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
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

  // Load paginated tickets
  const loadTickets = useCallback(
    async (bypassCache = false) => {
      if (!authToken) return;
      setIsLoading(true);
      try {
        const params = {
          page: currentPage,
          page_size: 25,
          sort_by: sortBy,
          sort_dir: sortDir,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (priorityFilter !== 'ALL') params.priority = priorityFilter;
        if (categoryFilter !== 'ALL') params.category = categoryFilter;
        if (departmentFilter !== 'ALL') params.department = departmentFilter;

        const data = await api.getTickets(authToken, params, { bypassCache });
        setTickets(data?.tickets || []);
        if (data?.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Failed to load tickets:', err);
        setFeedback({ type: 'error', message: err.message || 'Failed to retrieve tickets.' });
      } finally {
        setIsLoading(false);
      }
    },
    [authToken, currentPage, debouncedSearch, statusFilter, priorityFilter, categoryFilter, departmentFilter, sortBy, sortDir]
  );

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Select ticket and load chronological audit events
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setInternalNotesInput(ticket.internal_notes || '');
    setIsLoadingEvents(true);
    try {
      const data = await api.getTicketEvents(authToken, ticket.id);
      setSelectedTicketEvents(data?.events || []);
    } catch (err) {
      console.error('Failed to load ticket events:', err);
      setSelectedTicketEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Status transition action
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket || isUpdatingStatus || selectedTicket.status === newStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        status: newStatus,
        reason: `Status transition to ${newStatus}`,
      });
      setFeedback({ type: 'success', message: `Status updated to ${newStatus}.` });
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
      setFeedback({ type: 'success', message: 'Internal notes saved.' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E3ECF7]">
        <div>
          <h1 className="text-2xl font-semibold text-[#061B31] tracking-[-0.03em]">
            Tickets Management
          </h1>
          <p className="text-xs text-[#425466] mt-0.5">
            Enterprise grievance records, server-side pagination, and real-time status transitions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTickets(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#061B31] hover:bg-[#F6F9FC] transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-[12px] border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-[#E6F9F0] border-[#00D66F]/30 text-[#00D66F] font-semibold'
              : 'bg-[#FFF1F2] border-[#FECDD3] text-[#DF1B41] font-semibold'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#737373] hover:text-[#061B31]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Main Data Workspace: Search/Filters + Full Width Table */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="w-full space-y-4">
          {/* Structured Search & Filter Bar */}
          <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-4 sm:p-5 shadow-[0_4px_12px_rgba(13,23,56,0.05)] space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket ID, transcript, customer name..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-xs text-[#061B31] placeholder:text-[#A1AAB8] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none transition"
                />
              </div>

              {/* Quick Filter Selectors */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
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
                  className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {/* Category */}
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="delivery">Delivery</option>
                  <option value="orders">Orders</option>
                  <option value="account">Account</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </select>

                {/* Department */}
                <select
                  value={departmentFilter}
                  onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium hover:bg-[#F6F9FC] transition cursor-pointer"
                  title="Toggle Sort Order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#533AFD]" />
                  <span>{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] shadow-[0_8px_20px_rgba(13,23,56,0.08)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFDFF] text-[#737373] text-[11px] font-semibold uppercase tracking-wider border-b border-[#E3ECF7]">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3ECF7]">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => <TicketRowSkeleton key={i} />)
                  ) : tickets.length > 0 ? (
                    tickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;
                      return (
                        <tr
                          key={t.id}
                          onClick={() => handleSelectTicket(t)}
                          className={`hover:bg-[#F8FAFD] transition cursor-pointer ${
                            isSelected ? 'bg-[#533AFD]/5 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[#061B31]">
                            {t.ticket_number}
                          </td>
                          <td className="py-3 px-3 text-[#061B31] font-medium">
                            {t.customer_name || t.caller_name || t.customer_email || 'Verified Caller'}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge type="status" value={t.status} />
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge type="priority" value={t.priority} />
                          </td>
                          <td className="py-3 px-3 text-[#425466] capitalize">
                            {t.category || 'Support'}
                          </td>
                          <td className="py-3 px-3 text-[#425466]">
                            {t.department || t.department_name || 'General Support'}
                          </td>
                          <td className="py-3 px-4 text-[#737373] whitespace-nowrap font-mono tabular-nums">
                            {formatDate(t.created_at)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#737373]">
                        No matching tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Controls */}
            <div className="p-3.5 border-t border-[#E3ECF7] flex items-center justify-between text-xs bg-[#FAFDFF]">
              <span className="text-[#737373]">
                Showing page <span className="font-semibold text-[#061B31]">{pagination.page}</span> of{' '}
                <span className="font-semibold text-[#061B31]">{pagination.total_pages || 1}</span> ({pagination.total} tickets)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-full bg-white border border-[#D4DEE9] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F6F9FC] transition shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#061B31]" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-full bg-white border border-[#D4DEE9] disabled:opacity-40 hover:bg-[#F6F9FC] transition shadow-xs cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#061B31]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Slide-Over Ticket Inspector Drawer */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedTicket && typeof document !== 'undefined' && createPortal(
        <>
          {/* Global Backdrop */}
          <div
            className="fixed inset-0 bg-[#061B31]/40 backdrop-blur-xs z-[100] transition-opacity"
            onClick={() => setSelectedTicket(null)}
            aria-hidden="true"
          />

          {/* Full-Height Drawer */}
          <aside
            role="dialog"
            aria-label="Ticket Inspector"
            aria-modal="true"
            className="fixed inset-y-0 right-0 z-[101] w-full sm:max-w-lg md:max-w-xl bg-white border-l border-[#D4DEE9] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 ease-out"
          >
            {/* Drawer Top Bar with ID, Status & Close Action */}
            <div className="p-5 border-b border-[#E3ECF7] flex items-center justify-between bg-[#FAFDFF] shrink-0">
              <div>
                <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
                  Ticket Inspector
                </span>
                <span className="font-mono text-xl font-bold text-[#061B31]">
                  {selectedTicket.ticket_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="status" value={selectedTicket.status} />
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-[#737373] hover:text-[#061B31] hover:bg-white rounded-full transition border border-transparent hover:border-[#D4DEE9] cursor-pointer"
                  title="Close Inspector"
                  aria-label="Close Inspector"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left">
              {/* Customer & Ticket Metadata Bar */}
              <div className="p-4 rounded-[14px] bg-[#F8FAFD] border border-[#E3ECF7] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#737373] block mb-0.5 font-medium">Customer Contact</span>
                  <span className="font-semibold text-[#061B31]">
                    {selectedTicket.customer_name || selectedTicket.caller_name || 'Verified Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373] block mb-0.5 font-medium">Date Created</span>
                  <span className="font-semibold text-[#061B31] font-mono tabular-nums">
                    {formatDateTime(selectedTicket.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373] block mb-0.5 font-medium">Category</span>
                  <span className="font-semibold text-[#061B31] capitalize">
                    {selectedTicket.category || 'General Support'}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373] block mb-0.5 font-medium">Urgency Priority</span>
                  <StatusBadge type="priority" value={selectedTicket.priority} />
                </div>
              </div>

              {/* Quick Status Transitions */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#061B31] block">
                  Manage Ticket Status
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {['open', 'in_progress', 'resolved', 'escalated'].map((st) => {
                    const isCurrent = selectedTicket.status === st;
                    const activeClassMap = {
                      open: 'bg-[#F8FAFD] text-[#533AFD] border-[#533AFD]/40 shadow-sm',
                      in_progress: 'bg-[#F0F7FF] text-[#0073E6] border-[#0073E6]/40 shadow-sm',
                      resolved: 'bg-[#E6F9F0] text-[#00D66F] border-[#00D66F]/40 shadow-sm',
                      escalated: 'bg-[#FFF1F2] text-[#DF1B41] border-[#DF1B41]/40 shadow-sm',
                    };
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(st)}
                        disabled={isUpdatingStatus || isCurrent}
                        className={`py-2 px-2.5 rounded-full border text-center font-semibold capitalize transition ${
                          isCurrent
                            ? `${activeClassMap[st]} cursor-default`
                            : 'bg-white border-[#D4DEE9] text-[#425466] hover:bg-[#F6F9FC] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department Reassignment Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#061B31] block">
                  Assigned Department
                </label>
                <select
                  value={selectedTicket.department || ''}
                  onChange={(e) => handleReassignDepartment(e.target.value)}
                  disabled={isUpdatingDept}
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-xs text-[#061B31] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none cursor-pointer font-medium"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-[#061B31] flex items-center justify-between">
                  <span>Internal Investigation Notes</span>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || internalNotesInput === (selectedTicket.internal_notes || '')}
                    className="text-[#533AFD] hover:text-[#635BFF] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </label>
                <textarea
                  rows={3}
                  value={internalNotesInput}
                  onChange={(e) => setInternalNotesInput(e.target.value)}
                  placeholder="Add internal investigation notes or dispatch notes..."
                  className="w-full text-xs p-3 bg-white border border-[#D4DEE9] rounded-[4px] outline-none focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 transition resize-none leading-relaxed text-[#061B31]"
                />
              </div>

              {/* Transcript Quote */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-[#061B31] block">Customer Grievance Transcript</span>
                <div className="p-3.5 rounded-[12px] bg-[#FAFDFF] border border-[#E3ECF7] text-[#425466] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
                  "{selectedTicket.transcript || 'No transcript record available.'}"
                </div>
              </div>

              {/* Chronological Audit Events */}
              <div className="space-y-2 pt-2 border-t border-[#E3ECF7]">
                <span className="text-xs font-semibold text-[#061B31] block">
                  Chronological Audit Timeline
                </span>
                <ActivityTimeline events={selectedTicketEvents} isLoading={isLoadingEvents} />
              </div>
            </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  );
}
