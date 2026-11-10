import React from 'react';

/**
 * StatusBadge — Signal Slate Enterprise Semantic Badge System
 *
 * Implements strict semantic colors:
 * - Resolved / Success:   text-[#15803D] bg-[#ECFDF3] border-[#BBF7D0]
 * - In Progress / Info:   text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]
 * - Escalated / Danger:   text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]
 * - Open / Neutral:       text-[#475569] bg-[#F1F5F9] border-[#E2E8F0]
 *
 * Priorities:
 * - High:   text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]
 * - Medium: text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]
 * - Low:    text-[#475569] bg-[#F1F5F9] border-[#E2E8F0]
 */
export default function StatusBadge({ type = 'status', value }) {
  const normalized = (value || '').toLowerCase().replace(/\s+/g, '_');

  /* ── Priority badges ─────────────────────────────────────────────── */
  if (type === 'priority') {
    const priorityConfig = {
      high: {
        cls: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
        dot: 'bg-[#DC2626]',
        label: 'High Priority',
      },
      medium: {
        cls: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
        dot: 'bg-[#D97706]',
        label: 'Medium Priority',
      },
      low: {
        cls: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
        dot: 'bg-[#64748B]',
        label: 'Low Priority',
      },
    };

    const cfg = priorityConfig[normalized] || {
      cls: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
      dot: 'bg-[#64748B]',
      label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '—',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-tag text-xs font-medium border whitespace-nowrap ${cfg.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
        {cfg.label}
      </span>
    );
  }

  /* ── Status badges ───────────────────────────────────────────────── */
  const statusConfig = {
    open: {
      cls: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
      dot: 'bg-[#64748B]',
      label: 'Open',
    },
    in_progress: {
      cls: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
      dot: 'bg-[#3B82F6]',
      label: 'In Progress',
    },
    escalated: {
      cls: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      dot: 'bg-[#EF4444]',
      label: 'Escalated',
    },
    resolved: {
      cls: 'bg-[#ECFDF3] text-[#15803D] border-[#BBF7D0]',
      dot: 'bg-[#22C55E]',
      label: 'Resolved',
    },
  };

  const cfg = statusConfig[normalized] || {
    cls: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    dot: 'bg-[#64748B]',
    label: value || '—',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-tag text-xs font-medium border whitespace-nowrap ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
