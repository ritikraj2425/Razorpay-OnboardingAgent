"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Clock, ChevronDown, ChevronUp, Play, Globe, Hash, Eye, Brain, ArrowRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Card, Button, Alert, riskTone } from "@/components/ui";
import { VerificationGraph } from "@/components/VerificationGraph";
import { api, RecheckJob } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

/* ── Tier decision tree for each risk level ── */
const TIER_LOGIC: Record<string, { tiers: { n: number; name: string; icon: any; desc: string; runs: string }[]; why: string }> = {
  low:      { why: "Low-risk merchants run Tier-1 only (hash check) every 30 days. LLM is never invoked.", tiers: [
    { n: 1, name: "Website Hash Check", icon: Hash,  desc: "Fetch page, compute SHA-256 of HTML. If hash unchanged → STOP.", runs: "Every 30 days" },
  ]},
  medium:   { why: "Medium-risk merchants run Tier-1 + Tier-2 (semantic diff) every 14 days.", tiers: [
    { n: 1, name: "Website Hash Check", icon: Hash,  desc: "If hash changed → proceed to Tier 2.", runs: "Every 14 days" },
    { n: 2, name: "Semantic Analysis",  icon: Eye,   desc: "Text embedding cosine similarity vs baseline. If drift > 0.25 → STOP.", runs: "On hash change" },
  ]},
  high:     { why: "High-risk merchants run Tier-1 → Tier-2 → Tier-3 (LLM) every 7 days.", tiers: [
    { n: 1, name: "Website Hash Check", icon: Hash,  desc: "If hash changed → proceed to Tier 2.", runs: "Every 7 days" },
    { n: 2, name: "Semantic Analysis",  icon: Eye,   desc: "If drift detected → proceed to Tier 3.", runs: "On hash change" },
    { n: 3, name: "LLM Investigation",  icon: Brain, desc: "Groq LLM reads full page text, gives risk verdict.", runs: "On semantic drift" },
  ]},
  critical: { why: "Critical merchants run all 4 tiers every 3 days including full AI investigation.", tiers: [
    { n: 1, name: "Website Hash Check",   icon: Hash,  desc: "Always proceeds to Tier 2 regardless.", runs: "Every 3 days" },
    { n: 2, name: "Semantic Analysis",    icon: Eye,   desc: "Always proceeds to Tier 3.", runs: "Every 3 days" },
    { n: 3, name: "LLM Investigation",    icon: Brain, desc: "Calls Groq LLM for full-page risk analysis.", runs: "Every 3 days" },
    { n: 4, name: "Manual Review Escalation", icon: RefreshCw, desc: "Always queues a human review case.", runs: "Every 3 days" },
  ]},
};

