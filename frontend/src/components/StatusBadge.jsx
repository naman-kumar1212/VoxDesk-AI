import React from 'react';

export default function StatusBadge({ type = 'status', value }) {
  const normalized = (value || '').toLowerCase().replace(' ', '_');

  if (type === 'priority') {
    const styles = {
      high: 'bg-red-50 text-red-600 border border-red-100',
      medium: 'bg-amber-50 text-amber-700 border border-amber-100',
      low: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${styles[normalized] || 'bg-slate-100 text-slate-700'}`}>
        {value}
      </span>
    );
  }

  // Status badges
  const statusStyles = {
    open: 'bg-purple-50 text-purple-700 border border-purple-100',
    in_progress: 'bg-blue-50 text-blue-600 border border-blue-100',
    escalated: 'bg-rose-50 text-rose-600 border border-rose-100',
    resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  };

  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    escalated: 'Escalated',
    resolved: 'Resolved',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusStyles[normalized] || 'bg-slate-100 text-slate-700'}`}>
      {labels[normalized] || value}
    </span>
  );
}
