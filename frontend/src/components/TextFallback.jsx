import React, { useState } from 'react';
import { FileText, Send, Loader2, ArrowLeft } from 'lucide-react';

export default function TextFallback({ onSubmit, onBackToVoice, isSubmitting }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onSubmit(clean);
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-slate-800">Direct Text Complaint Intake</h3>
        </div>
        <button
          type="button"
          onClick={onBackToVoice}
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Voice Mode
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Type your complaint below. Our Gemini-powered AI backend will analyze your complaint, determine the department and priority, and issue a tracking ticket.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
          rows={6}
          className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-800 text-sm leading-relaxed outline-none transition disabled:bg-slate-50"
          placeholder="e.g. I ordered a laptop three days ago. The payment was deducted, but I did not receive an order confirmation. I have already contacted support twice..."
        />

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {text.trim().length} characters
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Ticket...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Grievance</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

