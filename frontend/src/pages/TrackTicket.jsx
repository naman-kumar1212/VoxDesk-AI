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
    <div className="bg-[#F8FAFD] min-h-[calc(100vh-64px)] flex flex-col justify-between py-12 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#425466] hover:text-[#061B31] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to overview</span>
          </Link>
          <span className="text-xs font-mono font-medium text-[#737373] bg-white border border-[#E3ECF7] px-2.5 py-1 rounded-full">
            Public verification portal
          </span>
        </div>

        {/* Search Bar Card */}
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 sm:p-8 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#061B31] tracking-[-0.03em]">
              Track ticket lifecycle
            </h1>
            <p className="text-xs sm:text-sm text-[#425466] leading-relaxed">
              Enter your grievance reference identifier to inspect real-time SLA progress, departmental dispatch, and resolution audit trail.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
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
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-sm font-mono text-[#061B31] placeholder:text-[#A1AAB8] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none transition-all uppercase tabular-nums"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-full bg-[#533AFD] hover:bg-[#635BFF] disabled:bg-[#ECF0F4] disabled:text-[#A1AAB8] disabled:cursor-not-allowed text-white text-xs font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] hover:shadow-[0_8px_20px_rgba(83,58,253,0.32)] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
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
            <div className={`p-3.5 rounded-[10px] border flex items-start gap-2.5 text-xs ${
              errorType === 'network'
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-[#FFF1F2] border-[#FECDD3] text-[#DF1B41]'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                errorType === 'network' ? 'text-[#D97706]' : 'text-[#DF1B41]'
              }`} />
              <div className="flex-1">
                <p className="font-medium">{errorMessage}</p>
                {errorType === 'network' && (
                  <button
                    type="button"
                    onClick={() => fetchTicket()}
                    className="mt-1.5 text-xs font-medium text-[#92400E] underline cursor-pointer"
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
          <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 sm:p-8 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-5 animate-pulse">
            <div className="flex items-center justify-between pb-4 border-b border-[#E3ECF7]">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-[#ECF0F4] rounded" />
                <div className="h-6 w-40 bg-[#ECF0F4] rounded" />
              </div>
              <div className="h-6 w-20 bg-[#ECF0F4] rounded-full" />
            </div>
            <div className="h-28 bg-[#F6F9FC] rounded-[14px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-[#F6F9FC] rounded-[10px]" />
              <div className="h-16 bg-[#F6F9FC] rounded-[10px]" />
            </div>
          </div>
        )}

        {/* Ticket Result Display */}
        {ticketData && !isLoading && (
          <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 sm:p-8 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-6">
            {/* Header with Reference & Refresh */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E3ECF7]">
              <div>
                <span className="text-[11px] font-mono text-[#737373] uppercase tracking-wider block">
                  Reference Identifier
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#061B31] tabular-nums">
                  {ticketData.ticket_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="status" value={ticketData.status} />
                <button
                  type="button"
                  onClick={() => fetchTicket(ticketData.ticket_number)}
                  className="p-2 rounded-full bg-white border border-[#D4DEE9] text-[#425466] hover:text-[#061B31] hover:bg-[#F6F9FC] transition-colors shadow-sm cursor-pointer"
                  title="Refresh live status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lifecycle Progression Timeline */}
            <div className="p-4 sm:p-5 rounded-[14px] bg-[#FAFDFF] border border-[#E3ECF7] space-y-4">
              <span className="text-xs font-semibold text-[#061B31] block">
                Lifecycle milestones & SLA tracking
              </span>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E3ECF7]">
                {/* Stage 1: Created */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#00D66F] text-white flex items-center justify-center text-[10px] shadow-sm">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <div className="text-xs">
                    <span className="font-semibold text-[#061B31] block">Grievance registered</span>
                    <span className="text-[11px] text-[#737373] font-mono">
                      Received and classified into organizational dispatch
                    </span>
                  </div>
                </div>

                {/* Stage 2: In Progress */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                      isInProgress
                        ? 'bg-[#533AFD] text-white'
                        : 'bg-white border border-[#D4DEE9] text-transparent'
                    }`}
                  >
                    {isInProgress && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="text-xs">
                    <span
                      className={`font-semibold block ${
                        isInProgress ? 'text-[#061B31]' : 'text-[#737373]'
                      }`}
                    >
                      Under investigation
                    </span>
                    <span className="text-[11px] text-[#737373] font-mono">
                      Assigned to {ticketData.department || ticketData.department?.name || ticketData.department_name || 'support specialists'}
                    </span>
                  </div>
                </div>

                {/* Stage 3: Resolved / Final Outcome */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                      isResolved
                        ? 'bg-[#00D66F] text-white'
                        : isEscalated
                        ? 'bg-[#DF1B41] text-white'
                        : 'bg-white border border-[#D4DEE9] text-transparent'
                    }`}
                  >
                    {(isResolved || isEscalated) && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="text-xs">
                    <span
                      className={`font-semibold block ${
                        isResolved
                          ? 'text-[#00D66F]'
                          : isEscalated
                          ? 'text-[#DF1B41]'
                          : 'text-[#737373]'
                      }`}
                    >
                      {isResolved
                        ? 'Resolved & confirmed'
                        : isEscalated
                        ? 'Managerial escalation'
                        : 'Final resolution pending'}
                    </span>
                    <span className="text-[11px] text-[#737373] font-mono">
                      {isResolved
                        ? 'Investigation verified and corrective action completed'
                        : isEscalated
                        ? 'Flagged for priority senior oversight'
                        : 'Awaiting departmental review conclusion'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Ticket Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[10px] bg-[#F6F9FC] border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Assigned department</span>
                <span className="font-semibold text-[#061B31]">
                  {ticketData.department || ticketData.department?.name || ticketData.department_name || 'General Support'}
                </span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#F6F9FC] border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Severity priority</span>
                <StatusBadge type="priority" value={ticketData.priority || 'medium'} />
              </div>
              <div className="p-3 rounded-[10px] bg-[#F6F9FC] border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Category classification</span>
                <span className="font-semibold text-[#061B31]">{ticketData.category || 'Support'}</span>
              </div>
              <div className="p-3 rounded-[10px] bg-[#F6F9FC] border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Timestamp logged</span>
                <span className="font-semibold text-[#061B31] font-mono tabular-nums">
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
              <div className="space-y-1.5 pt-2 border-t border-[#E3ECF7]">
                <span className="text-xs font-semibold text-[#061B31] block">
                  Original grievance transcript
                </span>
                <p className="p-3.5 rounded-[10px] bg-[#FAFDFF] border border-[#E3ECF7] text-xs text-[#425466] leading-relaxed">
                  "{ticketData.transcript}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State Before Searching */}
        {!ticketData && !isLoading && !errorMessage && (
          <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 sm:p-8 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-5 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E3ECF7]">
              <HelpCircle className="w-4 h-4 text-[#533AFD]" />
              <h2 className="text-sm font-semibold text-[#061B31]">How ticket tracking works</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-[12px] bg-[#FAFDFF] border border-[#E3ECF7] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-[#D4DEE9] text-[#061B31] font-mono flex items-center justify-center text-[10px] font-semibold">01</span>
                <h3 className="font-semibold text-[#061B31]">Locate reference ID</h3>
                <p className="text-[#737373] text-[11px] leading-relaxed">
                  Find your reference (e.g. VD-10473) from your voice intake receipt or audio confirmation.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#FAFDFF] border border-[#E3ECF7] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-[#D4DEE9] text-[#061B31] font-mono flex items-center justify-center text-[10px] font-semibold">02</span>
                <h3 className="font-semibold text-[#061B31]">Real-time query</h3>
                <p className="text-[#737373] text-[11px] leading-relaxed">
                  Enter the ID above. Our query checks real-time database timestamps with zero auth friction.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#FAFDFF] border border-[#E3ECF7] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-[#D4DEE9] text-[#061B31] font-mono flex items-center justify-center text-[10px] font-semibold">03</span>
                <h3 className="font-semibold text-[#061B31]">Audit progression</h3>
                <p className="text-[#737373] text-[11px] leading-relaxed">
                  Inspect assigned operational squads, milestone timestamps, and supervisor escalations.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#425466] border-t border-[#E3ECF7]">
              <span>Have another issue to lodge?</span>
              <Link
                to="/report"
                className="font-semibold text-[#533AFD] hover:text-[#635BFF] inline-flex items-center gap-1 transition-colors"
              >
                <span>Lodge new grievance</span>
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
