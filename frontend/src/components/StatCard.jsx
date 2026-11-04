import React from 'react';

/**
 * StatCard — Enterprise Signal Slate metric component
 *
 * Implements restrained styling:
 * - Surface container with subtle 1px border (#DCE3EC)
 * - Clear secondary metadata label
 * - High-contrast prominent numeric value
 * - Restrained, non-distracting semantic icon treatment
 */
export default function StatCard({ title, value, icon: Icon, colorClass, iconBgClass }) {
  return (
    <div className="bg-surface border border-border rounded-card p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition">
      <div>
        <span className="text-xs font-medium text-muted-text block mb-1">
          {title}
        </span>
        <span className="text-2xl font-bold text-primary-text font-mono tracking-tight">
          {value ?? 0}
        </span>
      </div>

      <div className={`w-9 h-9 rounded-btn flex items-center justify-center shrink-0 ${iconBgClass || 'bg-surface-subtle'} ${colorClass || 'text-slate-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}
