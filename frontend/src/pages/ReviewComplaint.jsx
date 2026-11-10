import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Edit2,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Cpu,
  RotateCcw,
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

export default function ReviewComplaint({ onTicketCreated }) {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTranscript = location.state?.transcript || '';
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Quick heuristic preview for the detected details preview block before final submission
  const previewCategory = /payment|card|charge|deduct|refund|bill/i.test(transcript)
    ? 'Payment'
    : /delivery|package|courier|ship/i.test(transcript)
    ? 'Delivery'
    : /order|purchase/i.test(transcript)
    ? 'Order'
    : /account|login|password/i.test(transcript)
    ? 'Account'
    : /technical|bug|crash|error|slow|internet|wifi|router/i.test(transcript)
    ? 'Technical'
    : 'Service';

  const previewDepartment =
    previewCategory === 'Payment'
      ? 'Billing'
      : previewCategory === 'Delivery'
      ? 'Logistics'
      : previewCategory === 'Account'
      ? 'Account Support'
      : previewCategory === 'Technical'
      ? 'Technical Support'
      : 'General Support';

  const previewPriority = /urgent|emergency|immediately|stolen|fraud|unauthorized/i.test(transcript)
    ? 'High'
    : /slow|delay|wait/i.test(transcript)
    ? 'Medium'
    : 'Low';

  const handleSubmit = async () => {
    const clean = transcript.trim();
    if (!clean) {
      setErrorMessage('Transcript content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = generateUUID();
      const result = await api.createTicketFromTranscript({ transcript: clean, idempotencyKey });

      if (onTicketCreated) {
        onTicketCreated(result);
      }

      navigate('/confirmation', { state: { ticketResult: result } });
    } catch (err) {
      console.error('Ticket submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit grievance. Please verify your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFD] min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Step Progression */}
        <div className="flex items-center justify-between">
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#425466] hover:text-[#061B31] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Record again</span>
          </Link>
          <span className="text-xs font-mono font-medium text-[#737373] bg-white border border-[#E3ECF7] px-2.5 py-1 rounded-full">
            Step 2 of 3 · Verification
          </span>
        </div>

        {/* Main Review Card */}
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 sm:p-10 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-6">
          <div className="text-center space-y-2 pb-3 border-b border-[#E3ECF7]">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#061B31] tracking-[-0.03em]">
              Review grievance transcript
            </h1>
            <p className="text-xs sm:text-sm text-[#425466] max-w-md mx-auto leading-relaxed">
              Verify your transcribed voice log below. Ensure issue specifics, order codes, and amounts are accurate before ticket dispatch.
            </p>
          </div>

          {/* Transcript Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="transcript-editor"
                className="text-xs font-semibold text-[#061B31] flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#533AFD]" />
                <span>Transcript content</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-medium text-[#533AFD] hover:text-[#635BFF] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditing ? 'Save edits' : 'Edit transcript'}</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                id="transcript-editor"
                rows={5}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full p-3.5 text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded-[4px] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none transition-all"
              />
            ) : (
              <div className="p-4 rounded-[12px] bg-[#FAFDFF] border border-[#E3ECF7] text-sm text-[#061B31] leading-relaxed whitespace-pre-wrap font-sans">
                {transcript || (
                  <span className="text-[#737373] italic">
                    No transcript captured. Click edit or return to speak again.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Detected Routing Preview */}
          <div className="p-4 sm:p-5 rounded-[14px] bg-[#F6F9FC] border border-[#E3ECF7] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#061B31] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#533AFD]" />
                <span>Gemini routing telemetry</span>
              </span>
              <span className="text-[11px] font-mono text-[#0073E6] bg-white px-2.5 py-0.5 rounded-full border border-[#D4DEE9]">
                Zero-shot classification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Domain / Category</span>
                <span className="font-semibold text-[#061B31]">{previewCategory}</span>
              </div>
              <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Assigned Department</span>
                <span className="font-semibold text-[#533AFD]">{previewDepartment}</span>
              </div>
              <div className="p-3 rounded-[10px] bg-white border border-[#E3ECF7]">
                <span className="text-[#737373] block mb-1 font-medium">Priority Score</span>
                <StatusBadge type="priority" value={previewPriority} />
              </div>
            </div>
            <p className="text-[11px] text-[#737373] pt-0.5 font-mono">
              Categorization and SLA rules are recorded permanently in Supabase upon submission.
            </p>
          </div>

          {/* Error Message if submission fails */}
          {errorMessage && (
            <div className="p-3.5 rounded-[10px] bg-[#FFF1F2] border border-[#FECDD3] flex items-start gap-2.5 text-xs text-[#DF1B41]">
              <AlertCircle className="w-4 h-4 text-[#DF1B41] shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Submission Action Bar */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#425466] hover:text-[#061B31] hover:bg-[#F6F9FC] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Record again</span>
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !transcript.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#533AFD] hover:bg-[#635BFF] disabled:bg-[#ECF0F4] disabled:text-[#A1AAB8] disabled:cursor-not-allowed text-white text-xs font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] hover:shadow-[0_8px_20px_rgba(83,58,253,0.32)] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting grievance...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit grievance</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
