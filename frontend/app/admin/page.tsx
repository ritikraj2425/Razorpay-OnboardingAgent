import Link from "next/link";
import { AlertTriangle, IndianRupee, ShieldCheck, Timer, TrendingUp, Zap } from "lucide-react";

import { Shell } from "@/components/Shell";
import { Badge, Panel, riskTone, statusTone } from "@/components/ui";
import { RiskPie } from "@/components/RiskPie";
import { getEvents, getMerchants, getMetrics } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [metrics, merchants, events] = await Promise.all([getMetrics(), getMerchants(), getEvents()]);
  const kpis = [
    ["Total merchants", metrics.total_merchants, ShieldCheck],
    ["Pending remediation", metrics.pending_remediation, Timer],
    ["Manual reviews", metrics.manual_review_count, AlertTriangle],
    ["LLM calls avoided", metrics.llm_calls_avoided, Zap],
    ["Compute saved", formatCurrency(metrics.estimated_compute_cost_saved * 84), IndianRupee],
    ["Onboarding time cut", metrics.average_onboarding_time_reduced, TrendingUp],
  ];

  return (
    <Shell>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">Risk Officer Dashboard</h1>
          <p className="text-sm text-slate-500">Day-0 verification, drift monitoring, ad mismatch checks, and review actions.</p>
        </div>
        <Link className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" href="/merchant/register">Register merchant</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, Icon]: any) => (
          <Panel key={label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
              <Icon size={17} className="text-slate-500" />
            </div>
            <div className="mt-3 text-2xl font-bold">{value}</div>
          </Panel>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel>
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-semibold">Monitored Merchants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-field text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payout limit</th>
                </tr>
              </thead>
              <tbody>
                {!merchants.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">No merchants have been onboarded yet.</td></tr>}
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold"><Link href={`/admin/merchants/${merchant.id}`}>{merchant.business_name}</Link></td>
                    <td className="px-4 py-3">{merchant.category}</td>
                    <td className="px-4 py-3">{merchant.trust_score}</td>
                    <td className="px-4 py-3"><Badge tone={riskTone(merchant.risk_level)}>{merchant.risk_level}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={statusTone(merchant.status)}>{merchant.status}</Badge></td>
                    <td className="px-4 py-3">{formatCurrency(merchant.payout_limit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-4">
            <h2 className="font-semibold">Risk Distribution</h2>
            <div className="h-56">
              <RiskPie data={metrics.risk_distribution} />
            </div>
          </Panel>
          <Panel>
            <div className="border-b border-line px-4 py-3 font-semibold">Recent Suspicious Events</div>
            <div className="divide-y divide-line">
              {events.slice(0, 6).map((event) => (
                <div key={event.id} className="px-4 py-3 text-sm">
                  <div className="font-medium">{event.event}</div>
                  <div className="text-slate-500">{event.details}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