function TierDecisionTree({ riskLevel, tierReached }: { riskLevel: string; tierReached: number }) {
  const logic = TIER_LOGIC[riskLevel] || TIER_LOGIC.medium;
  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">{logic.why}</p>
      <div className="space-y-2">
        {logic.tiers.map((t, i) => {
          const Icon = t.icon;
          const ran = t.n <= tierReached;
          return (
            <div key={t.n} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  ran ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                ].join(" ")}>
                  {ran ? <Icon size={13} /> : t.n}
                </div>
                {i < logic.tiers.length - 1 && (
                  <div className={["w-px flex-1 mt-1", ran ? "bg-gray-300" : "bg-gray-100"].join(" ")} style={{ minHeight: 12 }} />
                )}
              </div>
              <div className="pb-3 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={["text-sm font-semibold", ran ? "text-gray-900" : "text-gray-400"].join(" ")}>{t.name}</span>
                  {ran && t.n === tierReached && <Badge tone="blue" size="xs">Terminal Tier</Badge>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                  <Clock size={10} /> {t.runs}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobCard({ job, onRecheck }: { job: RecheckJob; onRecheck: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);

  const handleRecheck = async () => {
    setRunning(true);
    await onRecheck(job.merchant_id);
    setRunning(false);
  };

  const statusColor = job.status === "DONE" ? "success" : job.status === "QUEUED" ? "blue" : "warning";

  return (
    <Card padding={false} className="overflow-hidden">
      {/* Main row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center">
        {/* Merchant info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{job.merchant_name}</span>
            <Badge tone={riskTone(job.risk_level)} size="xs">{job.risk_level}</Badge>
            <Badge tone={statusColor} size="xs">{job.status}</Badge>
          </div>
          <div className="text-xs text-gray-500 mt-1">{job.trigger_reason}</div>
        </div>

        {/* Tier reached */}
        <div className="text-center hidden md:block">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tier Run</div>
          <div className="text-xl font-bold text-gray-900">{job.tier_reached}<span className="text-sm text-gray-400">/4</span></div>
        </div>

        {/* Schedule */}
        <div className="hidden lg:block text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Last Run</div>
          <div className="text-sm font-medium text-gray-700">{formatTimeAgo(job.last_checked_at)}</div>
          {job.next_check_due && (
            <div className="text-xs text-gray-400">Next: {job.next_check_due}</div>
          )}
        </div>

        {/* Manual recheck */}
        <Button size="sm" variant="secondary" onClick={handleRecheck} disabled={running}>
          {running ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
          {running ? "Running..." : "Run Now"}
        </Button>

        {/* Expand */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded: decision tree + tier output */}
      {expanded && (
        <div className="border-t border-gray-100 grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Left: Decision Logic */}
          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Why these tiers run</h3>
            <TierDecisionTree riskLevel={job.risk_level} tierReached={job.tier_reached} />
          </div>

          {/* Right: Actual tier outputs graph */}
          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Execution Output</h3>
            {job.tier_details && job.tier_details.length > 0 ? (
              <div className="mt-4 -mx-2">
                <VerificationGraph 
                  steps={job.tier_details.map((t: any) => ({
                    name: `Tier ${t.tier}: ${t.name}`,
                    status: t.status === "passed" || t.status === "no_change" || t.status === "cleared" || t.status === "benign" ? "passed" : 
                            t.status === "failed" || t.status === "escalated" ? "failed" : "warning",
                    detail: t.detail,
                    duration_ms: t.duration_ms,
                    category: t.tier === 1 ? "website" : t.tier === 2 ? "documents" : t.tier === 3 ? "risk" : "ai"
                  }))} 
                />
              </div>
            ) : (
              <div className="text-sm text-gray-400">No tier output stored for this job. Click "Run Now" to execute.</div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function RechecksPage() {
  const [jobs, setJobs] = useState<RecheckJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await api<RecheckJob[]>("/api/rechecks");
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleRunScheduler = async () => {
    await api("/api/admin/scheduler/run-due", { method: "POST" });
    fetchJobs();
  };

  const handleRecheck = async (merchantId: number) => {
    await api(`/api/rechecks/${merchantId}/run`, {
      method: "POST",
      body: JSON.stringify({ trigger_reason: "manual_admin_recheck" }),
    });
    fetchJobs();
  };

  const queued = jobs.filter(j => j.status === "QUEUED").length;
  const done   = jobs.filter(j => j.status === "DONE").length;

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recheck Scheduler</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {jobs.length} jobs total · <span className="text-blue-600">{queued} queued</span> · {done} completed
          </p>
        </div>
        <Button variant="secondary" onClick={handleRunScheduler}>
          <RefreshCw size={15} /> Run All Due Rechecks
        </Button>
      </div>

      {/* Tier explanation banner */}
      <Card className="mb-6 bg-gray-50 border-gray-200">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">How the Tier System Works</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: 1, icon: Hash,  label: "Hash Check",   color: "text-gray-600 bg-gray-100",    desc: "Low + all risks", run: "Always first" },
            { n: 2, icon: Eye,   label: "Semantic Diff", color: "text-blue-600 bg-blue-50",    desc: "Medium + above", run: "On hash change" },
            { n: 3, icon: Brain, label: "LLM Analysis",  color: "text-purple-600 bg-purple-50", desc: "High + critical", run: "On semantic drift" },
            { n: 4, icon: RefreshCw, label: "Human Review", color: "text-red-600 bg-red-50",   desc: "Critical only",   run: "Always escalates" },
          ].map(t => {
            const Icon = t.icon;
            return (
              <div key={t.n} className="flex flex-col gap-2">
                <div className={["flex h-8 w-8 items-center justify-center rounded-lg", t.color].join(" ")}>
                  <Icon size={16} />
                </div>
                <div className="text-xs font-bold text-gray-800">Tier {t.n}: {t.label}</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{t.desc}<br />{t.run}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {loading ? (
        <div className="text-sm text-gray-400">Loading recheck jobs...</div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <RefreshCw size={36} className="mx-auto mb-4 text-gray-200" />
          <p className="font-semibold">No recheck jobs scheduled yet.</p>
          <p className="text-sm mt-1">Approved merchants automatically generate scheduled rechecks.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onRecheck={handleRecheck} />
          ))}
        </div>
      )}
    </Shell>
  );
}
