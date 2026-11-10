import React from 'react';

/**
 * StatCard — Stripe Financial Infrastructure Metric Card
 *
 * Implements:
 * - 14px rounded surface with soft elevation
 * - Prominent tabular figures in #061B31
 * - Uppercase tracked micro-typography for label
 * - Subtle circular badge for semantic icon
 */
export default function StatCard({ title, value, icon: Icon, colorClass, iconBgClass }) {
  return (
    <div className="bg-white border border-[#D4DEE9]/80 rounded-[14px] p-4 shadow-[0_4px_12px_rgba(13,23,56,0.05)] hover:shadow-[0_8px_20px_rgba(13,23,56,0.09)] hover:border-[#533AFD]/40 transition-all flex items-center justify-between">
      <div>
        <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block mb-1">
          {title}
        </span>
        <span className="text-2xl font-bold text-[#061B31] font-mono tabular-nums tracking-tight">
          {value ?? 0}
        </span>
      </div>

      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBgClass || 'bg-[#F6F9FC]'} ${colorClass || 'text-[#533AFD]'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}
