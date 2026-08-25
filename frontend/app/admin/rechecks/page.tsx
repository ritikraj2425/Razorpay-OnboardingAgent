"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Button, Panel, riskTone } from "@/components/ui";
import { api } from "@/lib/api";

export default function RechecksPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  async function load() {
    setJobs(await api<any[]>("/api/rechecks"));
  }

  async function run(merchantId: number) {
    setLoading(merchantId);
    await api(`/api/rechecks/${merchantId}/run`, { method: "POST", body: JSON.stringify({ trigger_reason: "Manual admin recheck requested" }) });
    await load();
    setLoading(null);
  }

  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Recheck Queue</h1>
        <p className="text-sm text-slate-500">Four-tier monitoring jobs with hash and semantic-drift outcomes.</p>
      </div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-field text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Merchant</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Trigger</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Next due</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
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
