import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Mic, Search, ChevronRight } from 'lucide-react';
import VoxDeskLogo from './VoxDeskLogo';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';
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
    <header className="bg-surface border-b border-border sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
            aria-label="VoxDesk AI Home"
          >
            <VoxDeskLogo size="md" />
          </Link>
        </div>

        {/* Desktop Global Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary-text" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => handleNavAnchor('#how-it-works')}
            className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleNavAnchor('#features')}
            className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Features
          </button>
          <Link
            to="/track"
            className={`transition-colors py-1 relative ${
              isTrack
                ? 'text-brand font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Ticket
            {isTrack && (
              <span className="absolute bottom-[-20px] left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </Link>
        </nav>

        {/* Desktop Right Actions: Admin Access + One Coherent Primary CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/admin"
            className="text-xs font-semibold text-secondary-text hover:text-primary-text transition"
          >
            Admin Sign In
          </Link>

          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-brand hover:bg-brand-hover rounded-btn shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Mic className="w-3.5 h-3.5 text-white/90" />
            <span>Report an Issue</span>
          </Link>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-btn hover:bg-surface-subtle transition focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 shadow-md animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => handleNavAnchor('#how-it-works')}
              className="text-left py-2 px-3 rounded-btn hover:bg-surface-subtle hover:text-slate-900 transition"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => handleNavAnchor('#features')}
              className="text-left py-2 px-3 rounded-btn hover:bg-surface-subtle hover:text-slate-900 transition"
            >
              Features
            </button>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between py-2 px-3 rounded-btn transition ${
                isTrack ? 'bg-brand-subtle text-brand font-semibold' : 'hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500" />
                <span>Track Ticket</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-3 rounded-btn hover:bg-surface-subtle transition text-secondary-text"
            >
              <span>Admin Console</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </nav>

          <div className="pt-2 border-t border-border">
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-btn bg-brand text-white font-semibold text-xs shadow-xs"
            >
              <Mic className="w-4 h-4" />
              <span>Report an Issue</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
