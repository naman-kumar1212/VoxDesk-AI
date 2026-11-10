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
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-[#F8FAFD] flex flex-col min-h-screen">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Hero Section: Stripe Precision Financial-Grade Grievance Intake */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFD] to-[#F6F9FC] border-b border-[#E3ECF7] pt-14 sm:pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Subheading, CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow Context Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F0FE] text-[#533AFD] border border-[#CBC7FD]/50 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Voice grievance dispatch platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#061B31] tracking-tightest leading-[1.05]">
              Customer grievances, filed by voice
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#30313D] max-w-xl leading-relaxed">
              Customers explain issues naturally in their own spoken words. VoxDesk transcribes speech in sub-seconds, extracts structured complaint intents, and dispatches the ticket directly to the assigned department.
            </p>

            {/* Action Buttons: Stripe Pill Standard */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#533AFD] hover:bg-[#635BFF] text-white font-medium text-[15px] shadow-btn transition-all duration-150 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#0570DE]"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>Report an issue with voice</span>
                <ArrowRight className="w-4 h-4 ml-0.5 text-white/80" />
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#F8FAFD] text-[#061B31] font-medium text-[15px] border border-[#D4DEE9] shadow-xs transition-all duration-150 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#0570DE]"
              >
                <Search className="w-4 h-4 text-[#737373]" />
                <span>Track a ticket</span>
              </Link>
            </div>

            {/* Technical Meta Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#737373]">
              <span className="font-medium text-[#30313D]">Groq Whisper transcription</span>
              <span className="text-[#D4DEE9]" aria-hidden="true">•</span>
              <span className="font-medium text-[#30313D]">Zero-login public tracking</span>
              <span className="text-[#D4DEE9]" aria-hidden="true">•</span>
              <span className="font-medium text-[#30313D]">Deterministic policy rules</span>
            </div>
          </div>

          {/* Right Column: Acoustic Grievance Console Card (Stripe Elevated Card) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[18px] border border-[#D4DEE9]/80 p-6 shadow-md hover:shadow-lg transition-shadow duration-200 space-y-4">
              {/* Header with Acoustic Intake Stamp */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF7]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#533AFD] animate-pulse"></span>
                  <span className="text-xs font-semibold text-[#061B31]">Acoustic intake console</span>
                </div>
                <span className="text-[11px] font-mono text-[#533AFD] bg-[#F2F0FE] px-2.5 py-0.5 rounded-full border border-[#CBC7FD]/60 font-medium">
                  44.1 kHz • Mono
                </span>
              </div>

              {/* Acoustic Spectrum Display */}
              <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E3ECF7] space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#737373]">
                  <span>Input level</span>
                  <span className="text-[#0570DE] font-semibold">-14 dBFS</span>
                </div>

                {/* Discrete Frequency Spectrum Bars in Stripe Violet & Blue */}
                <div className="flex items-end justify-between gap-1.5 h-12 py-1">
                  {[28, 45, 72, 88, 96, 75, 58, 92, 66, 44, 32, 55, 80, 48, 35].map((level, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-sm transition-all duration-150"
                      style={{
                        height: `${level}%`,
                        backgroundColor: i % 2 === 0 ? '#533AFD' : '#0073E6',
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </div>

                <div className="pt-2.5 border-t border-[#E3ECF7]">
                  <p className="text-xs text-[#30313D] leading-relaxed font-sans">
                    "My credit card was charged twice for the monthly subscription on November 2nd. The duplicate charge of $120 has posted to my account. Please initiate a refund."
                  </p>
                </div>
              </div>

              {/* Extraction Ledger Rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#F6F9FC] border border-[#E3ECF7]/80">
                  <span className="text-[#737373]">Category</span>
                  <span className="font-semibold text-[#061B31]">Billing & payments</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#F6F9FC] border border-[#E3ECF7]/80">
                  <span className="text-[#737373]">Assigned team</span>
                  <span className="font-semibold text-[#533AFD]">Billing & Finance</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#F6F9FC] border border-[#E3ECF7]/80">
                  <span className="text-[#737373]">Ticket reference</span>
                  <span className="font-mono text-[#061B31] font-semibold">VD-426CC831</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. How It Works (Workflow Pass) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 border-b border-[#E3ECF7] bg-[#F8FAFD]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-2.5 mb-14">
            <span className="text-xs font-semibold text-[#533AFD] tracking-wide uppercase">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#061B31] tracking-tight">
              From spoken voice to verified ticket
            </h2>
            <p className="text-[#30313D] text-sm sm:text-base leading-relaxed">
              Four steps from the first spoken sentence to an audit-logged departmental dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {/* Step 1 */}
            <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-[#F2F0FE] text-[#533AFD] border border-[#CBC7FD]/60 flex items-center justify-center font-mono font-semibold text-xs">
                  01
                </div>
                <h3 className="text-base font-semibold text-[#061B31]">Record grievance</h3>
                <p className="text-xs text-[#30313D] leading-relaxed">
                  Speak naturally for up to 45 seconds. Live visualizer and waveform feedback confirm voice capture.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E3ECF7] flex items-center gap-1.5 text-xs text-[#737373] font-mono">
                <Mic className="w-3.5 h-3.5 text-[#533AFD]" />
                <span>MediaRecorder WebM</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-[#F2F0FE] text-[#533AFD] border border-[#CBC7FD]/60 flex items-center justify-center font-mono font-semibold text-xs">
                  02
                </div>
                <h3 className="text-base font-semibold text-[#061B31]">Inspect transcript</h3>
                <p className="text-xs text-[#30313D] leading-relaxed">
                  Groq Whisper transcribes speech in sub-seconds. Customers can edit and confirm before dispatch.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E3ECF7] flex items-center gap-1.5 text-xs text-[#737373] font-mono">
                <FileText className="w-3.5 h-3.5 text-[#0073E6]" />
                <span>Customer verification</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-[#F2F0FE] text-[#533AFD] border border-[#CBC7FD]/60 flex items-center justify-center font-mono font-semibold text-xs">
                  03
                </div>
                <h3 className="text-base font-semibold text-[#061B31]">Extract and route</h3>
                <p className="text-xs text-[#30313D] leading-relaxed">
                  Gemini extracts category, root cause, and priority under deterministic Python policy rules.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E3ECF7] flex items-center gap-1.5 text-xs text-[#737373] font-mono">
                <Cpu className="w-3.5 h-3.5 text-[#FF6118]" />
                <span>Pydantic v2 schema</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-6 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-[#F2F0FE] text-[#533AFD] border border-[#CBC7FD]/60 flex items-center justify-center font-mono font-semibold text-xs">
                  04
                </div>
                <h3 className="text-base font-semibold text-[#061B31]">Reference & reply</h3>
                <p className="text-xs text-[#30313D] leading-relaxed">
                  The customer receives a reference number, spoken confirmation, and a real-time status page.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E3ECF7] flex items-center gap-1.5 text-xs text-[#737373] font-mono">
                <Volume2 className="w-3.5 h-3.5 text-[#00D66F]" />
                <span>SpeechSynthesis audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Core Capabilities */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-24 bg-white border-b border-[#E3ECF7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-2.5 mb-14">
            <span className="text-xs font-semibold text-[#533AFD] tracking-wide uppercase">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#061B31] tracking-tight">
              Engineered for reliable ticket dispatch
            </h2>
            <p className="text-[#30313D] text-sm sm:text-base leading-relaxed">
              Every step is auditable, deterministic, and built on low-latency infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-[18px] border border-[#D4DEE9]/80 bg-[#F8FAFD] shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F2F0FE] text-[#533AFD] border border-[#CBC7FD]/50 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#061B31]">Speech-to-text architecture</h3>
              <p className="text-xs text-[#30313D] leading-relaxed">
                Groq Whisper Turbo transcribes speech in sub-seconds. Built-in fallback to manual text entry ensures accessibility in any environment.
              </p>
            </div>

            <div className="p-7 rounded-[18px] border border-[#D4DEE9]/80 bg-[#F8FAFD] shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#EBF5FE] text-[#0073E6] border border-[#B8DBFC] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#061B31]">Deterministic business rules</h3>
              <p className="text-xs text-[#30313D] leading-relaxed">
                Python policy rules enforce routing invariants, detect duplicate complaints, and prevent category hallucinations.
              </p>
            </div>

            <div className="p-7 rounded-[18px] border border-[#D4DEE9]/80 bg-[#F8FAFD] shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#E6F9F0] text-[#008A4B] border border-[#A3F0C8] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#061B31]">Operations console</h3>
              <p className="text-xs text-[#30313D] leading-relaxed">
                Support managers oversee ticket queues, inspect customer transcripts, monitor department capacity, and review audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
