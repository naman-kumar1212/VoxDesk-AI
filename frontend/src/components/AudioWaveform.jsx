import React, { useEffect, useRef, useState } from 'react';

export default function AudioWaveform({ stream, isRecording }) {
  const [levels, setLevels] = useState(() => Array(16).fill(6));
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      setLevels(Array(16).fill(6));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 16 discrete bands mapped to 6px - 32px height
        const nextLevels = [];
        const step = Math.max(1, Math.floor(dataArray.length / 16));
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          const height = Math.max(6, Math.min(36, Math.round((val / 255) * 36)));
          nextLevels.push(height);
        }
        setLevels(nextLevels);
        animationFrameRef.current = requestAnimationFrame(update);
      };

      animationFrameRef.current = requestAnimationFrame(update);
    } catch {
      // Graceful fallback to static acoustic resting shape
      setLevels([8, 14, 22, 28, 34, 26, 32, 24, 18, 28, 22, 18, 14, 10, 8, 6]);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isRecording, stream]);

  return (
    <div
      className="flex items-center justify-center gap-1.5 h-10 my-1"
      aria-hidden="true"
    >
      {levels.map((height, i) => (
        <span
          key={i}
          className={`w-1 rounded-xs transition-[height] duration-75 ease-out ${
            isRecording ? 'bg-voice' : 'bg-slate-200'
          }`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
