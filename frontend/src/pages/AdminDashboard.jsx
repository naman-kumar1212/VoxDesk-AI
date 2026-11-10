import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardView from '../components/admin/DashboardView';
import TicketsView from '../components/admin/TicketsView';
import AnalyticsView from '../components/admin/AnalyticsView';
import DepartmentsView from '../components/admin/DepartmentsView';
import UsersView from '../components/admin/UsersView';
import { api } from '../services/api';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const VALID_TABS = {
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  analytics: 'Analytics',
  departments: 'Departments',
  users: 'Users',
};

export default function AdminDashboard() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();

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

  // Synchronize activeTab with URL parameter
  const activeTab = useMemo(() => {
    if (!urlTab) return 'Dashboard';
    const normalized = urlTab.toLowerCase();
    return VALID_TABS[normalized] || 'Dashboard';
  }, [urlTab]);

  const handleTabChange = (newTab) => {
    navigate(`/admin/${newTab.toLowerCase()}`);
  };

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
      try {
        await api.logout(authToken);
      } catch {}
    }
    localStorage.removeItem('voxdesk_admin_token');
    localStorage.removeItem('voxdesk_admin_user');
    setAuthToken('');
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/admin');
  };

  // Loading state while verifying token
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#533AFD] mb-3" />
        <p className="text-xs font-medium text-[#425466]">Checking administrator authorization...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: ADMIN LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#D4DEE9]/80 rounded-[18px] p-8 sm:p-10 shadow-[0_8px_20px_rgba(13,23,56,0.08)] text-center space-y-6">
          <Link to="/" className="inline-block">
            <div className="w-12 h-12 rounded-xl bg-[#533AFD] text-white flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(83,58,253,0.25)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <line x1="4" y1="10" x2="4" y2="14" />
                <line x1="8" y1="7" x2="8" y2="17" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="16" y1="7" x2="16" y2="17" />
                <line x1="20" y1="10" x2="20" y2="14" />
              </svg>
            </div>
          </Link>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-[#061B31] tracking-[-0.03em]">
              Admin console sign in
            </h1>
            <p className="text-xs text-[#425466] leading-relaxed">
              Authorized operations portal for grievance dispatch, SLA metrics, and organizational routing.
            </p>
          </div>

          <form onSubmit={handleLogin} className="text-left space-y-4" noValidate>
            {/* Admin Email Input */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#061B31] mb-1.5"
              >
                Administrator email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isSubmittingLogin}
                  placeholder="admin@voxdesk.ai"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-xs text-[#061B31] placeholder:text-[#A1AAB8] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none transition-all"
                />
              </div>
            </div>

            {/* Admin Password Input with Masked Toggle */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#061B31] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSubmittingLogin}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-xs text-[#061B31] placeholder:text-[#A1AAB8] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#061B31] focus:outline-none cursor-pointer"
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
                className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-[10px] text-[#DF1B41] text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-[#DF1B41] shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingLogin || !loginEmail.trim() || !loginPassword.trim()}
              className="w-full py-2.5 px-4 bg-[#533AFD] hover:bg-[#635BFF] disabled:bg-[#ECF0F4] disabled:text-[#A1AAB8] disabled:cursor-not-allowed text-white rounded-full text-xs font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] hover:shadow-[0_8px_20px_rgba(83,58,253,0.32)] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#533AFD] cursor-pointer"
            >
              {isSubmittingLogin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Public Home */}
          <div className="mt-6 pt-4 border-t border-[#E3ECF7]">
            <Link
              to="/"
              className="text-xs text-[#425466] hover:text-[#061B31] font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              ← Return to public home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: AUTHENTICATED ADMIN CONSOLE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {activeTab === 'Dashboard' && (
        <DashboardView
          authToken={authToken}
          onNavigateToTickets={() => handleTabChange('Tickets')}
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
    </AdminLayout>
  );
}
