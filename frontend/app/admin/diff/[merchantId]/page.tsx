"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare, AlertTriangle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Card, Alert } from "@/components/ui";
import { api } from "@/lib/api";

export default function DiffPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const [diff, setDiff] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mid, setMid] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      setMid(p.merchantId);
      api<any>(`/api/merchants/${p.merchantId}/diff`)
        .then(setDiff)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) return <Shell><div className="text-sm text-gray-400">Loading diff analysis...</div></Shell>;

  if (error || !diff) {
    return (
      <Shell>
        <Link href={`/admin/merchants/${mid}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-6">
          <ArrowLeft size={15} /> Back
        </Link>
        <Alert tone="error">
          <span className="font-bold">No snapshot diff available:</span> {error || "No data found."}
        </Alert>
      </Shell>
    );
  }

  const isHighRisk = diff.semantic_drift_score > 0.25;

  return (
    <Shell>
      <Link href={`/admin/merchants/${mid}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-6">
        <ArrowLeft size={15} /> Back to Merchant
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <GitCompare size={22} className="text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">Semantic Drift Analysis</h1>
        <Badge tone={isHighRisk ? "danger" : "success"} size="sm">
          Drift Score: {diff.semantic_drift_score?.toFixed(3)}
        </Badge>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        {isHighRisk
          ? "High drift detected — website content has significantly changed from onboarding baseline."
          : "Content is within acceptable drift thresholds."}
      </p>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Baseline */}
        <Card padding={false} className="overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Day-0 Baseline</div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Extracted Website Text</div>
              <p className="text-sm text-gray-700 leading-relaxed font-mono text-[12px]">{diff.baseline?.website_text || "—"}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Policy Text</div>
              <p className="text-sm text-gray-600 leading-relaxed">{diff.baseline?.policy_text || "—"}</p>
            </div>
          </div>
        </Card>

        {/* Latest */}
        <Card padding={false} className={["overflow-hidden border-t-4", isHighRisk ? "border-t-danger" : "border-t-success"].join(" ")}>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Latest Crawl</div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Extracted Website Text</div>
              <p className={["text-sm leading-relaxed font-mono text-[12px]", isHighRisk ? "text-danger font-semibold" : "text-gray-700"].join(" ")}>
                {diff.latest?.website_text || "—"}
              </p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Policy Changes</div>
              <p className="text-sm text-gray-600 leading-relaxed">{diff.changed_policies || "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Changed Product Categories</div>
            <div className="flex flex-wrap gap-2">
              {diff.changed_product_categories?.length > 0
                ? diff.changed_product_categories.map((item: string) => (
                    <Badge key={item} tone="danger" size="sm">{item}</Badge>
                  ))
                : <span className="text-sm text-gray-400">None detected</span>
              }
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Risk Explanation</div>
            <p className="text-sm text-gray-700 font-medium">{diff.risk_explanation || "—"}</p>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
