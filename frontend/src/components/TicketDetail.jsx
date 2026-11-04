import React, { useState } from 'react';
import { X, AlertTriangle, Clock, Activity, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'escalated'],
  in_progress: ['escalated', 'resolved'],
  escalated: ['in_progress', 'resolved'],
  resolved: [],
};

export default function TicketDetail({ ticketData, adminKey, onClose, onStatusUpdated }) {
  const { ticket, events = [] } = ticketData;
  const [targetStatus, setTargetStatus] = useState('');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const availableTransitions = ALLOWED_TRANSITIONS[ticket.status] || [];

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const result = await api.updateTicketStatus(adminKey, ticket.id, {
        status: targetStatus,
        reason: reason.trim() || undefined,
      });
      setTargetStatus('');
      setReason('');
      onStatusUpdated(result.ticket);
    } catch (err) {
      console.error('Status transition failed:', err);
      setUpdateError(err.message || 'Status transition failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-brand-600">{ticket.ticket_number}</span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Escalation alert if active */}
          {ticket.escalated && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Ticket Under Escalated Review</span>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                Reason: {ticket.escalation_reason || 'Flagged by deterministic rules during intake.'}
              </p>
            </div>
          )}

          {/* Core Info Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Category</span>
              <span className="text-slate-800 font-bold uppercase mt-0.5 block">{ticket.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="text-slate-800 font-bold mt-0.5 block">{ticket.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Priority</span>
              <span className="text-slate-800 font-bold uppercase mt-0.5 block">{ticket.priority}</span>
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">AI Summary</h4>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              {ticket.summary}
            </div>
          </div>

          {/* Customer Voice Transcript */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Original Customer Transcript
            </h4>
            <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans italic">
              "{ticket.transcript}"
            </div>
          </div>

          {/* Status Update Form */}
          {availableTransitions.length > 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                Transition Status
              </h4>
              <form onSubmit={handleUpdateStatus} className="space-y-3">
                <div className="flex gap-2">
                  {availableTransitions.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition ${
                        targetStatus === st
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      → {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {targetStatus && (
                  <div>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Optional reason for status change..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                  </div>
                )}

                {updateError && (
                  <p className="text-xs text-red-600">{updateError}</p>
                )}

                {targetStatus && (
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Confirm Transition to {targetStatus.replace('_', ' ')}
                  </button>
                )}
              </form>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 text-center font-medium">
              This ticket is resolved (terminal state). No further transitions permitted.
            </div>
          )}

          {/* Event Activity History */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand-600" /> Event Activity Log
            </h4>
            <div className="space-y-3 border-l-2 border-slate-200 pl-4 ml-2">
              {events.map((ev) => (
                <div key={ev.id} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 uppercase">{ev.event_type}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600 font-mono">
                      {JSON.stringify(ev.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

