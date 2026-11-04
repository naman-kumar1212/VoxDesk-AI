import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Tag, CheckCircle2, Clock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function TrackTicket() {
  const [searchParams] = useSearchParams();
  const initialTicketNumber = searchParams.get('ticket') || '';

  const [ticketNumber, setTicketNumber] = useState(initialTicketNumber);
  const [ticketData, setTicketData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchTicket = async (numberToFetch) => {
    const num = (numberToFetch || ticketNumber).trim().toUpperCase();
    if (!num) return;

    setIsLoading(true);
    setErrorMessage(null);

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
      setErrorMessage(err.message || `No ticket found matching '${num}'.`);
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
  const isCreated = true;
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
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      {/* Headings matching reference Screen 5 */}
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Track Your Ticket
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
        Enter your ticket ID to check the latest status and updates.
      </p>

      {/* Search Input Box matching reference */}
      <form onSubmit={handleSubmit} className="mt-8 flex items-center gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. VD-10427 or VD-XXXXXXXX"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !ticketNumber.trim()}
          className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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
      </form>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium max-w-md mx-auto flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Ticket Result & Timeline Card matching reference Screen 5 */}
      {ticketData && (
        <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-left">
          {/* Card Header: Ticket: VD-XXXXXX and Status Pill */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">Ticket:</span>
              <span className="font-mono text-sm font-extrabold text-slate-900">{ticketData.ticket_number}</span>
            </div>
            <div>
              <StatusBadge value={ticketData.status} />
            </div>
          </div>

          {/* Stepper / Timeline matching reference */}
          <div className="pt-6 relative pl-8 space-y-7 before:absolute before:left-3 before:top-8 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Ticket Created */}
            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Ticket Created</h4>
                  {createdTime && <span className="text-[10px] text-slate-400 font-medium">{createdTime}</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Your complaint has been received.</p>
              </div>
            </div>

            {/* Step 2: Assigned to Department */}
            <div className="relative">
              <div className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                isAssigned ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Assigned to {ticketData.department || 'Support'}
                  </h4>
                  {createdTime && <span className="text-[10px] text-slate-400 font-medium">{createdTime}</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Our team is working on your issue.</p>
              </div>
            </div>

            {/* Step 3: In Progress */}
            <div className="relative">
              <div className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                isInProgress ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {isResolved ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {currentStatus === 'escalated' ? 'Escalated Review' : 'In Progress'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentStatus === 'escalated'
                    ? 'Flagged for priority investigation.'
                    : 'We are investigating and will update you shortly.'}
                </p>
              </div>
            </div>

            {/* Step 4: Resolved */}
            <div className="relative">
              <div className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                isResolved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {isResolved ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Resolved</h4>
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
