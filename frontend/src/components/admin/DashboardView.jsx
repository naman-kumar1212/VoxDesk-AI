import React, { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import { StatCardSkeleton } from '../LoadingSkeleton';
import { api } from '../../services/api';
import {
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Layers,
  Building2,
  Users,
  ArrowRight,
  TrendingUp,
  Inbox,
  RefreshCw,
} from 'lucide-react';

export default function DashboardView({ authToken, onNavigateToTickets }) {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!authToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, actData] = await Promise.all([
        api.getDashboardSummary(authToken),
        api.getRecentActivity(authToken),
      ]);
      setSummary(sumData);
      setActivities(actData?.activities || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to retrieve dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authToken]);

  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow hover:bg-rose-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const catDist = summary?.category_distribution || {};
  const maxCatCount = Math.max(1, ...Object.values(catDist));

  return (
    <div className="space-y-8">
      {/* 1. Header Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Operational Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time support operations, queue distribution and department workload across actual database records.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 2. Top Metric Cards (6 Operational KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Tickets"
          value={summary?.total_tickets ?? 0}
          icon={Calendar}
          iconBgClass="bg-purple-50"
          colorClass="text-purple-600"
        />
        <StatCard
          title="Open"
          value={summary?.open_tickets ?? 0}
          icon={Clock}
          iconBgClass="bg-slate-100"
          colorClass="text-slate-600"
        />
        <StatCard
          title="In Progress"
          value={summary?.in_progress_tickets ?? 0}
          icon={ShieldCheck}
          iconBgClass="bg-blue-50"
          colorClass="text-blue-600"
        />
        <StatCard
          title="Resolved"
          value={summary?.resolved_tickets ?? 0}
          icon={CheckCircle}
          iconBgClass="bg-emerald-50"
          colorClass="text-emerald-600"
        />
        <StatCard
          title="Escalated"
          value={summary?.escalated_tickets ?? 0}
          icon={AlertTriangle}
          iconBgClass="bg-rose-50"
          colorClass="text-rose-600"
        />
        <StatCard
          title="High Priority"
          value={summary?.high_priority_tickets ?? 0}
          icon={TrendingUp}
          iconBgClass="bg-amber-50"
          colorClass="text-amber-600"
        />
      </div>

      {/* 3. Middle Section: Category Distribution & Department Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Category Distribution Progress Bars */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-600" />
              <span>Grievance Categories</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              {Object.keys(catDist).length} categories
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(catDist).map(([category, count]) => {
              const percentage = Math.round((count / (summary?.total_tickets || 1)) * 100);
              const barWidth = Math.round((count / maxCatCount) * 100);

              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Department Workload Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span>Department Workload</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Active distribution</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2.5">Department</th>
                  <th className="pb-2.5 text-center">Open</th>
                  <th className="pb-2.5 text-center">In Progress</th>
                  <th className="pb-2.5 text-center">Resolved</th>
                  <th className="pb-2.5 text-center">Escalated</th>
                  <th className="pb-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {(summary?.department_workload || []).map((dept) => (
                  <tr key={dept.name} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-bold text-slate-800">{dept.name}</td>
                    <td className="py-2.5 text-center font-mono text-slate-600">{dept.open}</td>
                    <td className="py-2.5 text-center font-mono text-blue-600 font-semibold">{dept.in_progress}</td>
                    <td className="py-2.5 text-center font-mono text-emerald-600 font-semibold">{dept.resolved}</td>
                    <td className="py-2.5 text-center font-mono">
                      {dept.escalated > 0 ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                          {dept.escalated}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono font-extrabold text-slate-900">{dept.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Recent Real-Time Activity Feed */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Recent System Activity Stream
            </h2>
            <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              Live DB
            </span>
          </div>

          {onNavigateToTickets && (
            <button
              onClick={() => onNavigateToTickets()}
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1 transition"
            >
              <span>View All Tickets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 space-y-1">
            <Inbox className="w-8 h-8 mx-auto text-slate-300" />
            <p>No recorded activity events yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs space-y-1 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {act.ticket_number}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-slate-700 font-medium truncate" title={act.summary}>
                  {act.summary}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                  <span className="capitalize font-semibold text-primary-700">
                    {act.event_type.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span>•</span>
                  <span>{act.customer_name}</span>
                  <span>•</span>
                  <span>{act.department}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

