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
  ShieldCheck,
  Building2,
  Volume2,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-app flex flex-col min-h-screen">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Hero Section: Signal Slate Enterprise Voice Positioning */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border pt-12 sm:pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Subheading, Primary & Secondary CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle text-slate-700 text-xs font-semibold border border-border">
              <span className="w-2 h-2 rounded-full bg-voice"></span>
              <span>Enterprise Voice Grievance Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold text-primary-text tracking-tight leading-[1.12]">
              Resolve Customer Grievances <br />
              <span className="text-brand">Through Natural Voice</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-secondary-text max-w-xl leading-relaxed">
              Eliminate frustrating drop-down menus and lengthy typing on mobile devices. Customers speak their complaint naturally; VoxDesk AI transcribes in sub-seconds, extracts structured intent with Gemini, and deterministically routes tickets directly to the right department.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/report"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-btn bg-brand hover:bg-brand-hover text-white font-semibold text-sm shadow-xs transition transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>Report an Issue with Voice</span>
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-btn bg-surface hover:bg-surface-subtle text-primary-text font-semibold text-sm border border-border shadow-xs transition focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>Track My Ticket</span>
              </Link>
            </div>

            {/* Assurance Checkmarks */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-muted-text">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Whisper AI Transcription
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Zero-Login Public Tracking
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Immutable Audit Trail
              </span>
            </div>
          </div>

          {/* Right Column: Voice Interaction Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-surface rounded-card border border-border p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-voice"></span>
                  <span className="text-xs font-semibold text-primary-text">Voice Interaction Preview</span>
                </div>
                <span className="text-[11px] font-medium text-muted-text bg-surface-subtle px-2 py-0.5 rounded border border-border">Sample Grievance</span>
              </div>

              {/* Restrained Equalizer Graphic */}
              <div className="my-6 p-6 rounded-xl bg-surface-subtle border border-border flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-voice-subtle text-voice flex items-center justify-center shadow-xs">
                  <Mic className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 h-8">
                  {[40, 65, 90, 50, 75, 100, 60, 45, 80, 55, 35].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-voice rounded-full transition-all duration-300"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-secondary-text max-w-sm leading-relaxed">
                  "I was double charged on my card and haven't received a refund."
                </span>
              </div>

              {/* Extraction Preview Card */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-muted">
                  <span className="text-secondary-text font-medium">Extracted Category:</span>
                  <span className="font-semibold text-primary-text">Billing & Payments</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-muted">
                  <span className="text-secondary-text font-medium">Target Department:</span>
                  <span className="font-semibold text-brand">Billing</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-muted">
                  <span className="text-secondary-text font-medium">Urgency & Priority:</span>
                  <span className="font-semibold text-amber-700">Medium Priority</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. How It Works (Step-by-Step Architecture) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-border bg-app">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Structured Automation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-text tracking-tight">
              From Spoken Voice to Verified Resolution
            </h2>
            <p className="text-secondary-text text-sm sm:text-base">
              Four streamlined steps engineered to eliminate customer friction and support routing churn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {/* Step 1 */}
            <div className="bg-surface border border-border rounded-card p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-btn bg-voice-subtle text-voice flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="text-base font-semibold text-primary-text">Record Complaint</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Speak naturally for up to 45 seconds. Live visualizer and waveform feedback confirm voice capture.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-text">
                <Mic className="w-3.5 h-3.5 text-voice" />
                <span>MediaRecorder WebM</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface border border-border rounded-card p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-btn bg-brand-subtle text-brand flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="text-base font-semibold text-primary-text">Review Transcript</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Groq Whisper transcribes speech in &lt;800ms. Customers can inspect, correct, and verify before submission.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-text">
                <FileText className="w-3.5 h-3.5 text-brand" />
                <span>Customer Verification</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface border border-border rounded-card p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-btn bg-surface-muted text-slate-700 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="text-base font-semibold text-primary-text">AI Categorization</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Gemini Flash extracts summary, root cause, and priority. Python rules ensure deterministic department routing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-text">
                <Cpu className="w-3.5 h-3.5 text-slate-700" />
                <span>Pydantic v2 Schema</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-surface border border-border rounded-card p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-btn bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  04
                </div>
                <h3 className="text-base font-semibold text-primary-text">Ticket ID & Voice Reply</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Customer receives a unique reference number and a spoken audio confirmation, with real-time tracking online.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-text">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SpeechSynthesis Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Core Enterprise Features */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-text tracking-tight">
              Engineered for Enterprise Operational Reliability
            </h2>
            <p className="text-secondary-text text-sm sm:text-base">
              Designed from first principles to provide zero-cost, enterprise-grade scalability and data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-card border border-border bg-surface-subtle space-y-3">
              <div className="w-10 h-10 rounded-btn bg-voice-subtle text-voice flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">Speech-to-Text Architecture</h3>
              <p className="text-xs text-secondary-text leading-relaxed">
                Groq Whisper Turbo transcribes audio with minimal latency. Built-in fallback to accessible manual text entry ensures uninterrupted service in all environments.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-surface-subtle space-y-3">
              <div className="w-10 h-10 rounded-btn bg-brand-subtle text-brand flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">Deterministic Business Rules</h3>
              <p className="text-xs text-secondary-text leading-relaxed">
                Python policy rules override raw LLM outputs to detect fraud patterns, flag repeat contacts, and enforce organizational department routing invariants.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-surface-subtle space-y-3">
              <div className="w-10 h-10 rounded-btn bg-surface-muted text-slate-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">5-Module Admin Console</h3>
              <p className="text-xs text-secondary-text leading-relaxed">
                Support managers oversee ticket queues, monitor department capacity, manage RBAC staff access, and analyze in-memory resolution statistics.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
