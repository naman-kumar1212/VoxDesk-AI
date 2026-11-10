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
  RefreshCw,
  ShieldAlert,
  Inbox,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E3ECF7]">
        <div>
          <h1 className="text-2xl font-semibold text-[#061B31] tracking-[-0.03em]">
            Operational Overview
          </h1>
          <p className="text-xs text-[#425466] mt-0.5">
            Real-time grievance ingestion metrics, active department workloads, and recent audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#061B31] hover:bg-[#F6F9FC] transition shadow-sm self-start sm:self-auto cursor-pointer"
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
            iconBgClass="bg-[#F8FAFD]"
            colorClass="text-[#061B31]"
          />
          <StatCard
            title="Open"
            value={summary?.open_tickets}
            icon={Inbox}
            iconBgClass="bg-[#F8FAFD]"
            colorClass="text-[#533AFD]"
          />
          <StatCard
            title="In Progress"
            value={summary?.in_progress_tickets}
            icon={Clock}
            iconBgClass="bg-[#F0F7FF]"
            colorClass="text-[#0073E6]"
          />
          <StatCard
            title="Resolved"
            value={summary?.resolved_tickets}
            icon={CheckCircle2}
            iconBgClass="bg-[#E6F9F0]"
            colorClass="text-[#00D66F]"
          />
          <StatCard
            title="Escalated"
            value={summary?.escalated_tickets}
            icon={AlertTriangle}
            iconBgClass="bg-[#FFF1F2]"
            colorClass="text-[#DF1B41]"
          />
          <StatCard
            title="High Priority"
            value={summary?.high_priority_tickets}
            icon={ShieldAlert}
            iconBgClass="bg-[#FFF8F3]"
            colorClass="text-[#FF6118]"
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Operational Content: Categories Breakdown & Department Workloads */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Grievance Categories Breakdown */}
        <div className="lg:col-span-5 bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF7]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#533AFD]" />
              <h2 className="text-sm font-semibold text-[#061B31]">Grievance Categories</h2>
            </div>
            <span className="text-xs text-[#737373] font-mono">
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
                      <span className="font-semibold text-[#061B31] capitalize">
                        {category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#737373] font-mono">
                        {count || 0} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#ECF0F4] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#533AFD] h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#737373]">
                No categorical distributions recorded
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Department Active Workload Table */}
        <div className="lg:col-span-7 bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF7]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#533AFD]" />
              <h2 className="text-sm font-semibold text-[#061B31]">Department Workload</h2>
            </div>
            <span className="text-xs text-[#737373]">Active distribution</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAFDFF] text-[#737373] text-[11px] font-semibold uppercase tracking-wider border-b border-[#E3ECF7]">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-2 text-center">Open</th>
                  <th className="py-2.5 px-2 text-center">In Progress</th>
                  <th className="py-2.5 px-2 text-center">Resolved</th>
                  <th className="py-2.5 px-2 text-center">Escalated</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3ECF7]">
                {departmentRows.length > 0 ? (
                  departmentRows.map((dept) => (
                    <tr key={dept.name || dept.id} className="hover:bg-[#F8FAFD] transition">
                      <td className="py-2.5 px-3 font-semibold text-[#061B31]">{dept.name}</td>
                      <td className="py-2.5 px-2 text-center text-[#425466] font-mono">{dept.open || 0}</td>
                      <td className="py-2.5 px-2 text-center text-[#0073E6] font-mono font-semibold">{dept.in_progress || 0}</td>
                      <td className="py-2.5 px-2 text-center text-[#00D66F] font-mono font-semibold">{dept.resolved || 0}</td>
                      <td className="py-2.5 px-2 text-center text-[#DF1B41] font-mono font-semibold">
                        {dept.escalated > 0 ? (
                          <span className="text-[#DF1B41] bg-[#FFF1F2] px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-[#FECDD3]">
                            {dept.escalated}
                          </span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#061B31] font-mono">{dept.total || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-[#737373]">
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
      <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF7]">
          <h2 className="text-sm font-semibold text-[#061B31]">Recent Chronological Audit Log</h2>
          <button
            type="button"
            onClick={() => onNavigateToTickets && onNavigateToTickets()}
            className="text-xs font-semibold text-[#533AFD] hover:text-[#635BFF] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities && activities.length > 0 ? (
          <div className="divide-y divide-[#E3ECF7] text-xs">
            {activities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#061B31] bg-[#F6F9FC] border border-[#E3ECF7] px-2.5 py-0.5 rounded-full">
                    {act.ticket_number || 'VD-XXXX'}
                  </span>
                  <span className="text-[#425466] line-clamp-1">{act.description || act.event_type}</span>
                </div>
                <span className="text-[11px] text-[#737373] shrink-0 font-mono">
                  {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#737373]">
            No recent activity logged
          </div>
        )}
      </div>
    </div>
  );
}
