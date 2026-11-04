import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Search, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
          {/* Brand & Purpose */}
          <div className="md:col-span-5 space-y-3 text-left">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/voxdesk-app-icon-512.png"
                alt="VoxDesk AI Icon"
                className="w-7 h-7 rounded-lg object-contain"
              />
              <span className="text-white font-extrabold text-base tracking-tight">
                VoxDesk <span className="text-primary-400 font-medium">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Intelligent voice grievance automation platform. Speak naturally to file support tickets, get automatic AI classification, and track real-time resolution updates.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                VocalLabs Voice AI Hackathon Edition
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-primary-400" />
                  <span>Report an Issue</span>
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary-400" />
                  <span>Track Ticket</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Security Notice */}
          <div className="md:col-span-4 space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Privacy & Support
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Audio is processed in-memory for live transcription and deleted immediately. VoxDesk AI does not store raw customer audio files or sell customer data.
            </p>
            <div className="pt-1">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} VoxDesk AI. 100% Free-Tier Architecture ($0 Cost Invariant).</p>
          <p className="flex items-center gap-1">
            Built with React, Vite & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}

