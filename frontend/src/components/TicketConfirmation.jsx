import React, { useEffect, useState } from 'react';
import { CheckCircle2, Volume2, VolumeX, PlusCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { speakConfirmation, stopSpeaking } from '../utils/tts';

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  escalated: 'bg-rose-100 text-rose-800 border-rose-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function TicketConfirmation({ ticketData, onNewComplaint, onGoToAdmin }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ticket = ticketData?.ticket || {};
  const spokenReply = ticketData?.spoken_reply || `Your ticket reference is ${ticket.ticket_number}.`;

  // Automatically speak confirmation once mounted
  useEffect(() => {
    if (spokenReply) {
      setIsSpeaking(true);
      speakConfirmation(spokenReply, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }

    return () => {
      stopSpeaking();
    };
  }, [spokenReply]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakConfirmation(spokenReply, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header Banner */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Grievance Registered Successfully
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Ticket ID: <span className="font-mono text-brand-600">{ticket.ticket_number}</span>
          </h2>
        </div>
      </div>

      {/* Spoken Response Audio Bar */}
      <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSpeech}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              isSpeaking ? 'bg-brand-600 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
            aria-label={isSpeaking ? 'Stop speaking' : 'Play voice confirmation'}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Browser Voice Response</p>
            <p className="text-sm font-medium text-slate-800">{spokenReply}</p>
          </div>
        </div>
      </div>

      {/* Escalation Warning if applicable */}
      {ticket.escalated && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-900">
            <p className="font-semibold">Priority Escalation Triggered</p>
            <p className="text-xs text-rose-700 mt-0.5">
              This ticket has been automatically flagged for immediate human review due to repeated support contact or critical severity.
            </p>
          </div>
        </div>
      )}

      {/* Ticket Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-left mb-6">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Department</span>
          <span className="text-sm font-semibold text-slate-800 mt-0.5 block">{ticket.department}</span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Category</span>
          <span className="text-sm font-semibold text-slate-800 uppercase mt-0.5 block">{ticket.category}</span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Priority</span>
          <span
            className={`inline-block text-xs font-semibold uppercase px-2 py-0.5 rounded-full border mt-1 ${
              PRIORITY_STYLES[ticket.priority] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {ticket.priority}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Status</span>
          <span
            className={`inline-block text-xs font-semibold uppercase px-2 py-0.5 rounded-full border mt-1 ${
              STATUS_STYLES[ticket.status] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {ticket.status}
          </span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="text-left mb-8">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">AI Summary</h4>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm leading-relaxed">
          {ticket.summary}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onNewComplaint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow transition"
        >
          <PlusCircle className="w-4 h-4" /> Submit Another Complaint
        </button>

        <button
          onClick={onGoToAdmin}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 font-medium transition"
        >
          View in Admin Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

