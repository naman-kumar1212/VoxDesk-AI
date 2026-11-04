import React from 'react';

/**
 * VoxDeskLogo — Clean, proportional vector & optical SVG logo
 *
 * Implements the Signal Slate design identity:
 * - Equalizer / Microphone icon with clean geometric bars
 * - "VoxDesk" in dark navy (#111827)
 * - "AI" in refined violet brand color (#5B3CC4)
 * - Optical alignment and balanced spacing
 */
export default function VoxDeskLogo({ size = 'md', className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 'w-6 h-6' : isLg ? 'w-9 h-9' : 'w-7 h-7';
  const textClasses = isSm ? 'text-base' : isLg ? 'text-2xl' : 'text-lg';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Restrained Equalizer/Voice Vector Icon in Brand Purple Container */}
      <div className={`${iconSize} rounded-lg bg-brand text-white flex items-center justify-center p-1.5 shadow-xs shrink-0`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Sound wave / equalizer bars centered like a microphone wave */}
          <line x1="4" y1="10" x2="4" y2="14" />
          <line x1="8" y1="7" x2="8" y2="17" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="16" y1="7" x2="16" y2="17" />
          <line x1="20" y1="10" x2="20" y2="14" />
        </svg>
      </div>

      {/* Typography with optical weight and spacing */}
      <span className={`font-bold tracking-tight text-[#111827] leading-none ${textClasses}`}>
        VoxDesk <span className="text-brand font-semibold ml-0.5">AI</span>
      </span>
    </div>
  );
}

