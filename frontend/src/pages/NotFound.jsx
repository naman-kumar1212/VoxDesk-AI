import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Mic, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-b from-white via-primary-50/20 to-white">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-4 ring-8 ring-primary-50/50">
          <Search className="w-7 h-7" />
        </div>

        <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
          404 Not Found
        </span>

        <h1 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The page or support resource you are looking for doesn't exist or has moved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>

          <Link
            to="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/20 transition"
          >
            <Mic className="w-4 h-4" />
            <span>Report Issue</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

