import React from 'react';

/**
 * StatusBadge — Stripe Financial Infrastructure Semantic Badge System
 *
 * Implements canonical Stripe palette:
 * - Resolved / Success:   text-[#008A4B] bg-[#E6F9F0] border-[#A3F0C8]
 * - In Progress / Info:   text-[#0073E6] bg-[#EBF5FE] border-[#B8DBFC]
 * - Escalated / Danger:   text-[#DF1B41] bg-[#FDF0F3] border-[#F8BCC8]
 * - Open / Neutral:       text-[#596780] bg-[#F6F9FC] border-[#E3ECF7]
 *
 * Priorities:
 * - High:   text-[#DF1B41] bg-[#FDF0F3] border-[#F8BCC8]
 * - Medium: text-[#D9530F] bg-[#FFF2EB] border-[#FED4C0]
 * - Low:    text-[#596780] bg-[#F6F9FC] border-[#E3ECF7]
 */
export default function StatusBadge({ type = 'status', value }) {
  const normalized = (value || '').toLowerCase().replace(/\s+/g, '_');

  /* ── Priority badges ─────────────────────────────────────────────── */
  if (type === 'priority') {
    const priorityConfig = {
      high: {
        cls: 'bg-[#FDF0F3] text-[#DF1B41] border-[#F8BCC8]',
        dot: 'bg-[#DF1B41]',
        label: 'High Priority',
      },
      medium: {
        cls: 'bg-[#FFF2EB] text-[#D9530F] border-[#FED4C0]',
        dot: 'bg-[#FF6118]',
        label: 'Medium Priority',
      },
      low: {
        cls: 'bg-[#F6F9FC] text-[#596780] border-[#E3ECF7]',
        dot: 'bg-[#737373]',
        label: 'Low Priority',
      },
    };

    const cfg = priorityConfig[normalized] || {
      cls: 'bg-[#F6F9FC] text-[#596780] border-[#E3ECF7]',
      dot: 'bg-[#737373]',
      label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '—',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
        {cfg.label}
      </span>
    );
  }

  /* ── Status badges ───────────────────────────────────────────────── */
  const statusConfig = {
    open: {
      cls: 'bg-[#F6F9FC] text-[#596780] border-[#E3ECF7]',
      dot: 'bg-[#737373]',
      label: 'Open',
    },
    in_progress: {
      cls: 'bg-[#EBF5FE] text-[#0073E6] border-[#B8DBFC]',
      dot: 'bg-[#0073E6]',
      label: 'In Progress',
    },
    escalated: {
      cls: 'bg-[#FDF0F3] text-[#DF1B41] border-[#F8BCC8]',
      dot: 'bg-[#DF1B41]',
      label: 'Escalated',
    },
    resolved: {
      cls: 'bg-[#E6F9F0] text-[#008A4B] border-[#A3F0C8]',
      dot: 'bg-[#00D66F]',
      label: 'Resolved',
    },
  };

  const cfg = statusConfig[normalized] || {
    cls: 'bg-[#F6F9FC] text-[#596780] border-[#E3ECF7]',
    dot: 'bg-[#737373]',
    label: value || '—',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
