import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Tag,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mic,
  Ticket as TicketIcon,
  AlertTriangle,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function TrackTicket() {
  const [searchParams] = useSearchParams();
  const initialTicketNumber = searchParams.get('ticket') || '';

  const [ticketNumber, setTicketNumber] = useState(initialTicketNumber);
  const [ticketData, setTicketData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'not_found' | 'network' | 'validation'
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTicket = async (numberToFetch) => {
    const raw = numberToFetch !== undefined ? numberToFetch : ticketNumber;
    const clean = (raw || '').trim().toUpperCase();

    // Validation
    if (!clean) {
      setErrorType('validation');
      setErrorMessage('Please enter a ticket reference ID to search.');
      setTicketData(null);
      return;
    }

    if (clean.length < 3) {
      setErrorType('validation');
      setErrorMessage('Please enter a valid ticket reference (e.g. VD-10473).');
      setTicketData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);
    setHasSearched(true);

    try {
      const data = await api.getTicket(clean);
      if (data && data.ticket) {
        setTicketData(data.ticket);
        setTicketNumber(clean);
      } else {
        setErrorType('not_found');
        setErrorMessage(`No grievance ticket found matching "${clean}".`);
        setTicketData(null);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      if (err.status === 404 || err.message?.includes('not found')) {
        setErrorType('not_found');
        setErrorMessage(`No grievance ticket found matching "${clean}".`);
      } else {
        setErrorType('network');
        setErrorMessage(err.message || 'Unable to connect to the tracking server.');
      }
      setTicketData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicketNumber) {
      fetchTicket(initialTicketNumber);
    }
  }, [initialTicketNumber]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTicket();
  };

  // Progression milestones: open -> in_progress -> (resolved | escalated)
  const isResolved = ticketData?.status === 'resolved';
  const isEscalated = ticketData?.status === 'escalated' || ticketData?.escalated;
  const isInProgress = ticketData?.status === 'in_progress' || isResolved || isEscalated;

  return (
    <div className="bg-app min-h-[calc(100vh-64px)] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-text hover:text-primary-text transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <span className="text-xs font-medium text-muted-text">Public Inquiry Desk</span>
        </div>

        {/* Search Bar Card */}
        <div className="bg-surface border border-border rounded-card p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
              Track Grievance Status
            </h1>
            <p className="text-xs text-secondary-text">
              Enter your ticket reference ID (e.g., VD-10473) to view live status and audit updates.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                placeholder="VD-XXXXX"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-input text-sm font-mono text-primary-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-2 cursor-pointer disabled:bg-slate-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Lookup Ticket</span>
              )}
            </button>
          </form>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Ticket Result Display */}
        {ticketData && (
          <div className="bg-surface border border-border rounded-card p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
            {/* Header with Reference & Refresh */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-semibold text-muted-text uppercase tracking-wider block">
                  Ticket Reference
                </span>
                <span className="font-mono text-xl font-bold text-primary-text">
                  {ticketData.ticket_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="status" value={ticketData.status} />
                <button
                  type="button"
                  onClick={() => fetchTicket(ticketData.ticket_number)}
                  className="p-1.5 rounded-btn bg-surface border border-border text-slate-500 hover:text-primary-text transition shadow-xs"
                  title="Refresh live status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vertical Lifecycle Progression Timeline */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-4">
              <span className="text-xs font-semibold text-primary-text block">
                Investigation Lifecycle Progression
              </span>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {/* Stage 1: Created */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <div className="text-xs">
                    <span className="font-semibold text-primary-text block">Grievance Registered</span>
                    <span className="text-[11px] text-muted-text">
                      Received and categorized via voice intake
                    </span>
                  </div>
                </div>

                {/* Stage 2: In Progress */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isInProgress
                        ? 'bg-blue-600 text-white'
                        : 'bg-surface border-2 border-border text-transparent'
                    }`}
                  >
                    {isInProgress && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="text-xs">
                    <span
                      className={`font-semibold block ${
                        isInProgress ? 'text-primary-text' : 'text-muted-text'
                      }`}
                    >
                      Under Investigation
                    </span>
                    <span className="text-[11px] text-muted-text">
                      Assigned to {ticketData.department?.name || ticketData.department_name || 'support specialists'}
                    </span>
                  </div>
                </div>

                {/* Stage 3: Resolved / Final Outcome */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isResolved
                        ? 'bg-emerald-600 text-white'
                        : isEscalated
                        ? 'bg-rose-600 text-white'
                        : 'bg-surface border-2 border-border text-transparent'
                    }`}
                  >
                    {(isResolved || isEscalated) && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="text-xs">
                    <span
                      className={`font-semibold block ${
                        isResolved
                          ? 'text-emerald-700'
                          : isEscalated
                          ? 'text-rose-700'
                          : 'text-muted-text'
                      }`}
                    >
                      {isResolved
                        ? 'Resolved & Closed'
                        : isEscalated
                        ? 'Supervisor Escalation'
                        : 'Final Resolution'}
                    </span>
                    <span className="text-[11px] text-muted-text">
                      {isResolved
                        ? 'Investigation verified and completed'
                        : isEscalated
                        ? 'Flagged for priority managerial oversight'
                        : 'Awaiting departmental conclusion'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Ticket Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Target Department</span>
                <span className="font-semibold text-primary-text">
                  {ticketData.department?.name || ticketData.department_name || 'General Support'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Severity Priority</span>
                <StatusBadge type="priority" value={ticketData.priority} />
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Category</span>
                <span className="font-semibold text-primary-text">{ticketData.category || 'Support'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Date Logged</span>
                <span className="font-semibold text-primary-text">
                  {new Date(ticketData.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Transcript Quote */}
            {ticketData.transcript && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-xs font-semibold text-primary-text block">
                  Original Grievance Transcript
                </span>
                <p className="p-3.5 rounded-lg bg-surface-subtle border border-border text-xs text-secondary-text leading-relaxed">
                  "{ticketData.transcript}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
