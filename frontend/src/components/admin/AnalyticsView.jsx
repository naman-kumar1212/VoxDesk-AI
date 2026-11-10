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
      iconColor: 'text-[#533AFD] bg-[#533AFD]/10',
    },
    {
      key: 'status_distribution',
      title: 'Tickets by Resolution Status',
      subtitle: 'Current lifecycle distribution across all support stages',
      icon: ShieldCheck,
      iconColor: 'text-[#0073E6] bg-[#0073E6]/10',
    },
    {
      key: 'department_workload',
      title: 'Department Active Workload',
      subtitle: 'Ranked ticket allocation and operational capacity across teams',
      icon: Building2,
      iconColor: 'text-[#061B31] bg-[#F6F9FC]',
    },
    {
      key: 'resolution_time',
      title: 'Resolution Time Distribution',
      subtitle: 'Duration spread from customer intake to verified resolution',
      icon: Clock,
      iconColor: 'text-[#00D66F] bg-[#00D66F]/10',
    },
  ], []);

  // Secondary breakdown charts
  const secondaryCharts = useMemo(() => [
    {
      key: 'category_distribution',
      title: 'Complaint Categories Breakdown',
      subtitle: 'Root causes and complaint categorization taxonomy',
      icon: Layers,
      iconColor: 'text-[#FF6118] bg-[#FF6118]/10',
    },
    {
      key: 'priority_distribution',
      title: 'Priority Level Allocation',
      subtitle: 'Urgency distribution between High, Medium, and Low tiers',
      icon: PieChart,
      iconColor: 'text-[#DF1B41] bg-[#DF1B41]/10',
    },
  ], []);

  // Toggle table visibility for a specific chart
  const toggleTable = (chartKey) => {
    setOpenTables((prev) => ({
      ...prev,
      [chartKey]: !prev[chartKey],
    }));
  };

  // Load KPI summary from backend
  const loadSummary = useCallback(
    async (params = {}, bypassCache = false) => {
      if (!authToken) return;
      setIsLoadingSummary(true);
      setGlobalError(null);
      try {
        const data = await api.getAnalyticsSummary(authToken, params, { bypassCache });
        setSummary(data);
      } catch (err) {
        console.error('Failed to load analytics summary:', err);
        setGlobalError(err.message || 'Unable to retrieve analytics summary.');
      } finally {
        setIsLoadingSummary(false);
      }
    },
    [authToken]
  );

  // Load single Matplotlib chart blob from backend
  const loadSingleChart = useCallback(
    async (chartType, params = {}, bypassCache = false) => {
      if (!authToken) return;
      setLoadingCharts((prev) => ({ ...prev, [chartType]: true }));
      setChartErrors((prev) => ({ ...prev, [chartType]: null }));
      try {
        const objectUrl = await api.getAnalyticsChart(authToken, chartType, params, { bypassCache });
        setChartUrls((prev) => ({ ...prev, [chartType]: objectUrl }));
      } catch (err) {
        console.error(`Failed to load chart [${chartType}]:`, err);
        setChartErrors((prev) => ({
          ...prev,
          [chartType]: err.message || 'Chart visual generation unavailable.',
        }));
      } finally {
        setLoadingCharts((prev) => ({ ...prev, [chartType]: false }));
      }
    },
    [authToken]
  );

  // Unified refresh of all charts & KPIs
  const refreshAll = useCallback(
    (bypassCache = false) => {
      const params = {};
      if (dateRange === 'custom') {
        if (!appliedCustomStart) return;
        params.range = 'custom';
        params.start_date = appliedCustomStart;
        if (appliedCustomEnd) params.end_date = appliedCustomEnd;
      } else {
        params.range = dateRange;
      }

      loadSummary(params, bypassCache);
      primaryCharts.forEach((chart) => {
        loadSingleChart(chart.key, params, bypassCache);
      });
      if (showSecondaryCharts) {
        secondaryCharts.forEach((chart) => {
          loadSingleChart(chart.key, params, bypassCache);
        });
      }
      setLastRefreshed(new Date());
    },
    [dateRange, appliedCustomStart, appliedCustomEnd, primaryCharts, secondaryCharts, showSecondaryCharts, loadSummary, loadSingleChart]
  );

  // Trigger load when dateRange preset changes
  useEffect(() => {
    if (dateRange !== 'custom') {
      refreshAll();
    }
  }, [dateRange, refreshAll]);

  // Load secondary charts when expanded
  useEffect(() => {
    if (showSecondaryCharts) {
      const params = dateRange === 'custom'
        ? { range: 'custom', start_date: appliedCustomStart, end_date: appliedCustomEnd }
        : { range: dateRange };

      secondaryCharts.forEach((chart) => {
        if (!chartUrls[chart.key] && !loadingCharts[chart.key]) {
          loadSingleChart(chart.key, params);
        }
      });
    }
  }, [showSecondaryCharts, dateRange, appliedCustomStart, appliedCustomEnd, secondaryCharts, chartUrls, loadingCharts, loadSingleChart]);

  // Handle custom date submission
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E3ECF7]">
        <div>
          <h1 className="text-2xl font-semibold text-[#061B31] tracking-[-0.03em]">
            Analytics &amp; Performance
          </h1>
          <p className="text-xs text-[#425466] mt-0.5">
            Operational intelligence, volume trends, resolution velocity, and department capacity across customer grievance workflows.
          </p>
        </div>

        {/* Refresh & Last Updated Timestamp */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-medium text-[#737373] block">
              Last updated
            </span>
            <span className="text-xs font-semibold text-[#061B31] font-mono tabular-nums">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={anyLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#D4DEE9] rounded-full text-xs font-semibold text-[#061B31] shadow-sm hover:bg-[#F6F9FC] transition cursor-pointer disabled:opacity-50"
            title="Refresh analytics and charts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin text-[#533AFD]' : 'text-[#737373]'}`} />
            <span>{anyLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Unified Date Range Filter Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-3 sm:p-4 shadow-[0_4px_12px_rgba(13,23,56,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#061B31] px-1">Date Range:</span>
          <div className="bg-[#F6F9FC] p-1 rounded-full flex flex-wrap items-center text-xs font-medium border border-[#E3ECF7]">
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
                  className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-[#533AFD] text-white font-semibold shadow-sm'
                      : 'hover:text-[#061B31] text-[#425466]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Synchronized date window indicator */}
        <div className="text-[11px] text-[#737373] px-1 font-mono">
          {dateRange === '7d' && 'Past 7 days'}
          {dateRange === '30d' && 'Past 30 days'}
          {dateRange === '90d' && 'Past 90 days'}
          {dateRange === 'all' && 'All historical records'}
          {dateRange === 'custom' && appliedCustomStart && (
            <span>
              Range: <strong className="text-[#061B31]">{appliedCustomStart}</strong> to{' '}
              <strong className="text-[#061B31]">{appliedCustomEnd || 'Present'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {dateRange === 'custom' && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-4 bg-white border border-[#D4DEE9]/80 rounded-[14px] flex flex-wrap items-center gap-4 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#061B31]">Start Date:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-[#D4DEE9] rounded-[4px] px-3 py-1.5 text-[#061B31] text-xs focus:ring-2 focus:ring-[#0570DE]/15 focus:border-[#0570DE] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#061B31]">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-[#D4DEE9] rounded-[4px] px-3 py-1.5 text-[#061B31] text-xs focus:ring-2 focus:ring-[#0570DE]/15 focus:border-[#0570DE] outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#533AFD] text-white font-semibold rounded-full text-xs hover:bg-[#635BFF] transition cursor-pointer shadow-sm"
          >
            Apply Range
          </button>

          {(!customStart || (appliedCustomStart !== customStart)) && (
            <span className="text-[11px] text-[#FF6118] font-medium">
              Click &quot;Apply Range&quot; to compute statistics.
            </span>
          )}
        </form>
      )}

      {/* Global Error Banner */}
      {globalError && (
        <div className="p-4 bg-[#FFF1F2] border border-[#FECDD3] rounded-[14px] flex items-center justify-between text-xs text-[#DF1B41]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DF1B41] shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-white border border-[#FECDD3] text-[#DF1B41] font-semibold rounded-full hover:bg-[#FFF1F2] transition cursor-pointer"
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
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 shadow-[0_8px_20px_rgba(13,23,56,0.08)] flex flex-col justify-between hover:border-[#533AFD]/40 transition group relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
            <span>Period Volume</span>
            <div className="p-2 rounded-full bg-[#F6F9FC] text-[#061B31]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#061B31] font-mono tabular-nums tracking-tight">
              {isLoadingSummary ? '...' : (summary?.total_volume?.toLocaleString() ?? 0)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#425466] pt-2 border-t border-[#E3ECF7]">
            <span>Total registered grievances</span>
            <span
              className="text-[#737373] hover:text-[#061B31] cursor-help"
              title="Total number of customer voice and manual tickets created within the selected timeframe."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 2: Escalation Rate */}
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 shadow-[0_8px_20px_rgba(13,23,56,0.08)] flex flex-col justify-between hover:border-[#533AFD]/40 transition group relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
            <span>Escalation Rate</span>
            <div className="p-2 rounded-full bg-[#FFF1F2] text-[#DF1B41]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#061B31] font-mono tabular-nums tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.escalation_rate ?? 0}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#425466] pt-2 border-t border-[#E3ECF7]">
            <span>
              {summary ? `${summary.escalated_tickets} of ${summary.total_volume} flagged` : 'Supervisor review required'}
            </span>
            <span
              className="text-[#737373] hover:text-[#061B31] cursor-help"
              title="Percentage of tickets flagged for immediate supervisor intervention or priority review."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 3: Resolution Rate */}
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 shadow-[0_8px_20px_rgba(13,23,56,0.08)] flex flex-col justify-between hover:border-[#533AFD]/40 transition group relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
            <span>Resolution Rate</span>
            <div className="p-2 rounded-full bg-[#E6F9F0] text-[#00D66F]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#061B31] font-mono tabular-nums tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.resolution_rate ?? 0}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#425466] pt-2 border-t border-[#E3ECF7]">
            <span>
              {summary ? `${summary.resolved_tickets} of ${summary.total_volume} completed` : 'Successfully completed'}
            </span>
            <span
              className="text-[#737373] hover:text-[#061B31] cursor-help"
              title="Percentage of tickets in this timeframe marked as resolved by support agents."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 4: Avg Resolution Time */}
        <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 shadow-[0_8px_20px_rgba(13,23,56,0.08)] flex flex-col justify-between hover:border-[#533AFD]/40 transition group relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
            <span>Avg Resolution Time</span>
            <div className="p-2 rounded-full bg-[#F0F7FF] text-[#0073E6]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#061B31] font-mono tabular-nums tracking-tight">
              {isLoadingSummary ? '...' : `${summary?.avg_resolution_hours ?? 0}h`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#425466] pt-2 border-t border-[#E3ECF7]">
            <span className="font-mono">
              {summary?.median_resolution_hours !== undefined
                ? `Median: ${summary.median_resolution_hours}h`
                : 'Mean hours to resolution'}
            </span>
            <span
              className="text-[#737373] hover:text-[#061B31] cursor-help"
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
              className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(13,23,56,0.08)] flex flex-col hover:border-[#533AFD]/30 transition"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E3ECF7]">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full shrink-0 ${chart.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#061B31] tracking-tight">
                      {chart.title}
                    </h3>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      {chart.subtitle}
                    </p>
                  </div>
                </div>

                {/* Accessible Data Table Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleTable(chart.key)}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-full border transition cursor-pointer shrink-0 ${
                    isTableOpen
                      ? 'bg-[#533AFD]/10 text-[#533AFD] border-[#533AFD]/30'
                      : 'bg-white text-[#425466] border-[#D4DEE9] hover:bg-[#F6F9FC] hover:text-[#061B31]'
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
              <div className="my-3 relative min-h-[300px] bg-[#FAFDFF] rounded-[14px] overflow-hidden flex items-center justify-center border border-[#E3ECF7]">
                {isLoading ? (
                  <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[#F8FAFD] p-6 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin text-[#533AFD]" />
                    <span className="text-xs font-semibold text-[#737373]">
                      Generating visualization...
                    </span>
                  </div>
                ) : errorMsg ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-[#DF1B41]" />
                    <span className="text-xs font-semibold text-[#DF1B41]">
                      Visualization failed to render
                    </span>
                    <p className="text-[11px] text-[#737373] max-w-xs">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => loadSingleChart(chart.key)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#D4DEE9] text-xs font-semibold text-[#061B31] rounded-full hover:bg-[#F6F9FC] shadow-sm transition"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={chart.title}
                    className="w-full h-auto object-contain rounded-[10px]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-[#737373]">
                    <span>No data available for selected period</span>
                  </div>
                )}
              </div>

              {/* Accessible Data Table Dropdown */}
              {isTableOpen && (
                <div className="mt-3 pt-3 border-t border-[#E3ECF7] animate-in fade-in duration-150">
                  <div className="text-[11px] font-semibold text-[#061B31] mb-2 flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 text-[#533AFD]" />
                    <span>Accessible Data Breakdown</span>
                  </div>

                  {/* Volume Over Time Table */}
                  {chart.key === 'volume_over_time' && (
                    <div className="max-h-48 overflow-y-auto rounded-[10px] border border-[#E3ECF7]">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-[#FAFDFF] text-[#737373] font-semibold sticky top-0 uppercase tracking-wider">
                          <tr>
                            <th className="py-1.5 px-3">Date</th>
                            <th className="py-1.5 px-3 text-right">Tickets Ingested</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3ECF7]">
                          {summary?.daily_trends && summary.daily_trends.length > 0 ? (
                            summary.daily_trends.map((item) => (
                              <tr key={item.date} className="hover:bg-[#F8FAFD]">
                                <td className="py-1.5 px-3 font-semibold text-[#061B31] font-mono">{item.date}</td>
                                <td className="py-1.5 px-3 text-right font-bold text-[#061B31] font-mono">{item.count}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-3 px-3 text-center text-[#737373]">
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
                    <div className="max-h-48 overflow-y-auto rounded-[10px] border border-[#E3ECF7]">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-[#FAFDFF] text-[#737373] font-semibold sticky top-0 uppercase tracking-wider">
                          <tr>
                            <th className="py-1.5 px-3">Status Lifecycle</th>
                            <th className="py-1.5 px-3 text-right">Ticket Count</th>
                            <th className="py-1.5 px-3 text-right">Proportion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3ECF7]">
                          {[
                            { label: 'Open', count: summary?.open_tickets ?? 0, color: 'text-[#425466]' },
                            { label: 'In Progress', count: summary?.in_progress_tickets ?? 0, color: 'text-[#0073E6]' },
                            { label: 'Resolved', count: summary?.resolved_tickets ?? 0, color: 'text-[#00D66F]' },
                            { label: 'Escalated', count: summary?.escalated_tickets ?? 0, color: 'text-[#DF1B41]' },
                          ].map((row) => {
                            const tot = summary?.total_volume || 1;
                            const pct = Math.round((row.count / tot) * 100);
                            return (
                              <tr key={row.label} className="hover:bg-[#F8FAFD]">
                                <td className="py-1.5 px-3 font-semibold text-[#061B31]">{row.label}</td>
                                <td className={`py-1.5 px-3 text-right font-mono font-bold ${row.color}`}>{row.count}</td>
                                <td className="py-1.5 px-3 text-right text-[#737373] font-mono">{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Department Workload Table */}
                  {chart.key === 'department_workload' && (
                    <div className="max-h-48 overflow-y-auto rounded-[10px] border border-[#E3ECF7]">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-[#FAFDFF] text-[#737373] font-semibold sticky top-0 uppercase tracking-wider">
                          <tr>
                            <th className="py-1.5 px-3">Department Name</th>
                            <th className="py-1.5 px-3 text-right">Assigned Tickets</th>
                            <th className="py-1.5 px-3 text-right">% Workload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3ECF7]">
                          {summary?.department_breakdown && summary.department_breakdown.length > 0 ? (
                            summary.department_breakdown.map((d) => {
                              const tot = summary.department_breakdown.reduce((acc, curr) => acc + curr.count, 0) || 1;
                              const pct = ((d.count / tot) * 100).toFixed(1);
                              return (
                                <tr key={d.name} className="hover:bg-[#F8FAFD]">
                                  <td className="py-1.5 px-3 font-semibold text-[#061B31]">{d.name}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-[#061B31]">{d.count}</td>
                                  <td className="py-1.5 px-3 text-right font-mono text-[#737373]">{pct}%</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-3 px-3 text-center text-[#737373]">
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
                    <div className="max-h-48 overflow-y-auto rounded-[10px] border border-[#E3ECF7]">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-[#FAFDFF] text-[#737373] font-semibold sticky top-0 uppercase tracking-wider">
                          <tr>
                            <th className="py-1.5 px-3">Metric Parameter</th>
                            <th className="py-1.5 px-3 text-right">Value (Hours)</th>
                            <th className="py-1.5 px-3 text-[#737373]">Benchmark Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3ECF7]">
                          <tr className="hover:bg-[#F8FAFD]">
                            <td className="py-2 px-3 font-semibold text-[#061B31]">Mean Duration</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#0073E6]">{summary?.avg_resolution_hours ?? 0}h</td>
                            <td className="py-2 px-3 text-[#737373]">Arithmetic average for period</td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFD]">
                            <td className="py-2 px-3 font-semibold text-[#061B31]">Median Duration</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#533AFD]">{summary?.median_resolution_hours ?? 0}h</td>
                            <td className="py-2 px-3 text-[#737373]">50th percentile cycle time</td>
                          </tr>
                          <tr className="hover:bg-[#F8FAFD]">
                            <td className="py-2 px-3 font-semibold text-[#061B31]">Resolved Sample (N)</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#00D66F]">{summary?.resolved_tickets_count ?? 0}</td>
                            <td className="py-2 px-3 text-[#737373]">Completed tickets evaluated</td>
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
          className="w-full py-3.5 px-5 bg-white border border-[#D4DEE9]/80 rounded-[18px] flex items-center justify-between text-xs font-semibold text-[#061B31] hover:bg-[#F8FAFD] transition cursor-pointer shadow-[0_4px_12px_rgba(13,23,56,0.05)]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#533AFD]" />
            <span>Additional Demographics (Complaint Category &amp; Priority Allocation)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#533AFD] font-semibold text-[11px]">
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
                  className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(13,23,56,0.08)] flex flex-col"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-[#E3ECF7]">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full shrink-0 ${chart.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#061B31] tracking-tight">
                          {chart.title}
                        </h3>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                          {chart.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="my-3 relative min-h-[300px] bg-[#FAFDFF] rounded-[14px] overflow-hidden flex items-center justify-center border border-[#E3ECF7]">
                    {isLoading ? (
                      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 bg-[#F8FAFD] p-6 animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin text-[#533AFD]" />
                        <span className="text-xs font-semibold text-[#737373]">
                          Rendering visualization...
                        </span>
                      </div>
                    ) : errorMsg ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-[#DF1B41]" />
                        <span className="text-xs font-semibold text-[#DF1B41]">
                          Render notice
                        </span>
                        <p className="text-[11px] text-[#737373] max-w-xs">{errorMsg}</p>
                      </div>
                    ) : imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={chart.title}
                        className="w-full h-auto object-contain rounded-[10px]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-xs text-[#737373]">No data available</div>
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
