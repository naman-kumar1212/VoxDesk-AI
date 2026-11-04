import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  ArrowRight,
  Zap,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  Search,
  MessageSquare,
  FileText,
  Cpu,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white flex flex-col">
      {/* Hero Section matching Screen 1 visual direction */}
      <section className="bg-gradient-to-b from-white via-primary-50/30 to-white pt-10 sm:pt-16 pb-14 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Benefit Description, and Dual Customer CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/90 text-primary-700 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Voice Support Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Resolve Issues <br />
              <span className="text-slate-900">with Your Voice</span>
            </h1>

            {/* Customer Benefit Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Skip tedious support forms and confusing phone menus. Speak your issue naturally in your own words, and our voice AI will capture, categorize, and route your support ticket in seconds.
            </p>

            {/* Dual CTAs: Primary [Report an Issue] and Secondary [Track My Ticket] */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm shadow-md shadow-primary-700/25 transition transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span>Report an Issue</span>
                <Mic className="w-4 h-4" />
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span>Track My Ticket</span>
                <Search className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Customer Trust Highlights */}
            <div className="pt-3 flex flex-wrap items-center gap-5 sm:gap-7 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No typing required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant ticket ID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live resolution updates</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Microphone Illustration properly aligned */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Concentric subtle lavender backdrop */}
              <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-primary-50/70 border border-primary-100" />
              <div className="absolute w-56 h-56 rounded-full bg-primary-100/50 border border-primary-200/50" />

              {/* Left Soundwave bars */}
              <div className="absolute left-6 sm:left-8 flex items-center gap-1.5 z-10" aria-hidden="true">
                <span className="w-1.5 h-6 bg-primary-300 rounded-full" />
                <span className="w-1.5 h-12 bg-primary-400 rounded-full" />
                <span className="w-1.5 h-8 bg-primary-300 rounded-full" />
              </div>

              {/* Right Soundwave bars */}
              <div className="absolute right-6 sm:right-8 flex items-center gap-1.5 z-10" aria-hidden="true">
                <span className="w-1.5 h-8 bg-primary-300 rounded-full" />
                <span className="w-1.5 h-12 bg-primary-400 rounded-full" />
                <span className="w-1.5 h-6 bg-primary-300 rounded-full" />
              </div>

              {/* Central Microphone orb with gradient and stand */}
              <div className="relative z-20 flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-xl shadow-primary-700/30">
                  <Mic className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
                </div>
                {/* Stand connector and base */}
                <div className="w-1 h-6 bg-primary-500" />
                <div className="w-12 h-1.5 bg-primary-600 rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for Faster Resolution
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Every feature is built to help customers describe problems effortlessly and get them resolved quickly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Voice to Ticket */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-5 ring-4 ring-primary-50/50">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Voice to Ticket</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Report problems naturally without lengthy forms.
            </p>
          </div>

          {/* Card 2: AI Understanding */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-5 ring-4 ring-primary-50/50">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Understanding</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Automatically categorize and route complaints.
            </p>
          </div>

          {/* Card 3: Ticket Tracking */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-5 ring-4 ring-primary-50/50">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Ticket Tracking</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Follow progress and receive resolution updates.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section: 4 Customer-Facing Steps */}
      <section id="how-it-works" className="bg-slate-50/70 border-y border-slate-100 py-16 w-full">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/80 text-primary-700 text-xs font-bold tracking-wide mb-3">
              <span>Simple 4-Step Process</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How VoxDesk Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              From spoken complaint to active department assignment in four seamless steps.
            </p>
          </div>

          {/* 4 Connected Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1: Speak Your Complaint */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between text-left relative group hover:border-primary-200 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-primary-700 text-white font-bold text-xs flex items-center justify-center mb-4 shadow-sm shadow-primary-700/20">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900">Speak Your Complaint</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Describe your issue using your voice.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-primary-700">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Natural spoken voice</span>
              </div>
            </div>

            {/* Step 2: Automatic Transcription */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between text-left relative group hover:border-primary-200 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-primary-700 text-white font-bold text-xs flex items-center justify-center mb-4 shadow-sm shadow-primary-700/20">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900">Automatic Transcription</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Your speech is converted into text.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-primary-700">
                <FileText className="w-3.5 h-3.5" />
                <span>Editable transcript</span>
              </div>
            </div>

            {/* Step 3: AI Complaint Analysis */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between text-left relative group hover:border-primary-200 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-primary-700 text-white font-bold text-xs flex items-center justify-center mb-4 shadow-sm shadow-primary-700/20">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI Complaint Analysis</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Your complaint is categorized and routed.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-primary-700">
                <Cpu className="w-3.5 h-3.5" />
                <span>Priority & department routing</span>
              </div>
            </div>

            {/* Step 4: Track Your Resolution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between text-left relative group hover:border-primary-200 transition">
              <div>
                <div className="w-8 h-8 rounded-xl bg-primary-700 text-white font-bold text-xs flex items-center justify-center mb-4 shadow-sm shadow-primary-700/20">
                  4
                </div>
                <h3 className="text-sm font-bold text-slate-900">Track Your Resolution</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Receive your ticket ID and monitor progress.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-primary-700">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Live status updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Action CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 w-full text-center">
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-primary-900/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to Resolve Your Issue?
            </h2>
            <p className="text-xs sm:text-sm text-primary-100 max-w-lg mx-auto leading-relaxed">
              Speak directly to our voice support desk. Describe what went wrong and get your official ticket tracking ID immediately.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-primary-900 hover:bg-primary-50 font-bold text-xs sm:text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span>Report an Issue Now</span>
                <Mic className="w-4 h-4 text-primary-700" />
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-800/80 hover:bg-primary-800 text-white border border-primary-600/60 font-bold text-xs sm:text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <span>Track an Existing Ticket</span>
                <Search className="w-4 h-4 text-primary-300" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
