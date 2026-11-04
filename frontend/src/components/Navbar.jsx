import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isCustomerFlow = ['/report', '/review', '/confirmation', '/track'].includes(location.pathname);

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo matching reference */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-slate-900">
          <div className="flex items-center gap-0.5 text-primary-600">
            <span className="w-1 h-3.5 bg-primary-600 rounded-full"></span>
            <span className="w-1 h-5 bg-primary-600 rounded-full"></span>
            <span className="w-1 h-6 bg-primary-700 rounded-full"></span>
            <span className="w-1 h-4 bg-primary-600 rounded-full"></span>
            <span className="w-1 h-2.5 bg-primary-500 rounded-full"></span>
          </div>
          <span className="font-extrabold text-slate-900">VoxDesk <span className="text-primary-600 font-medium">AI</span></span>
        </Link>

        {/* Navigation Links */}
        {isLanding ? (
          <>
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
              <Link to="/" className="text-primary-600 font-bold">Home</Link>
              <a href="#how-it-works" className="hover:text-primary-600 transition">How it Works</a>
              <a href="#features" className="hover:text-primary-600 transition">Features</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/report"
                className="px-4 py-2 rounded-full border border-primary-200 text-primary-700 hover:bg-primary-50 text-xs font-bold transition"
              >
                Customer Support
              </Link>
              <Link
                to="/admin"
                className="px-4 py-2 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold shadow-sm transition"
              >
                Admin Login
              </Link>
            </div>
          </>
        ) : isCustomerFlow ? (
          /* Customer sub-navbar: Report Issue / Track Ticket tabs matching reference screens 2-5 */
          <div className="flex items-center gap-6">
            <Link
              to="/report"
              className={`text-xs font-bold pb-1 transition relative ${
                ['/report', '/review', '/confirmation'].includes(location.pathname)
                  ? 'text-primary-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Report Issue
              {['/report', '/review', '/confirmation'].includes(location.pathname) && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-primary-600 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/track"
              className={`text-xs font-bold pb-1 transition relative ${
                location.pathname === '/track'
                  ? 'text-primary-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Track Ticket
              {location.pathname === '/track' && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-primary-600 rounded-full"></span>
              )}
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}

