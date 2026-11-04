import React from 'react';
import { Inbox, AlertCircle, AlertTriangle, Layers } from 'lucide-react';

export default function DashboardMetrics({ metrics, isLoading }) {
  const cards = [
    {
      title: 'Total Tickets',
      value: metrics?.total_tickets ?? 0,
      icon: Layers,
      color: 'text-slate-700 bg-slate-100',
    },
    {
      title: 'Open Tickets',
      value: metrics?.open_tickets ?? 0,
      icon: Inbox,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'High Priority',
      value: metrics?.high_priority_tickets ?? 0,
      icon: AlertCircle,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Escalated Review',
      value: metrics?.escalated_tickets ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.title} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</span>
              <div className={`p-2 rounded-xl ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
              ) : (
                c.value
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

