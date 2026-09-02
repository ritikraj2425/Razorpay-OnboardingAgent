import { useEffect, useState, useRef } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Cpu, Database, FileSearch, Landmark, Globe, Shield, AlertTriangle, Key, Zap, Brain, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentStep } from "./AgentTerminal";

const CATEGORY_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  registration: { icon: Cpu,          label: "Registry",    color: "text-blue-600",    bg: "bg-gradient-to-br from-blue-50/80 to-white" },
  documents:    { icon: Database,     label: "Documents",   color: "text-teal-600",    bg: "bg-gradient-to-br from-teal-50/80 to-white" },
  kyc:          { icon: FileSearch,   label: "KYC Engine",  color: "text-purple-600",  bg: "bg-gradient-to-br from-purple-50/80 to-white" },
  banking:      { icon: Landmark,     label: "Banking",     color: "text-teal-600",    bg: "bg-gradient-to-br from-teal-50/80 to-white" },
  website:      { icon: Globe,        label: "Web Crawler", color: "text-orange-600",  bg: "bg-gradient-to-br from-orange-50/80 to-white" },
  compliance:   { icon: Shield,       label: "Compliance",  color: "text-indigo-600",  bg: "bg-gradient-to-br from-indigo-50/80 to-white" },
  risk:         { icon: AlertTriangle, label: "Risk Engine", color: "text-red-600",    bg: "bg-gradient-to-br from-red-50/80 to-white" },
  decision:     { icon: Key,          label: "Decision",    color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50/80 to-white" },
  activation:   { icon: Zap,          label: "Activation",  color: "text-orange-600",  bg: "bg-gradient-to-br from-orange-50/80 to-white" },
  ai:           { icon: Brain,        label: "LLM Agent",   color: "text-violet-600",  bg: "bg-gradient-to-br from-violet-50/80 to-white" },
  general:      { icon: Cpu,          label: "Agent",       color: "text-gray-600",    bg: "bg-gradient-to-br from-gray-50/80 to-white" },
};

export function VerificationGraph({ steps, onComplete, isRunning }: { steps: AgentStep[], onComplete?: () => void, isRunning?: boolean }) {
  const [animStep, setAnimStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (steps.length === 0) return;
    setAnimStep(0);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step >= steps.length) {
        clearInterval(iv);
        setAnimStep(steps.length);
        if (onCompleteRef.current) onCompleteRef.current();
        return;
      }
      setAnimStep(step);
      if (containerRef.current) {
        const list = containerRef.current.firstElementChild;
        if (list && list.children[step]) {
          list.children[step].scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 1200); // Slower for reading outputs
    return () => clearInterval(iv);
  }, [steps]);

  if (steps.length === 0 && !isRunning) return null;

  return (
    <div className="bg-[#fafaf8] rounded-2xl border border-gray-100 p-8 shadow-sm h-[600px] flex overflow-hidden relative">
      
      {/* Background flowing grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Central Processing Node */}
      <div className="w-1/3 flex flex-col items-center justify-center relative z-10 border-r border-gray-200/50 pr-8">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />
          <div className="relative h-24 w-24 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-white/10">
            {steps.length === 0 && isRunning ? (
              <Loader2 size={32} className="text-blue-400 animate-spin" />
            ) : animStep < steps.length ? (
              <Activity size={32} className="text-white animate-pulse" />
            ) : (
              <CheckCircle size={32} className="text-emerald-400" />
            )}
          </div>
        </div>
        <h3 className="mt-6 text-sm font-bold text-gray-900 uppercase tracking-widest">Sentinels Core</h3>
        <p className="text-xs text-gray-400 mt-1">Autonomous Verification</p>
      </div>

      {/* Flowing Data Lines & Cards */}
      <div 
        ref={containerRef}
        className="w-2/3 pl-8 overflow-y-auto scroll-smooth relative z-10 pb-20"
      >
        <div className="space-y-6">
          {steps.length === 0 && isRunning && (
            <div className="flex items-center justify-center h-full pt-32">
              <div className="flex flex-col items-center gap-4 animate-pulse text-gray-400">
                <Loader2 size={32} className="animate-spin text-blue-400" />
                <p className="text-sm font-semibold tracking-widest uppercase">Initializing Agent Pipeline...</p>
                <p className="text-xs text-center max-w-xs">Connecting to Sentinel core. This involves live web crawling and LLM analysis which may take 10-15 seconds.</p>
              </div>
            </div>
          )}
          {steps.map((step, i) => {
            const meta = CATEGORY_META[step.category || "general"] || CATEGORY_META.general;
            const Icon = meta.icon;
            const isAnimating = i === animStep;
            const isVisible = i <= animStep;
            const isPassed = step.status === "passed" || step.status === "info";
            const isFailed = step.status === "failed" || step.status === "flagged";
            const isWarning = step.status === "warning";

            if (!isVisible) return null;

            return (
              <div 
                key={i} 
                className={cn(
                  "relative p-5 rounded-2xl border transition-all duration-700 ease-out transform",
                  isAnimating ? "translate-x-0 opacity-100 scale-100 border-blue-200 shadow-md ring-4 ring-blue-50" : "translate-x-0 opacity-100 scale-100 border-gray-100 shadow-sm",
                  meta.bg
                )}
              >
                {/* SVG connection line to center */}
                <div className="absolute top-1/2 -left-12 w-12 h-[2px] bg-gradient-to-r from-transparent to-blue-300 opacity-50" />
                {isAnimating && (
                  <div className="absolute top-1/2 -left-12 w-4 h-[2px] bg-blue-500 rounded-full animate-[flow_1s_ease-in-out_infinite]" />
                )}

                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100",
                    meta.color
                  )}>
                    {isAnimating ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {meta.label}
                      </span>
                      {!isAnimating && (
                        <div className="flex items-center gap-1.5">
                          {isPassed && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">PASSED</span>}
                          {isFailed && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">FAILED</span>}
                          {isWarning && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">WARN</span>}
                          <span className="text-[10px] text-gray-400 font-mono ml-2">
                            {step.duration_ms}ms
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {step.name}
                    </h3>

                    {/* Detailed Output Box */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50 text-xs text-gray-600 leading-relaxed font-medium">
                      {isAnimating ? (
                        <span className="flex items-center gap-2 text-blue-500 animate-pulse">
                          <Activity size={12} /> Processing data streams...
                        </span>
                      ) : (
                        <>
                          {step.detail}
                          {step.code_snippet && (
                            <pre className="mt-3 p-3 bg-gray-900 rounded-md text-emerald-400 font-mono text-[10px] whitespace-pre-wrap overflow-x-auto border border-gray-800">
                              <code>{step.code_snippet}</code>
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow {
          0% { transform: translateX(0) scaleX(1); opacity: 1; }
          100% { transform: translateX(40px) scaleX(0.2); opacity: 0; }
        }
      `}} />
    </div>
  );
}
