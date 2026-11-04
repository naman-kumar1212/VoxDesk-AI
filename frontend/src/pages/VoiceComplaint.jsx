import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic, Square, Loader2, AlertCircle, Info, RefreshCw, ArrowLeft, Keyboard } from 'lucide-react';
import AudioWaveform from '../components/AudioWaveform';
import { api } from '../services/api';

const MAX_RECORDING_SECONDS = 45;

export default function VoiceComplaint({ onTranscriptReady }) {
  const navigate = useNavigate();
  const [state, setState] = useState('idle'); // idle | recording | uploading | transcribing | error
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState('error');
      setErrorMessage('Browser does not support direct audio capture. Please type your complaint instead.');
      return;
    }

    try {
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

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!blob || blob.size === 0) {
          setState('error');
          setErrorMessage('No voice captured. Please ensure your microphone is unmuted and speak clearly.');
          return;
        }

        await uploadAndTranscribe(blob);
      };

      recorder.start(250);
      setState('recording');

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
      setState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission was denied. Please allow microphone access in your browser or type your issue.');
      } else {
        setErrorMessage('Failed to access microphone: ' + (err.message || 'Unknown error'));
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
        if (onTranscriptReady) {
          onTranscriptReady(result.transcript);
        }
        navigate('/review', { state: { transcript: result.transcript } });
      } else {
        throw new Error('Whisper returned empty transcript.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setState('error');
      if (err.code === 'QUOTA_EXHAUSTED' || err.status === 429) {
        setErrorMessage('Free Whisper transcription rate limit reached. Please type your complaint directly below.');
      } else {
        setErrorMessage(err.message || 'Failed to transcribe audio. Please retry or type your complaint.');
      }
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-center">
      {/* Contextual top back link */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        <button
          type="button"
          onClick={() => navigate('/review', { state: { transcript: '' } })}
          className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-800 font-semibold"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Type instead</span>
        </button>
      </div>

      {/* Headings matching reference Screen 2 */}
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Tell Us Your Issue
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        Press the mic and describe your problem.<br />
        Our AI will understand and create a support ticket for you.
      </p>

      {/* Main Recording Center Card */}
      <div className="mt-8 bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col items-center justify-center relative">
        {/* Concentric rings matching Screen 2 */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-primary-50/70 flex items-center justify-center border border-primary-100/60">
            <div
              className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
                state === 'recording'
                  ? 'bg-primary-100 ring-8 ring-primary-100/60 animate-pulse'
                  : 'bg-primary-100/60'
              }`}
            />
          </div>

          {/* Central Action Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            {state === 'recording' ? (
              <button
                type="button"
                onClick={stopRecording}
                className="w-24 h-24 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center shadow-xl shadow-rose-600/30 transition-transform transform active:scale-95 z-10 focus:outline-none focus:ring-4 focus:ring-rose-300"
                aria-label="Stop recording audio"
              >
                <Square className="w-8 h-8 fill-current" />
              </button>
            ) : state === 'uploading' || state === 'transcribing' ? (
              <div
                className="w-24 h-24 rounded-full bg-primary-700 text-white flex flex-col items-center justify-center shadow-xl shadow-primary-700/30 z-10"
                role="status"
                aria-label="Processing audio with Whisper"
              >
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-24 h-24 rounded-full bg-primary-700 hover:bg-primary-800 text-white flex flex-col items-center justify-center shadow-xl shadow-primary-700/30 transition-all transform hover:scale-105 active:scale-95 z-10 focus:outline-none focus:ring-4 focus:ring-primary-300"
                aria-label="Start recording audio complaint"
              >
                <Mic className="w-10 h-10 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>

        {/* Action text indicator */}
        <div className="mt-4">
          <p className="text-xs font-bold text-primary-700">
            {state === 'recording'
              ? 'Click to stop recording'
              : state === 'transcribing'
              ? 'Whisper transcribing audio...'
              : state === 'uploading'
              ? 'Uploading audio...'
              : 'Click to start recording'}
          </p>
        </div>

        {/* Audio Waveform visualization */}
        <AudioWaveform isRecording={state === 'recording'} />

        {/* Timer display matching Screen 2 */}
        <div
          className="font-mono text-xs sm:text-sm font-bold text-slate-700 mt-1"
          aria-live="polite"
        >
          {formatTimer(elapsedSeconds)} / 00:45
        </div>

        {/* Error Notification */}
        {state === 'error' && errorMessage && (
          <div
            role="alert"
            className="mt-6 w-full max-w-md p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-900 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Audio Recording Notice</p>
              <p className="mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/review', { state: { transcript: '' } })}
                  className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 rounded-lg font-bold transition"
                >
                  Type Complaint Instead
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tip Pill matching Screen 2 */}
        <div className="mt-8 w-full max-w-md bg-primary-50/80 border border-primary-100 rounded-full py-2 px-4 flex items-center justify-center gap-2 text-xs text-primary-800 font-medium">
          <Info className="w-3.5 h-3.5 text-primary-600 shrink-0" />
          <span>You can speak for up to 45 seconds.</span>
        </div>
      </div>
    </div>
  );
}
