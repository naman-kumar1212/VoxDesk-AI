import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function TicketFilters({ filters, onFilterChange, onResetFilters }) {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
        <Filter className="w-4 h-4 text-brand-600" /> Filters
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-slate-500 font-medium">Status:</label>
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-slate-500 font-medium">Priority:</label>
        <select
          value={filters.priority || ''}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500 outline-none"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-slate-500 font-medium">Category:</label>
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500 outline-none"
        >
          <option value="">All Categories</option>
          <option value="payment">Payment</option>
          <option value="orders">Orders</option>
          <option value="delivery">Delivery</option>
          <option value="technical">Technical</option>
          <option value="account">Account</option>
          <option value="refund">Refund</option>
          <option value="other">Other</option>
        </select>
      </div>

      {(filters.status || filters.priority || filters.category) && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 ml-auto transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  );
}

