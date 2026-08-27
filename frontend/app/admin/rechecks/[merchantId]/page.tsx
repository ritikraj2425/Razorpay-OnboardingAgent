"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Play, TrendingUp, MessageSquareWarning, Hash, Eye, Brain, AlertTriangle, Loader2, CheckCircle, XCircle, Clock, Shield, Globe } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Card, Button, riskTone } from "@/components/ui";
import { AgentExecutionViewer } from "@/components/AgentExecutionViewer";
import { api, RecheckJob } from "@/lib/api";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return iso; }
}

type TierResult = {
  tier: number;
  name: string;
  status: string;
  detail: string;
  duration_ms?: number;
};

const TIER_CONFIG = [
  { n: 1, name: "Website Availability Check", icon: Globe, desc: "Verify merchant website is online and parse textual content from all pages.", stopIf: "Website offline -- wait for next scheduled check." },
  { n: 2, name: "Content Hash Comparison", icon: Hash, desc: "Compute SHA-256 of the latest text content and compare with the baseline hash.", stopIf: "Hash unchanged -- no content drift detected. Pipeline stops." },
  { n: 3, name: "Semantic Drift Analysis", icon: Eye, desc: "Compute cosine similarity of text embeddings against baseline to detect meaning-level changes.", stopIf: "Drift below threshold -- negligible meaning change. Pipeline stops." },
  { n: 4, name: "AI Investigation & Escalation", icon: Brain, desc: "Send content to Groq LLM for deep risk analysis, adjust payout limits, and create human review cases.", stopIf: "Terminal tier -- actions executed." },
];



export default function RecheckDetailPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = use(params);
  const [job, setJob] = useState<RecheckJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [liveTiers, setLiveTiers] = useState<TierResult[]>([]);
  const [eventResult, setEventResult] = useState<any>(null);

  const fetchJob = async () => {
    try {
      const jobs = await api<RecheckJob[]>("/api/rechecks");
      const match = jobs.find(j => j.merchant_id === parseInt(merchantId));
      if (match) {
        setJob(match);
        if (match.tier_details?.length > 0) {
          setLiveTiers(match.tier_details as TierResult[]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJob(); }, [merchantId]);

  const handleRun = async (triggerType: "MANUAL" | "TRANSACTION_SPIKE" | "COMPLAINT_SPIKE") => {
    setRunning(true);
    setHasTriggered(true);
    setLiveTiers([]);
    setEventResult(null);

    try {
      if (triggerType === "MANUAL") {
        const result = await api<any>(`/api/rechecks/${merchantId}/run`, {
          method: "POST",
          body: JSON.stringify({ trigger_reason: "manual_recheck" }),
        });
        if (result.tier_details) setLiveTiers(result.tier_details);
      } else {
        const result = await api<any>(`/api/rechecks/${merchantId}/trigger-event`, {
          method: "POST",
          body: JSON.stringify({ event_type: triggerType, details: `Dashboard simulation` }),
        });
        setEventResult(result);
        if (result.tier_details) setLiveTiers(result.tier_details);
      }
      await fetchJob();
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Back nav */}
      <Link href="/admin/rechecks" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-6">
        <ArrowLeft size={14} /> Back to Rechecks
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mb-1">Recheck Pipeline</p>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {job?.merchant_name || `Merchant #${merchantId}`}
          </h1>
          {job && (
            <div className="flex items-center gap-3 mt-2">
              <Badge tone={riskTone(job.risk_level)} size="sm">{job.risk_level.toUpperCase()} RISK</Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} />
                Last checked: {formatDate(job.last_checked_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => handleRun("MANUAL")}
          disabled={running}
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all text-left disabled:opacity-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 mb-3 group-hover:bg-rzp-blue group-hover:text-white transition">
            <Play size={18} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Normal Recheck</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Run the standard tier pipeline based on current risk level and schedule</p>
        </button>

        <button
          onClick={() => handleRun("TRANSACTION_SPIKE")}
          disabled={running}
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-orange-200 transition-all text-left disabled:opacity-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-rzp-orange mb-3 group-hover:bg-rzp-orange group-hover:text-white transition">
            <TrendingUp size={18} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Transaction Spike</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Simulate sudden volume increase. Bypasses schedule, escalates risk level</p>
        </button>

        <button
          onClick={() => handleRun("COMPLAINT_SPIKE")}
          disabled={running}
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-red-200 transition-all text-left disabled:opacity-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-rzp-red mb-3 group-hover:bg-rzp-red group-hover:text-white transition">
            <MessageSquareWarning size={18} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Complaint Spike</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Simulate complaint surge. Immediately triggers full investigation</p>
        </button>
      </div>

      {/* Event result banner */}
      {eventResult && (
        <div className={[
          "rounded-xl border p-4 mb-6 flex items-center justify-between",
          eventResult.auto_action_taken ? "bg-danger-subtle border-red-200" : "bg-accent-subtle border-blue-200"
        ].join(" ")}>
          <div className="flex items-center gap-3">
            {eventResult.auto_action_taken ? <AlertTriangle size={18} className="text-rzp-red" /> : <Shield size={18} className="text-rzp-blue" />}
            <div>
              <p className={["text-sm font-semibold", eventResult.auto_action_taken ? "text-red-800" : "text-rzp-blue"].join(" ")}>
                {eventResult.event_type === "TRANSACTION_SPIKE" ? "Transaction spike processed" : "Complaint spike processed"}
                {eventResult.risk_escalated && " -- Risk level escalated"}
              </p>
              {eventResult.auto_action_taken && (
                <p className="text-xs text-red-600 mt-0.5">Payout limit reduced to {eventResult.new_payout_limit?.toLocaleString("en-IN")}</p>
              )}
            </div>
          </div>
          <Badge tone={eventResult.auto_action_taken ? "danger" : "blue"}>Tier {eventResult.tier_reached} reached</Badge>
        </div>
      )}

      {/* Tier Pipeline Animation */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">4-Tier Pipeline Execution</h2>
            <p className="text-xs text-gray-500 mt-0.5">Each tier runs only if the previous tier detected a change</p>
          </div>
          {running && (
            <div className="flex items-center gap-2 text-rzp-blue">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm font-medium">Running pipeline...</span>
            </div>
          )}
        </div>

        <AgentExecutionViewer results={liveTiers} config={TIER_CONFIG} isRunning={running} disableAnimation={!hasTriggered} />
      </div>

      {/* Previous result summary */}
      {job?.result_summary && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Previous Result</h3>
          <p className="text-sm text-gray-700">{job.result_summary}</p>
        </div>
      )}
    </Shell>
  );
}
