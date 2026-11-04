import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Mic, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-app">
      <div className="max-w-md w-full bg-surface border border-border rounded-card p-8 shadow-xs text-center">
        <div className="w-14 h-14 rounded-btn bg-surface-muted text-slate-700 flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7" />
        </div>

        <span className="text-xs font-mono font-bold text-slate-700 bg-surface-muted px-2.5 py-1 rounded-full uppercase tracking-wider">
          404 Not Found
        </span>

        <h1 className="text-2xl font-bold text-primary-text mt-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs text-secondary-text mt-2 leading-relaxed">
          The page or support resource you are looking for doesn't exist or has moved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-surface border border-border hover:bg-surface-subtle text-primary-text rounded-btn text-xs font-semibold shadow-xs transition"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>

          <Link
            to="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-btn text-xs font-semibold shadow-xs transition"
          >
            <Mic className="w-4 h-4" />
            <span>Report Issue</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

