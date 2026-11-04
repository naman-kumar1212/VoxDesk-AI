import React, { useState } from 'react';
import { Lock, Key, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function AdminAccessGate({ onAuthenticated }) {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = adminKey.trim();
    if (!key) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate key by pinging summary endpoint
      await api.getAdminAnalytics(key);
      onAuthenticated(key);
    } catch (err) {
      console.error('Admin authentication failed:', err);
      if (err.status === 401) {
        setError('Invalid admin key. Check server ADMIN_API_KEY setting.');
      } else {
        setError(err.message || 'Failed to authenticate admin access.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6" />
      </div>

      <h3 className="text-xl font-bold text-slate-800">Support Desk Administration</h3>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        Enter the demo admin key configured in your backend environment to review and manage grievance tickets.
      </p>

      <form onSubmit={handleSubmit} className="text-left">
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Demo Admin Key (X-Admin-Key)
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition disabled:bg-slate-50 font-mono"
              placeholder="e.g. your-secret-admin-key"
              autoFocus
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !adminKey.trim()}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            <>
              Access Dashboard <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

