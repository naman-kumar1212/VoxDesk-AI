import React from 'react';

export default function AudioWaveform({ isRecording }) {
  const bars = [6, 12, 18, 26, 32, 22, 36, 28, 16, 30, 20, 24, 16, 10, 6];

  return (
    <div
      className="flex items-center justify-center gap-1.5 h-10 my-2"
      aria-hidden="true"
    >
      {bars.map((height, i) => (
        <span
          key={i}
          className={`w-1 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-primary-600 animate-pulse'
              : 'bg-slate-200 h-1.5'
          }`}
          style={{
            height: isRecording ? `${Math.max(6, height)}px` : '4px',
            animationDelay: isRecording ? `${(i % 5) * 120}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
