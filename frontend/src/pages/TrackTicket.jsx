import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  ExternalLink,
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

  const fetchTicket = async (numberToFetch) => {
    const raw = numberToFetch !== undefined ? numberToFetch : ticketNumber;
    const clean = (raw || '').trim().toUpperCase();

    // Inline validation
    if (!clean) {
      setErrorType('validation');
      setErrorMessage('Please enter a ticket reference ID (e.g., VD-10473).');
      setTicketData(null);
      return;
    }

    if (clean.length < 3) {
      setErrorType('validation');
      setErrorMessage('Ticket reference IDs are at least 3 characters (e.g. VD-10473).');
      setTicketData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const data = await api.trackTicket(clean);
      if (data && data.ticket) {
        setTicketData(data.ticket);
        setTicketNumber(clean);
      } else {
        setErrorType('not_found');
        setErrorMessage(`No grievance ticket found matching reference "${clean}".`);
        setTicketData(null);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      if (err.status === 404 || err.message?.includes('not found')) {
        setErrorType('not_found');
        setErrorMessage(`No grievance ticket found matching reference "${clean}". Please verify your ticket ID.`);
      } else {
        setErrorType('network');
        setErrorMessage(err.message || 'Unable to connect to the tracking server. Please check your connection and try again.');
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
    <div className="bg-app min-h-[calc(100vh-64px)] flex flex-col justify-between py-10 px-4">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-text hover:text-primary-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to home</span>
          </Link>
          <span className="text-xs font-mono text-muted-text">Public inquiry desk</span>
        </div>

        {/* Search Bar Card */}
        <div className="bg-surface border border-border rounded-card p-6 sm:p-7 shadow-xs space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-medium text-primary-text tracking-tight">
              Track your ticket
            </h1>
            <p className="text-xs text-secondary-text leading-relaxed">
              Enter your ticket reference ID to inspect live department routing, investigation stage, and audit updates.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => {
                  setTicketNumber(e.target.value.toUpperCase());
                  if (errorMessage) {
                    setErrorMessage(null);
                    setErrorType(null);
                  }
                }}
                placeholder="e.g. VD-10473"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-input text-sm font-mono text-primary-text placeholder:text-muted-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors uppercase tabular-nums"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-btn bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-medium shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Track ticket</span>
              )}
            </button>
          </form>

          {/* Inline Validation / Error Message */}
          {errorMessage && (
            <div className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
              errorType === 'network'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                errorType === 'network' ? 'text-amber-600' : 'text-rose-600'
              }`} />
              <div className="flex-1">
                <p className="font-medium">{errorMessage}</p>
                {errorType === 'network' && (
                  <button
                    type="button"
                    onClick={() => fetchTicket()}
                    className="mt-1.5 text-xs font-medium text-amber-900 underline cursor-pointer"
                  >
                    Retry request
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="bg-surface border border-border rounded-card p-6 shadow-xs space-y-5 animate-pulse">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-surface-muted rounded" />
                <div className="h-6 w-40 bg-surface-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-surface-muted rounded" />
            </div>
            <div className="h-28 bg-surface-subtle rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-surface-muted rounded-lg" />
              <div className="h-16 bg-surface-muted rounded-lg" />
            </div>
          </div>
        )}

        {/* Ticket Result Display */}
        {ticketData && !isLoading && (
          <div className="bg-surface border border-border rounded-card p-6 sm:p-7 shadow-xs space-y-6">
            {/* Header with Reference & Refresh */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-mono text-muted-text block">
                  Ticket reference
                </span>
                <span className="font-mono text-xl sm:text-2xl font-medium text-primary-text tabular-nums">
                  {ticketData.ticket_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="status" value={ticketData.status} />
                <button
                  type="button"
                  onClick={() => fetchTicket(ticketData.ticket_number)}
                  className="p-1.5 rounded-btn bg-surface border border-border text-secondary-text hover:text-primary-text transition-colors shadow-xs cursor-pointer"
                  title="Refresh live status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lifecycle Progression Timeline */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-4">
              <span className="text-xs font-medium text-primary-text block">
                Investigation lifecycle progression
              </span>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {/* Stage 1: Created */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <div className="text-xs">
                    <span className="font-medium text-primary-text block">Grievance registered</span>
                    <span className="text-[11px] text-muted-text font-mono">
                      Received and classified into organizational dispatch
                    </span>
                  </div>
                </div>

                {/* Stage 2: In Progress */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isInProgress
                        ? 'bg-brand text-white'
                        : 'bg-surface border border-border text-transparent'
                    }`}
                  >
                    {isInProgress && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="text-xs">
                    <span
                      className={`font-medium block ${
                        isInProgress ? 'text-primary-text' : 'text-muted-text'
                      }`}
                    >
                      Under investigation
                    </span>
                    <span className="text-[11px] text-muted-text font-mono">
                      Assigned to {ticketData.department || ticketData.department?.name || ticketData.department_name || 'support specialists'}
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
                        : 'bg-surface border border-border text-transparent'
                    }`}
                  >
                    {(isResolved || isEscalated) && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="text-xs">
                    <span
                      className={`font-medium block ${
                        isResolved
                          ? 'text-emerald-700'
                          : isEscalated
                          ? 'text-rose-700'
                          : 'text-muted-text'
                      }`}
                    >
                      {isResolved
                        ? 'Resolved & closed'
                        : isEscalated
                        ? 'Supervisor escalation'
                        : 'Final resolution'}
                    </span>
                    <span className="text-[11px] text-muted-text font-mono">
                      {isResolved
                        ? 'Investigation verified and customer notified'
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
                <span className="text-muted-text block mb-1">Target department</span>
                <span className="font-medium text-primary-text">
                  {ticketData.department || ticketData.department?.name || ticketData.department_name || 'General Support'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Severity priority</span>
                <StatusBadge type="priority" value={ticketData.priority || 'medium'} />
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Category</span>
                <span className="font-medium text-primary-text">{ticketData.category || 'Support'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Date logged</span>
                <span className="font-medium text-primary-text font-mono tabular-nums">
                  {ticketData.created_at ? new Date(ticketData.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }) : 'Today'}
                </span>
              </div>
            </div>

            {/* Transcript Quote */}
            {ticketData.transcript && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-xs font-medium text-primary-text block">
                  Original grievance transcript
                </span>
                <p className="p-3.5 rounded-lg bg-surface-subtle border border-border text-xs text-secondary-text leading-relaxed">
                  "{ticketData.transcript}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Professional Empty State Before Searching */}
        {!ticketData && !isLoading && !errorMessage && (
          <div className="bg-surface border border-border rounded-card p-6 sm:p-7 shadow-xs space-y-5 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <HelpCircle className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-medium text-primary-text">How grievance tracking works</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border space-y-1.5">
                <span className="w-5 h-5 rounded-btn bg-surface border border-border text-primary-text font-mono flex items-center justify-center text-xs">01</span>
                <h3 className="font-medium text-primary-text">Locate reference ID</h3>
                <p className="text-muted-text text-[11px] leading-relaxed">
                  Find your reference (e.g. VD-XXXXX) from your voice intake confirmation or SMS.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border space-y-1.5">
                <span className="w-5 h-5 rounded-btn bg-surface border border-border text-primary-text font-mono flex items-center justify-center text-xs">02</span>
                <h3 className="font-medium text-primary-text">Instant lookup</h3>
                <p className="text-muted-text text-[11px] leading-relaxed">
                  Enter the ID above. Our query checks real-time database timestamps with zero login required.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border space-y-1.5">
                <span className="w-5 h-5 rounded-btn bg-surface border border-border text-primary-text font-mono flex items-center justify-center text-xs">03</span>
                <h3 className="font-medium text-primary-text">Audit progression</h3>
                <p className="text-muted-text text-[11px] leading-relaxed">
                  View assigned support teams, resolution milestones, and supervisor escalation logs.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-secondary-text border-t border-border">
              <span>Have a new issue to register?</span>
              <Link
                to="/report"
                className="font-medium text-brand hover:text-brand-hover inline-flex items-center gap-1 transition-colors"
              >
                <span>Submit grievance</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="py-4" />
    </div>
  );
}
