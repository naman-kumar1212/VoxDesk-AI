import React from 'react';
import { AlertTriangle, ChevronRight, Inbox } from 'lucide-react';

const PRIORITY_BADGES = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_BADGES = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  escalated: 'bg-rose-50 text-rose-700 border-rose-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function TicketTable({ tickets, onSelectTicket, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm">Loading tickets...</p>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-700">No Tickets Found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No complaints match your active filters or have been registered yet. Submit a voice grievance to populate this table.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Ticket</th>
              <th className="py-3.5 px-4">Summary</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => {
              const createdDate = new Date(t.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                    <div className="flex items-center gap-1.5">
                      {t.escalated && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      <span>{t.ticket_number}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate" title={t.summary}>
                    {t.summary}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 uppercase font-medium">
                    {t.category}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {t.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border uppercase text-[10px] font-bold ${
                        PRIORITY_BADGES[t.priority] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border uppercase text-[10px] font-bold ${
                        STATUS_BADGES[t.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {createdDate}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-slate-400 hover:text-brand-600 p-1">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

