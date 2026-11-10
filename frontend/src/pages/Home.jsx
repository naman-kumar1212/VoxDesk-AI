import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Search,
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
      {/* 1. Hero Section: Exact, Calm, Acoustic Voice Grievance Dispatch */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border pt-12 sm:pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Subheading, Primary & Secondary CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow Context */}
            <div className="text-xs font-medium text-secondary-text tracking-normal">
              Voice grievance dispatch
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-medium text-primary-text tracking-tight leading-[1.08]">
              Customer grievances, filed by voice
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-secondary-text max-w-xl leading-relaxed">
              Customers speak what happened in their own words. VoxDesk transcribes speech in under a second, extracts structured complaint details, and routes the ticket directly to the assigned department.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white font-medium text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>Report an issue with voice</span>
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-surface hover:bg-surface-subtle text-primary-text font-medium text-sm border border-border shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Search className="w-4 h-4 text-secondary-text" />
                <span>Track a ticket</span>
              </Link>
            </div>

            {/* Quiet Technical Meta Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-muted-text">
              <span>Groq Whisper transcription</span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span>Zero-login public tracking</span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span>Deterministic routing rules</span>
            </div>
          </div>

          {/* Right Column: Acoustic Grievance Console Card (The Hero Moment) */}
          <div className="lg:col-span-5">
            <div className="bg-surface rounded-card border border-border p-5 shadow-xs space-y-4">
              {/* Header with Acoustic Intake Stamp */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-voice"></span>
                  <span className="text-xs font-medium text-primary-text">Acoustic intake console</span>
                </div>
                <span className="text-[11px] font-mono text-muted-text bg-surface-subtle px-2 py-0.5 rounded border border-border">
                  44.1 kHz • Mono
                </span>
              </div>

              {/* Acoustic Spectrum Display */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-text">
                  <span>Input level</span>
                  <span className="text-voice">-14 dBFS</span>
                </div>

                {/* Discrete Frequency Spectrum Bars */}
                <div className="flex items-end justify-between gap-1.5 h-12 py-1">
                  {[24, 42, 68, 85, 92, 70, 54, 88, 62, 40, 28, 50, 75, 45, 30].map((level, i) => (
                    <span
                      key={i}
                      className="flex-1 bg-voice/80 rounded-t-xs"
                      style={{ height: `${level}%` }}
                    />
                  ))}
                </div>

                <div className="pt-2 border-t border-border/80">
                  <p className="text-xs text-secondary-text leading-relaxed font-sans">
                    "My credit card was charged twice for the monthly subscription on November 2nd. The duplicate charge of $120 has posted to my account. Please initiate a refund."
                  </p>
                </div>
              </div>

              {/* Extraction Ledger Rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-muted/60">
                  <span className="text-secondary-text">Category</span>
                  <span className="font-medium text-primary-text">Billing & payments</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-muted/60">
                  <span className="text-secondary-text">Assigned team</span>
                  <span className="font-medium text-brand">Billing</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-muted/60">
                  <span className="text-secondary-text">Ticket reference</span>
                  <span className="font-mono text-primary-text font-medium">VD-426CC831</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. How It Works (Workflow Pass) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-border bg-app">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-2 mb-14">
            <span className="text-xs font-medium text-secondary-text">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium text-primary-text tracking-tight">
              From spoken voice to verified ticket
            </h2>
            <p className="text-secondary-text text-sm sm:text-base leading-relaxed">
              Four steps from the first spoken sentence to an audit-logged departmental dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-left">
            {/* Step 1 */}
            <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-btn bg-surface-subtle border border-border text-primary-text flex items-center justify-center font-mono font-medium text-xs">
                  01
                </div>
                <h3 className="text-sm font-medium text-primary-text">Record grievance</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Speak naturally for up to 45 seconds. Live visualizer and waveform feedback confirm voice capture.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-text font-mono">
                <Mic className="w-3.5 h-3.5 text-voice" />
                <span>MediaRecorder WebM</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-btn bg-surface-subtle border border-border text-primary-text flex items-center justify-center font-mono font-medium text-xs">
                  02
                </div>
                <h3 className="text-sm font-medium text-primary-text">Inspect transcript</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Groq Whisper transcribes speech in sub-seconds. Customers can edit and confirm before dispatch.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-text font-mono">
                <FileText className="w-3.5 h-3.5 text-brand" />
                <span>Customer verification</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-btn bg-surface-subtle border border-border text-primary-text flex items-center justify-center font-mono font-medium text-xs">
                  03
                </div>
                <h3 className="text-sm font-medium text-primary-text">Extract and route</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  Gemini extracts category, root cause, and priority under deterministic Python policy rules.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-text font-mono">
                <Cpu className="w-3.5 h-3.5 text-secondary-text" />
                <span>Pydantic v2 schema</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-surface border border-border rounded-card p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-btn bg-surface-subtle border border-border text-primary-text flex items-center justify-center font-mono font-medium text-xs">
                  04
                </div>
                <h3 className="text-sm font-medium text-primary-text">Reference and audio reply</h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  The customer receives a reference number, spoken confirmation, and a real-time status page.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-text font-mono">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SpeechSynthesis audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Core Capabilities */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-2 mb-14">
            <span className="text-xs font-medium text-secondary-text">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium text-primary-text tracking-tight">
              Engineered for reliable ticket dispatch
            </h2>
            <p className="text-secondary-text text-sm sm:text-base leading-relaxed">
              Every step is auditable, deterministic, and built on low-latency infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-card border border-border bg-surface-subtle space-y-3">
              <div className="w-9 h-9 rounded-btn bg-surface border border-border text-voice flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-medium text-primary-text">Speech-to-text architecture</h3>
              <p className="text-xs text-secondary-text leading-relaxed">
                Groq Whisper Turbo transcribes speech in sub-seconds. Built-in fallback to manual text entry ensures accessibility in any environment.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-surface-subtle space-y-3">
              <div className="w-9 h-9 rounded-btn bg-surface border border-border text-brand flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-medium text-primary-text">Deterministic business rules</h3>
              <p className="text-xs text-secondary-text leading-relaxed">
                Python policy rules enforce routing invariants, detect duplicate complaints, and prevent category hallucinations.
              </p>
            </div>

            <div className="p-6 rounded-card border border-border bg-surface-subtle space-y-3">
              <div className="w-9 h-9 rounded-btn bg-surface border border-border text-secondary-text flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-medium text-primary-text">Operations console</h3>
              <p className="text-xs text-secondary-text leading-relaxed">
                Support managers oversee ticket queues, inspect customer transcripts, monitor department capacity, and review audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
