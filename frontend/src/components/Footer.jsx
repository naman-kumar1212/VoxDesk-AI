import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import VoxDeskLogo from './VoxDeskLogo';

export default function Footer() {
  return (
    <footer className="bg-[#061B31] border-t border-[#1C1E54] text-[#A0B2C6] text-xs">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#1C2C47]">
          {/* Brand & Purpose */}
          <div className="md:col-span-5 space-y-3 text-left">
            <Link to="/" className="inline-block">
              <VoxDeskLogo size="md" theme="dark" />
            </Link>
            <p className="text-xs text-[#A0B2C6] max-w-sm leading-relaxed">
              Financial-grade AI voice customer grievance and automated ticket routing platform. Speak naturally to file support tickets, receive instant structured AI classification, and track real-time resolution updates.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2642] text-[11px] font-medium text-[#D4DEE9] border border-[#2B408A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D66F]"></span>
                Voice AI Dispatch Engine
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
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
            <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
              Administration & Trust
            </h4>
            <p className="text-xs text-[#A0B2C6] leading-relaxed">
              Protected operations center with role-based access control, PostgreSQL audit logging, and deterministic routing overrides.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F2642] hover:bg-[#1C3558] text-white border border-[#2B408A] text-xs font-medium transition shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Admin Operations Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A0B2C6]">
          <p>© {new Date().getFullYear()} VoxDesk AI. Developer-grade precision grievance dispatch.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#A0B2C6]">
              <span className="w-2 h-2 rounded-full bg-[#00D66F] inline-block"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
