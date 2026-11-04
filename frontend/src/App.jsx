import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Mic, ShieldCheck, Activity, HelpCircle } from 'lucide-react';
import CustomerPage from './pages/CustomerPage';
import AdminPage from './pages/AdminPage';
import { api } from './services/api';

export default function App() {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getHealth()
      .then((data) => {
        if (isMounted) setHealthStatus(data);
      })
      .catch((err) => {
        console.warn('Backend health check warning:', err);
        if (isMounted) setHealthStatus({ api: 'unreachable', database: 'unknown' });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-md">
              <Mic className="w-4 h-4" />
            </div>
            <span>VoxDesk <span className="text-brand-400 font-medium text-sm">AI</span></span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-3 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-brand-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Customer Desk
            </Link>

            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-slate-800 text-brand-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Console
            </Link>
          </nav>

          {/* Backend Status indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                healthStatus?.api === 'ok' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] text-slate-400 font-mono">
              {healthStatus?.api === 'ok' ? 'API Active' : 'Checking API...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CustomerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VoxDesk AI — 100% Free-Tier Voice AI Grievance Intake & Automation MVP</span>
          <span className="text-[11px] text-slate-400">Groq Whisper STT • Gemini AI • Supabase Postgres</span>
        </div>
      </footer>
    </div>
  );
}

