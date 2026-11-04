import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  BarChart3,
  Layers,
  PieChart,
  ShieldCheck,
  Building2,
  Table2,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function AnalyticsView({ authToken }) {
  const [dateRange, setDateRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedCustomStart, setAppliedCustomStart] = useState('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartUrls, setChartUrls] = useState({});
  const [chartErrors, setChartErrors] = useState({});
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [openTables, setOpenTables] = useState({});
  const [showSecondaryCharts, setShowSecondaryCharts] = useState(false);

  // 4 Primary Visualizations strictly matching design specification
  const primaryCharts = useMemo(() => [
    {
      key: 'volume_over_time',
      title: 'Ticket Volume Over Time',
      subtitle: 'Daily grievance intake rate and volume trajectory',
      icon: TrendingUp,
      iconColor: 'text-purple-600 bg-purple-50',
    },
    {
      key: 'status_distribution',
      title: 'Tickets by Resolution Status',
      subtitle: 'Current lifecycle distribution across all support stages',
      icon: ShieldCheck,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      key: 'department_workload',
      title: 'Department Active Workload',
      subtitle: 'Ranked ticket allocation and operational capacity across teams',
      icon: Building2,
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
    {
      key: 'resolution_time',
      title: 'Resolution Time Distribution',
      subtitle: 'Duration spread from customer intake to verified resolution',
      icon: Clock,
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
  ], []);

  // Secondary breakdown charts
  const secondaryCharts = useMemo(() => [
    {
      key: 'category_distribution',
      title: 'Complaint Categories Breakdown',
      subtitle: 'Root causes and complaint categorization taxonomy',
      icon: Layers,
      iconColor: 'text-amber-600 bg-amber-50',
    },
    {
      key: 'priority_distribution',
      title: 'Priority Level Allocation',
      subtitle: 'Urgency distribution between High, Medium, and Low tiers',
      icon: PieChart,
      iconColor: 'text-rose-600 bg-rose-50',
    },
  ], []);

  const allCharts = useMemo(() => [...primaryCharts, ...secondaryCharts], [primaryCharts, secondaryCharts]);

  // Toggle table visibility for a specific chart
  const toggleTable = (chartKey) => {
    setOpenTables((prev) => ({
      ...prev,
      [chartKey]: !prev[chartKey],
    }));
  };

  // Load KPI summary from backend
  const loadSummary = useCallback(async () => {
    if (!authToken) return;
    setIsLoadingSummary(true);
    setGlobalError(null);

    const isCustom = dateRange === 'custom';
    const startDate = isCustom ? appliedCustomStart : null;
    const endDate = isCustom ? appliedCustomEnd : null;

    try {
      const data = await api.getAdminAnalytics(authToken, {
        range: dateRange,
        startDate,
        endDate,
      });
      setSummary(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
      setGlobalError(err.message || 'Failed to compute analytics summary from database.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [authToken, dateRange, appliedCustomStart, appliedCustomEnd]);

  // Load an individual chart PNG
  const loadSingleChart = useCallback(async (chartKey) => {
    if (!authToken) return;

    setLoadingCharts((prev) => ({ ...prev, [chartKey]: true }));
    setChartErrors((prev) => ({ ...prev, [chartKey]: null }));

    const isCustom = dateRange === 'custom';
    const startDate = isCustom ? appliedCustomStart : null;
    const endDate = isCustom ? appliedCustomEnd : null;

    try {
      const url = await api.fetchChartBlob(authToken, chartKey, {
        range: dateRange,
        startDate,
        endDate,
      });

      setChartUrls((prev) => {
        // Revoke prior blob URL if existing to prevent memory leak
        if (prev[chartKey] && prev[chartKey].startsWith('blob:')) {
          URL.revokeObjectURL(prev[chartKey]);
        }
        return { ...prev, [chartKey]: url };
      });
    } catch (err) {
      console.error(`Chart load failed for ${chartKey}:`, err);
      setChartErrors((prev) => ({
        ...prev,
        [chartKey]: err.message || 'Chart visualization render failed.',
      }));
    } finally {
      setLoadingCharts((prev) => ({ ...prev, [chartKey]: false }));
    }
  }, [authToken, dateRange, appliedCustomStart, appliedCustomEnd]);

  // Load all charts concurrently
  const loadAllCharts = useCallback(() => {
    allCharts.forEach((c) => loadSingleChart(c.key));
  }, [allCharts, loadSingleChart]);

  // Master refresh
  const handleRefresh = useCallback(() => {
    loadSummary();
    loadAllCharts();
  }, [loadSummary, loadAllCharts]);

  // Trigger load on date range change
  useEffect(() => {
    if (dateRange !== 'custom') {
      loadSummary();
      loadAllCharts();
    }
  }, [dateRange, loadSummary, loadAllCharts]);

  // Apply custom dates
  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customStart) return;
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);
  };

  useEffect(() => {
    if (dateRange === 'custom' && appliedCustomStart) {
      loadSummary();
      loadAllCharts();
    }
  }, [dateRange, appliedCustomStart, appliedCustomEnd, loadSummary, loadAllCharts]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(chartUrls).forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const anyLoading = isLoadingSummary || Object.values(loadingCharts).some(Boolean);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header & Business-Oriented Subtitle */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Analytics &amp; Performance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational intelligence, volume trends, resolution velocity, and department capacity across customer grievance workflows.
          </p>
        </div>

        {/* Refresh & Last Updated Timestamp */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-medium text-slate-400 block">
              Last updated
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={anyLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer disabled:opacity-50"
            title="Refresh analytics and charts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
            <span>{anyLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Unified Date Range Filter Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 px-1">Date Range:</span>
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold text-slate-600">
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' },
            ].map((tab) => {
              const active = dateRange === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDateRange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    active
                      ? 'bg-primary-600 text-white font-bold shadow-xs'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Synchronized date window indicator */}
        <div className="text-[11px] text-slate-500 px-1 font-medium">
          {dateRange === '7d' && 'Showing data from the past 7 days'}
          {dateRange === '30d' && 'Showing data from the past 30 days'}
          {dateRange === '90d' && 'Showing data from the past 90 days'}
          {dateRange === 'all' && 'Showing all historical tickets across the database'}
          {dateRange === 'custom' && appliedCustomStart && (
            <span>
              Range: <strong className="text-slate-800">{appliedCustomStart}</strong> to{' '}
              <strong className="text-slate-800">{appliedCustomEnd || 'Present'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {dateRange === 'custom' && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-4 bg-primary-50/50 border border-primary-100 rounded-2xl flex flex-wrap items-center gap-4 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Start Date:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-700 transition cursor-pointer shadow-xs"
          >
            Apply Range
          </button>

          {(!customStart || (appliedCustomStart !== customStart)) && (
            <span className="text-[11px] text-amber-700 font-medium">
              Click &quot;Apply Range&quot; to compute statistics.
            </span>
          )}
        </form>
      )}

      {/* Global Error Banner if API Fails */}
      {globalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 font-semibold rounded-lg hover:bg-rose-100 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Four Core KPI Cards */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Period Volume */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary-200 transition group relative">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Period Volume</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoadingSummary ? '...' : (summary?.total_volume?.toLocaleString() ?? 0)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Total registered grievances</span>
            <span
              className="text-slate-400 hover:text-slate-600 cursor-help"
              title="Total number of customer voice and manual tickets created within the selected timeframe."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 2: Escalation Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-200 transition group relative">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Escalation Rate</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.escalation_rate ?? 0}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              {summary ? `${summary.escalated_tickets} of ${summary.total_volume} flagged` : 'Supervisor review required'}
            </span>
            <span
              className="text-slate-400 hover:text-slate-600 cursor-help"
              title="Percentage of tickets flagged for immediate supervisor intervention or priority review."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 3: Resolution Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition group relative">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Resolution Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.resolution_rate ?? 0}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              {summary ? `${summary.resolved_tickets} of ${summary.total_volume} completed` : 'Successfully completed'}
            </span>
            <span
              className="text-slate-400 hover:text-slate-600 cursor-help"
              title="Percentage of tickets in this timeframe marked as resolved by support agents."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 4: Avg Resolution Time */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition group relative">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Average Resolution Time</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.avg_resolution_hours ?? 0}h`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              {summary?.median_resolution_hours !== undefined
                ? `Median: ${summary.median_resolution_hours}h (${summary.resolved_tickets_count || 0} resolved)`
                : 'Mean hours to resolution'}
            </span>
            <span
              className="text-slate-400 hover:text-slate-600 cursor-help"
              title="Average elapsed time (in hours) between complaint intake and final ticket resolution."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. The 4 Primary Visualizations (2x2 Grid) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {primaryCharts.map((chart) => {
          const Icon = chart.icon;
          const imgUrl = chartUrls[chart.key];
          const isLoading = loadingCharts[chart.key];
          const errorMsg = chartErrors[chart.key];
          const isTableOpen = openTables[chart.key];

          return (
            <div
              key={chart.key}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${chart.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {chart.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {chart.subtitle}
                    </p>
                  </div>
                </div>

                {/* Accessible Data Table Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleTable(chart.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer shrink-0 ${
                    isTableOpen
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-expanded={isTableOpen}
                  title="Toggle accessible raw data table"
                >
                  <Table2 className="w-3 h-3" />
                  <span>{isTableOpen ? 'Hide Table' : 'Data Table'}</span>
                  {isTableOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Chart Visual Container */}
              <div className="my-3 relative min-h-[260px] bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                {isLoading ? (
                  <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center gap-3 bg-slate-50/70 p-6 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="text-xs font-medium text-slate-500">
                      Generating visualization...
                    </span>
                  </div>
                ) : errorMsg ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      Visualization failed to render
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-xs">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => loadSingleChart(chart.key)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 shadow-2xs transition"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={chart.title}
                    className="w-full h-auto object-contain rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
                    <span>No data available for selected period</span>
                  </div>
                )}
              </div>

              {/* Accessible Data Table Dropdown */}
              {isTableOpen && (
                <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 text-primary-600" />
                    <span>Accessible Data Breakdown</span>
                  </div>

                  {/* Volume Over Time Table */}
                  {chart.key === 'volume_over_time' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                          <tr>
                            <th className="py-1.5 px-3">Date</th>
                            <th className="py-1.5 px-3 text-right">Tickets Ingested</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary?.daily_trends && summary.daily_trends.length > 0 ? (
                            summary.daily_trends.map((item) => (
                              <tr key={item.date} className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-medium text-slate-700">{item.date}</td>
                                <td className="py-1.5 px-3 text-right font-bold text-slate-900">{item.count}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-3 px-3 text-center text-slate-400">
                                No trend data available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Status Distribution Table */}
                  {chart.key === 'status_distribution' && (
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="py-2 px-3">Lifecycle Status</th>
                            <th className="py-2 px-3 text-right">Count</th>
                            <th className="py-2 px-3 text-right">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary?.status_table ? (
                            summary.status_table.map((row) => (
                              <tr key={row.status} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                    style={{ backgroundColor: row.color }}
                                  />
                                  <span className="font-semibold text-slate-800">{row.status}</span>
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{row.count}</td>
                                <td className="py-2 px-3 text-right text-slate-600 font-medium">{row.percentage}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-3 px-3 text-center text-slate-400">
                                No status data.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Department Workload Table */}
                  {chart.key === 'department_workload' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Department Name</th>
                            <th className="py-2 px-3 text-right">Assigned Tickets</th>
                            <th className="py-2 px-3 text-right">% Workload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary?.department_table && summary.department_table.length > 0 ? (
                            summary.department_table.map((row) => (
                              <tr key={row.department} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-800">{row.department}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{row.count}</td>
                                <td className="py-2 px-3 text-right text-slate-600 font-medium">{row.percentage}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-3 px-3 text-center text-slate-400">
                                No department data available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Resolution Time Distribution Table */}
                  {chart.key === 'resolution_time' && (
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="py-2 px-3">Metric</th>
                            <th className="py-2 px-3 text-right">Value</th>
                            <th className="py-2 px-3 text-slate-500 font-normal">Context</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">Mean Duration</td>
                            <td className="py-2 px-3 text-right font-bold text-rose-600">{summary?.avg_resolution_hours ?? 0} hrs</td>
                            <td className="py-2 px-3 text-slate-500">Average resolution turnaround</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">Median Duration</td>
                            <td className="py-2 px-3 text-right font-bold text-blue-600">{summary?.median_resolution_hours ?? 0} hrs</td>
                            <td className="py-2 px-3 text-slate-500">50th percentile cycle time</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">Resolved Sample (N)</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">{summary?.resolved_tickets_count ?? 0}</td>
                            <td className="py-2 px-3 text-slate-500">Completed tickets evaluated</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. Optional Secondary Demographics Toggle (Category & Priority) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowSecondaryCharts((prev) => !prev)}
          className="w-full py-3 px-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>Additional Demographics (Complaint Category &amp; Priority Allocation)</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary-600 font-semibold text-[11px]">
            <span>{showSecondaryCharts ? 'Hide Additional Charts' : 'View Additional Charts'}</span>
            {showSecondaryCharts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showSecondaryCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 animate-in fade-in duration-200">
            {secondaryCharts.map((chart) => {
              const Icon = chart.icon;
              const imgUrl = chartUrls[chart.key];
              const isLoading = loadingCharts[chart.key];
              const errorMsg = chartErrors[chart.key];

              return (
                <div
                  key={chart.key}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${chart.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {chart.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {chart.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="my-3 relative min-h-[260px] bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                    {isLoading ? (
                      <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center gap-3 bg-slate-50/70 p-6 animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        <span className="text-xs font-medium text-slate-500">
                          Rendering visualization...
                        </span>
                      </div>
                    ) : errorMsg ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                        <span className="text-xs font-semibold text-slate-700">
                          Render notice
                        </span>
                        <p className="text-[11px] text-slate-400 max-w-xs">{errorMsg}</p>
                      </div>
                    ) : imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={chart.title}
                        className="w-full h-auto object-contain rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">No data available</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
