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
      const result = await api.trackTicket(clean);
      if (result && result.ticket) {
        setTicketData(result.ticket);
      } else {
        throw new Error(`Ticket '${clean}' not found.`);
      }
    } catch (err) {
      console.error('Failed to track ticket:', err);
      setTicketData(null);

      if (err.status === 404 || err.code === 'NOT_FOUND') {
        setErrorType('not_found');
        setErrorMessage(
          `No active ticket found matching '${clean}'. Please verify your reference number.`
        );
      } else if (!navigator.onLine || err.message?.includes('fetch') || err.message?.includes('network')) {
        setErrorType('network');
        setErrorMessage(
          'Network connection error. Unable to reach the tracking server. Please check your connection and retry.'
        );
      } else {
        setErrorType('server');
        setErrorMessage(
          err.message || `Unable to retrieve status for '${clean}'. Please retry shortly.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicketNumber) {
      fetchTicket(initialTicketNumber);
    }
  }, [initialTicketNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTicket();
  };

  const handleDemoFill = (demoId) => {
    setTicketNumber(demoId);
    fetchTicket(demoId);
  };

  // Timeline computation based on backend status and events
  const currentStatus = ticketData?.status || 'open';
  const isAssigned = true;
  const isInProgress = ['in_progress', 'escalated', 'resolved'].includes(currentStatus);
  const isResolved = currentStatus === 'resolved';
  const isEscalated = ticketData?.escalated || currentStatus === 'escalated';

  const createdTime = ticketData?.created_at
    ? new Date(ticketData.created_at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  const updatedTime = ticketData?.updated_at
    ? new Date(ticketData.updated_at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-4 text-center">
      {/* Top Contextual Link (Single Home Link, no duplicate CTA) */}
      <div className="flex items-center justify-between mb-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Page Title & Guidance */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Track Your Ticket
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
        Enter your ticket ID to check the latest status and updates.
      </p>

      {/* Ticket Search Form */}
      <form onSubmit={handleSubmit} className="mt-6 max-w-md mx-auto text-left">
        <label
          htmlFor="ticket-track-input"
          className="block text-xs font-bold text-slate-700 mb-1.5"
        >
          Ticket Reference ID
        </label>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="ticket-track-input"
              type="text"
              value={ticketNumber}
              onChange={(e) => {
                setTicketNumber(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isLoading}
              placeholder="e.g. VD-10473"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !ticketNumber.trim()}
            className="px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/20 transition flex items-center gap-1.5 shrink-0 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert States */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs text-left max-w-md mx-auto flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">
              {errorType === 'not_found'
                ? 'Ticket Not Found'
                : errorType === 'network'
                  ? 'Connection Error'
                  : 'Lookup Notice'}
            </p>
            <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchTicket()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Search</span>
              </button>

              <Link
                to="/report"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-800 hover:bg-rose-50 font-bold rounded-lg text-xs transition"
              >
                <Mic className="w-3 h-3" />
                <span>Report Issue Instead</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="mt-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm max-w-md mx-auto animate-pulse text-left space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="w-28 h-5 bg-slate-100 rounded" />
            <div className="w-16 h-5 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-2 py-3 border-b border-slate-100">
            <div className="w-20 h-3 bg-slate-100 rounded" />
            <div className="w-full h-8 bg-slate-100 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-100">
            <div className="w-24 h-4 bg-slate-100 rounded" />
            <div className="w-24 h-4 bg-slate-100 rounded" />
          </div>
          <div className="space-y-4 pt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-24 h-3 bg-slate-100 rounded" />
                  <div className="w-40 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Initial Empty State before search */}
      {!isLoading && !ticketData && !errorMessage && !hasSearched && (
        <div className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm max-w-md mx-auto text-center">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-3">
            <TicketIcon className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Track Your Support Request
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Enter your ticket ID above to check live routing status and resolution updates. You received this reference when filing your complaint or via voice confirmation.
          </p>

          {/* Realistic Example Hint */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium mb-2">
              Have an existing demo ticket? Try searching:
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('VD-10473')}
                className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-xs font-mono font-bold transition"
              >
                VD-10473
              </button>
            </div>
          </div>

          {/* Secondary Action */}
          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 text-xs text-primary-700 hover:text-primary-800 font-bold"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Report a New Issue Instead</span>
            </Link>
          </div>
        </div>
      )}

      {/* Successful Search Result & Visual Status Timeline Card */}
      {!isLoading && ticketData && (
        <div className="mt-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-left max-w-md mx-auto">
          {/* Card Header: Ticket ID & Status Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">Ticket:</span>
              <span className="font-mono text-sm font-extrabold text-slate-900">
                {ticketData.ticket_number}
              </span>
            </div>
            <div>
              <StatusBadge value={ticketData.status} />
            </div>
          </div>

          {/* Complaint Summary */}
          <div className="py-3.5 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Complaint Summary
            </span>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-sans">
              {ticketData.summary || 'Customer grievance recorded and logged in system.'}
            </p>
          </div>

          {/* Metadata Grid: Category, Priority, Department, Escalation */}
          <div className="py-3.5 border-b border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                Category
              </span>
              <span className="font-bold text-slate-800 uppercase">
                {ticketData.category}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                Priority
              </span>
              <div>
                <StatusBadge type="priority" value={ticketData.priority} />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                Department
              </span>
              <span className="font-bold text-slate-800">
                {ticketData.department || 'Support'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                Escalation
              </span>
              {isEscalated ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>Escalated</span>
                </span>
              ) : (
                <span className="text-slate-600 font-medium">Standard</span>
              )}
            </div>
          </div>

          {/* Timestamps: Created and Last Updated */}
          <div className="py-3 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <span className="font-semibold text-slate-400">Created: </span>
              <span>{createdTime}</span>
            </div>
            {updatedTime && updatedTime !== createdTime && (
              <div>
                <span className="font-semibold text-slate-400">Updated: </span>
                <span>{updatedTime}</span>
              </div>
            )}
          </div>

          {/* Visual Status Timeline matching Reference Screen 5 */}
          <div className="pt-5 relative pl-8 space-y-6 before:absolute before:left-3 before:top-7 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Ticket Created */}
            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">Ticket Created</h3>
                  {createdTime && (
                    <span className="text-[10px] text-slate-400 font-medium">{createdTime}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Your complaint has been received.</p>
              </div>
            </div>

            {/* Step 2: Assigned to Department */}
            <div className="relative">
              <div
                className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${isAssigned ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Assigned to {ticketData.department || 'Support'}
                  </h3>
                  {createdTime && (
                    <span className="text-[10px] text-slate-400 font-medium">{createdTime}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Our team is working on your issue.</p>
              </div>
            </div>

            {/* Step 3: In Progress */}
            <div className="relative">
              <div
                className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${isInProgress ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
              >
                {isResolved ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {isEscalated ? 'Escalated Review' : 'In Progress'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isEscalated
                    ? 'Flagged for priority investigation.'
                    : 'We are investigating and will update you shortly.'}
                </p>
              </div>
            </div>

            {/* Step 4: Resolved */}
            <div className="relative">
              <div
                className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${isResolved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
              >
                {isResolved ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Resolved</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isResolved
                    ? 'Your issue has been successfully resolved.'
                    : 'Your issue will be marked as resolved once fixed.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
