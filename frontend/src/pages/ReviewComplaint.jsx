import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Edit2,
  Sparkles,
  ArrowLeft,
  Check,
  Loader2,
  Tag,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
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

const SAMPLE_COMPLAINTS = [
  'The internet on my home broadband is very slow since yesterday. I have restarted the router but still not working.',
  'I was charged twice on my credit card for the monthly subscription and request an immediate refund.',
  'My delivery package #4912 has been delayed for 4 days and tracking has stopped updating.',
];

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

  const previewDepartment =
    previewCategory === 'Payment'
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
      setErrorMessage('Please enter or record a complaint description before submitting.');
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
      setErrorMessage(err.message || 'Failed to submit complaint to the server. Please check your network and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-center">
      {/* Contextual Back Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate('/report')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Record Again</span>
        </button>

        <span className="text-[11px] font-medium text-slate-400">Step 2 of 3</span>
      </div>

      {/* Title & Subtitle matching Screen 3 */}
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Review Your Complaint
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Here is what we heard. You can edit it if needed and submit.
      </p>

      <div className="mt-8 space-y-6 text-left">
        {/* Card 1: Transcribed Complaint matching reference Screen 3 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <label
              htmlFor="complaint-transcript"
              className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-primary-600" />
              <span>Transcribed Complaint</span>
            </label>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900 font-bold transition focus:outline-none focus:underline"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done' : 'Edit'}</span>
            </button>
          </div>

          <div className="pt-4">
            {isEditing || !transcript ? (
              <div className="space-y-2">
                <textarea
                  id="complaint-transcript"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full text-xs text-slate-800 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none leading-relaxed transition resize-y"
                  placeholder="Describe your issue in detail here..."
                  autoFocus={isEditing}
                />
                {!transcript && (
                  <div className="pt-2">
                    <p className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      <span>Or try a quick demo sample complaint:</span>
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {SAMPLE_COMPLAINTS.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTranscript(sample);
                            setIsEditing(false);
                          }}
                          className="text-left text-[11px] p-2 rounded-lg bg-primary-50/50 hover:bg-primary-50 text-primary-800 border border-primary-100 transition truncate"
                        >
                          "{sample}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p
                onClick={() => setIsEditing(true)}
                className="text-xs text-slate-700 leading-relaxed min-h-[50px] p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                title="Click to edit transcript"
              >
                {transcript}
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Detected Details (by AI) matching reference Screen 3 */}
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

        {/* Error message alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bottom Actions matching Screen 3 */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/report')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Record Again</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !transcript.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
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
