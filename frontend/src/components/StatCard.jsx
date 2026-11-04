import React from 'react';

export default function StatCard({ title, value, icon: Icon, colorClass, iconBgClass }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
          {title}
        </span>
        <span className="text-2xl font-extrabold text-slate-900 font-mono">
          {value ?? 0}
        </span>
      </div>

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass || 'bg-slate-100'} ${colorClass || 'text-slate-700'}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

