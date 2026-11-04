import React, { useState } from 'react';
import { Send, Edit3, RotateCcw, Loader2, Sparkles } from 'lucide-react';

export default function TranscriptReview({ transcript, onConfirm, onReset, isSubmitting }) {
  const [editedTranscript, setEditedTranscript] = useState(transcript);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = editedTranscript.trim();
    if (!clean) return;
    onConfirm(clean);
  };

  const wordCount = editedTranscript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-slate-800">Review & Correct Transcription</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">{wordCount} words</span>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Whisper transcribed your voice. You may edit any names, amounts, or details below before submitting to Gemini for classification.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            disabled={isSubmitting}
            rows={5}
            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-800 text-sm leading-relaxed outline-none transition disabled:bg-slate-50"
            placeholder="Review and edit your grievance details here..."
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> Re-record Audio
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !editedTranscript.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Classifying with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Confirm & Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

