import React, { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import { StatCardSkeleton } from '../LoadingSkeleton';
import { api } from '../../services/api';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  ArrowRight,
  TrendingUp,
  Inbox,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardView({ authToken, onNavigateToTickets }) {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async (bypassCache = false) => {
    if (!authToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, actData] = await Promise.all([
        api.getDashboardSummary(authToken, { bypassCache }),
        api.getRecentActivity(authToken, { bypassCache }),
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

  // Handle both object-based category_distribution and list-based categories
  const categoryEntries = summary?.category_distribution
    ? Object.entries(summary.category_distribution)
    : Array.isArray(summary?.categories)
    ? summary.categories.map((c) => [c.category || c.name, c.count])
    : [];

  const maxCatCount = Math.max(1, ...categoryEntries.map(([_, count]) => count || 0));

  // Handle both department_workload and departments list
  const departmentRows = summary?.department_workload || summary?.departments || [];

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header with Operational Context & Refresh */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-medium text-primary-text tracking-tight">
            Operational Overview
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Real-time grievance ingestion metrics, active department workloads, and recent audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-medium text-slate-700 hover:bg-surface-subtle transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Structured Responsive 6-KPI Metric Section */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Total Tickets"
            value={summary?.total_tickets}
            icon={Calendar}
            iconBgClass="bg-surface-subtle"
            colorClass="text-slate-700"
          />
          <StatCard
            title="Open"
            value={summary?.open_tickets}
            icon={Inbox}
            iconBgClass="bg-[#F1F5F9]"
            colorClass="text-[#475569]"
          />
          <StatCard
            title="In Progress"
            value={summary?.in_progress_tickets}
            icon={Clock}
            iconBgClass="bg-[#EFF6FF]"
            colorClass="text-[#2563EB]"
          />
          <StatCard
            title="Resolved"
            value={summary?.resolved_tickets}
            icon={CheckCircle2}
            iconBgClass="bg-[#ECFDF3]"
            colorClass="text-[#15803D]"
          />
          <StatCard
            title="Escalated"
            value={summary?.escalated_tickets}
            icon={AlertTriangle}
            iconBgClass="bg-[#FEF2F2]"
            colorClass="text-[#B91C1C]"
          />
          <StatCard
            title="High Priority"
            value={summary?.high_priority_tickets}
            icon={ShieldAlert}
            iconBgClass="bg-[#FEF2F2]"
            colorClass="text-[#B91C1C]"
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Operational Content: Categories Breakdown & Department Workloads */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Grievance Categories Breakdown */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-medium text-primary-text">Grievance Categories</h2>
            </div>
            <span className="text-xs text-muted-text font-mono">
              {categoryEntries.length} categories
            </span>
          </div>

          <div className="space-y-3">
            {categoryEntries.length > 0 ? (
              categoryEntries.map(([category, count]) => {
                const total = summary?.total_tickets || 1;
                const percentage = Math.round(((count || 0) / total) * 100);
                const barWidth = Math.round(((count || 0) / maxCatCount) * 100);

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-primary-text capitalize">
                        {category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-muted-text font-mono">
                        {count || 0} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted-text">
                No categorical distributions recorded
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Department Active Workload Table */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-medium text-primary-text">Department Workload</h2>
            </div>
            <span className="text-xs text-muted-text">Active distribution</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-subtle text-muted-text font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-2 text-center">Open</th>
                  <th className="py-2.5 px-2 text-center">In Progress</th>
                  <th className="py-2.5 px-2 text-center">Resolved</th>
                  <th className="py-2.5 px-2 text-center">Escalated</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departmentRows.length > 0 ? (
                  departmentRows.map((dept) => (
                    <tr key={dept.name || dept.id} className="hover:bg-surface-subtle/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-primary-text">{dept.name}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600 font-mono">{dept.open || 0}</td>
                      <td className="py-2.5 px-2 text-center text-blue-600 font-mono font-semibold">{dept.in_progress || 0}</td>
                      <td className="py-2.5 px-2 text-center text-emerald-600 font-mono">{dept.resolved || 0}</td>
                      <td className="py-2.5 px-2 text-center text-rose-600 font-mono font-semibold">
                        {dept.escalated > 0 ? (
                          <span className="text-[#B91C1C] bg-[#FEF2F2] px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#FECACA]">
                            {dept.escalated}
                          </span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-primary-text font-mono">{dept.total || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-muted-text">
                      No departmental allocations recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. Recent Chronological Audit Activity Stream */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-medium text-primary-text">Recent Chronological Audit Log</h2>
          <button
            type="button"
            onClick={() => onNavigateToTickets && onNavigateToTickets()}
            className="text-xs font-semibold text-brand hover:text-brand-hover inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities && activities.length > 0 ? (
          <div className="divide-y divide-border text-xs">
            {activities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold text-primary-text bg-surface-muted px-2 py-0.5 rounded">
                    {act.ticket_number || 'VD-XXXX'}
                  </span>
                  <span className="text-secondary-text line-clamp-1">{act.description || act.event_type}</span>
                </div>
                <span className="text-[11px] text-muted-text shrink-0 font-mono">
                  {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-text">
            No recent activity logged
          </div>
        )}
      </div>
    </div>
  );
}
