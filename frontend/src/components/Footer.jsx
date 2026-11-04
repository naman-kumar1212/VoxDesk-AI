import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';
import VoxDeskLogo from './VoxDeskLogo';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border text-secondary-text text-xs">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-border">
          {/* Brand & Purpose */}
          <div className="md:col-span-5 space-y-3 text-left">
            <Link to="/" className="inline-block">
              <VoxDeskLogo size="md" />
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Enterprise AI voice customer grievance and automated ticket routing platform. Speak naturally to file support tickets, receive instant structured AI classification, and track real-time resolution updates.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle text-[11px] font-medium text-slate-600 border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                VocalLabs Voice AI Hackathon Edition
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-text">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-primary-text transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary-text transition-colors">
                  Architecture & Features
                </a>
              </li>
              <li>
                <Link to="/report" className="hover:text-primary-text transition-colors">
                  Report a Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-primary-text transition-colors">
                  Public Ticket Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div className="md:col-span-4 space-y-3 text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-text">
              Administration & Trust
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Protected operations center with role-based access control, PostgreSQL audit logging, and deterministic routing overrides.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surface-subtle hover:bg-surface-muted text-primary-text border border-border text-xs font-semibold transition shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-brand" />
                <span>Admin Operations Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-text">
          <p>© {new Date().getFullYear()} VoxDesk AI. Built on a strictly $0 free-tier architecture.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
