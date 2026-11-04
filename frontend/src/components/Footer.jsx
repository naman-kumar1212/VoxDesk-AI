import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import VoxDeskLogo from './VoxDeskLogo';

export default function Footer() {
  return (
    <footer className="bg-[#111827] border-t border-[#1F2937] text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#1F2937]">
          {/* Brand & Purpose */}
          <div className="md:col-span-5 space-y-3 text-left">
            <Link to="/" className="inline-block">
              <VoxDeskLogo size="md" theme="dark" />
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Enterprise AI voice customer grievance and automated ticket routing platform. Speak naturally to file support tickets, receive instant structured AI classification, and track real-time resolution updates.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#182338] text-[11px] font-medium text-slate-300 border border-[#2E3C54]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                VocalLabs Voice AI Hackathon Edition
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Architecture & Features
                </a>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition-colors">
                  Report a Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Public Ticket Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div className="md:col-span-4 space-y-3 text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Administration & Trust
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protected operations center with role-based access control, PostgreSQL audit logging, and deterministic routing overrides.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-[#182338] hover:bg-[#26344B] text-slate-200 border border-[#2E3C54] text-xs font-semibold transition shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-[#8B6CF0]" />
                <span>Admin Operations Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} VoxDesk AI. Built on a strictly $0 free-tier architecture.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
