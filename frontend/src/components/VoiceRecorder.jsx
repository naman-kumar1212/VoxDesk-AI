import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const MAX_RECORDING_SECONDS = 45;

export default function VoiceRecorder({ onTranscriptionSuccess, onSwitchToTextFallback }) {
  const [state, setState] = useState('idle'); // idle | requesting | recording | uploading | transcribing | error
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up media streams and timers on unmount
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
    setState('requesting');
    chunksRef.current = [];
    setElapsedSeconds(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState('error');
      setErrorMessage('Browser does not support audio recording. Please use text fallback.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick supported mime type
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

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!blob || blob.size === 0) {
          setState('error');
          setErrorMessage('No audio captured. Please try speaking again.');
          return;
        }

        await uploadAndTranscribe(blob);
      };

      recorder.start(250); // gather 250ms chunks
      setState('recording');

      // Start duration countdown/timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(secs);

        if (secs >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 500);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      stopTracks();
      setState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. You can enable it or use text entry.');
      } else {
        setErrorMessage('Failed to start recording: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('uploading');
    }
  };

  const uploadAndTranscribe = async (audioBlob) => {
    setState('transcribing');
    setErrorMessage(null);

    try {
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const result = await api.transcribeAudio(audioBlob, `complaint.${ext}`);

      if (result && result.transcript) {
        setState('idle');
        onTranscriptionSuccess(result.transcript, result.language);
      } else {
        throw new Error('No transcript returned.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setState('error');
      if (err.code === 'QUOTA_EXHAUSTED' || err.status === 429) {
        setErrorMessage('Free transcription quota temporarily unavailable. Please enter your complaint as text.');
      } else {
        setErrorMessage(err.message || 'Failed to transcribe audio. You may retry or type your complaint.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Voice Grievance Intake</h3>
        <p className="text-sm text-slate-500 mt-1">
          Click the microphone to speak your issue. Groq Whisper will transcribe it instantly.
        </p>
      </div>

      {/* Recording Visual & Button */}
      <div className="relative flex items-center justify-center my-4">
        {state === 'recording' && (
          <span className="absolute animate-ping inline-flex h-24 w-24 rounded-full bg-red-400 opacity-60"></span>
        )}

        {state === 'recording' ? (
          <button
            onClick={stopRecording}
            className="relative z-10 w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center shadow-lg transition-transform transform active:scale-95"
            aria-label="Stop recording"
          >
            <Square className="w-8 h-8 fill-current" />
            <span className="text-xs font-bold mt-1">Stop</span>
          </button>
        ) : state === 'requesting' || state === 'uploading' || state === 'transcribing' ? (
          <div className="w-20 h-20 rounded-full bg-brand-500 text-white flex flex-col items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95"
            aria-label="Start recording"
          >
            <Mic className="w-8 h-8" />
            <span className="text-xs font-medium mt-1">Record</span>
          </button>
        )}
      </div>

      {/* Duration and Status Messages */}
      {state === 'recording' && (
        <div className="mt-3 flex flex-col items-center">
          <span className="text-red-600 font-mono text-lg font-bold">
            00:{elapsedSeconds.toString().padStart(2, '0')} / 00:45
          </span>
          <span className="text-xs text-slate-500 mt-1">Listening... Click Stop when finished.</span>
        </div>
      )}

      {state === 'transcribing' && (
        <div className="mt-3 text-sm text-brand-700 font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Transcribing voice using Groq Whisper Large V3 Turbo...
        </div>
      )}

      {state === 'uploading' && (
        <div className="mt-3 text-sm text-slate-600">Uploading audio to secure ingestion service...</div>
      )}

      {/* Error State */}
      {state === 'error' && errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm max-w-md text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to process audio</p>
            <p className="mt-1 text-xs text-red-700">{errorMessage}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
              {onSwitchToTextFallback && (
                <button
                  onClick={onSwitchToTextFallback}
                  className="px-3 py-1.5 bg-white border border-red-300 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50 transition"
                >
                  Type Complaint Instead
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual switch to text fallback */}
      {state === 'idle' && onSwitchToTextFallback && (
        <button
          onClick={onSwitchToTextFallback}
          className="mt-6 text-xs text-slate-500 hover:text-brand-600 underline transition"
        >
          Having mic issues? Type your complaint instead →
        </button>
      )}
    </div>
  );
}

