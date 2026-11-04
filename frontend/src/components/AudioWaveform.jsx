import React from 'react';

export default function AudioWaveform({ isRecording }) {
  const bars = [4, 8, 14, 20, 26, 18, 30, 22, 12, 28, 16, 24, 18, 10, 6];

  return (
    <div className="flex items-center justify-center gap-1.5 h-10 my-3">
      {bars.map((height, i) => (
        <span
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${
            isRecording
              ? 'bg-primary-500 animate-pulse'
              : 'bg-primary-200'
          }`}
          style={{
            height: isRecording ? `${Math.max(6, (height + (i % 3) * 6)) * 0.9}px` : '8px',
            animationDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

