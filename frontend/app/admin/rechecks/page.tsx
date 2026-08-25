"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, RotateCw } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Button, Notice, Panel, riskTone } from "@/components/ui";
import { api } from "@/lib/api";

export default function RechecksPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function load() {
    try { setJobs(await api<any[]>("/api/rechecks")); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load rechecks."); }
  }

  async function run(merchantId: number) {
    setError("");
    setLoading(merchantId);
    try {
      await api(`/api/rechecks/${merchantId}/run`, { method: "POST", body: JSON.stringify({ trigger_reason: "Manual admin recheck requested" }) });
      await load();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not run the recheck.");
    } finally { setLoading(null); }
  }

  async function processDue() {
    setError("");
    setProcessing(true);
    try { await api("/api/admin/scheduler/run-due", { method: "POST" }); await load(); }
    catch (processError) { setError(processError instanceof Error ? processError.message : "Could not process due jobs."); }
    finally { setProcessing(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold">Recheck Queue</h1>
          <p className="text-sm text-slate-500">Automatic Day-7, Day-14, and recurring risk-based checks. The backend scheduler also processes due jobs every 30 minutes.</p>
        </div>
        <Button disabled={processing} onClick={processDue}><RotateCw size={15} className={processing ? "animate-spin" : ""} />Process due jobs</Button>
      </div>
      {error && <div className="mb-4"><Notice>{error}</Notice></div>}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-field text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Merchant</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Trigger</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Next due</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {!jobs.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No rechecks are currently queued.</td></tr>}
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold"><Link href={`/admin/merchants/${job.merchant_id}`}>{job.merchant_name}</Link></td>
                  <td className="px-4 py-3"><Badge tone={riskTone(job.risk_level)}>{job.risk_level}</Badge></td>
                  <td className="px-4 py-3">{job.trigger_reason}</td>
                  <td className="px-4 py-3">Tier {job.tier_reached}</td>
                  <td className="px-4 py-3">{job.status}</td>
                  <td className="px-4 py-3">{job.next_check_due?.slice(0, 10)}</td>
                  <td className="px-4 py-3"><Button disabled={loading === job.merchant_id} onClick={() => run(job.merchant_id)}><Play size={15} />Run</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}
