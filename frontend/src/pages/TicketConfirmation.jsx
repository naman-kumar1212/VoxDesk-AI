import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Volume2,
  Search,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { speakConfirmation, stopSpeaking } from '../utils/tts';
import StatusBadge from '../components/StatusBadge';

export default function TicketConfirmation({ ticketResult: propResult }) {
  const location = useLocation();

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
    <div className="bg-[#F8FAFD] min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Step Progression */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-medium text-[#425466] hover:text-[#061B31] transition-colors"
          >
            ← Return to overview
          </Link>
          <span className="text-xs font-mono font-medium text-[#00D66F] bg-[#E6F9F0] border border-[#00D66F]/20 px-2.5 py-1 rounded-full">
            Step 3 of 3 · Dispatched
          </span>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 sm:p-10 shadow-[0_8px_20px_rgba(13,23,56,0.08)] text-center space-y-6">
          {/* Success Checkmark Circle */}
          <div className="w-14 h-14 rounded-full bg-[#E6F9F0] text-[#00D66F] flex items-center justify-center mx-auto border border-[#00D66F]/30 shadow-[0_4px_12px_rgba(0,214,111,0.15)]">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#061B31] tracking-[-0.03em]">
              Grievance registered
            </h1>
            <p className="text-xs sm:text-sm text-[#425466] leading-relaxed max-w-sm mx-auto">
              Your grievance has been captured, classified, and assigned an authoritative SLA timeline.
            </p>
          </div>

          {/* Ticket Reference Stamp Block */}
          <div className="p-4 sm:p-5 rounded-[14px] bg-[#FAFDFF] border border-[#E3ECF7] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[11px] font-mono text-[#737373] uppercase tracking-wider block">
                Reference ID
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#061B31] tabular-nums tracking-tight">
                {ticket?.ticket_number || 'VD-DEMO'}
              </span>
            </div>

            <button
              type="button"
              onClick={copyTicketId}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#061B31] hover:bg-[#F6F9FC] transition-colors shadow-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00D66F]" />
                  <span className="text-[#00D66F]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#425466]" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Audio Readout Bar */}
          <div className="p-3.5 rounded-[12px] bg-[#F6F9FC] border border-[#E3ECF7] flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-[#533AFD]/10 text-[#533AFD] border border-[#533AFD]/20">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#061B31] block">
                  Acoustic confirmation
                </span>
                <span className="text-[11px] text-[#737373] font-mono line-clamp-1 max-w-xs">
                  {spokenReply || 'Verbal confirmation synthesized and ready'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleVoice}
              className="px-3 py-1.5 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#425466] hover:text-[#061B31] hover:bg-white transition-colors cursor-pointer"
            >
              {isSpeaking ? 'Mute' : 'Replay'}
            </button>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-left text-xs pt-1">
            <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
              <span className="text-[#737373] block mb-1 font-medium">Assigned department</span>
              <span className="font-semibold text-[#061B31]">
                {ticket?.department?.name || ticket?.department_name || 'General Support'}
              </span>
            </div>

            <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
              <span className="text-[#737373] block mb-1 font-medium">Initial lifecycle</span>
              <StatusBadge type="status" value={ticket?.status || 'open'} />
            </div>

            <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
              <span className="text-[#737373] block mb-1 font-medium">Priority score</span>
              <StatusBadge type="priority" value={ticket?.priority || 'medium'} />
            </div>

            <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
              <span className="text-[#737373] block mb-1 font-medium">Domain taxonomy</span>
              <span className="font-semibold text-[#061B31]">
                {ticket?.category || 'Service Inquiry'}
              </span>
            </div>
          </div>

          {/* Tracking Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/track?ticket=${ticket?.ticket_number || ''}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#533AFD] hover:bg-[#635BFF] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] hover:shadow-[0_8px_20px_rgba(83,58,253,0.32)] transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track ticket online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#425466] hover:text-[#061B31] hover:bg-[#F6F9FC] transition-colors cursor-pointer"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
