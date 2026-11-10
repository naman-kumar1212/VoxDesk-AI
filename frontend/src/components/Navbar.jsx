import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Mic } from 'lucide-react';
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
    <header className="bg-white/90 backdrop-blur-md border-b border-[#E3ECF7] sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0570DE] rounded-lg"
            aria-label="VoxDesk AI Home"
          >
            <VoxDeskLogo size="md" />
          </Link>
        </div>

        {/* Desktop Global Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#30313D]" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => handleNavAnchor('#how-it-works')}
            className="text-[#30313D] hover:text-[#061B31] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleNavAnchor('#features')}
            className="text-[#30313D] hover:text-[#061B31] transition-colors cursor-pointer"
          >
            Features
          </button>
          <Link
            to="/track"
            className={`transition-colors py-1 relative ${
              isTrack
                ? 'text-[#533AFD] font-semibold'
                : 'text-[#30313D] hover:text-[#061B31]'
            }`}
          >
            Track Ticket
            {isTrack && (
              <span className="absolute bottom-[-20px] left-0 right-0 h-0.5 bg-[#533AFD] rounded-full" />
            )}
          </Link>
        </nav>

        {/* Desktop Right Actions: Admin Access + Stripe Pill CTA */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            to="/admin"
            className="text-xs font-medium text-[#30313D] hover:text-[#061B31] transition"
          >
            Admin sign in
          </Link>

          {!isCustomerFlow && (
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#533AFD] hover:bg-[#635BFF] rounded-full shadow-btn transition-all duration-150 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#0570DE]"
            >
              <Mic className="w-3.5 h-3.5 text-white/95" />
              <span>Report an issue</span>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#30313D] hover:text-[#061B31] rounded-lg hover:bg-[#F6F9FC] transition focus-visible:ring-2 focus-visible:ring-[#0570DE]"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3ECF7] bg-white px-4 py-4 space-y-3 shadow-md animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-[#30313D]">
            <button
              type="button"
              onClick={() => handleNavAnchor('#how-it-works')}
              className="text-left py-2 hover:text-[#061B31] transition"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => handleNavAnchor('#features')}
              className="text-left py-2 hover:text-[#061B31] transition"
            >
              Features
            </button>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#061B31] transition"
            >
              Track Ticket
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#061B31] transition"
            >
              Admin Sign In
            </Link>
          </nav>

          {!isCustomerFlow && (
            <div className="pt-2">
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#533AFD] hover:bg-[#635BFF] rounded-full shadow-btn transition"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Report an issue</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
