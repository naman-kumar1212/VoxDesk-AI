import React from 'react';
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  Building2,
  StickyNote,
  ArrowUpDown,
  Activity,
  Clock,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Convert snake_case / enum values to human-readable title case */
function humanize(str) {
  if (!str) return '—';
  return String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Channel enum → friendly label */
function friendlyChannel(ch) {
  const map = {
    web_voice: 'Voice (Web)',
    web_text: 'Text (Web)',
    voice: 'Voice',
    text: 'Text',
  };
  return map[(ch || '').toLowerCase()] || humanize(ch);
}

/** Format timestamp — medium date + short time */
function formatTs(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

/* ── Event type config ───────────────────────────────────────────────── */

function getEventConfig(eventType, details = {}) {
  const type = (eventType || '').toUpperCase();

  switch (type) {
    case 'TICKET_CREATED': {
      const { category, channel, department, priority } = details;
      return {
        icon: Plus,
        iconBg: 'bg-primary-100',
        iconColor: 'text-primary-600',
        connectorColor: 'border-primary-200',
        title: 'Ticket Created',
        description: [
          channel && `Received via ${friendlyChannel(channel)}.`,
          category && `Category: ${humanize(category)}.`,
          department && `Assigned to ${department}.`,
          priority && `Priority: ${humanize(priority)}.`,
        ]
          .filter(Boolean)
          .join(' ') || 'Complaint recorded and ticket opened.',
      };
    }

    case 'STATUS_CHANGED': {
      const { from_status, to_status, reason, operator } = details;
      const parts = [`Status changed from ${humanize(from_status)} to ${humanize(to_status)}.`];
      if (reason) parts.push(`Reason: ${reason}.`);
      if (operator) parts.push(`By: ${operator}.`);
      return {
        icon: RefreshCw,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        connectorColor: 'border-slate-200',
        title: 'Status Updated',
        description: parts.join(' '),
      };
    }

    case 'TICKET_ESCALATED': {
      const { from_status, reason, operator } = details;
      const parts = [
        `Ticket escalated${from_status ? ` from ${humanize(from_status)}` : ''} to Escalated.`,
      ];
      if (reason) parts.push(`Reason: ${reason}.`);
      if (operator) parts.push(`By: ${operator}.`);
      return {
        icon: AlertTriangle,
        iconBg: 'bg-red-50',
        iconColor: 'text-red-600',
        connectorColor: 'border-red-200',
        title: 'Ticket Escalated',
        description: parts.join(' '),
      };
    }

    case 'DEPARTMENT_REASSIGNED': {
      const { from_department, to_department, reason } = details;
      const parts = [
        from_department && to_department
          ? `Moved from ${from_department} to ${to_department}.`
          : to_department
          ? `Assigned to ${to_department}.`
          : 'Department updated.',
      ];
      if (reason) parts.push(`Reason: ${reason}.`);
      return {
        icon: Building2,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        connectorColor: 'border-slate-200',
        title: 'Department Reassigned',
        description: parts.join(' '),
      };
    }

    case 'NOTE_ADDED': {
      const { preview } = details;
      return {
        icon: StickyNote,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        connectorColor: 'border-amber-200',
        title: 'Admin Note Added',
        description: preview ? `Note: "${preview}"` : 'Internal note updated.',
      };
    }

    case 'PRIORITY_CHANGED': {
      const { from_priority, to_priority } = details;
      return {
        icon: ArrowUpDown,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        connectorColor: 'border-slate-200',
        title: 'Priority Changed',
        description:
          from_priority && to_priority
            ? `Priority updated from ${humanize(from_priority)} to ${humanize(to_priority)}.`
            : to_priority
            ? `Priority set to ${humanize(to_priority)}.`
            : 'Priority updated.',
      };
    }

    default:
      return {
        icon: Activity,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-400',
        connectorColor: 'border-slate-200',
        title: humanize(eventType) || 'Activity Logged',
        description: 'Administrative action recorded.',
      };
  }
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function ActivityTimeline({ events = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-4 text-xs">
        <Clock className="w-4 h-4 animate-pulse" />
        <span>Loading activity history…</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 space-y-1">
        <Activity className="w-6 h-6 mx-auto text-slate-300" />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <ol role="list" className="relative space-y-0">
      {events.map((evt, idx) => {
        const isLast = idx === events.length - 1;
        const details = typeof evt.details === 'object' && evt.details !== null
          ? evt.details
          : {};

        const cfg = getEventConfig(evt.event_type, details);
        const Icon = cfg.icon;

        return (
          <li key={evt.id || idx} role="listitem" className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cfg.iconBg}`}
                aria-hidden="true"
              >
                <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
              </span>
              {!isLast && (
                <span className={`w-px flex-1 mt-1 mb-1 border-l-2 ${cfg.connectorColor}`} />
              )}
            </div>

            {/* Event content */}
            <div className={`pb-4 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {cfg.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                  {formatTs(evt.created_at)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {cfg.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

