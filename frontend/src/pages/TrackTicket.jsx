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
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTicket = async (numberToFetch) => {
    const num = (numberToFetch || ticketNumber).trim().toUpperCase();
    if (!num) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const result = await api.trackTicket(num);
      if (result && result.ticket) {
        setTicketData(result.ticket);
      } else {
        throw new Error(`Ticket '${num}' not found.`);
      }
    } catch (err) {
      console.error('Failed to track ticket:', err);
      setTicketData(null);
      setErrorMessage(
        err.message || `No ticket found matching '${num}'. Please check your ID and retry.`
      );
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

  // Determine timeline progress based on current ticket status
  const currentStatus = ticketData?.status || 'open';
  const isAssigned = true;
  const isInProgress = ['in_progress', 'escalated', 'resolved'].includes(currentStatus);
  const isResolved = currentStatus === 'resolved';

  const createdTime = ticketData?.created_at
    ? new Date(ticketData.created_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="max-w-xl mx-auto py-10 px-4 text-center">
      {/* Contextual top link */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        <Link
          to="/report"
          className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-800 font-semibold"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Headings matching reference Screen 5 */}
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Track Your Ticket
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto">
        Enter your ticket ID to check the latest status and updates.
      </p>

      {/* Search Input Box matching reference Screen 5 */}
      <form onSubmit={handleSubmit} className="mt-8 flex items-center gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <label htmlFor="ticket-track-input" className="sr-only">
            Ticket ID
          </label>
          <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            id="ticket-track-input"
            type="text"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. VD-10427 or VD-XXXXXXXX"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !ticketNumber.trim()}
          className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </>
          )}
        </button>
      </form>

      {/* Error state alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs text-left max-w-md mx-auto flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Ticket Not Found</p>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            <div className="mt-3">
              <Link
                to="/report"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
              >
                <Mic className="w-3 h-3" /> Report Issue Instead
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm max-w-md mx-auto animate-pulse text-left space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="w-28 h-5 bg-slate-100 rounded" />
            <div className="w-16 h-5 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-6 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-24 h-3.5 bg-slate-100 rounded" />
                  <div className="w-40 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State before search */}
      {!isLoading && !ticketData && !errorMessage && !hasSearched && (
        <div className="mt-8 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm max-w-md mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <TicketIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Ready to Track</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Enter your VoxDesk ticket reference number above to view real-time routing status and progress.
          </p>
        </div>
      )}

      {/* Ticket Result & Timeline Card matching reference Screen 5 */}
      {!isLoading && ticketData && (
        <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-left">
          {/* Card Header: Ticket: VD-XXXXXX and Status Pill */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
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

          {/* Stepper / Timeline matching reference Screen 5 */}
          <div className="pt-6 relative pl-8 space-y-7 before:absolute before:left-3 before:top-8 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Ticket Created */}
            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-900">Ticket Created</h2>
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
                className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                  isAssigned ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-900">
                    Assigned to {ticketData.department || 'Support'}
                  </h2>
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
                className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                  isInProgress ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isResolved ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  {currentStatus === 'escalated' ? 'Escalated Review' : 'In Progress'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentStatus === 'escalated'
                    ? 'Flagged for priority investigation.'
                    : 'We are investigating and will update you shortly.'}
                </p>
              </div>
            </div>

            {/* Step 4: Resolved */}
            <div className="relative">
              <div
                className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                  isResolved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isResolved ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Resolved</h2>
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
