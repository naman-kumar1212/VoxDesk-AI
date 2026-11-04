import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Edit2, Sparkles, ArrowLeft, Check, Loader2, Tag, ShieldAlert, Building2 } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ReviewComplaint({ onTicketCreated }) {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTranscript = location.state?.transcript || '';
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Quick heuristic preview for the "Detected Details (by AI)" preview card before final submission
  const previewCategory = /payment|card|charge|deduct|refund|bill/i.test(transcript)
    ? 'Payment'
    : /delivery|package|courier|ship/i.test(transcript)
    ? 'Delivery'
    : /order|purchase/i.test(transcript)
    ? 'Orders'
    : /account|login|password/i.test(transcript)
    ? 'Account'
    : 'Technical Support';

  const previewDepartment = previewCategory === 'Payment'
    ? 'Billing Support'
    : previewCategory === 'Delivery'
    ? 'Logistics'
    : previewCategory === 'Orders'
    ? 'Order Management'
    : 'Technical Support';

  const previewPriority = /twice|unauthorized|fraud|urgent|stolen|multiple times/i.test(transcript)
    ? 'High'
    : 'Medium';

  const handleSubmit = async () => {
    const clean = transcript.trim();
    if (!clean) {
      setErrorMessage('Complaint text cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey = generateUUID();

    try {
      const result = await api.createTicketFromTranscript({
        transcript: clean,
        idempotencyKey,
      });

      if (onTicketCreated) {
        onTicketCreated(result);
      }
      navigate('/confirmation', { state: { ticketResult: result } });
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      setErrorMessage(err.message || 'Failed to submit complaint. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-center">
      {/* Title & Subtitle matching Screen 3 */}
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Review Your Complaint
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
        Here is what we heard. You can edit it if needed and submit.
      </p>

      <div className="mt-8 space-y-6 text-left">
        {/* Card 1: Transcribed Complaint matching reference */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileText className="w-4 h-4 text-primary-600" />
              <span>Transcribed Complaint</span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900 font-bold transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done' : 'Edit'}</span>
            </button>
          </div>

          <div className="pt-4">
            {isEditing ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="w-full text-xs text-slate-800 p-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                placeholder="Type your complaint details here..."
                autoFocus
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed min-h-[50px]">
                {transcript || (
                  <span className="italic text-slate-400">
                    No transcript entered yet. Click Edit to type your issue.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Detected Details (by AI) matching reference */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>Detected Details (by AI)</span>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Category
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Tag className="w-3.5 h-3.5 text-primary-500" />
                <span>{previewCategory}</span>
              </div>
            </div>

            {/* Priority */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Priority
              </span>
              <div>
                <StatusBadge type="priority" value={previewPriority} />
              </div>
            </div>

            {/* Department */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Department
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-primary-500" />
                <span>{previewDepartment}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Bottom Actions matching Screen 3 */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/report')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Record Again</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !transcript.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <>
                <span>Submit Complaint</span>
                <Check className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

