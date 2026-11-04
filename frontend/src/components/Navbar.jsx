import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, Shield, Mic, Search } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = location.pathname === '';
  const isCustomerFlow = ['/report', '/review', '/confirmation', '/track'].includes(location.pathname);

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo with actual official logo asset */}
        <div className="flex items-center gap-3">
          {/* Contextual back button if inside report/review flow and not landing */}
          {isCustomerFlow && location.pathname !== '/report' && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              aria-label="Go back to previous page"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/"
            className="flex items-center transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            aria-label="VoxDesk AI Home"
          >
            <img
              src="/voxdesk-logo-compact.png"
              alt="VoxDesk AI"
              className="h-8 w-auto object-contain"
              height="32"
            />
          </Link>
        </div>

        {/* Navigation for Landing Page */}
        {isLanding ? (
          <>
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
              <Link to="/" className="text-primary-700 font-bold">
                Home
              </Link>
              <a href="#how-it-works" className="hover:text-primary-700 transition">
                How it Works
              </a>
              <a href="#features" className="hover:text-primary-700 transition">
                Features
              </a>
            </nav>

            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/report"
                className="px-4 py-2 rounded-full border border-primary-200 text-primary-700 hover:bg-primary-50 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Customer Support
              </Link>
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Admin Login
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </>
        ) : isCustomerFlow ? (
          /* Customer Flow Tabs matching Screens 2-5 in reference image */
          <div className="flex items-center gap-6">
            <Link
              to="/report"
              className={`text-xs font-bold pb-1 transition relative flex items-center gap-1.5 ${
                ['/report', '/review', '/confirmation'].includes(location.pathname)
                  ? 'text-primary-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5 sm:hidden" />
              <span>Report Issue</span>
              {['/report', '/review', '/confirmation'].includes(location.pathname) && (
                <span className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </Link>

            <Link
              to="/track"
              className={`text-xs font-bold pb-1 transition relative flex items-center gap-1.5 ${
                location.pathname === '/track'
                  ? 'text-primary-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Search className="w-3.5 h-3.5 sm:hidden" />
              <span>Track Ticket</span>
              {location.pathname === '/track' && (
                <span className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </Link>

            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 ml-4 pl-4 border-l border-slate-200 transition"
              title="Admin Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Mobile dropdown for Landing */}
      {isLanding && mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 shadow-lg">
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-xs font-bold"
          >
            <Mic className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
          >
            <Search className="w-4 h-4" />
            <span>Track a Ticket</span>
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-primary-700 bg-primary-50 text-xs font-bold"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Console</span>
          </Link>
        </div>
      )}
    </header>
  );
}
