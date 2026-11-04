import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Filter,
  BarChart3,
  Layers,
  PieChart,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export default function AnalyticsView({ authToken }) {
  const [dateRange, setDateRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartUrls, setChartUrls] = useState({});
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [error, setError] = useState(null);

  const chartNames = [
    { key: 'volume_over_time', title: 'Ticket Volume Ingestion Over Time', icon: TrendingUp },
    { key: 'status_distribution', title: 'Tickets by Resolution Status', icon: ShieldCheck },
    { key: 'category_distribution', title: 'Complaint Categories Breakdown', icon: Layers },
    { key: 'priority_distribution', title: 'Priority Level Allocation (Donut)', icon: PieChart },
    { key: 'department_workload', title: 'Department Active Workload', icon: Building2 },
    { key: 'resolution_time', title: 'Resolution Time Distribution (Hours)', icon: Clock },
  ];

  // Load KPI summary
  const loadSummary = useCallback(async () => {
    if (!authToken) return;
    setIsLoadingSummary(true);
    setError(null);
    try {
      const data = await api.getAdminAnalytics(authToken, {
        range: dateRange,
        startDate: dateRange === 'custom' ? customStart : null,
        endDate: dateRange === 'custom' ? customEnd : null,
      });
      setSummary(data);
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
      setError(err.message || 'Failed to compute analytics summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [authToken, dateRange, customStart, customEnd]);

  // Load in-memory chart PNGs via fetch blob
  const loadCharts = useCallback(async () => {
    if (!authToken) return;
    setIsLoadingCharts(true);
    const newUrls = {};

    try {
      await Promise.all(
        chartNames.map(async (c) => {
          try {
            const url = await api.fetchChartBlob(authToken, c.key, {
              range: dateRange,
              startDate: dateRange === 'custom' ? customStart : null,
              endDate: dateRange === 'custom' ? customEnd : null,
            });
            newUrls[c.key] = url;
          } catch (chartErr) {
            console.warn(`Chart ${c.key} load notice:`, chartErr);
          }
        })
      );
      setChartUrls(newUrls);
    } finally {
      setIsLoadingCharts(false);
    }
  }, [authToken, dateRange, customStart, customEnd]);

  useEffect(() => {
    loadSummary();
    loadCharts();

    // Revoke previous blob URLs on cleanup
    return () => {
      Object.values(chartUrls).forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [dateRange, customStart, customEnd]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Date Range Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Statistical Analytics
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
              Pandas + Seaborn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical aggregation and distributions rendered via in-memory Python data pipelines with zero disk persistence.
          </p>
        </div>

        {/* Date Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold text-slate-600">
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dateRange === tab.id
                    ? 'bg-white text-primary-700 shadow-sm font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              loadSummary();
              loadCharts();
            }}
            disabled={isLoadingCharts || isLoadingSummary}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCharts ? 'animate-spin text-primary-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers (Shown if range === 'custom') */}
      {dateRange === 'custom' && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-none"
            />
          </div>
        </div>
      )}

      {/* 2. Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Ingested */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Period Volume</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isLoadingSummary ? '...' : summary?.total_volume ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Total registered complaints</div>
        </div>

        {/* Escalation Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Escalation Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {isLoadingSummary ? '...' : `${summary?.escalation_rate ?? 0}%`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Flagged for supervisor review</div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Resolution Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {isLoadingSummary ? '...' : `${summary?.resolution_rate ?? 0}%`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Successfully completed tickets</div>
        </div>

        {/* Avg Resolution Duration */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {isLoadingSummary ? '...' : `${summary?.avg_resolution_hours ?? 0}h`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Mean hours to resolution</div>
        </div>
      </div>

      {/* 3. Six Matplotlib & Seaborn Chart Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartNames.map((chart) => {
          const Icon = chart.icon;
          const imgUrl = chartUrls[chart.key];

          return (
            <div
              key={chart.key}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    {chart.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  PNG 140DPI
                </span>
              </div>

              {/* Chart container */}
              <div className="relative min-h-[220px] bg-slate-50/50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100">
                {isLoadingCharts ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span>Rendering Matplotlib visualization...</span>
                  </div>
                ) : imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={chart.title}
                    className="w-full h-auto object-contain rounded-lg shadow-2xs"
                  />
                ) : (
                  <div className="text-xs text-slate-400">Unable to load visualization</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
