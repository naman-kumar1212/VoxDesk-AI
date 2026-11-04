import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Volume2, VolumeX, Info, RotateCcw, ArrowRight } from 'lucide-react';
import { speakConfirmation, stopSpeaking } from '../utils/tts';
import StatusBadge from '../components/StatusBadge';

export default function TicketConfirmation({ ticketResult: propResult }) {
  const location = useLocation();
  const navigate = useNavigate();

  const ticketData = location.state?.ticketResult || propResult;
  const ticket = ticketData?.ticket;
  const spokenReply = ticketData?.spoken_reply || (
    ticket ? `Your complaint has been registered. Your ticket reference is ${ticket.ticket_number}.` : ''
  );

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Play voice confirmation once on mount
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

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h3 className="text-lg font-bold text-slate-800">No active ticket</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Please submit a complaint first to view confirmation.
        </p>
        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-700 text-white text-xs font-bold rounded-xl"
        >
          Report an Issue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      {/* Green Checkmark Badge matching reference Screen 4 */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
        <CheckCircle2 className="w-10 h-10 stroke-[2.3]" />
      </div>

      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Your Ticket Has Been Created!
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
        We've received your complaint and assigned it to the right team.
      </p>

      {/* Ticket Details Card matching reference */}
      <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-left">
        <div className="space-y-4 text-xs">
          {/* Ticket ID */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
            <span className="text-slate-400 font-semibold">Ticket ID</span>
            <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md">
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

        {/* Listen to Confirmation Button matching reference */}
        <div className="mt-6">
          <button
            type="button"
            onClick={toggleVoice}
            className="w-full py-3 px-4 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition flex items-center justify-center gap-2"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Mute Confirmation' : 'Listen to Confirmation'}</span>
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

      <div className="mt-4">
        <Link
          to={`/track?ticket=${ticket.ticket_number}`}
          className="text-xs text-primary-700 hover:text-primary-900 font-bold inline-flex items-center gap-1"
        >
          Track this ticket in timeline view <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

