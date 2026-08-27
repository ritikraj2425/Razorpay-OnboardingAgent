import { useEffect, useState, useRef } from "react";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play, Brain, Eye, Hash, Globe, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Typewriter = ({ text, speed = 15 }: { text: string, speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const iv = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <>{displayed}</>;
};

type TierResult = {
  tier: number;
  name: string;
  status: string;
  detail: string;
  duration_ms?: number;
};

const TIER_ICONS: Record<number, any> = {
  1: Globe,
  2: Hash,
  3: Eye,
  4: Brain,
};

export function AgentExecutionViewer({ 
  results, 
  config,
  isRunning = false,
  disableAnimation = false
}: { 
  results: TierResult[], 
  config: { n: number, name: string, desc: string }[],
  isRunning?: boolean,
  disableAnimation?: boolean
}) {
  const [animStep, setAnimStep] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results.length === 0) {
      setAnimStep(0);
      return;
    }

    if (disableAnimation) {
      setAnimStep(results.length);
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
      return;
    }

    setAnimStep(0);
    
    // Calculate total duration for each step based on the result duration_ms (or minimum of 800ms)
    let accumulatedDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    results.forEach((res, i) => {
      const ms = Math.max(res.duration_ms || 800, 800); // Slow down slightly for visual effect
      
      // Activate the step
      timeouts.push(setTimeout(() => {
        setAnimStep(i + 1);
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, accumulatedDelay));
      
      accumulatedDelay += ms;
    });

    return () => timeouts.forEach(clearTimeout);
  }, [results, disableAnimation]);

  if (results.length === 0 && !isRunning) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
      
      {/* Visual Pipeline */}
      <div className="lg:col-span-3 space-y-4 relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
        
        {config.map((tierConf, idx) => {
          const result = results.find(r => r.tier === tierConf.n);
          const isAnimating = idx === animStep;
          const isComplete = idx < animStep;
          const isPending = idx > animStep;
          
          const Icon = TIER_ICONS[tierConf.n] || Play;
          
          let statusColor = "text-gray-400 bg-gray-100 border-gray-200";
          let textColor = "text-gray-500";
          let StatusIcon = null;
          
          if (isAnimating) {
            // It's only truly animating if it's the current animStep AND we haven't reached the end of known results 
            // OR if it's the next step and it's actively running.
            const actuallyAnimating = idx < results.length || isRunning;
            if (actuallyAnimating) {
              statusColor = "text-blue-600 bg-blue-50 border-blue-200 ring-4 ring-blue-50 animate-pulse";
              textColor = "text-blue-900";
              StatusIcon = <Loader2 size={14} className="animate-spin text-blue-600" />;
            }
          } else if (isComplete && result) {
            if (result.status === "passed" || result.status === "cleared") {
              statusColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
              textColor = "text-emerald-900";
              StatusIcon = <CheckCircle size={14} className="text-emerald-500" />;
            } else if (result.status === "failed" || result.status === "escalated") {
              statusColor = "text-red-600 bg-red-50 border-red-200";
              textColor = "text-red-900";
              StatusIcon = <XCircle size={14} className="text-red-500" />;
            } else if (result.status === "warning") {
              statusColor = "text-orange-600 bg-orange-50 border-orange-200";
              textColor = "text-orange-900";
              StatusIcon = <AlertTriangle size={14} className="text-orange-500" />;
            } else if (result.status === "no_change" || result.status === "benign") {
              statusColor = "text-slate-600 bg-slate-50 border-slate-200";
              textColor = "text-slate-900";
              StatusIcon = <MinusCircle size={14} className="text-slate-500" />;
            }
          }

          // If the pipeline stopped early (e.g., no_change), visually disable the remaining steps
          const pipelineStopped = results.length < config.length && idx >= results.length;
          if (pipelineStopped && !isPending) {
            statusColor = "text-gray-300 bg-gray-50 border-gray-100 opacity-50";
            textColor = "text-gray-400";
          }

          return (
            <div key={tierConf.n} className={cn(
              "relative pl-14 transition-all duration-500",
              (isPending && !pipelineStopped) ? "opacity-40 grayscale" : "opacity-100",
              pipelineStopped ? "opacity-30" : ""
            )}>
              {/* Connector Node */}
              <div className={cn(
                "absolute left-2.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-colors duration-500 z-10",
                statusColor.split(" ")[0], // text color
                statusColor.split(" ")[2]  // border color
              )}>
                <Icon size={14} />
              </div>

              {/* Content Box */}
              <div className={cn(
                "rounded-xl border p-4 bg-white transition-all duration-500",
                isAnimating && (idx < results.length || isRunning) ? "shadow-md border-blue-200 ring-2 ring-blue-50" : "shadow-sm border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">Tier {tierConf.n}</span>
                    <h3 className={cn("text-sm font-semibold", textColor)}>{tierConf.name}</h3>
                  </div>
                  {StatusIcon && <div className="flex items-center gap-1.5">{StatusIcon}</div>}
                </div>
                
                <p className="text-xs text-gray-500 mb-2">{tierConf.desc}</p>
                
                {isComplete && result && (
                  <div className={cn(
                    "mt-3 text-xs p-2 rounded bg-gray-50 border font-mono border-gray-100",
                    result.status === "no_change" || result.status === "benign" ? "text-slate-600 bg-slate-100/50" : "text-gray-700"
                  )}>
                    <span className="opacity-50 mr-2">&gt;</span> {result.detail}
                    {result.duration_ms && <span className="float-right opacity-40">{result.duration_ms}ms</span>}
                  </div>
                )}

                {pipelineStopped && idx === results.length && (
                  <div className="mt-3 text-xs font-semibold text-slate-500 bg-slate-100 p-2 rounded flex items-center gap-2 border border-slate-200">
                    <MinusCircle size={14} /> Pipeline Halted: Optimization Criteria Met
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Viewer */}
      <div className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden flex flex-col shadow-xl border border-gray-800">
        <div className="bg-gray-950 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="ml-2 text-[10px] font-mono text-gray-500 uppercase">Agent.log</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/70 animate-pulse">Running</span>
        </div>
        
        <div 
          ref={terminalRef}
          className="flex-1 p-4 font-mono text-[10px] sm:text-xs leading-relaxed text-gray-300 overflow-y-auto max-h-[400px] whitespace-pre-wrap break-all"
        >
          {results.length === 0 && isRunning ? (
            <div className="text-gray-500 animate-pulse">
              [SYS] Establishing secure connection to Sentinels Core...<br/>
              [SYS] Handshake successful. Awaiting stream data...<span className="animate-[ping_1s_infinite]">_</span>
            </div>
          ) : (
            <div className="text-gray-500 mb-4">
              [SYS] Initializing Recheck Agents...<br/>
              [SYS] Loading baseline configuration...<br/>
              [SYS] Target acquired.
            </div>
          )}
          
          {results.slice(0, animStep).map((res, i) => (
            <div key={i} className="mb-4">
              <div className="text-blue-400">
                <span className="text-gray-500">[{new Date().toISOString().split("T")[1].slice(0,8)}]</span> [TIER_{res.tier}] Executing {res.name.replace(/ /g, '_').toUpperCase()}
              </div>
              <div className={cn(
                "pl-4 py-1",
                res.status === "passed" || res.status === "cleared" ? "text-emerald-400" :
                res.status === "failed" || res.status === "escalated" ? "text-red-400" :
                res.status === "warning" ? "text-yellow-400" : "text-slate-400"
              )}>
                {">"} <Typewriter text={res.detail} speed={10} />
                <br/>
                <span className="text-gray-600">
                  <Typewriter text={`{ "status": "${res.status}", "latency": ${res.duration_ms}ms }`} speed={5} />
                </span>
              </div>
            </div>
          ))}
          
          {animStep < results.length && (
            <div className="animate-pulse text-gray-500">
              <span className="text-blue-400">[{new Date().toISOString().split("T")[1].slice(0,8)}]</span> [TIER_{results[animStep].tier}] Awaiting resolution...<span className="animate-[ping_1s_infinite]">_</span>
            </div>
          )}

          {animStep === results.length && results.length < config.length && (
            <div className="text-emerald-500 font-bold mt-4">
              [SYS] Optimization triggered.<br/>
              [SYS] Execution HALTED to save API costs.<br/>
              [SYS] Estimated savings: $0.13
            </div>
          )}
          
          {animStep === results.length && results.length === config.length && (
            <div className="text-emerald-500 font-bold mt-4">
              [SYS] Pipeline completed.<br/>
              [SYS] Risk score updated.<br/>
              [SYS] Awaiting manual review.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
