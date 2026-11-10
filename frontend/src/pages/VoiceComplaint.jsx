import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  Square,
  X,
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
  ArrowLeft,
  Keyboard,
  ShieldCheck,
  Check,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import AudioWaveform from '../components/AudioWaveform';
import { api } from '../services/api';

const MAX_RECORDING_SECONDS = 45;

const SAMPLE_COMPLAINTS = [
  'The internet on my home broadband is very slow since yesterday. I have restarted the router but still not working.',
  'I was charged twice on my credit card for the monthly subscription and request an immediate refund.',
  'My delivery package #4912 has been delayed for 4 days and tracking has stopped updating.',
];

export default function VoiceComplaint({ onTranscriptReady }) {
  const navigate = useNavigate();

  // Mode: 'voice' | 'text'
  const [activeMode, setActiveMode] = useState('voice');

  // Voice recording states: 'idle' | 'requesting' | 'recording' | 'uploading' | 'transcribing' | 'error'
  const [voiceState, setVoiceState] = useState('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Manual text state
  const [manualText, setManualText] = useState('');
  const [manualError, setManualError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    // Preload ReviewComplaint chunk in background while user speaks so /review navigation is instant
    import('./ReviewComplaint').catch(() => {});

    return () => {
      cleanupMedia();
    };
  }, []);

  const cleanupMedia = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setVoiceState('requesting');
      isCancelledRef.current = false;
      chunksRef.current = [];
      setElapsedSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (isCancelledRef.current) {
          cleanupMedia();
          setVoiceState('idle');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupMedia();

        if (blob.size === 0) {
          setErrorMessage('No audio data was captured. Please speak clearly and try again.');
          setVoiceState('error');
          return;
        }

        setVoiceState('transcribing');
        try {
          const result = await api.transcribeVoice(blob);
          if (result && result.transcript) {
            if (onTranscriptReady) onTranscriptReady(result.transcript);
            navigate('/review', { state: { transcript: result.transcript } });
          } else {
            setErrorMessage('Could not decipher speech. Please try recording again or enter text.');
            setVoiceState('error');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setErrorMessage(err.message || 'Speech-to-text service unavailable. Please use text mode.');
          setVoiceState('error');
        }
      };

      recorder.start(100);
      setVoiceState('recording');

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setErrorMessage(
        'Microphone permission was denied. Please allow microphone access or switch to text mode.'
      );
      setVoiceState('error');
      cleanupMedia();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    stopRecording();
    cleanupMedia();
    setVoiceState('idle');
    setElapsedSeconds(0);
    setErrorMessage(null);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = manualText.trim();
    if (!clean) {
      setManualError('Please describe your grievance before continuing.');
      return;
    }
    if (clean.length < 10) {
      setManualError('Please provide a few more details so our system can categorize it properly.');
      return;
    }
    setManualError(null);
    if (onTranscriptReady) onTranscriptReady(clean);
    navigate('/review', { state: { transcript: clean } });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, (elapsedSeconds / MAX_RECORDING_SECONDS) * 100);

  return (
    <div className="bg-app min-h-[calc(100vh-64px)] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back navigation & header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-text hover:text-primary-text transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs font-medium text-muted-text">Step 1 of 3</span>
        </div>

        {/* Card Container */}
        <div className="bg-surface border border-border rounded-card p-6 sm:p-8 shadow-xs">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              Report a Grievance
            </h1>
            <p className="text-sm text-secondary-text max-w-md mx-auto">
              Speak naturally to describe your issue. Our AI transcribes and categorizes your request in seconds.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-surface-muted rounded-btn max-w-xs mx-auto mb-8">
            <button
              type="button"
              onClick={() => {
                cancelRecording();
                setActiveMode('voice');
              }}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'voice'
                  ? 'bg-surface text-primary-text shadow-xs'
                  : 'text-muted-text hover:text-primary-text'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-voice" />
              <span>Voice Record</span>
            </button>
            <button
              type="button"
              onClick={() => {
                cancelRecording();
                setActiveMode('text');
              }}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'text'
                  ? 'bg-surface text-primary-text shadow-xs'
                  : 'text-muted-text hover:text-primary-text'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Manual Text</span>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Mode 1: Voice Recording Experience */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeMode === 'voice' && (
            <div className="space-y-6">
              {/* Interaction Canvas */}
              <div className="py-8 px-4 rounded-xl bg-surface-subtle border border-border flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
                {/* Idle State */}
                {voiceState === 'idle' && (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-voice hover:bg-voice-hover text-white flex items-center justify-center shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer focus-visible:ring-4 focus-visible:ring-voice-subtle"
                      aria-label="Click to start voice recording"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-primary-text block">
                        Tap microphone to speak
                      </span>
                      <span className="text-xs text-muted-text">
                        Up to 45 seconds of natural audio
                      </span>
                    </div>
                  </div>
                )}

                {/* Requesting microphone permissions */}
                {voiceState === 'requesting' && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-voice" />
                    <span className="text-xs font-semibold text-primary-text">
                      Requesting microphone access...
                    </span>
                  </div>
                )}

                {/* Live Recording State */}
                {voiceState === 'recording' && (
                  <div className="w-full flex flex-col items-center gap-5">
                    {/* Live Waveform Component */}
                    <div className="w-full max-w-sm h-16 flex items-center justify-center">
                      <AudioWaveform stream={streamRef.current} isRecording={true} />
                    </div>

                    {/* Timer and Progress */}
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="font-mono text-lg font-bold text-primary-text">
                        {formatTime(elapsedSeconds)}
                      </span>
                      <span className="text-xs text-muted-text">/ 0:45 max</span>
                    </div>

                    <div className="w-48 bg-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-voice h-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="px-4 py-2 rounded-btn bg-surface border border-border text-xs font-semibold text-secondary-text hover:bg-surface-muted transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-btn bg-voice hover:bg-voice-hover text-white text-xs font-semibold shadow-xs transition"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Done & Submit</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Transcribing State */}
                {voiceState === 'transcribing' && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-primary-text block">
                        Transcribing your speech...
                      </span>
                      <span className="text-xs text-muted-text">
                        Groq Whisper LPU processing in sub-seconds
                      </span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {voiceState === 'error' && (
                  <div className="flex flex-col items-center gap-3 text-center max-w-md p-4">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <span className="text-xs font-semibold text-rose-700">
                      Recording was not completed
                    </span>
                    <p className="text-xs text-muted-text">{errorMessage}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-1.5 rounded-btn bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMode('text')}
                        className="px-4 py-1.5 rounded-btn bg-surface border border-border text-xs font-semibold text-secondary-text hover:bg-surface-muted transition"
                      >
                        Use Text Instead
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Security and privacy reassurance */}
              <div className="p-3.5 rounded-lg bg-surface-subtle border border-border flex items-start gap-2.5 text-xs text-secondary-text">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Audio is streamed securely for real-time transcription and is never permanently archived without consent.
                </p>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Mode 2: Accessible Manual Text Input */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeMode === 'text' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="manual-transcript"
                  className="block text-xs font-semibold text-primary-text mb-1.5"
                >
                  Describe Your Grievance
                </label>
                <textarea
                  id="manual-transcript"
                  rows={5}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Please state what happened, including any order or account numbers..."
                  className="w-full p-3 text-sm text-primary-text bg-surface border border-border rounded-input focus:border-brand focus:ring-1 focus:ring-brand outline-none transition resize-none"
                />
                {manualError && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{manualError}</p>
                )}
              </div>

              {/* Sample Complaints for instant testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-text uppercase tracking-wider block">
                  Click to try a sample complaint:
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_COMPLAINTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setManualText(sample)}
                      className="w-full text-left p-2 rounded-lg bg-surface-subtle hover:bg-surface-muted border border-border text-xs text-secondary-text transition line-clamp-1 cursor-pointer"
                    >
                      "{sample}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition"
                >
                  <span>Review & Submit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
