import Link from "next/link";
import { PlusCircle, ChevronRight, Globe, TrendingUp, Users, ShieldAlert } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Card, Stat, riskTone, statusTone } from "@/components/ui";
import { getMerchants, getMetrics } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const [merchants, metrics] = await Promise.all([getMerchants(), getMetrics()]);

  return (
    <Shell>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Registry</h1>
          <p className="mt-0.5 text-sm text-gray-500">{metrics.total_merchants} merchants · AI-verified onboarding</p>
        </div>
        <Link href="/merchant/register" className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition">
          <PlusCircle size={16} /> Onboard New Merchant
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Total Merchants"  value={metrics.total_merchants}         sub="All time" />
        <Stat label="Approved"         value={metrics.approved_merchants}       tone="success" sub="Active on platform" />
        <Stat label="High Risk"        value={metrics.high_risk_merchants}      tone="danger"  sub="Flagged by AI" />
        <Stat label="Pending Review"   value={metrics.manual_review_count}      sub="Queued for human review" />
      </div>

      {/* Merchant table */}
      <Card padding={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Merchants</h2>
          <span className="text-xs text-gray-400">{merchants.length} results</span>
        </div>

        {merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-gray-200 mb-4" />
            <p className="text-sm font-semibold text-gray-500">No merchants yet</p>
            <p className="text-xs text-gray-400 mt-1">Onboard your first merchant to get started.</p>
            <Link href="/merchant/register" className="mt-6 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition">
              <PlusCircle size={16} /> Onboard Merchant
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px_48px] gap-4 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <span>Business</span>
              <span>Category</span>
              <span>Status</span>
              <span>Risk Level</span>
              <span>Trust Score</span>
              <span />
            </div>
            {merchants.map((m) => (
              <Link
                key={m.id}
                href={`/admin/merchants/${m.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_120px_48px] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition group"
              >
                {/* Business */}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{m.legal_business_name}</div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                    <Globe size={10} />
                    <span className="truncate">{m.website_url}</span>
                  </div>
                </div>

                {/* Category */}
                <span className="text-sm text-gray-600 capitalize">{m.category?.replace(/_/g, " ")}</span>

                {/* Status */}
                <Badge tone={statusTone(m.status)} size="sm">
                  {m.status.replace(/_/g, " ")}
                </Badge>

                {/* Risk */}
                <Badge tone={riskTone(m.risk_level)} size="sm">
                  {m.risk_level?.toUpperCase()}
                </Badge>

                {/* Trust Score */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={[
                        "h-full rounded-full transition-all",
                        m.trust_score >= 85 ? "bg-success" :
                        m.trust_score >= 60 ? "bg-warning" : "bg-danger"
                      ].join(" ")}
                      style={{ width: `${m.trust_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{m.trust_score}</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </Shell>
  );
}
