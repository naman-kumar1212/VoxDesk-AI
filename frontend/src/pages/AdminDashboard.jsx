import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardView from '../components/admin/DashboardView';
import TicketsView from '../components/admin/TicketsView';
import AnalyticsView from '../components/admin/AnalyticsView';
import DepartmentsView from '../components/admin/DepartmentsView';
import UsersView from '../components/admin/UsersView';
import { api } from '../services/api';
import {
  Loader2,
  Menu,
  ChevronDown,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  LogOut,
  ShieldCheck,
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

  // Navigation tab: 'Dashboard' | 'Tickets' | 'Analytics' | 'Departments' | 'Users'
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
        if (data?.user?.role === 'admin' || data?.user?.role === 'staff') {
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
      setAuthError('Please enter both administrator email and password.');
      return;
    }

    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const result = await api.login({ email, password });
      if (!result?.token) {
        throw new Error('Authentication failed. No session token returned.');
      }

      setAuthToken(result.token);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      localStorage.setItem('voxdesk_admin_token', result.token);
      localStorage.setItem('voxdesk_admin_user', JSON.stringify(result.user));
    } catch (err) {
      console.error('Admin login error:', err);
      setIsAuthenticated(false);
      setAuthError(err.message || 'Invalid administrator credentials. Access denied.');
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
  };

  // Loading state while verifying token
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
        <p className="text-xs font-semibold text-slate-500">Checking administrator authorization...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: ADMIN LOGIN
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
            Sign in with authorized administrator credentials to manage grievance tickets, monitor queues and inspect analytics.
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
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
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

            {/* Submit Button */}
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
  // VIEW 2: AUTHENTICATED ADMIN CONSOLE (All 5 Sections)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Dark Navy Sidebar */}
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

      {/* Mobile Sidebar Overlay Drawer */}
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

      {/* Main Administrative Workspace */}
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                VoxDesk Control Center
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full">
                {activeTab}
              </span>
            </div>
          </div>

          {/* User Profile Pill matching Reference Screen 6 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="hidden sm:inline">
                {currentUser?.name || currentUser?.email || 'Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 z-30 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100 text-xs">
                  <div className="font-bold text-slate-800 truncate">{currentUser?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-primary-600 mt-1">
                    Role: {currentUser?.role}
                  </div>
                </div>

                <Link
                  to="/"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                >
                  Exit to Public Home
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Section Content */}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'Dashboard' && (
            <DashboardView
              authToken={authToken}
              onNavigateToTickets={() => setActiveTab('Tickets')}
            />
          )}

          {activeTab === 'Tickets' && (
            <TicketsView authToken={authToken} />
          )}

          {activeTab === 'Analytics' && (
            <AnalyticsView authToken={authToken} />
          )}

          {activeTab === 'Departments' && (
            <DepartmentsView authToken={authToken} />
          )}

          {activeTab === 'Users' && (
            <UsersView authToken={authToken} currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}
