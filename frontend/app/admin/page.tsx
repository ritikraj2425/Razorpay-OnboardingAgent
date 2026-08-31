import Link from "next/link";
import { PlusCircle, Globe, ExternalLink, ArrowRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Card, riskTone, statusTone } from "@/components/ui";
import { getMerchants, getMetrics, Merchant } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  let merchants: Merchant[] = [];
  let metrics = {
    total_merchants: 0,
    approved_merchants: 0,
    restricted_count: 0,
    rejected_count: 0,
    manual_review_count: 0,
    pending_remediation: 0,
  };
  let backendOffline = false;

  try {
    [merchants, metrics] = await Promise.all([getMerchants(), getMetrics()]);
  } catch (err) {
    backendOffline = true;
  }

  return (
    <Shell>
      {backendOffline && (
        <div className="mb-8 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Globe size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Backend Connection Failed</h3>
            <p className="text-xs mt-0.5 opacity-90">Cannot connect to the SentinelPay API server. It might be sleeping on Render or offline.</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mb-1">Dashboard</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#649e9c]">Merchant Registry</h1>
          <p className="mt-1 text-sm text-gray-500">{metrics.total_merchants} merchants registered and verified by AI agents</p>
        </div>
        <Link href="/merchant/register" className="flex items-center gap-2 rounded-lg bg-rzp-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-rzp-blue-light transition shadow-sm">
          <PlusCircle size={16} /> Onboard Merchant
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Merchants", value: metrics.total_merchants, sub: "All time" },
          { label: "Approved", value: metrics.approved_merchants, sub: "Active on platform", color: "text-gray-900" },
          { label: "Restricted", value: metrics.restricted_count + metrics.rejected_count, sub: "Suspended or rejected", color: "text-gray-900" },
          { label: "Needs Review", value: metrics.manual_review_count + metrics.pending_remediation, sub: "Queued for review" },
        ].map((s, i) => {
          const bgGradients = [
            "bg-gradient-to-br from-blue-50/50 to-white",
            "bg-gradient-to-br from-teal-50/50 to-white",
            "bg-gradient-to-br from-purple-50/50 to-white",
            "bg-gradient-to-br from-orange-50/50 to-white",
          ];
          const lineColors = [
            "bg-blue-500",
            "bg-teal-500",
            "bg-purple-500",
            "bg-orange-500",
          ];
          return (
            <div key={s.label} className={`rounded-2xl border border-gray-100 p-8 shadow-sm ${bgGradients[i]}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{s.label}</p>
              <p className={["text-3xl font-bold mb-6", s.color || "text-gray-900"].join(" ")}>{s.value}</p>
              <div className={`w-8 h-[3px] rounded-full mb-4 ${lineColors[i]}`} />
              <p className="text-xs text-gray-400 font-medium">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Merchant cards */}
      {merchants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Globe size={28} className="text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-600">No merchants yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Onboard your first merchant to get started</p>
          <Link href="/merchant/register" className="flex items-center gap-2 rounded-lg bg-rzp-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-rzp-blue-light transition">
            <PlusCircle size={16} /> Onboard Merchant
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((m) => {
            const isRejected = m.status === 'REJECTED';
            const isPendingRemediation = m.status === 'PENDING_REMEDIATION';
            const isHighRisk = m.risk_level === 'high' || m.risk_level === 'critical';
            const isMediumRisk = m.risk_level === 'medium';
            
            const bgClass = isRejected
              ? "bg-gradient-to-br from-red-50/30 to-white border-dashed border-2 border-red-300 shadow-sm"
              : isPendingRemediation
              ? "bg-gradient-to-br from-amber-50/30 to-white border-dashed border-2 border-amber-300 shadow-sm"
              : isHighRisk 
              ? "bg-gradient-to-br from-orange-50/50 to-white" 
              : isMediumRisk 
                ? "bg-gradient-to-br from-yellow-50/50 to-white" 
                : "bg-gradient-to-br from-teal-50/50 to-white";

            const scoreColor = m.trust_score < 60 ? "text-red-500" : m.trust_score < 85 ? "text-amber-500" : "text-emerald-500";
            const barColor = m.trust_score < 60 ? "bg-red-500" : m.trust_score < 85 ? "bg-amber-500" : "bg-emerald-500";
                
            return (
              <Link
                key={m.id}
                href={`/admin/merchants/${m.id}`}
                className={`group rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all ${bgClass}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#649e9c] transition">{m.legal_business_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-gray-400">
                      <Globe size={12} />
                      <span className="truncate">{m.website_url?.replace(/^https?:\/\//, "")}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-[#649e9c] transition mt-1 shrink-0" />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/60 text-[#649e9c] border border-[#649e9c]/20">
                    {m.status.replace(/_/g, " ")}
                  </span>
                  {m.status === "PENDING_REMEDIATION" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                      48h Grace Period
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/60 text-[#649e9c] border border-[#649e9c]/20">
                    {m.risk_level.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-[#649e9c]/70 uppercase ml-auto">{m.category?.replace(/_/g, " ")}</span>
                </div>

                {/* Trust Score Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Trust Score</span>
                    <span className={`text-sm font-bold ${scoreColor}`}>{m.trust_score}/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${m.trust_score}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
