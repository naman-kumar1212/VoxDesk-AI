import React, { useState } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import TranscriptReview from '../components/TranscriptReview';
import TextFallback from '../components/TextFallback';
import TicketConfirmation from '../components/TicketConfirmation';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

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

export default function CustomerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('voice'); // voice | review | text | confirmation
  const [transcript, setTranscript] = useState('');
  const [ticketResult, setTicketResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleTranscriptionSuccess = (transcribedText) => {
    setTranscript(transcribedText);
    setStep('review');
  };

  const handleConfirmTranscript = async (confirmedText) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Generate an idempotency key for this submission attempt
    const idempotencyKey = generateUUID();

    try {
      const data = await api.createTicketFromTranscript({
        transcript: confirmedText,
        idempotencyKey,
      });

      setTicketResult(data);
      setStep('confirmation');
    } catch (err) {
      console.error('Failed to create ticket from transcript:', err);
      setSubmitError(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTranscript('');
    setTicketResult(null);
    setSubmitError(null);
    setStep('voice');
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-wider">
          AI Voice Grievance Desk
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Speak Your Problem</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          State your complaint in natural speech. Our AI transcribes with Whisper, classifies with Gemini, and assigns your ticket instantly.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
          {submitError}
        </div>
      )}

      {step === 'voice' && (
        <VoiceRecorder
          onTranscriptionSuccess={handleTranscriptionSuccess}
          onSwitchToTextFallback={() => setStep('text')}
        />
      )}

      {step === 'review' && (
        <TranscriptReview
          transcript={transcript}
          onConfirm={handleConfirmTranscript}
          onReset={handleReset}
          isSubmitting={isSubmitting}
        />
      )}

      {step === 'text' && (
        <TextFallback
          onSubmit={handleConfirmTranscript}
          onBackToVoice={() => setStep('voice')}
          isSubmitting={isSubmitting}
        />
      )}

      {step === 'confirmation' && ticketResult && (
        <TicketConfirmation
          ticketData={ticketResult}
          onNewComplaint={handleReset}
          onGoToAdmin={() => navigate('/admin')}
        />
      )}
    </div>
  );
}

