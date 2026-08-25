import { Shell } from "@/components/Shell";
import { Badge, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DiffPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  const diff = await api<any>(`/api/merchants/${merchantId}/diff`);
  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Website Snapshot Diff</h1>
        <p className="text-sm text-slate-500">Baseline versus latest crawled merchant state.</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={diff.semantic_drift_score > 0.25 ? "bad" : "good"}>Semantic drift {diff.semantic_drift_score}</Badge>
        <Badge tone="info">{diff.risk_explanation}</Badge>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="p-4">
          <h2 className="font-semibold">Day-0 Baseline Content</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{diff.baseline.website_text}</p>
          <div className="mt-4 rounded-md bg-field p-3 text-sm">{diff.baseline.policy_text}</div>
        </Panel>
        <Panel className="p-4">
          <h2 className="font-semibold">Latest Crawled Content</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{diff.latest.website_text}</p>
          <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{diff.changed_policies}</div>
        </Panel>
      </div>
      <Panel className="mt-5 p-4">
        <h2 className="font-semibold">Changed Product Categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(diff.changed_product_categories.length ? diff.changed_product_categories : ["No severe category changes"]).map((item: string) => <Badge key={item} tone={item.includes("No") ? "good" : "bad"}>{item}</Badge>)}
        </div>
        <p className="mt-4 text-sm text-slate-600">Changed prices: {diff.changed_prices}</p>
      </Panel>
    </Shell>
  );
}
