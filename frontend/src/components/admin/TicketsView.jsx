import React, { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../StatusBadge';
import { TicketRowSkeleton, TicketDetailSkeleton } from '../LoadingSkeleton';
import { api } from '../../services/api';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertTriangle,
  FileText,
  Sparkles,
  History,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  User,
  Mail,
  StickyNote,
} from 'lucide-react';

export default function TicketsView({ authToken }) {
  // Data states
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 25, total_pages: 1 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketEvents, setSelectedTicketEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Departments list for filter & reassignment
  const [departments, setDepartments] = useState([]);

  // Ticket detail actions
  const [targetStatus, setTargetStatus] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Load departments list once
  useEffect(() => {
    if (!authToken) return;
    api.getDepartments(authToken)
      .then((data) => setDepartments(data?.departments || []))
      .catch((err) => console.error('Failed to load departments:', err));
  }, [authToken]);

  // Load tickets list
  const loadTickets = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setActionFeedback(null);
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

      // If selected ticket exists, refresh its state from list or keep it
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

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Fetch ticket details & events on ticket selection
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setTargetStatus(ticket.status);
    setTargetDepartment(ticket.department);
    setInternalNotesInput(ticket.internal_notes || '');
    setActionFeedback(null);
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

  // Status update
  const handleUpdateStatus = async () => {
    if (!selectedTicket || !targetStatus || targetStatus === selectedTicket.status) return;
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        status: targetStatus,
        reason: 'Updated from Tickets Management',
      });
      setActionFeedback({ type: 'success', message: `Status updated to ${targetStatus.replace('_', ' ')}.` });
      await loadTickets();
      handleSelectTicket({ ...selectedTicket, status: targetStatus });
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Status transition denied.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Department reassignment
  const handleReassignDepartment = async () => {
    if (!selectedTicket || !targetDepartment || targetDepartment === selectedTicket.department) return;
    setIsUpdatingDept(true);
    setActionFeedback(null);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        department: targetDepartment,
        reason: `Reassigned to ${targetDepartment}`,
      });
      setActionFeedback({ type: 'success', message: `Reassigned to ${targetDepartment}.` });
      await loadTickets();
      handleSelectTicket({ ...selectedTicket, department: targetDepartment });
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Department reassignment failed.' });
    } finally {
      setIsUpdatingDept(false);
    }
  };

  // Save internal notes
  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setIsSavingNotes(true);
    setActionFeedback(null);
    try {
      await api.updateTicket(authToken, selectedTicket.id, {
        internalNotes: internalNotesInput,
      });
      setActionFeedback({ type: 'success', message: 'Internal admin notes updated.' });
      await loadTickets();
      handleSelectTicket({ ...selectedTicket, internal_notes: internalNotesInput });
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to save notes.' });
    } finally {
      setIsSavingNotes(false);
    }
  };

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
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition"
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ticket ID, customer name/email, complaint..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 transition"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':');
                setSortBy(sb);
                setSortDir(sd);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none text-slate-700"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="priority:desc">High Priority First</option>
              <option value="ticket_number:asc">Ticket ID (A-Z)</option>
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Tickets Table & Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tickets Table (Left Column) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
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

          {/* Table content */}
          <div className="overflow-x-auto min-h-[360px]">
            {isLoading && tickets.length === 0 ? (
              <div className="p-4 space-y-2">
                <TicketRowSkeleton />
                <TicketRowSkeleton />
                <TicketRowSkeleton />
                <TicketRowSkeleton />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No matching tickets found.</p>
                <p className="text-[11px]">Adjust your search query or reset filter settings.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                    <th className="py-2.5 px-4">Ticket</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-primary-50/70 border-l-4 border-l-primary-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-extrabold text-slate-900">
                            {t.ticket_number}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[140px]" title={t.summary}>
                            {t.summary}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 truncate max-w-[120px]">
                            {t.customer_name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {t.customer_email}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-semibold text-[11px]">
                          {t.department}
                        </td>

                        <td className="py-3 px-3">
                          <StatusBadge type="priority" value={t.priority} />
                        </td>

                        <td className="py-3 px-3">
                          <StatusBadge value={t.status} />
                        </td>

                        <td className="py-3 px-3 text-right text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Showing {tickets.length} of {pagination.total} tickets
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition"
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
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Details & Action Panel (Right Column) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          {selectedTicket ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedTicket.ticket_number}
                    </h2>
                    {selectedTicket.escalated && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Escalated
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Filed on {new Date(selectedTicket.created_at).toLocaleString()}
                  </div>
                </div>

                <StatusBadge value={selectedTicket.status} />
              </div>

              {/* Feedback Alert */}
              {actionFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    actionFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {actionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              {/* Customer Info Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-800">{selectedTicket.customer_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedTicket.customer_email}</span>
                </div>
              </div>

              {/* Original Audio Transcript */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Customer Voice Transcript</span>
                </span>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {selectedTicket.transcript}
                </p>
              </div>

              {/* AI Summary */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary-500" />
                  <span>AI Extracted Summary</span>
                </span>
                <p className="text-xs text-slate-700 bg-primary-50/30 p-2.5 rounded-xl border border-primary-100 font-medium">
                  {selectedTicket.summary}
                </p>
              </div>

              {/* Status Update Control */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Update Resolution Status
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    disabled={isUpdatingStatus}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none capitalize"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus || targetStatus === selectedTicket.status}
                    className="px-3.5 py-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Department Reassignment */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>Assigned Department</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    disabled={isUpdatingDept}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleReassignDepartment}
                    disabled={isUpdatingDept || targetDepartment === selectedTicket.department}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {isUpdatingDept ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reassign'}
                  </button>
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <StickyNote className="w-3 h-3 text-slate-400" />
                  <span>Internal Admin Notes</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNotesInput}
                  onChange={(e) => setInternalNotesInput(e.target.value)}
                  placeholder="Add internal investigation notes or operator instructions..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500 transition"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || internalNotesInput === (selectedTicket.internal_notes || '')}
                    className="px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

              {/* Event Activity History Timeline */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                  <History className="w-3 h-3 text-slate-500" />
                  <span>Activity History Timeline</span>
                </span>

                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 text-xs">
                  {isLoadingEvents ? (
                    <div className="flex items-center gap-2 text-slate-400 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading history...</span>
                    </div>
                  ) : selectedTicketEvents.length === 0 ? (
                    <p className="text-slate-400 text-[11px]">No activity history logged yet.</p>
                  ) : (
                    selectedTicketEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="border-l-2 border-primary-500 pl-2.5 py-0.5 space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 capitalize">
                            {evt.event_type.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {evt.details && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {typeof evt.details === 'string' ? evt.details : JSON.stringify(evt.details)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No ticket selected</p>
              <p className="text-[11px]">Click any ticket on the left to inspect transcripts and manage resolution.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

