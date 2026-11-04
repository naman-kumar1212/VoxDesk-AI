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
      iconColor: 'text-brand bg-brand-subtle',
    },
    {
      key: 'status_distribution',
      title: 'Tickets by Resolution Status',
      subtitle: 'Current lifecycle distribution across all support stages',
      icon: ShieldCheck,
      iconColor: 'text-[#2563EB] bg-[#EFF6FF]',
    },
    {
      key: 'department_workload',
      title: 'Department Active Workload',
      subtitle: 'Ranked ticket allocation and operational capacity across teams',
      icon: Building2,
      iconColor: 'text-slate-700 bg-surface-muted',
    },
    {
      key: 'resolution_time',
      title: 'Resolution Time Distribution',
      subtitle: 'Duration spread from customer intake to verified resolution',
      icon: Clock,
      iconColor: 'text-[#15803D] bg-[#ECFDF3]',
    },
  ], []);

  // Secondary breakdown charts
  const secondaryCharts = useMemo(() => [
    {
      key: 'category_distribution',
      title: 'Complaint Categories Breakdown',
      subtitle: 'Root causes and complaint categorization taxonomy',
      icon: Layers,
      iconColor: 'text-[#B45309] bg-[#FFFBEB]',
    },
    {
      key: 'priority_distribution',
      title: 'Priority Level Allocation',
      subtitle: 'Urgency distribution between High, Medium, and Low tiers',
      icon: PieChart,
      iconColor: 'text-[#B91C1C] bg-[#FEF2F2]',
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
  const loadSummary = useCallback(async (params, bypassCache = false) => {
    if (!authToken) return;
    setIsLoadingSummary(true);
    setGlobalError(null);
    try {
      const data = await api.getAnalyticsSummary(authToken, { ...params, bypassCache });
      setSummary(data);
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
      setGlobalError(err.message || 'Unable to retrieve analytical summary metrics.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [authToken]);

  // Load a single chart image
  const loadSingleChart = useCallback(async (chartKey, params, bypassCache = false) => {
    if (!authToken) return;
    setLoadingCharts((prev) => ({ ...prev, [chartKey]: true }));
    setChartErrors((prev) => ({ ...prev, [chartKey]: null }));

    try {
      const blob = await api.getAnalyticsChart(authToken, chartKey, { ...params, bypassCache });
      const objectUrl = URL.createObjectURL(blob);
      setChartUrls((prev) => {
        if (prev[chartKey]) {
          URL.revokeObjectURL(prev[chartKey]);
        }
        return { ...prev, [chartKey]: objectUrl };
      });
    } catch (err) {
      console.error(`Chart generation failed for ${chartKey}:`, err);
      setChartErrors((prev) => ({
        ...prev,
        [chartKey]: err.message || 'Failed to render visualization.',
      }));
    } finally {
      setLoadingCharts((prev) => ({ ...prev, [chartKey]: false }));
    }
  }, [authToken]);

  // Synchronized parameters from filter states
  const getFilterParams = useCallback(() => {
    const params = { range: dateRange };
    if (dateRange === 'custom') {
      if (appliedCustomStart) params.start_date = appliedCustomStart;
      if (appliedCustomEnd) params.end_date = appliedCustomEnd;
    }
    return params;
  }, [dateRange, appliedCustomStart, appliedCustomEnd]);

  // Master fetch coordinator
  const refreshAll = useCallback(async (bypassCache = false) => {
    const params = getFilterParams();
    setLastRefreshed(new Date());

    loadSummary(params, bypassCache);

    primaryCharts.forEach((chart) => {
      loadSingleChart(chart.key, params, bypassCache);
    });

    if (showSecondaryCharts) {
      secondaryCharts.forEach((chart) => {
        loadSingleChart(chart.key, params, bypassCache);
      });
    }
  }, [getFilterParams, loadSummary, loadSingleChart, primaryCharts, secondaryCharts, showSecondaryCharts]);

  useEffect(() => {
    if (dateRange !== 'custom') {
      refreshAll();
    }
  }, [dateRange, refreshAll]);

  useEffect(() => {
    if (showSecondaryCharts) {
      const params = getFilterParams();
      secondaryCharts.forEach((chart) => {
        if (!chartUrls[chart.key] && !loadingCharts[chart.key]) {
          loadSingleChart(chart.key, params);
        }
      });
    }
  }, [showSecondaryCharts, getFilterParams, secondaryCharts, chartUrls, loadingCharts, loadSingleChart]);

  // Clean up ObjectURLs on unmount
  useEffect(() => {
    return () => {
      Object.values(chartUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customStart) return;
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);

    const params = {
      range: 'custom',
      start_date: customStart,
      end_date: customEnd,
    };
    loadSummary(params, true);
    primaryCharts.forEach((chart) => loadSingleChart(chart.key, params, true));
    if (showSecondaryCharts) {
      secondaryCharts.forEach((chart) => loadSingleChart(chart.key, params, true));
    }
    setLastRefreshed(new Date());
  };

  const handleRefresh = () => {
    refreshAll(true);
  };

  const anyLoading = isLoadingSummary || Object.values(loadingCharts).some(Boolean);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header & Context */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            Analytics &amp; Performance
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Operational intelligence, volume trends, resolution velocity, and department capacity across customer grievance workflows.
          </p>
        </div>

        {/* Refresh & Last Updated Timestamp */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-medium text-muted-text block">
              Last updated
            </span>
            <span className="text-xs font-semibold text-primary-text font-mono">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={anyLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-btn text-xs font-medium text-slate-700 shadow-xs hover:bg-surface-subtle transition cursor-pointer disabled:opacity-50"
            title="Refresh analytics and charts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin text-brand' : 'text-slate-500'}`} />
            <span>{anyLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Unified Date Range Filter Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-card p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary-text px-1">Date Range:</span>
          <div className="bg-surface-muted p-1 rounded-btn flex items-center text-xs font-medium text-slate-600">
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
                  className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer ${
                    active
                      ? 'bg-brand text-white font-semibold shadow-xs'
                      : 'hover:text-primary-text text-secondary-text'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Synchronized date window indicator */}
        <div className="text-[11px] text-muted-text px-1 font-medium">
          {dateRange === '7d' && 'Showing data from the past 7 days'}
          {dateRange === '30d' && 'Showing data from the past 30 days'}
          {dateRange === '90d' && 'Showing data from the past 90 days'}
          {dateRange === 'all' && 'Showing all historical tickets across the database'}
          {dateRange === 'custom' && appliedCustomStart && (
            <span>
              Range: <strong className="text-primary-text font-mono">{appliedCustomStart}</strong> to{' '}
              <strong className="text-primary-text font-mono">{appliedCustomEnd || 'Present'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {dateRange === 'custom' && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-4 bg-surface border border-border rounded-card flex flex-wrap items-center gap-4 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary-text">Start Date:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-surface border border-border rounded-input px-3 py-1.5 text-primary-text text-xs focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary-text">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-surface border border-border rounded-input px-3 py-1.5 text-primary-text text-xs focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-brand text-white font-semibold rounded-btn text-xs hover:bg-brand-hover transition cursor-pointer shadow-xs"
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-card flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-surface border border-rose-200 text-rose-700 font-semibold rounded-btn hover:bg-rose-100 transition cursor-pointer"
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
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition group relative">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-text">
            <span>Period Volume</span>
            <div className="p-2 rounded-btn bg-surface-muted text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-primary-text font-mono tracking-tight">
              {isLoadingSummary ? '...' : (summary?.total_volume?.toLocaleString() ?? 0)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary-text pt-2 border-t border-border">
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
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition group relative">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-text">
            <span>Escalation Rate</span>
            <div className="p-2 rounded-btn bg-[#FEF2F2] text-[#B91C1C]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#B91C1C] font-mono tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.escalation_rate ?? 0}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary-text pt-2 border-t border-border">
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
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition group relative">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-text">
            <span>Resolution Rate</span>
            <div className="p-2 rounded-btn bg-[#ECFDF3] text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#15803D] font-mono tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.resolution_rate ?? 0}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary-text pt-2 border-t border-border">
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
        <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition group relative">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-text">
            <span>Average Resolution Time</span>
            <div className="p-2 rounded-btn bg-[#EFF6FF] text-[#2563EB]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#2563EB] font-mono tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.avg_resolution_hours ?? 0}h`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary-text pt-2 border-t border-border">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {primaryCharts.map((chart) => {
          const Icon = chart.icon;
          const imgUrl = chartUrls[chart.key];
          const isLoading = loadingCharts[chart.key];
          const errorMsg = chartErrors[chart.key];
          const isTableOpen = openTables[chart.key];

          return (
            <div
              key={chart.key}
              className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col hover:border-slate-300 transition"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-btn shrink-0 ${chart.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-text tracking-tight">
                      {chart.title}
                    </h3>
                    <p className="text-[11px] text-secondary-text mt-0.5">
                      {chart.subtitle}
                    </p>
                  </div>
                </div>

                {/* Accessible Data Table Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleTable(chart.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-btn border transition cursor-pointer shrink-0 ${
                    isTableOpen
                      ? 'bg-brand-subtle text-brand border-brand/30'
                      : 'bg-surface-subtle text-slate-600 border-border hover:bg-surface-muted hover:text-primary-text'
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
              <div className="my-3 relative min-h-[300px] bg-surface rounded-xl overflow-hidden flex items-center justify-center border border-border">
                {isLoading ? (
                  <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-surface-subtle/70 p-6 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    <span className="text-xs font-medium text-muted-text">
                      Generating visualization...
                    </span>
                  </div>
                ) : errorMsg ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                    <span className="text-xs font-semibold text-rose-700">
                      Visualization failed to render
                    </span>
                    <p className="text-[11px] text-muted-text max-w-xs">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => loadSingleChart(chart.key)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-border text-xs font-semibold text-slate-700 rounded-btn hover:bg-surface-subtle shadow-xs transition"
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
                  <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-text">
                    <span>No data available for selected period</span>
                  </div>
                )}
              </div>

              {/* Accessible Data Table Dropdown */}
              {isTableOpen && (
                <div className="mt-3 pt-3 border-t border-border animate-in fade-in duration-150">
                  <div className="text-[11px] font-semibold text-primary-text mb-2 flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 text-brand" />
                    <span>Accessible Data Breakdown</span>
                  </div>

                  {/* Volume Over Time Table */}
                  {chart.key === 'volume_over_time' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-surface-subtle text-muted-text font-semibold sticky top-0">
                          <tr>
                            <th className="py-1.5 px-3">Date</th>
                            <th className="py-1.5 px-3 text-right">Tickets Ingested</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {summary?.daily_trends && summary.daily_trends.length > 0 ? (
                            summary.daily_trends.map((item) => (
                              <tr key={item.date} className="hover:bg-surface-subtle/50">
                                <td className="py-1.5 px-3 font-medium text-primary-text font-mono">{item.date}</td>
                                <td className="py-1.5 px-3 text-right font-bold text-primary-text font-mono">{item.count}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-3 px-3 text-center text-muted-text">
                                No volume data logged in this timeframe
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Status Distribution Table */}
                  {chart.key === 'status_distribution' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-surface-subtle text-muted-text font-semibold sticky top-0">
                          <tr>
                            <th className="py-1.5 px-3">Status Lifecycle</th>
                            <th className="py-1.5 px-3 text-right">Ticket Count</th>
                            <th className="py-1.5 px-3 text-right">Proportion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {[
                            { label: 'Open', count: summary?.open_tickets ?? 0, color: 'text-slate-600' },
                            { label: 'In Progress', count: summary?.in_progress_tickets ?? 0, color: 'text-blue-600' },
                            { label: 'Resolved', count: summary?.resolved_tickets ?? 0, color: 'text-emerald-600' },
                            { label: 'Escalated', count: summary?.escalated_tickets ?? 0, color: 'text-rose-600' },
                          ].map((row) => {
                            const tot = summary?.total_volume || 1;
                            const pct = Math.round((row.count / tot) * 100);
                            return (
                              <tr key={row.label} className="hover:bg-surface-subtle/50">
                                <td className="py-1.5 px-3 font-semibold text-primary-text">{row.label}</td>
                                <td className={`py-1.5 px-3 text-right font-mono font-bold ${row.color}`}>{row.count}</td>
                                <td className="py-1.5 px-3 text-right text-muted-text font-mono">{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Department Workload Table */}
                  {chart.key === 'department_workload' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-surface-subtle text-muted-text font-semibold sticky top-0">
                          <tr>
                            <th className="py-1.5 px-3">Department Name</th>
                            <th className="py-1.5 px-3 text-right">Assigned Tickets</th>
                            <th className="py-1.5 px-3 text-right">% Workload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {summary?.department_breakdown && summary.department_breakdown.length > 0 ? (
                            summary.department_breakdown.map((d) => {
                              const tot = summary.department_breakdown.reduce((acc, curr) => acc + curr.count, 0) || 1;
                              const pct = ((d.count / tot) * 100).toFixed(1);
                              return (
                                <tr key={d.name} className="hover:bg-surface-subtle/50">
                                  <td className="py-1.5 px-3 font-semibold text-primary-text">{d.name}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-primary-text">{d.count}</td>
                                  <td className="py-1.5 px-3 text-right font-mono text-muted-text">{pct}%</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-3 px-3 text-center text-muted-text">
                                No department workload data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Resolution Time Distribution Table */}
                  {chart.key === 'resolution_time' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-surface-subtle text-muted-text font-semibold sticky top-0">
                          <tr>
                            <th className="py-1.5 px-3">Metric Parameter</th>
                            <th className="py-1.5 px-3 text-right">Value (Hours)</th>
                            <th className="py-1.5 px-3 text-slate-500">Benchmark Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr className="hover:bg-surface-subtle/50">
                            <td className="py-2 px-3 font-semibold text-primary-text">Mean Duration</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#2563EB]">{summary?.avg_resolution_hours ?? 0}h</td>
                            <td className="py-2 px-3 text-muted-text">Arithmetic average for period</td>
                          </tr>
                          <tr className="hover:bg-surface-subtle/50">
                            <td className="py-2 px-3 font-semibold text-primary-text">Median Duration</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-brand">{summary?.median_resolution_hours ?? 0}h</td>
                            <td className="py-2 px-3 text-muted-text">50th percentile cycle time</td>
                          </tr>
                          <tr className="hover:bg-surface-subtle/50">
                            <td className="py-2 px-3 font-semibold text-primary-text">Resolved Sample (N)</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#15803D]">{summary?.resolved_tickets_count ?? 0}</td>
                            <td className="py-2 px-3 text-muted-text">Completed tickets evaluated</td>
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
          className="w-full py-3 px-4 bg-surface border border-border rounded-card flex items-center justify-between text-xs font-semibold text-primary-text hover:bg-surface-subtle transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Additional Demographics (Complaint Category &amp; Priority Allocation)</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand font-semibold text-[11px]">
            <span>{showSecondaryCharts ? 'Hide Additional Charts' : 'View Additional Charts'}</span>
            {showSecondaryCharts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showSecondaryCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-4 animate-in fade-in duration-200">
            {secondaryCharts.map((chart) => {
              const Icon = chart.icon;
              const imgUrl = chartUrls[chart.key];
              const isLoading = loadingCharts[chart.key];
              const errorMsg = chartErrors[chart.key];

              return (
                <div
                  key={chart.key}
                  className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-border">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-btn shrink-0 ${chart.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-primary-text tracking-tight">
                          {chart.title}
                        </h3>
                        <p className="text-[11px] text-secondary-text mt-0.5">
                          {chart.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="my-3 relative min-h-[300px] bg-surface rounded-xl overflow-hidden flex items-center justify-center border border-border">
                    {isLoading ? (
                      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-surface-subtle/70 p-6 animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                        <span className="text-xs font-medium text-muted-text">
                          Rendering visualization...
                        </span>
                      </div>
                    ) : errorMsg ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-700">
                          Render notice
                        </span>
                        <p className="text-[11px] text-muted-text max-w-xs">{errorMsg}</p>
                      </div>
                    ) : imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={chart.title}
                        className="w-full h-auto object-contain rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-xs text-muted-text">No data available</div>
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
