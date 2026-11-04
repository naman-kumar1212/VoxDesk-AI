import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, Mic, Search, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isReport = location.pathname === '/report';
  const isCustomerFlow = ['/report', '/review', '/confirmation'].includes(location.pathname);
  const isTrack = location.pathname === '/track';

  const handleNavAnchor = (anchor) => {
    setMobileMenuOpen(false);
    if (!isHome) {
      navigate(`/${anchor}`);
    } else {
      const element = document.querySelector(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo (no redundant back arrow in header) */}
        <div className="flex items-center gap-3">
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

        {/* Desktop Global Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => handleNavAnchor('#how-it-works')}
            className="hover:text-primary-700 transition font-medium"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleNavAnchor('#features')}
            className="hover:text-primary-700 transition font-medium"
          >
            Features
          </button>
          <Link
            to="/report"
            className={`transition font-semibold py-1 relative ${
              isCustomerFlow
                ? 'text-primary-700 font-bold'
                : 'hover:text-primary-700'
            }`}
          >
            Report an Issue
            {isCustomerFlow && (
              <span className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </Link>
          <Link
            to="/track"
            className={`transition font-semibold py-1 relative ${
              isTrack
                ? 'text-primary-700 font-bold'
                : 'hover:text-primary-700'
            }`}
          >
            Track Ticket
            {isTrack && (
              <span className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </Link>
        </nav>

        {/* Right Actions: Admin Login & Contextual CTA (No duplicate CTA on /report) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/admin"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
          >
            Admin Login
          </Link>

          {!isReport ? (
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold shadow-sm shadow-primary-700/20 transition transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Report an Issue</span>
            </Link>
          ) : (
            <Link
              to="/track"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Track Ticket</span>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => handleNavAnchor('#how-it-works')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-primary-700 transition"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => handleNavAnchor('#features')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-primary-700 transition"
            >
              Features
            </button>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition ${
                isCustomerFlow ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary-600" />
                <span>Report an Issue</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition ${
                isTrack ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary-600" />
                <span>Track Ticket</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {!isReport && (
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-700 text-white text-xs font-bold shadow-sm"
              >
                <Mic className="w-4 h-4" />
                <span>Report an Issue</span>
              </Link>
            )}
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 text-xs font-semibold"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
