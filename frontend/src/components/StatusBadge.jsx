import React from 'react';

/**
 * StatusBadge — simplified color system
 *
 * STATUS
 *   escalated  → red  (only danger signal)
 *   open / in_progress / resolved → neutral slate
 *
 * PRIORITY
 *   All priorities → neutral slate (no color semantics)
 *   A subtle dot differentiates High / Medium / Low visually.
 *
 * Always whitespace-nowrap so "In Progress" never wraps.
 */
export default function StatusBadge({ type = 'status', value }) {
  const normalized = (value || '').toLowerCase().replace(/\s+/g, '_');

  /* ── Priority badges ─────────────────────────────────────────────── */
  if (type === 'priority') {
    const dots = {
      high:   'bg-slate-700',
      medium: 'bg-slate-500',
      low:    'bg-slate-400',
    };
    const dot = dots[normalized] || 'bg-slate-400';
    const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                       bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        {label}
      </span>
    );
  }

  /* ── Status badges ───────────────────────────────────────────────── */
  const statusConfig = {
    open: {
      cls: 'bg-slate-100 text-slate-600 border border-slate-200',
      label: 'Open',
    },
    in_progress: {
      cls: 'bg-slate-100 text-slate-600 border border-slate-200',
      label: 'In Progress',
    },
    escalated: {
      cls: 'bg-red-50 text-red-700 border border-red-200',
      label: 'Escalated',
    },
    resolved: {
      cls: 'bg-slate-100 text-slate-600 border border-slate-200',
      label: 'Resolved',
    },
  };

  const cfg = statusConfig[normalized] || {
    cls: 'bg-slate-100 text-slate-600 border border-slate-200',
    label: value || '—',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                      whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
