"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Clock, ArrowRight, Calendar, Shield } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, riskTone } from "@/components/ui";
import { api, RecheckJob } from "@/lib/api";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function nextCheckLabel(due: string) {
  if (!due) return "Not scheduled";
  try {
    const d = new Date(due);
    const now = new Date();
    const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Due now";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  } catch { return due; }
}

export default function RechecksPage() {
  const [jobs, setJobs] = useState<RecheckJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<RecheckJob[]>("/api/rechecks")
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mb-1">Monitoring</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#649e9c]">Recheck Scheduler</h1>
        <p className="mt-1 text-sm text-gray-500">
          Post-onboarding monitoring pipeline. Click a merchant to run tier simulations.
        </p>
      </div>

      {/* 4-Tier overview */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { tier: 1, label: "Hash Check", desc: "Content fingerprint comparison", schedule: "All merchants" },
          { tier: 2, label: "Semantic Diff", desc: "Meaning-level change detection", schedule: "Medium+ risk" },
          { tier: 3, label: "LLM Analysis", desc: "AI-powered risk investigation", schedule: "High+ risk" },
          { tier: 4, label: "Auto Action", desc: "Restrict payouts, flag for review", schedule: "Critical risk" },
        ].map(t => (
          <div key={t.tier} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">{t.tier}</div>
              <span className="text-sm font-bold text-gray-900">{t.label}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-2 uppercase tracking-wider">{t.schedule}</p>
          </div>
        ))}
      </div>

      {/* Job cards */}
      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading recheck jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <RefreshCw size={28} className="text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-600">No recheck jobs scheduled</p>
          <p className="text-sm text-gray-400 mt-1">Approved merchants automatically generate scheduled rechecks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => {
            const isHighRisk = job.risk_level === 'high' || job.risk_level === 'critical';
            const isMediumRisk = job.risk_level === 'medium';
            const bgClass = isHighRisk 
              ? "bg-gradient-to-br from-orange-50/50 to-white" 
              : isMediumRisk 
                ? "bg-gradient-to-br from-yellow-50/50 to-white" 
                : "bg-gradient-to-br from-teal-50/50 to-white";

            return (
              <Link
                key={job.id}
                href={`/admin/rechecks/${job.merchant_id}`}
                className={`group rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all ${bgClass}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#649e9c] transition">{job.merchant_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-gray-400">
                      <Clock size={12} />
                      <span className="truncate">
                        {job.status === "QUEUED" ? "Pending Execution" : formatDate(job.last_checked_at)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-[#649e9c] transition mt-1 shrink-0" />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/60 text-[#649e9c] border border-[#649e9c]/20">
                    {job.status.replace(/_/g, " ")}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/60 text-[#649e9c] border border-[#649e9c]/20">
                    {job.risk_level.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-[#649e9c]/70 uppercase ml-auto">Tier {job.tier_reached}/4</span>
                </div>

                {/* Footer details */}
                <div className="pt-4 border-t border-[#649e9c]/10">
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                    Last run was on <span className="font-semibold text-gray-700">{formatDate(job.last_checked_at)}</span>. 
                    Risk was <span className="font-semibold text-gray-700">{job.risk_level}</span>, so next check is {nextCheckLabel(job.next_check_due).toLowerCase()}.
                    {isHighRisk && <span className="text-red-500 font-semibold block mt-1">Admin has been informed.</span>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
