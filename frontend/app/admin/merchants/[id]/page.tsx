import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Badge, Panel, riskTone, statusTone } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MerchantProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await api<any>(`/api/merchants/${id}`);
  const merchant = data.merchant;
  const baseline = data.snapshots[data.snapshots.length - 1];
  const latest = data.snapshots[0];

  return (
    <Shell>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">{merchant.business_name}</h1>
          <p className="text-sm text-slate-500">{merchant.category} · {merchant.website_url}</p>
        </div>
        <Link className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" href={`/admin/diff/${merchant.id}`}>Open diff</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Panel className="p-4"><div className="text-xs uppercase text-slate-500">Trust score</div><div className="mt-2 text-3xl font-bold">{merchant.trust_score}</div></Panel>
        <Panel className="p-4"><div className="text-xs uppercase text-slate-500">Risk</div><div className="mt-3"><Badge tone={riskTone(merchant.risk_level)}>{merchant.risk_level}</Badge></div></Panel>
        <Panel className="p-4"><div className="text-xs uppercase text-slate-500">Status</div><div className="mt-3"><Badge tone={statusTone(merchant.status)}>{merchant.status}</Badge></div></Panel>
        <Panel className="p-4"><div className="text-xs uppercase text-slate-500">Payout limit</div><div className="mt-2 text-2xl font-bold">{formatCurrency(merchant.payout_limit)}</div></Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel className="p-4">
          <h2 className="font-semibold">Baseline Snapshot</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{baseline?.website_text}</p>
          <div className="mt-3 text-sm text-slate-500">{baseline?.product_summary} · {baseline?.price_summary}</div>
        </Panel>
        <Panel className="p-4">
          <h2 className="font-semibold">Latest Snapshot</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{latest?.website_text}</p>
          <div className="mt-3 text-sm text-slate-500">Semantic drift: {latest?.semantic_drift_score}</div>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel>
          <div className="border-b border-line px-4 py-3 font-semibold">Risk Signals</div>
          {data.signals.map((signal: any) => (
            <div key={signal.id} className="border-b border-line px-4 py-3 text-sm">
              <Badge tone={riskTone(signal.level)}>{signal.reason_code}</Badge>
              <p className="mt-2 text-slate-600">{signal.description}</p>
            </div>
          ))}
        </Panel>
        <Panel>
          <div className="border-b border-line px-4 py-3 font-semibold">Audit Timeline</div>
          {data.audit.map((event: any) => (
            <div key={event.id} className="border-b border-line px-4 py-3 text-sm">
              <div className="font-medium">{event.event}</div>
              <div className="text-slate-500">{event.details}</div>
            </div>
          ))}
        </Panel>
      </div>
    </Shell>
  );
}
