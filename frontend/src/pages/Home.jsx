import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ArrowRight, Zap, Layers, Clock, Sparkles, CheckCircle2, Shield, Headphones } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white via-primary-50/25 to-slate-50 flex flex-col justify-between">
      {/* Hero Section matching Screen 1 */}
      <section className="max-w-6xl mx-auto px-4 pt-12 sm:pt-16 pb-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline and Call-to-Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Pill Badge matching reference */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/80 text-primary-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Voice Support Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Resolve Issues <br />
            <span className="text-slate-900">with Your Voice</span>
          </h1>

          <p className="text-base text-slate-600 max-w-lg leading-relaxed">
            Speak your problem, get it understood, categorized and resolved faster with AI.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm shadow-md shadow-primary-700/25 transition transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span>Report an Issue</span>
              <Mic className="w-4 h-4" />
            </Link>

            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-4 flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Whisper STT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Gemini Classification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Free $0 Tier</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic matching Reference Screen 1 */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Soft concentric lavender circular backdrop */}
            <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-primary-50/70 border border-primary-100" />
            <div className="absolute w-56 h-56 rounded-full bg-primary-100/50 border border-primary-200/50" />

            {/* Left Soundwave bars matching reference */}
            <div className="absolute left-6 sm:left-8 flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-6 bg-primary-300 rounded-full" />
              <span className="w-1.5 h-12 bg-primary-400 rounded-full" />
              <span className="w-1.5 h-8 bg-primary-300 rounded-full" />
            </div>

            {/* Right Soundwave bars matching reference */}
            <div className="absolute right-6 sm:right-8 flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-8 bg-primary-300 rounded-full" />
              <span className="w-1.5 h-12 bg-primary-400 rounded-full" />
              <span className="w-1.5 h-6 bg-primary-300 rounded-full" />
            </div>

            {/* Central Microphone orb with gradient and stand matching reference */}
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
      </section>

      {/* Feature Cards Grid (Bottom of Screen 1) */}
      <section id="features" className="max-w-6xl mx-auto px-4 pb-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Voice to Ticket */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Voice to Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">Speak, not type</p>
          </div>

          {/* Card 2: AI Understanding */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Understanding</h3>
            <p className="text-xs text-slate-500 mt-1">Auto categorize & route</p>
          </div>

          {/* Card 3: Faster Resolution */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Faster Resolution</h3>
            <p className="text-xs text-slate-500 mt-1">Track & get updates</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-100 w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">How VoxDesk Works</h2>
          <p className="text-xs text-slate-500 mt-2">
            Automating customer grievance intake through speech-to-text, generative AI classification, and structured database routing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">Speak Complaint</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Press record and describe what went wrong in your own natural spoken words.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">Whisper STT</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Groq Whisper Large V3 Turbo accurately transcribes speech with low latency.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">Gemini Extraction</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Google Gemini classifies category, urgency, department, and flags human escalation.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center mb-3">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-900">Track & Resolve</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Ticket persists in Supabase PostgreSQL; customer receives audio and tracking ID.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
