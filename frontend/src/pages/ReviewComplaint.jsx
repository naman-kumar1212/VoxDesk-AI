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
    <div className="bg-app min-h-[calc(100vh-64px)] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Step Progression */}
        <div className="flex items-center justify-between">
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-text hover:text-primary-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Record again</span>
          </Link>
          <span className="text-xs font-mono text-muted-text">Step 2 of 3</span>
        </div>

        {/* Main Review Card */}
        <div className="bg-surface border border-border rounded-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1 pb-2 border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-medium text-primary-text tracking-tight">
              Review your grievance
            </h1>
            <p className="text-xs text-secondary-text leading-relaxed">
              Verify the transcribed text below to ensure issue details and reference figures are accurate.
            </p>
          </div>

          {/* Transcript Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="transcript-editor"
                className="text-xs font-medium text-primary-text flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-secondary-text" />
                <span>Transcript text</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-medium text-brand hover:text-brand-hover inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditing ? 'Finish editing' : 'Edit text'}</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                id="transcript-editor"
                rows={5}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full p-3 text-sm text-primary-text bg-surface border border-border rounded-input focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
              />
            ) : (
              <div className="p-4 rounded-xl bg-surface-subtle border border-border text-sm text-primary-text leading-relaxed whitespace-pre-wrap">
                {transcript || (
                  <span className="text-muted-text italic">
                    No transcript captured. Click edit or return to speak again.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Detected Routing Preview */}
          <div className="p-4 rounded-xl bg-surface-muted/60 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary-text flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-secondary-text" />
                <span>Intelligent routing detection</span>
              </span>
              <span className="text-[11px] font-mono text-secondary-text bg-surface px-2 py-0.5 rounded-tag border border-border">
                Proposed dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Detected Category</span>
                <span className="font-medium text-primary-text">{previewCategory}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Assigned Department</span>
                <span className="font-medium text-brand">{previewDepartment}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border">
                <span className="text-muted-text block mb-1">Assigned Priority</span>
                <StatusBadge type="priority" value={previewPriority} />
              </div>
            </div>
            <p className="text-[11px] text-muted-text pt-0.5 font-mono">
              Categorization and department routing are confirmed upon ticket registration.
            </p>
          </div>

          {/* Error Message if submission fails */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Submission Action Bar */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-btn bg-surface border border-border text-xs font-medium text-secondary-text hover:bg-surface-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Record again</span>
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !transcript.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
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
