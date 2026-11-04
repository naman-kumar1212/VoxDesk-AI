import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
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
  Key,
  ArrowRight,
  User,
} from 'lucide-react';

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem('voxdesk_admin_key') || ''
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginKeyInput, setLoginKeyInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [targetStatus, setTargetStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState(null);

  // Authenticate key against analytics endpoint
  const authenticate = async (keyToTest) => {
    const key = (keyToTest || loginKeyInput).trim();
    if (!key) return;

    setIsVerifying(true);
    setAuthError(null);

    try {
      const data = await api.getAdminAnalytics(key);
      setAdminKey(key);
      setIsAuthenticated(true);
      setMetrics(data);
      localStorage.setItem('voxdesk_admin_key', key);
    } catch (err) {
      console.error('Admin authentication failed:', err);
      setIsAuthenticated(false);
      setAuthError(err.message || 'Invalid admin key. Check server configuration.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      authenticate(adminKey);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!adminKey) return;
    setIsLoading(true);

    try {
      const [metricsData, ticketsData] = await Promise.all([
        api.getAdminAnalytics(adminKey),
        api.getAdminTickets(adminKey, { pageSize: 50 }),
      ]);

      setMetrics(metricsData);
      const list = ticketsData.tickets || [];
      setTickets(list);

      // Default select the first ticket if none selected
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
        setTargetStatus(list[0].status);
      } else if (selectedTicket) {
        const refreshed = list.find((t) => t.id === selectedTicket.id);
        if (refreshed) {
          setSelectedTicket(refreshed);
          setTargetStatus(refreshed.status);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminKey, selectedTicket]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    setTargetStatus(t.status);
    setStatusUpdateMessage(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !targetStatus || targetStatus === selectedTicket.status) {
      return;
    }

    setIsUpdatingStatus(true);
    setStatusUpdateMessage(null);

    try {
      const res = await api.updateTicketStatus(adminKey, selectedTicket.id, {
        status: targetStatus,
        reason: 'Updated from Admin Management Dashboard',
      });

      setStatusUpdateMessage({ type: 'success', text: `Status updated to ${targetStatus.replace('_', ' ')}.` });
      await loadDashboardData();
    } catch (err) {
      console.error('Status update failed:', err);
      setStatusUpdateMessage({ type: 'error', text: err.message || 'Status transition not permitted.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('voxdesk_admin_key');
    setAdminKey('');
    setIsAuthenticated(false);
    setMetrics(null);
    setTickets([]);
    setSelectedTicket(null);
  };

  // If not authenticated, show modern Admin Login matching design
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-4">
            <Key className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-900">Admin Console Access</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Enter your secret Demo Admin Key to manage tickets, update resolution states, and monitor queues.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              authenticate();
            }}
            className="text-left space-y-4"
          >
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Admin Key (X-Admin-Key)
              </label>
              <input
                type="password"
                value={loginKeyInput}
                onChange={(e) => setLoginKeyInput(e.target.value)}
                disabled={isVerifying}
                placeholder="Enter admin key..."
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !loginKeyInput.trim()}
              className="w-full py-3 px-4 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <span>Sign In to Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Two-Column Layout matching Reference Image Screen 6
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Dark Sidebar matching reference */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className="text-xs font-bold text-slate-800 tracking-tight">VoxDesk Control Center</span>
          </div>

          {/* User Profile Pill matching reference "(A) Admin v" */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs flex items-center gap-1 transition"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px] font-bold">
                A
              </div>
              <span>Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Dashboard Title & Subtitle matching reference */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage support tickets and monitor resolution performance.
            </p>
          </div>

          {/* 4 Stat Cards matching reference */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Tickets"
              value={metrics?.total_tickets ?? 0}
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
              value={metrics?.escalated_tickets ?? 0}
              icon={AlertTriangle}
              iconBgClass="bg-rose-50"
              colorClass="text-rose-600"
            />
          </div>

          {/* Two-Column Lower Workspace matching reference Screen 6 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Recent Tickets */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Recent Tickets</h3>
                <span className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
                  View All →
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No tickets registered yet.
                  </div>
                ) : (
                  tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-primary-50/50 border-primary-300 ring-1 ring-primary-300'
                            : 'bg-white border-slate-200/70 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900">
                              {t.ticket_number}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5" title={t.summary}>
                            {t.summary}
                          </p>
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

            {/* Right Column: Ticket Details matching reference */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              {selectedTicket ? (
                <div>
                  {/* Header: Ticket Details: VD-XXXX and Status pill */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Ticket Details:</span>
                      <span className="font-mono text-primary-700">{selectedTicket.ticket_number}</span>
                    </h3>
                    <StatusBadge value={selectedTicket.status} />
                  </div>

                  {/* Complaint Section */}
                  <div className="py-4 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Complaint
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans">
                      {selectedTicket.transcript || selectedTicket.summary}
                    </p>
                  </div>

                  {/* 2x2 Grid: Category, Priority, Department, Created At matching reference */}
                  <div className="py-4 border-b border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Category</span>
                      <span className="font-bold text-slate-800 uppercase">{selectedTicket.category}</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Priority</span>
                      <div>
                        <StatusBadge type="priority" value={selectedTicket.priority} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Department</span>
                      <span className="font-bold text-slate-800">{selectedTicket.department}</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Created At</span>
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

                  {/* Actions: Status Dropdown & Update Status Button matching reference */}
                  <div className="pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Actions
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <select
                          value={targetStatus}
                          onChange={(e) => setTargetStatus(e.target.value)}
                          disabled={isUpdatingStatus || selectedTicket.status === 'resolved'}
                          className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none capitalize disabled:opacity-60"
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
                        disabled={isUpdatingStatus || targetStatus === selectedTicket.status || selectedTicket.status === 'resolved'}
                        className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-700/25 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                      <p className={`mt-2 text-xs font-medium ${
                        statusUpdateMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {statusUpdateMessage.text}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-xs text-slate-400">
                  Select a ticket on the left to view details and update its resolution status.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

