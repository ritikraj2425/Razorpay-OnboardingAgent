"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, CheckCircle, XCircle, AlertCircle, Loader2, Globe, Database, FileSearch, Landmark, Shield, Brain, Key, Cpu, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentStep = {
  name: string;
  status: string;
  detail: string;
  duration_ms?: number;
  category?: string;
  code_snippet?: string;
};

type StepState = "waiting" | "running" | "done";

const CATEGORY_META: Record<string, { icon: any; label: string; color: string }> = {
  registration: { icon: Cpu,        label: "Registry",    color: "text-gray-600" },
  documents:    { icon: Database,   label: "Documents",   color: "text-blue-600" },
  kyc:          { icon: FileSearch, label: "KYC Engine",  color: "text-purple-600" },
  banking:      { icon: Landmark,   label: "Banking",     color: "text-teal-600" },
  website:      { icon: Globe,      label: "Web Crawler", color: "text-orange-600" },
  compliance:   { icon: Shield,     label: "Compliance",  color: "text-indigo-600" },
  risk:         { icon: AlertCircle,label: "Risk Engine", color: "text-red-600" },
  decision:     { icon: Key,        label: "Decision",    color: "text-emerald-600" },
  activation:   { icon: Zap,        label: "Activation",  color: "text-yellow-600" },
  ai:           { icon: Brain,      label: "LLM Agent",   color: "text-violet-600" },
  general:      { icon: Cpu,        label: "Agent",       color: "text-gray-600" },
};

function StatusIcon({ status, running }: { status: string; running?: boolean }) {
  if (running) return <Loader2 size={16} className="animate-spin text-blue-500" />;
  if (status === "passed" || status === "info") return <CheckCircle size={16} className="text-success" />;
  if (status === "failed" || status === "flagged") return <XCircle size={16} className="text-danger" />;
  if (status === "warning") return <AlertCircle size={16} className="text-warning" />;
  return <CheckCircle size={16} className="text-gray-300" />;
}

// Typing animation for a single string
function TypedText({ text, speed = 18, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const iv = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(iv);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-blink border-r border-gray-600 ml-0.5">&nbsp;</span>
      )}
    </span>
  );
}

// Simulated output lines per category
function getSimulatedLines(step: AgentStep): string[] {
  const cat = step.category || "general";
  if (cat === "website") {
    if (step.name === "Website Availability") {
      return [
        `→ DNS resolve: merchant website...`,
        `→ HTTP GET / ... ${step.status === "passed" ? "200 OK" : "FAILED"}`,
        `→ Detecting page type: ${step.detail.includes("SPA") ? "JavaScript SPA" : "Server-rendered HTML"}`,
        `→ ${step.detail}`,
      ];
    }
    if (step.name === "Content Extraction") {
      return [
        `→ Running Playwright content extractor...`,
        `→ Scraping headings, paragraphs, product listings...`,
        `→ ${step.detail}`,
      ];
    }
    return [`→ ${step.detail}`];
  }
  if (cat === "kyc") {
    return [
      `→ Querying validation engine...`,
      `→ ${step.detail}`,
    ];
  }
  if (cat === "banking") {
    return [
      `→ Initiating penny-drop simulation...`,
      `→ ${step.detail}`,
    ];
  }
  if (cat === "ai") {
    return [
      `→ Calling Groq LLM (llama-3.3-70b)...`,
      `→ Analyzing merchant risk profile...`,
      `→ ${step.detail}`,
    ];
  }
  if (cat === "decision") {
    return [
      `→ Aggregating all verification signals...`,
      `→ ${step.detail}`,
    ];
  }
  return [`→ ${step.detail}`];
}

