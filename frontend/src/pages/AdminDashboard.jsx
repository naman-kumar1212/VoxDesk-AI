import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  StatCardSkeleton,
  TicketRowSkeleton,
  TicketDetailSkeleton,
} from '../components/LoadingSkeleton';
import { api } from '../services/api';
import {
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
  ArrowRight,
  Menu,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Clock,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Activity,
  History,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  // Authentication states
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem('voxdesk_admin_token') || ''
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('voxdesk_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Dashboard layout states
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketEvents, setSelectedTicketEvents] = useState([]);
  const [isLoadingTicketEvents, setIsLoadingTicketEvents] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status update
  const [targetStatus, setTargetStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState(null);

  // 1. Session verification on mount
  useEffect(() => {
    const verifyExistingSession = async () => {
      const token = authToken || localStorage.getItem('voxdesk_admin_token');
      if (!token) {
        setIsCheckingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        const data = await api.getMe(token);
        if (data?.user?.role === 'admin') {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          setAuthToken(token);
          localStorage.setItem('voxdesk_admin_user', JSON.stringify(data.user));
        } else {
          throw new Error('Unauthorized role');
        }
      } catch (err) {
        console.warn('Admin session expired or invalid:', err.message);
        localStorage.removeItem('voxdesk_admin_token');
        localStorage.removeItem('voxdesk_admin_user');
        setAuthToken('');
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyExistingSession();
  }, [authToken]);

  // 2. Handle Login Submission
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) {
      setAuthError('Please enter both admin email and password.');
      return;
    }

    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const result = await api.login({ email, password });
      if (!result?.token || result?.user?.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }

      setAuthToken(result.token);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      localStorage.setItem('voxdesk_admin_token', result.token);
      localStorage.setItem('voxdesk_admin_user', JSON.stringify(result.user));
    } catch (err) {
      console.error('Admin login error:', err);
      setIsAuthenticated(false);
      setAuthError(err.message || 'Invalid administrator email or password.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    if (authToken) {
      await api.logout(authToken);
    }
    localStorage.removeItem('voxdesk_admin_token');
    localStorage.removeItem('voxdesk_admin_user');
    setAuthToken('');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setMetrics(null);
    setTickets([]);
    setSelectedTicket(null);
    setSelectedTicketEvents([]);
  };

  // 4. Fetch Ticket Detail & Timeline Events
  const fetchTicketDetails = useCallback(
    async (ticketId) => {
      if (!authToken || !ticketId) return;
      setIsLoadingTicketEvents(true);
      try {
        const data = await api.getAdminTicketDetail(authToken, ticketId);
        if (data?.ticket) {
          setSelectedTicket(data.ticket);
          setTargetStatus(data.ticket.status);
        }
        if (Array.isArray(data?.events)) {
          setSelectedTicketEvents(data.events);
        }
      } catch (err) {
        console.error('Failed to fetch ticket detail and timeline:', err);
      } finally {
        setIsLoadingTicketEvents(false);
      }
    },
    [authToken]
  );

  // 5. Load Dashboard Data (Metrics & Tickets)
  const loadDashboardData = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);

    try {
      const [metricsData, ticketsData] = await Promise.all([
        api.getAdminAnalytics(authToken),
        api.getAdminTickets(authToken, { pageSize: 50 }),
      ]);

      setMetrics(metricsData);
      const list = ticketsData?.tickets || [];
      setTickets(list);

      // Auto-select first ticket if none selected or keep refreshed selection
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
        setTargetStatus(list[0].status);
        fetchTicketDetails(list[0].id);
      } else if (selectedTicket) {
        const refreshed = list.find((t) => t.id === selectedTicket.id);
        if (refreshed) {
          setSelectedTicket(refreshed);
          setTargetStatus(refreshed.status);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (err.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [authToken, selectedTicket, fetchTicketDetails]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  // 6. Handle Selecting a Ticket
  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    setTargetStatus(t.status);
    setStatusUpdateMessage(null);
    fetchTicketDetails(t.id);
  };

  // 7. Update Ticket Status
  const handleUpdateStatus = async () => {
    if (!selectedTicket || !targetStatus || targetStatus === selectedTicket.status) {
      return;
    }

    setIsUpdatingStatus(true);
    setStatusUpdateMessage(null);

    try {
      await api.updateTicketStatus(authToken, selectedTicket.id, {
        status: targetStatus,
        reason: 'Updated from Admin Management Dashboard',
      });

      setStatusUpdateMessage({
        type: 'success',
        text: `Status updated to ${targetStatus.replace('_', ' ')}.`,
      });

      // Refresh list & timeline
      await Promise.all([
        loadDashboardData(),
        fetchTicketDetails(selectedTicket.id),
      ]);
    } catch (err) {
      console.error('Status update failed:', err);
      setStatusUpdateMessage({
        type: 'error',
        text: err.message || 'Status transition not permitted.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter tickets by search and status
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Loading state while checking session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
        <p className="text-xs font-semibold text-slate-500">Checking admin session...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: ADMIN LOGIN (Replaces old single-key login)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center">
          <Link to="/" className="inline-block mb-4">
            <img
              src="/voxdesk-app-icon-512.png"
              alt="VoxDesk AI Icon"
              className="w-12 h-12 rounded-2xl mx-auto shadow-md ring-4 ring-primary-50"
            />
          </Link>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Admin Console Sign In
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            Sign in with your verified administrator credentials to manage grievance tickets and monitor queues.
          </p>

          <form onSubmit={handleLogin} className="text-left space-y-4" noValidate>
            {/* Admin Email Input */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Admin Email / ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="admin-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isSubmittingLogin}
                  placeholder="admin@voxdesk.ai"
                  required
                  autoFocus
                  className="w-full text-xs p-3 pl-9 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                />
              </div>
            </div>

            {/* Admin Password Input with Show/Hide toggle */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSubmittingLogin}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-xs p-3 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit Button with Distinct Idle / Loading / Retry states */}
            <button
              type="submit"
              disabled={isSubmittingLogin || !loginEmail.trim() || !loginPassword.trim()}
              className="w-full py-3 px-4 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {isSubmittingLogin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Public Home */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1.5"
            >
              ← Return to Public Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD (Screen 6 Reference Implementation)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Dark Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentUser={currentUser}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
              onCloseMobile={() => setMobileSidebarOpen(false)}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-slate-800 tracking-tight">
              VoxDesk Control Center
            </span>
          </div>

          {/* Refresh & User Profile Dropdown Pill matching Reference Screen 6 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs flex items-center gap-1 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Refresh tickets"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`}
              />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px] font-bold">
                A
              </div>
              <span className="hidden sm:inline">
                {currentUser?.name || currentUser?.email || 'Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'Tickets' ? 'Support Tickets' : 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage support tickets and monitor resolution performance.
            </p>
          </div>

          {/* 4 Summary Stat Cards matching Screen 6 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading && !metrics ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Tickets"
                  value={metrics?.total_tickets ?? tickets.length}
                  icon={Calendar}
                  iconBgClass="bg-purple-50"
                  colorClass="text-purple-600"
                />
                <StatCard
                  title="In Progress"
                  value={tickets.filter((t) => t.status === 'in_progress').length}
                  icon={ShieldCheck}
                  iconBgClass="bg-blue-50"
                  colorClass="text-blue-600"
                />
                <StatCard
                  title="Resolved"
                  value={tickets.filter((t) => t.status === 'resolved').length}
                  icon={CheckCircle}
                  iconBgClass="bg-emerald-50"
                  colorClass="text-emerald-600"
                />
                <StatCard
                  title="Escalated"
                  value={
                    metrics?.escalated_tickets ??
                    tickets.filter((t) => t.status === 'escalated').length
                  }
                  icon={AlertTriangle}
                  iconBgClass="bg-rose-50"
                  colorClass="text-rose-600"
                />
              </>
            )}
          </div>

          {/* Two-Column Lower Workspace matching Screen 6 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* LEFT COLUMN: Recent Tickets List with Search & Status Filter */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Recent Tickets</h2>
                  <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                    {filteredTickets.length}
                  </span>
                </div>

                {/* Status Filter dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Search input */}
              <div className="pt-3 pb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticket ID, summary, department..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-primary-400 transition"
                  />
                </div>
              </div>

              {/* Tickets list */}
              <div className="mt-2 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {isLoading && tickets.length === 0 ? (
                  <>
                    <TicketRowSkeleton />
                    <TicketRowSkeleton />
                    <TicketRowSkeleton />
                  </>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-medium">No matching tickets found.</p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-primary-50/60 border-primary-300 ring-1 ring-primary-300'
                            : 'bg-white border-slate-200/70 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900">
                              {t.ticket_number}
                            </span>
                            {t.escalated && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Escalated
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs text-slate-600 truncate mt-0.5"
                            title={t.summary}
                          >
                            {t.summary}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>{t.department}</span>
                            <span>•</span>
                            <span>
                              {new Date(t.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <StatusBadge value={t.status} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* RIGHT COLUMN: Ticket Detail Panel (9 Structured Sections) */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              {isLoading && !selectedTicket ? (
                <TicketDetailSkeleton />
              ) : selectedTicket ? (
                <div className="space-y-4">
                  {/* Section 1: Ticket Header & Status Pill */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Ticket Details:</span>
                      <span className="font-mono text-primary-700">
                        {selectedTicket.ticket_number}
                      </span>
                    </h2>
                    <StatusBadge value={selectedTicket.status} />
                  </div>

                  {/* AI Fallback Warning Banner (Prompt requirement) */}
                  {selectedTicket.analysis_status === 'fallback' && (
                    <div
                      role="alert"
                      className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-900">
                          AI analysis unavailable. Manual review required.
                        </div>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Audio was transcribed via Whisper, but automated AI categorization encountered a fallback. Department and priority were assigned using fallback rules.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Section 2: Original Customer Complaint (Voice Transcript) */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>Original Customer Complaint (Transcript)</span>
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {selectedTicket.transcript || selectedTicket.summary}
                    </p>
                  </div>

                  {/* Section 3: AI-Generated Summary */}
                  {selectedTicket.summary && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary-500" />
                        <span>AI Complaint Summary</span>
                      </span>
                      <p className="text-xs text-slate-700 font-medium bg-primary-50/30 p-2.5 rounded-xl border border-primary-100">
                        {selectedTicket.summary}
                      </p>
                    </div>
                  )}

                  {/* Sections 4, 5, 6: 2x2 Grid (Category, Priority, Department, Timestamps) */}
                  <div className="py-3 border-y border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Category
                      </span>
                      <span className="font-bold text-slate-800 uppercase">
                        {selectedTicket.category?.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Priority
                      </span>
                      <div>
                        <StatusBadge type="priority" value={selectedTicket.priority} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Assigned Department
                      </span>
                      <span className="font-bold text-slate-800">
                        {selectedTicket.department}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                        Created At
                      </span>
                      <span className="font-medium text-slate-700">
                        {new Date(selectedTicket.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Section 7: Escalation Details (if escalated) */}
                  {selectedTicket.escalated && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Escalation Flagged:</span>{' '}
                        <span className="text-[11px]">
                          {selectedTicket.escalation_reason ||
                            'Flagged for high customer frustration or urgent SLA breach.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Section 8: Ticket Activity Timeline */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      <span>Activity Timeline</span>
                    </span>

                    <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2.5">
                      {isLoadingTicketEvents ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading event timeline...</span>
                        </div>
                      ) : selectedTicketEvents.length === 0 ? (
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Ticket created. Awaiting first operator intervention.</span>
                        </div>
                      ) : (
                        selectedTicketEvents.map((evt, idx) => (
                          <div
                            key={evt.id || idx}
                            className="flex items-start gap-2 text-xs border-l-2 border-primary-400 pl-2.5 py-0.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-800 capitalize">
                                {evt.event_type?.replace(/_/g, ' ')}
                              </div>
                              {evt.details && (
                                <p className="text-[11px] text-slate-500">
                                  {typeof evt.details === 'string'
                                    ? evt.details
                                    : JSON.stringify(evt.details)}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(evt.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Section 9: Status Management Actions matching Screen 6 */}
                  <div className="pt-2 border-t border-slate-100">
                    <label
                      htmlFor="target-status-select"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2"
                    >
                      Status Management
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <select
                          id="target-status-select"
                          value={targetStatus}
                          onChange={(e) => setTargetStatus(e.target.value)}
                          disabled={
                            isUpdatingStatus || selectedTicket.status === 'resolved'
                          }
                          className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none capitalize disabled:opacity-60 transition"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="escalated">Escalated</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleUpdateStatus}
                        disabled={
                          isUpdatingStatus ||
                          targetStatus === selectedTicket.status ||
                          selectedTicket.status === 'resolved'
                        }
                        className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-700/25 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                      >
                        {isUpdatingStatus ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </span>
                        ) : (
                          'Update Status'
                        )}
                      </button>
                    </div>

                    {statusUpdateMessage && (
                      <p
                        className={`mt-2.5 text-xs font-medium flex items-center gap-1.5 ${
                          statusUpdateMessage.type === 'success'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {statusUpdateMessage.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        )}
                        <span>{statusUpdateMessage.text}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-xs text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Select a ticket on the left to inspect complaint details and update status.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
