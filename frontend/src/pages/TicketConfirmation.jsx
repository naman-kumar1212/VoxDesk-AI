import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Volume2,
  VolumeX,
  Info,
  RotateCcw,
  ArrowRight,
  Search,
  Mic,
  Ticket as TicketIcon,
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
      ? `Your complaint has been registered. Your ticket reference is ${ticket.ticket_number}.`
      : '');

  const [isSpeaking, setIsSpeaking] = useState(false);

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

  // Graceful Empty State if user landed directly on /confirmation
  if (!ticket) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-4 ring-8 ring-primary-50/50">
          <TicketIcon className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          No Active Confirmation
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          No newly created ticket was found in this session. You can record a new voice complaint or track an existing ticket number.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-700/20 transition"
          >
            <Mic className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>

          <Link
            to="/track"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Search className="w-4 h-4" />
            <span>Track Existing</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      {/* Green Checkmark Badge matching reference Screen 4 */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50 shadow-sm">
        <CheckCircle2 className="w-10 h-10 stroke-[2.3]" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Your Ticket Has Been Created!
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
        We've received your complaint and assigned it to the right team.
      </p>

      {/* Ticket Details Card matching reference Screen 4 */}
      <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-left">
        <div className="space-y-4 text-xs">
          {/* Ticket ID */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
            <span className="text-slate-400 font-semibold">Ticket ID</span>
            <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-100">
              {ticket.ticket_number}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
            <span className="text-slate-400 font-semibold">Category</span>
            <span className="font-bold text-slate-800 uppercase">
              {ticket.category}
            </span>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
            <span className="text-slate-400 font-semibold">Priority</span>
            <div>
              <StatusBadge type="priority" value={ticket.priority} />
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 font-semibold">Department</span>
            <span className="font-bold text-slate-800">
              {ticket.department}
            </span>
          </div>
        </div>

        {/* Listen to Confirmation Button matching reference Screen 4 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={toggleVoice}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
              isSpeaking
                ? 'bg-primary-800 text-white ring-2 ring-primary-400 shadow-primary-700/30'
                : 'bg-primary-700 hover:bg-primary-800 text-white shadow-primary-700/25'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 animate-pulse" />
                <span>Mute Confirmation Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Listen to Confirmation</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info pill */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span>You will receive updates on the status of this ticket.</span>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900 font-bold ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Track Another Issue</span>
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <Link
          to={`/track?ticket=${ticket.ticket_number}`}
          className="text-xs text-primary-700 hover:text-primary-900 font-bold inline-flex items-center gap-1 hover:underline"
        >
          <span>Track this ticket in timeline view</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
