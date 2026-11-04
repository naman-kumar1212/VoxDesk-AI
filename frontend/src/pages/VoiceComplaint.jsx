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
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    chunksRef.current = [];
    setElapsedSeconds(0);
    isCancelledRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceState('error');
      setErrorMessage(
        'Your browser does not support direct audio capture. Please use the manual text option.'
      );
      return;
    }

    try {
      setVoiceState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopTracks();
        if (timerRef.current) clearInterval(timerRef.current);

        // If user cancelled, discard audio
        if (isCancelledRef.current) {
          chunksRef.current = [];
          setVoiceState('idle');
          setElapsedSeconds(0);
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        if (!blob || blob.size === 0) {
          setVoiceState('error');
          setErrorMessage(
            'No audio detected. Please ensure your microphone is unmuted and speak clearly.'
          );
          return;
        }

        await uploadAndTranscribe(blob);
      };

      recorder.start(250);
      setVoiceState('recording');

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(secs);

        if (secs >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 500);
    } catch (err) {
      console.error('Microphone access failed:', err);
      stopTracks();
      setVoiceState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser settings, or use the manual text option.'
        );
      } else {
        setErrorMessage(
          'Failed to access microphone: ' + (err.message || 'Unknown audio device error')
        );
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
      setVoiceState('uploading');
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      setVoiceState('idle');
      setElapsedSeconds(0);
    }
  };

  const uploadAndTranscribe = async (audioBlob) => {
    setVoiceState('transcribing');
    setErrorMessage(null);

    try {
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const result = await api.transcribeAudio(audioBlob, `complaint.${ext}`);

      if (result && result.transcript) {
        setVoiceState('idle');
        if (onTranscriptReady) {
          onTranscriptReady(result.transcript);
        }
        navigate('/review', { state: { transcript: result.transcript } });
      } else {
        throw new Error('Whisper returned empty transcript.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setVoiceState('error');
      if (err.code === 'QUOTA_EXHAUSTED' || err.status === 429) {
        setErrorMessage(
          'Free Whisper transcription rate limit reached. Please use the manual text option below.'
        );
      } else {
        setErrorMessage(
          err.message || 'Failed to transcribe audio. Please retry or enter your complaint as text.'
        );
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = manualText.trim();
    if (!clean) {
      setManualError('Please describe your issue before proceeding.');
      return;
    }
    if (onTranscriptReady) {
      onTranscriptReady(clean);
    }
    navigate('/review', { state: { transcript: clean } });
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const remainingSeconds = Math.max(0, MAX_RECORDING_SECONDS - elapsedSeconds);

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 text-center">
      {/* Top Contextual Bar: Single clean Home link and Mode switcher */}
      <div className="flex items-center justify-between mb-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Mode Toggle Switcher: Voice vs Text */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              if (voiceState === 'recording') cancelRecording();
              setActiveMode('voice');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeMode === 'voice'
                ? 'bg-white text-primary-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (voiceState === 'recording') cancelRecording();
              setActiveMode('text');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeMode === 'text'
                ? 'bg-white text-primary-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Type Text</span>
          </button>
        </div>
      </div>

      {/* Main Page Heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        {activeMode === 'voice' ? 'Tell Us Your Issue' : 'Describe Your Complaint'}
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
        {activeMode === 'voice'
          ? 'Press the mic and describe your problem naturally. Our AI will understand and create a support ticket for you.'
          : 'Type what happened below. Our AI will categorize your complaint and assign it to the right department.'}
      </p>

      {/* Mode 1: Voice Recording Card */}
      {activeMode === 'voice' && (
        <div className="mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center relative">
          {/* Status Badge Indicator */}
          <div className="mb-3">
            {voiceState === 'recording' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Recording in progress ({remainingSeconds}s left)</span>
              </span>
            )}
            {voiceState === 'requesting' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for microphone permission...</span>
              </span>
            )}
            {voiceState === 'uploading' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading audio...</span>
              </span>
            )}
            {voiceState === 'transcribing' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Whisper is processing your audio...</span>
              </span>
            )}
            {voiceState === 'idle' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-xs font-medium">
                <span>Maximum 45 seconds</span>
              </span>
            )}
          </div>

          {/* Central Microphone Visual & Action Button */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Concentric rings (pulsing only during active recording) */}
            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-primary-50/70 flex items-center justify-center border border-primary-100/60">
              <div
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
                  voiceState === 'recording'
                    ? 'bg-rose-50 ring-4 ring-rose-100'
                    : 'bg-primary-100/50'
                }`}
              />
            </div>

            {/* Central Action Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              {voiceState === 'recording' ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center shadow-xl shadow-rose-600/30 transition-transform transform active:scale-95 z-10 focus:outline-none focus:ring-4 focus:ring-rose-300"
                  aria-label="Stop recording and transcribe"
                  title="Stop recording"
                >
                  <Square className="w-7 h-7 fill-current" />
                </button>
              ) : voiceState === 'uploading' || voiceState === 'transcribing' || voiceState === 'requesting' ? (
                <div
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-primary-700 text-white flex flex-col items-center justify-center shadow-xl shadow-primary-700/30 z-10"
                  role="status"
                  aria-label="Processing audio with Whisper"
                >
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-primary-700 hover:bg-primary-800 text-white flex flex-col items-center justify-center shadow-xl shadow-primary-700/30 transition-all transform hover:scale-105 active:scale-95 z-10 focus:outline-none focus:ring-4 focus:ring-primary-300"
                  aria-label="Start recording audio complaint"
                  title="Click to start recording"
                >
                  <Mic className="w-9 h-9 stroke-[2.2]" />
                </button>
              )}
            </div>
          </div>

          {/* Action Instruction Text */}
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-800">
              {voiceState === 'recording'
                ? 'Recording... Speak clearly into your microphone'
                : voiceState === 'transcribing'
                ? 'Whisper is transcribing your audio...'
                : voiceState === 'uploading'
                ? 'Uploading voice file...'
                : voiceState === 'requesting'
                ? 'Please click "Allow" on the microphone prompt'
                : 'Click microphone to start recording'}
            </p>
          </div>

          {/* Waveform Visualization (Animated only during active recording) */}
          <AudioWaveform isRecording={voiceState === 'recording'} />

          {/* Timer Display */}
          <div
            className="font-mono text-xs sm:text-sm font-bold text-slate-700"
            aria-live="polite"
          >
            {formatTimer(elapsedSeconds)} / 00:45
          </div>

          {/* Dual Controls while Recording: Stop & Cancel */}
          {voiceState === 'recording' && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/20 transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Done & Submit</span>
              </button>

              <button
                type="button"
                onClick={cancelRecording}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* Error Banner with Retry and Switch to Text */}
          {voiceState === 'error' && errorMessage && (
            <div
              role="alert"
              className="mt-5 w-full max-w-md p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-900 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Recording Notice</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('text')}
                    className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 rounded-lg font-bold transition"
                  >
                    Type Complaint Instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audio Privacy & Processing Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 w-full max-w-md flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span>
              Audio is processed in-memory for transcription and discarded immediately. No raw audio is stored.
            </span>
          </div>
        </div>
      )}

      {/* Mode 2: Manual Text Complaint Card */}
      {activeMode === 'text' && (
        <form
          onSubmit={handleManualSubmit}
          className="mt-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm text-left max-w-xl mx-auto space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="manual-complaint-text"
                className="text-xs font-bold text-slate-800"
              >
                Complaint Description
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {manualText.length} characters
              </span>
            </div>

            <textarea
              id="manual-complaint-text"
              rows={5}
              value={manualText}
              onChange={(e) => {
                setManualText(e.target.value);
                if (manualError) setManualError(null);
              }}
              placeholder="Describe what happened, when it occurred, and what resolution you need..."
              className="w-full text-xs text-slate-800 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none leading-relaxed transition resize-y"
              autoFocus
            />
          </div>

          {manualError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          {/* Quick Demo Sample Complaints */}
          <div>
            <p className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>Or click a demo sample to fill:</span>
            </p>
            <div className="space-y-1.5">
              {SAMPLE_COMPLAINTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setManualText(sample);
                    if (manualError) setManualError(null);
                  }}
                  className="w-full text-left text-[11px] p-2 rounded-lg bg-primary-50/50 hover:bg-primary-50 text-primary-800 border border-primary-100 transition truncate block"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Actions: Switch to Voice & Submit */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveMode('voice')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
            >
              <Mic className="w-3.5 h-3.5 text-primary-600" />
              <span>Switch to Voice</span>
            </button>

            <button
              type="submit"
              disabled={!manualText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/20 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
