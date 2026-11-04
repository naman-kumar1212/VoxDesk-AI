import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw,
  Search,
  Ticket as TicketIcon,
  Copy,
  Check,
  Building2,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { speakConfirmation, stopSpeaking } from '../utils/tts';
import StatusBadge from '../components/StatusBadge';

export default function TicketConfirmation({ ticketResult: propResult }) {
  const location = useLocation();
  const navigate = useNavigate();

  const ticketData = location.state?.ticketResult || propResult;
  const ticket = ticketData?.ticket;
  const spokenReply =
    ticketData?.spoken_reply ||
    (ticket
      ? `Your grievance has been registered. Your ticket reference ID is ${ticket.ticket_number}.`
      : '');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Play voice confirmation once on mount if available
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

  const toggleVoice = () => {
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

  const copyTicketId = () => {
    if (!ticket?.ticket_number) return;
    navigator.clipboard.writeText(ticket.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-app min-h-[calc(100vh-64px)] py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Step Progression */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-semibold text-secondary-text hover:text-primary-text transition"
          >
            ← Return to Home
          </Link>
          <span className="text-xs font-medium text-emerald-700 font-semibold">Step 3 of 3: Registered</span>
        </div>

        {/* Confirmation Card */}
        <div className="bg-surface border border-border rounded-card p-6 sm:p-8 shadow-xs text-center space-y-6">
          {/* Success Checkmark Circle */}
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-primary-text tracking-tight">
              Grievance Registered Successfully
            </h1>
            <p className="text-xs text-secondary-text">
              Your issue has been routed to the appropriate department for active investigation.
            </p>
          </div>

          {/* Ticket Reference Block */}
          <div className="p-4 rounded-xl bg-surface-subtle border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[11px] font-semibold text-muted-text uppercase tracking-wider block">
                Official Reference ID
              </span>
              <span className="font-mono text-xl font-bold text-primary-text">
                {ticket?.ticket_number || 'VD-DEMO'}
              </span>
            </div>

            <button
              type="button"
              onClick={copyTicketId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-semibold text-primary-text hover:bg-surface-muted transition shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Audio Readout Bar */}
          <div className="p-3.5 rounded-xl bg-surface-muted/70 border border-border flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-voice-subtle text-voice">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-primary-text block">
                  Spoken Confirmation
                </span>
                <span className="text-[11px] text-muted-text line-clamp-1 max-w-xs">
                  {spokenReply || 'Verbal confirmation playback ready'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleVoice}
              className="px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-semibold text-secondary-text hover:bg-surface-subtle transition cursor-pointer"
            >
              {isSpeaking ? 'Pause Voice' : 'Replay Voice'}
            </button>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-left text-xs pt-1">
            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-muted-text block mb-1">Target Department</span>
              <span className="font-semibold text-primary-text">
                {ticket?.department?.name || ticket?.department_name || 'General Support'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-muted-text block mb-1">Initial Status</span>
              <StatusBadge type="status" value={ticket?.status || 'open'} />
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-muted-text block mb-1">Assigned Priority</span>
              <StatusBadge type="priority" value={ticket?.priority || 'medium'} />
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-muted-text block mb-1">Category Classification</span>
              <span className="font-semibold text-primary-text">
                {ticket?.category || 'Service Inquiry'}
              </span>
            </div>
          </div>

          {/* Tracking Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/track?ticket=${ticket?.ticket_number || ''}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Ticket Online</span>
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-btn bg-surface border border-border text-xs font-semibold text-secondary-text hover:bg-surface-muted transition"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
