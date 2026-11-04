import React from 'react';

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-slate-100" />
        <div className="w-12 h-6 bg-slate-100 rounded-md" />
      </div>
      <div className="mt-3 w-20 h-3.5 bg-slate-100 rounded" />
    </div>
  );
}

export function TicketRowSkeleton() {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white animate-pulse flex items-center justify-between gap-3">
      <div className="space-y-2 flex-1">
        <div className="w-24 h-4 bg-slate-100 rounded" />
        <div className="w-3/4 h-3 bg-slate-100 rounded" />
      </div>
      <div className="w-16 h-5 bg-slate-100 rounded-full" />
    </div>
  );
}

export function TicketDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between pb-4 border-b border-slate-100">
        <div className="w-36 h-5 bg-slate-100 rounded" />
        <div className="w-16 h-5 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-2 py-4 border-b border-slate-100">
        <div className="w-16 h-3 bg-slate-100 rounded" />
        <div className="w-full h-12 bg-slate-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="w-14 h-3 bg-slate-100 rounded" />
          <div className="w-24 h-4 bg-slate-100 rounded" />
        </div>
        <div className="space-y-1.5">
          <div className="w-14 h-3 bg-slate-100 rounded" />
          <div className="w-20 h-4 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

