import React from 'react';

/**
 * VoxDeskLogo — Stripe Precision Geometric Logo Mark
 *
 * Combines:
 * - Stripe violet (#533AFD) icon container with pill geometry
 * - Deep brand ink (#061B31) for "VoxDesk"
 * - Stripe electric violet (#635BFF) for "AI"
 */
export default function VoxDeskLogo({ size = 'md', className = '', theme = 'light' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 'w-6 h-6' : isLg ? 'w-9 h-9' : 'w-7 h-7';
  const textClasses = isSm ? 'text-base' : isLg ? 'text-2xl' : 'text-lg';
  const brandTextClass = theme === 'dark' ? 'text-white' : 'text-[#061B31]';
  const aiTextClass = theme === 'dark' ? 'text-[#ABA4FC]' : 'text-[#533AFD]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Equalizer / Audio Intake Icon in Stripe Violet */}
      <div className={`${iconSize} rounded-[10px] bg-[#533AFD] text-white flex items-center justify-center p-1.5 shadow-sm shrink-0`}>
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
          <line x1="4" y1="10" x2="4" y2="14" />
          <line x1="8" y1="7" x2="8" y2="17" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="16" y1="7" x2="16" y2="17" />
          <line x1="20" y1="10" x2="20" y2="14" />
        </svg>
      </div>

      {/* Typography with optical weight and spacing */}
      <span className={`font-semibold tracking-tight leading-none ${brandTextClass} ${textClasses}`}>
        VoxDesk <span className={`${aiTextClass} font-semibold ml-0.5`}>AI</span>
      </span>
    </div>
  );
}
