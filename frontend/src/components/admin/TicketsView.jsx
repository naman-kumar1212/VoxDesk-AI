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
  Sparkles,
  History,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  StickyNote,
  Tag,
  Calendar,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────── */
function formatDate(ts, opts = { month: 'short', day: 'numeric' }) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, opts);
}

function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Per-action feedback state shape: { type: 'success'|'error', message: string } ── */

export default function TicketsView({ authToken }) {
  /* ── Data states ───────────────────────────────────────────────────── */
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 25, total_pages: 1 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketEvents, setSelectedTicketEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  /* ── Filter & Search states ────────────────────────────────────────── */
  const [searchQuery, setSearchQuery]       = useState('');
  const [statusFilter, setStatusFilter]     = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy]   = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Departments list for filter & reassignment ────────────────────── */
  const [departments, setDepartments] = useState([]);

  /* ── Ticket detail actions ─────────────────────────────────────────── */
  const [targetStatus, setTargetStatus]         = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingDept,   setIsUpdatingDept]   = useState(false);
  const [isSavingNotes,    setIsSavingNotes]     = useState(false);

  /* Separate per-action feedback so they don't collide */
  const [statusFeedback, setStatusFeedback] = useState(null); // { type, message }
  const [deptFeedback,   setDeptFeedback]   = useState(null);
  const [notesFeedback,  setNotesFeedback]  = useState(null);

  /* ── Load departments once ─────────────────────────────────────────── */
  useEffect(() => {
    if (!authToken) return;
    api.getDepartments(authToken)
      .then((data) => setDepartments(data?.departments || []))
      .catch((err) => console.error('Failed to load departments:', err));
  }, [authToken]);

  /* ── Load tickets list ─────────────────────────────────────────────── */
  const loadTickets = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const data = await api.getAdminTickets(authToken, {
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        department: departmentFilter,
        q: searchQuery,
        sortBy,
        sortDir,
        page: currentPage,
        pageSize: 25,
      });

      const list = data?.tickets || [];
      setTickets(list);
      setPagination(data?.pagination || { total: 0, page: 1, page_size: 25, total_pages: 1 });

      // Refresh selected ticket from list
      if (selectedTicket) {
        const found = list.find((t) => t.id === selectedTicket.id);
        if (found) {
          setSelectedTicket(found);
          setTargetStatus(found.status);
          setTargetDepartment(found.department);
          setInternalNotesInput(found.internal_notes || '');
        }
      }
    } catch (err) {
      console.error('Failed to query tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, statusFilter, priorityFilter, categoryFilter, departmentFilter, searchQuery, sortBy, sortDir, currentPage]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  /* ── Select ticket & load events ───────────────────────────────────── */
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setTargetStatus(ticket.status);
    setTargetDepartment(ticket.department);
    setInternalNotesInput(ticket.internal_notes || '');
    setStatusFeedback(null);
    setDeptFeedback(null);
    setNotesFeedback(null);
    setIsLoadingEvents(true);

    try {
      const data = await api.getAdminTicketDetail(authToken, ticket.id);
      if (data?.ticket) {
        setSelectedTicket(data.ticket);
        setTargetStatus(data.ticket.status);
        setTargetDepartment(data.ticket.department);
        setInternalNotesInput(data.ticket.internal_notes || '');
      }
      setSelectedTicketEvents(data?.events || []);
    } catch (err) {
      console.error('Failed to load ticket events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  /* ── Auto-clear feedback after 3 s ─────────────────────────────────── */
  useEffect(() => {
    if (!statusFeedback) return;
    const t = setTimeout(() => setStatusFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [statusFeedback]);

  useEffect(() => {
    if (!deptFeedback) return;
    const t = setTimeout(() => setDeptFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [deptFeedback]);

  useEffect(() => {
    if (!notesFeedback) return;
    const t = setTimeout(() => setNotesFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [notesFeedback]);

  /* ── Status update ──────────────────────────────────────────────────── */
  const handleUpdateStatus = async () => {
    if (!selectedTicket || !targetStatus || targetStatus === selectedTicket.status) return;
    setIsUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        status: targetStatus,
        reason: 'Updated from Tickets Management',
      });
      setStatusFeedback({ type: 'success', message: `Status updated to ${targetStatus.replace(/_/g, ' ')}.` });
      await loadTickets();
      await handleSelectTicket({ ...selectedTicket, status: targetStatus });
    } catch (err) {
      setStatusFeedback({ type: 'error', message: err.message || 'Status transition denied.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  /* ── Department reassignment ────────────────────────────────────────── */
  const handleReassignDepartment = async () => {
    if (!selectedTicket || !targetDepartment || targetDepartment === selectedTicket.department) return;
    setIsUpdatingDept(true);
    setDeptFeedback(null);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        department: targetDepartment,
        reason: `Reassigned to ${targetDepartment}`,
      });
      setDeptFeedback({ type: 'success', message: `Reassigned to ${targetDepartment}.` });
      await loadTickets();
      await handleSelectTicket({ ...selectedTicket, department: targetDepartment });
    } catch (err) {
      setDeptFeedback({ type: 'error', message: err.message || 'Department reassignment failed.' });
    } finally {
      setIsUpdatingDept(false);
    }
  };

  /* ── Save internal notes ────────────────────────────────────────────── */
  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setIsSavingNotes(true);
    setNotesFeedback(null);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        internalNotes: internalNotesInput,
      });
      setNotesFeedback({ type: 'success', message: 'Admin notes saved.' });
      await loadTickets();
      await handleSelectTicket({ ...selectedTicket, internal_notes: internalNotesInput });
    } catch (err) {
      setNotesFeedback({ type: 'error', message: err.message || 'Failed to save notes.' });
    } finally {
      setIsSavingNotes(false);
    }
  };

  /* ── Inline feedback pill ───────────────────────────────────────────── */
  const FeedbackPill = ({ fb }) => {
    if (!fb) return null;
    return (
      <div
        className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-medium px-2 py-1 rounded-lg ${
          fb.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}
      >
        {fb.type === 'success'
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
        {fb.message}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tickets Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, inspect transcripts, reassign departments, and update grievance statuses.
          </p>
        </div>

        <button
          onClick={loadTickets}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                     text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl
                     shadow-sm hover:bg-slate-50 transition focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Search & Multi-Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by ticket ID, customer name/email, complaint…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl
                         outline-none focus:bg-white focus:border-primary-500 transition
                         focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => { const [sb, sd] = e.target.value.split(':'); setSortBy(sb); setSortDir(sd); }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl
                         px-2.5 py-2 outline-none text-slate-700"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="priority:desc">High Priority First</option>
              <option value="ticket_number:asc">Ticket ID (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="payment">Payment</option>
              <option value="orders">Orders</option>
              <option value="delivery">Delivery</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="refund">Refund</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Tickets Table & Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Tickets Table (Left Column) ──────────────────────────────── */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Tickets Log</span>
              <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                {pagination.total} Total
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Page {pagination.page} of {pagination.total_pages}
            </span>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto min-h-[360px]">
            {isLoading && tickets.length === 0 ? (
              <div className="p-4 space-y-2">
                <TicketRowSkeleton /><TicketRowSkeleton />
                <TicketRowSkeleton /><TicketRowSkeleton />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No matching tickets found.</p>
                <p className="text-[11px]">Adjust your search query or reset filter settings.</p>
              </div>
            ) : (
              <table
                role="table"
                aria-label="Ticket list"
                className="w-full text-left text-xs border-collapse"
              >
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold
                                 uppercase tracking-wider text-slate-400 select-none">
                    <th className="py-2.5 px-4 whitespace-nowrap">Ticket</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Customer</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Department</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[80px]">Priority</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">Status</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    const customerName  = t.customer_name  || 'Anonymous Customer';
                    const customerEmail = t.customer_email || 'Email not provided';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`cursor-pointer transition align-middle ${
                          isSelected
                            ? 'bg-primary-50/70 border-l-4 border-l-primary-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Ticket ID + summary */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-extrabold text-slate-900 whitespace-nowrap">
                            {t.ticket_number}
                          </div>
                          <div
                            className="text-[11px] text-slate-500 truncate max-w-[140px]"
                            title={t.summary}
                          >
                            {t.summary || '—'}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <div
                            className="font-bold text-slate-800 truncate max-w-[130px]"
                            title={customerName}
                          >
                            {customerName}
                          </div>
                          <div
                            className="text-[10px] text-slate-400 truncate max-w-[130px]"
                            title={customerEmail}
                          >
                            {customerEmail}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3">
                          <span
                            className="text-slate-700 font-semibold text-[11px] truncate max-w-[110px] block"
                            title={t.department}
                          >
                            {t.department || '—'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3 whitespace-nowrap min-w-[80px]">
                          <StatusBadge type="priority" value={t.priority} />
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap min-w-[110px]">
                          <StatusBadge value={t.status} />
                        </td>

                        {/* Created date */}
                        <td className="py-3 px-3 text-right text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-500 text-[11px]">
              Showing {tickets.length} of {pagination.total} tickets
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white
                           disabled:opacity-40 transition focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700">
                {pagination.page} / {pagination.total_pages || 1}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={pagination.page >= pagination.total_pages || isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white
                           disabled:opacity-40 transition focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Ticket Details & Action Panel (Right Column) ─────────────── */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {selectedTicket ? (
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-220px)]">

              {/* ① Ticket ID + Status + Date ─────────────────────────── */}
              <div className="px-5 py-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedTicket.ticket_number}
                    </h2>
                    <StatusBadge value={selectedTicket.status} />
                    {selectedTicket.escalated && selectedTicket.status !== 'escalated' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider
                                       text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Escalated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Filed {formatDateTime(selectedTicket.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* ② Customer Info ─────────────────────────────────────── */}
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Customer
                </p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="font-semibold text-slate-800 break-all">
                      {selectedTicket.customer_name || 'Anonymous Customer'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-slate-500 font-mono break-all">
                      {selectedTicket.customer_email || 'Email not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ③ Voice Transcript ──────────────────────────────────── */}
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Customer Voice Transcript
                </p>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 max-h-28 overflow-y-auto">
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.transcript || 'No transcript available.'}
                  </p>
                </div>
              </div>

              {/* ④ AI Summary ────────────────────────────────────────── */}
              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary-500" />
                  AI Extracted Summary
                </p>
                <p className="text-xs text-slate-700 bg-primary-50/40 p-2.5 rounded-xl
                              border border-primary-100 font-medium leading-relaxed">
                  {selectedTicket.summary || '—'}
                </p>
              </div>

              {/* ⑤ Metadata row: Priority / Category / Department ───── */}
              <div className="px-5 py-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-0.5">
                      <Tag className="w-3 h-3" /> Priority
                    </p>
                    <StatusBadge type="priority" value={selectedTicket.priority} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Category
                    </p>
                    <span className="text-slate-700 font-semibold capitalize">
                      {selectedTicket.category || '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-0.5">
                      <Building2 className="w-3 h-3" /> Dept
                    </p>
                    <span className="text-slate-700 font-semibold text-[11px] leading-tight block">
                      {selectedTicket.department || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ⑥ Update Status ─────────────────────────────────────── */}
              <div className="px-5 py-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Update Resolution Status
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    disabled={isUpdatingStatus}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs
                               font-semibold text-slate-800 outline-none capitalize
                               focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus || targetStatus === selectedTicket.status}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-700
                               hover:bg-primary-800 text-white text-xs font-bold rounded-lg shadow-sm
                               disabled:opacity-50 disabled:cursor-not-allowed transition
                               focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {isUpdatingStatus
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Updating…</span></>
                      : 'Apply'}
                  </button>
                </div>
                <FeedbackPill fb={statusFeedback} />
              </div>

              {/* ⑦ Reassign Department ───────────────────────────────── */}
              <div className="px-5 py-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Assigned Department
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    disabled={isUpdatingDept}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs
                               font-semibold text-slate-800 outline-none
                               focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleReassignDepartment}
                    disabled={isUpdatingDept || targetDepartment === selectedTicket.department}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800
                               hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm
                               disabled:opacity-50 disabled:cursor-not-allowed transition
                               focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {isUpdatingDept
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Moving…</span></>
                      : 'Reassign'}
                  </button>
                </div>
                <FeedbackPill fb={deptFeedback} />
              </div>

              {/* ⑧ Internal Admin Notes ──────────────────────────────── */}
              <div className="px-5 py-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1">
                  <StickyNote className="w-3 h-3 text-slate-400" /> Internal Admin Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotesInput}
                  onChange={(e) => setInternalNotesInput(e.target.value)}
                  placeholder="Add internal investigation notes or operator instructions…"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none
                             focus:border-primary-500 transition resize-none
                             focus-visible:ring-2 focus-visible:ring-primary-500"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <FeedbackPill fb={notesFeedback} />
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || internalNotesInput === (selectedTicket.internal_notes || '')}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-700
                               hover:bg-primary-800 text-white text-xs font-bold rounded-lg shadow-sm
                               disabled:opacity-50 disabled:cursor-not-allowed transition
                               focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {isSavingNotes
                      ? <><Loader2 className="w-3 h-3 animate-spin" /><span>Saving…</span></>
                      : 'Save Notes'}
                  </button>
                </div>
              </div>

              {/* ⑨ Activity History Timeline ─────────────────────────── */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                  <History className="w-3 h-3 text-slate-500" />
                  Activity History
                </p>
                <ActivityTimeline
                  events={selectedTicketEvents}
                  isLoading={isLoadingEvents}
                />
              </div>
            </div>
          ) : (
            /* Empty state — no ticket selected */
            <div className="py-24 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No ticket selected</p>
              <p className="text-[11px]">
                Click any ticket on the left to inspect transcripts and manage resolution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
