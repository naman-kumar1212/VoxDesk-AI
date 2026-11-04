import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ArrowRight, Zap, Layers, Clock, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white via-primary-50/30 to-primary-100/40 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline and Call-to-Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Pill Badge matching reference */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Voice Support Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Resolve Issues <br />
            <span className="text-slate-900">with Your Voice</span>
          </h1>

          <p className="text-base text-slate-600 max-w-lg leading-relaxed">
            Speak your problem, get it understood, categorized and resolved faster with AI.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm shadow-md shadow-primary-700/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Report an Issue</span>
              <Mic className="w-4 h-4" />
            </Link>

            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm shadow-sm transition"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Illustration matching reference */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          {/* Soft lavender glowing aura */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Concentric rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-200/50 to-primary-100/30 blur-2xl"></div>
            <div className="absolute w-64 h-64 rounded-full border border-primary-200/60 animate-pulse"></div>
            <div className="absolute w-52 h-52 rounded-full border border-primary-300/80 bg-primary-50/40"></div>

            {/* Frequency bars left and right */}
            <div className="absolute -left-4 flex items-center gap-1">
              <span className="w-1 h-6 bg-primary-400 rounded-full"></span>
              <span className="w-1 h-12 bg-primary-500 rounded-full"></span>
              <span className="w-1 h-8 bg-primary-400 rounded-full"></span>
            </div>
            <div className="absolute -right-4 flex items-center gap-1">
              <span className="w-1 h-8 bg-primary-400 rounded-full"></span>
              <span className="w-1 h-12 bg-primary-500 rounded-full"></span>
              <span className="w-1 h-6 bg-primary-400 rounded-full"></span>
            </div>

            {/* Central glowing microphone orb */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-b from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-xl shadow-primary-600/30 relative z-10">
              <Mic className="w-14 h-14 text-white stroke-[2.2]" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid (Bottom section of Landing Screen in reference) */}
      <section className="max-w-6xl mx-auto px-4 pb-14 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-primary-100/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Voice to Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">Speak, not type</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-primary-100/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Understanding</h3>
            <p className="text-xs text-slate-500 mt-1">Auto categorize & route</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-primary-100/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Faster Resolution</h3>
            <p className="text-xs text-slate-500 mt-1">Track & get updates</p>
          </div>
        </div>
      </section>
    </div>
  );
}

