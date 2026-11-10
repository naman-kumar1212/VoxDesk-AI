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
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-3" />
        <p className="text-xs text-secondary-text">Checking administrator authorization...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: ADMIN LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-card p-8 shadow-xs text-center space-y-6">
          <Link to="/" className="inline-block">
            <img
              src="/voxdesk-app-icon-512.png"
              alt="VoxDesk AI Icon"
              className="w-12 h-12 rounded-card mx-auto shadow-xs border border-border"
            />
          </Link>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-medium text-primary-text tracking-tight">
              Admin console sign in
            </h1>
            <p className="text-xs text-secondary-text leading-relaxed">
              Authorized operations portal for grievance queue auditing, departmental routing, and analytics.
            </p>
          </div>

          <form onSubmit={handleLogin} className="text-left space-y-4" noValidate>
            {/* Admin Email Input */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-secondary-text mb-1.5"
              >
                Administrator email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isSubmittingLogin}
                  placeholder="Enter administrator email"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-input text-xs text-primary-text placeholder:text-muted-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
              </div>
            </div>

            {/* Admin Password Input with Masked Toggle */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-secondary-text mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isSubmittingLogin}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-input text-xs text-primary-text placeholder:text-muted-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
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
                className="p-3 bg-rose-50 border border-rose-200 rounded-btn text-rose-700 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingLogin || !loginEmail.trim() || !loginPassword.trim()}
              className="w-full py-2.5 px-4 bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-btn text-xs font-medium shadow-xs transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
            >
              {isSubmittingLogin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying authorization...</span>
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
          <div className="mt-6 pt-4 border-t border-border">
            <Link
              to="/"
              className="text-xs text-secondary-text hover:text-primary-text font-normal inline-flex items-center gap-1.5"
            >
              ← Return to public home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: AUTHENTICATED ADMIN CONSOLE (Rendered via shared AdminLayout)
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