export function AgentTerminal({ steps }: { steps: AgentStep[] }) {
  const [visibleStep, setVisibleStep] = useState(0);
  const [stepState, setStepState] = useState<StepState>("running");
  const logRef = useRef<HTMLDivElement>(null);

  // step states: for each step 0..steps.length, track: waiting / running / done
  const [stepPhase, setStepPhase] = useState<StepState[]>(steps.map((_, i) => (i === 0 ? "running" : "waiting")));

  useEffect(() => {
    const advance = () => {
      setVisibleStep(prev => {
        const next = prev + 1;
        if (next >= steps.length) return prev;
        setStepPhase(ph => ph.map((s, i) => i === next ? "running" : i < next ? "done" : "waiting"));
        return next;
      });
    };

    const dur = (steps[visibleStep]?.duration_ms || 400) + 600;
    const t = setTimeout(() => {
      setStepPhase(ph => ph.map((s, i) => i === visibleStep ? "done" : s));
      advance();
    }, Math.min(dur, 1800));
    return () => clearTimeout(t);
  }, [visibleStep]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleStep]);

  const finalDecision = steps[steps.length - 1];
  const isDone = visibleStep >= steps.length - 1 && stepPhase[steps.length - 1] === "done";

  return (
    <div className="grid grid-cols-[280px_1fr] gap-0 rounded-2xl border border-gray-200 overflow-hidden shadow-lg bg-white min-h-[520px]">
      {/* Left: Agent Step List */}
      <div className="bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-semibold text-gray-400 ml-1">Agent Pipeline</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {steps.map((step, i) => {
            const meta = CATEGORY_META[step.category || "general"] || CATEGORY_META.general;
            const Icon = meta.icon;
            const phase = stepPhase[i];
            return (
              <div key={i} className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-xs cursor-default transition-all",
                phase === "running" && "bg-gray-800",
                phase === "done" && i === visibleStep && "bg-gray-800/50",
              )}>
                {/* Connector line */}
                <div className="relative flex flex-col items-center">
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "absolute top-4 left-1/2 -translate-x-1/2 w-px transition-all duration-300",
                      phase === "done" ? "bg-gray-600 h-7" : "bg-gray-700 h-7"
                    )} />
                  )}
                  <div className={cn(
                    "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300",
                    phase === "done" && step.status === "passed"  ? "border-green-500 bg-green-500/20" : "",
                    phase === "done" && step.status === "failed"  ? "border-red-500 bg-red-500/20" : "",
                    phase === "done" && step.status === "warning" ? "border-yellow-500 bg-yellow-500/20" : "",
                    phase === "running" ? "border-blue-400 bg-blue-400/20" : "",
                    phase === "waiting" ? "border-gray-700 bg-gray-800" : "",
                  )}>
                    {phase === "running"
                      ? <Loader2 size={10} className="animate-spin text-blue-400" />
                      : phase === "done"
                        ? step.status === "passed" || step.status === "info"
                          ? <Check size={10} className="text-green-400" />
                          : step.status === "failed"
                            ? <X size={10} className="text-red-400" />
                            : <span className="text-yellow-400 text-[9px] font-bold">!</span>
                        : <span className="text-gray-600 text-[9px]">{i + 1}</span>
                    }
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold truncate",
                    phase === "running" ? "text-white" : phase === "done" ? "text-gray-300" : "text-gray-600"
                  )}>
                    {step.name}
                  </div>
                  <div className={cn("text-[10px] truncate", meta.color)}>{meta.label}</div>
                </div>

                {phase === "running" && (
                  <div className="flex gap-0.5 items-end h-3">
                    {[0, 1, 2].map(k => (
                      <div key={k} className="w-0.5 bg-blue-400 rounded-full animate-pulse-dot" style={{ height: `${6 + k * 3}px`, animationDelay: `${k * 150}ms` }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Live Output Panel */}
      <div className="flex flex-col bg-gray-50 border-l border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isDone ? "bg-success" : "bg-blue-500 animate-pulse-dot"
            )} />
            <span className="text-sm font-semibold text-gray-900">
              {isDone ? "Verification Complete" : "Agent is working..."}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {steps.slice(0, visibleStep + 1).reduce((a, s) => a + (s.duration_ms || 0), 0)}ms elapsed
          </span>
        </div>

        {/* Output log */}
        <div ref={logRef} className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-sm">
          {steps.slice(0, visibleStep + 1).map((step, i) => {
            const meta = CATEGORY_META[step.category || "general"] || CATEGORY_META.general;
            const Icon = meta.icon;
            const phase = stepPhase[i];
            const simLines = getSimulatedLines(step);

            return (
              <div key={i} className="animate-slide-up">
                {/* Step header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={13} className={meta.color} />
                  <span className={cn("text-xs font-bold uppercase tracking-wider", meta.color)}>{meta.label}</span>
                  <span className="text-xs text-gray-400 font-sans">{step.name}</span>
                  {step.duration_ms !== undefined && step.duration_ms > 0 && (
                    <span className="ml-auto text-[10px] text-gray-400">{step.duration_ms}ms</span>
                  )}
                </div>

                {/* Output lines */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1">
                  {simLines.map((line, li) => (
                    <div key={li} className="text-[12px] text-gray-600 leading-relaxed">
                      {i === visibleStep && phase === "running" && li === simLines.length - 1
                        ? <TypedText text={line} speed={12} />
                        : <span>{line}</span>
                      }
                    </div>
                  ))}
                  {/* Result badge */}
                  {(phase === "done" || i < visibleStep) && (
                    <div className={cn(
                      "mt-2 flex items-center gap-1.5 text-[11px] font-bold",
                      step.status === "passed" || step.status === "info" ? "text-success" :
                      step.status === "failed" || step.status === "flagged" ? "text-danger" :
                      "text-warning"
                    )}>
                      <StatusIcon status={step.status} />
                      {step.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final decision banner */}
        {isDone && finalDecision && (
          <div className={cn(
            "border-t p-5 flex items-center justify-between animate-slide-up",
            finalDecision.status === "passed" ? "bg-success-subtle border-green-200" :
            finalDecision.status === "warning" ? "bg-warning-subtle border-amber-200" :
            "bg-danger-subtle border-red-200"
          )}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Final Decision</div>
              <div className="text-lg font-bold text-gray-900">{finalDecision.detail}</div>
            </div>
            <StatusIcon status={finalDecision.status} />
          </div>
        )}
      </div>
    </div>
  );
}
