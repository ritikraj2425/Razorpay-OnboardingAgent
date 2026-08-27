import Link from "next/link";
import { ArrowLeft, Globe, Building2, ShieldCheck, Landmark, AlertTriangle, Clock } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Card, Button, Alert, riskTone, statusTone } from "@/components/ui";
import { api } from "@/lib/api";
import { cn, formatTimeAgo, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MerchantProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: any;
  try {
    data = await api<any>(`/api/merchants/${id}`);
  } catch {
    return (
      <Shell>
        <div className="text-red-500 font-semibold">Merchant not found.</div>
      </Shell>
    );
  }
  const m = data.merchant;
  const signals: any[] = data.signals ?? [];
  const audit: any[] = data.audit ?? [];

  return (
    <Shell>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-4">
          <ArrowLeft size={15} /> All Merchants
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone={statusTone(m.status)} size="sm">{m.status.replace(/_/g, " ")}</Badge>
              {m.status === "PENDING_REMEDIATION" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                  48h Grace Period — On Hold (Auto-recheck in 48hrs)
                </span>
              )}
              <Badge tone={riskTone(m.risk_level)} size="sm">{m.risk_level?.toUpperCase()} RISK</Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{m.legal_business_name}</h1>
            {m.customer_facing_business_name && m.customer_facing_business_name !== m.legal_business_name && (
              <p className="text-sm text-gray-500 mt-0.5">DBA: {m.customer_facing_business_name}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="capitalize">{m.business_type?.replace(/_/g, " ")}</span>
              <span>·</span>
              <span className="capitalize">{m.category?.replace(/_/g, " ")}</span>
              <span>·</span>
              <a href={m.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                <Globe size={11} /> {m.website_url}
              </a>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/admin/diff/${m.id}`}>
              <Button variant="secondary" size="sm">View Diff</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Score hero */}
      <Card className={cn(
        "mb-6 flex items-center justify-between gap-6 transition-all",
        m.status === "REJECTED" && "border-2 border-dashed border-red-300 bg-red-50/30",
        m.status === "PENDING_REMEDIATION" && "border-2 border-dashed border-amber-300 bg-amber-50/30"
      )}>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Trust Score</div>
            <div className={[
              "text-5xl font-black tabular-nums",
              m.trust_score >= 85 ? "text-success" : m.trust_score >= 60 ? "text-warning" : "text-danger"
            ].join(" ")}>{m.trust_score}</div>
            <div className="text-xs text-gray-400 mt-1">out of 100</div>
          </div>
          <div className="h-16 w-px bg-gray-100" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Score Breakdown</div>
            <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={[
                "h-full rounded-full",
                m.trust_score >= 85 ? "bg-success" : m.trust_score >= 60 ? "bg-warning" : "bg-danger"
              ].join(" ")} style={{ width: `${m.trust_score}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {m.trust_score >= 85 ? "Excellent — auto-approved" : m.trust_score >= 75 ? "Good — approved with monitoring" : m.trust_score >= 60 ? "Moderate — remediation required" : "Poor — manual review or rejected"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Payout Limit</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(m.payout_limit)}</div>
          {m.api_key && (
            <div className="mt-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">API Key</div>
              <div className="font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">{m.api_key.slice(0, 16)}...</div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: KYC + Banking */}
        <div className="lg:col-span-2 space-y-6">
          {/* KYC */}
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-5">
              <ShieldCheck size={16} className="text-gray-500" /> KYC Verification
            </h2>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: "Business PAN",     value: m.pan },
                { label: "GSTIN",            value: m.gst },
                { label: "CIN",              value: m.cin || "—" },
                { label: "MCC Code",         value: m.mcc_code || "—" },
                { label: "Stakeholder",      value: m.stakeholder_name || m.contact_name },
                { label: "Stakeholder PAN",  value: m.stakeholder_pan || "—" },
                { label: "Designation",      value: `${m.stakeholder_designation} · ${m.stakeholder_ownership_pct}%` },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.label}</div>
                  <div className="font-mono text-sm text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Registered Address</div>
              <div className="text-sm text-gray-700">{m.registered_address}, {m.registered_city}, {m.registered_state} {m.registered_pincode}</div>
            </div>
          </Card>

          {/* Banking */}
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-5">
              <Landmark size={16} className="text-gray-500" /> Banking Details
            </h2>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: "Account Number",   value: `${"*".repeat(Math.max(0, (m.bank_account || "").length - 4))}${(m.bank_account || "").slice(-4)}` },
                { label: "IFSC",             value: m.ifsc },
                { label: "Bank",             value: m.bank_name || "—" },
                { label: "Monthly Volume",   value: formatCurrency(m.expected_monthly_volume) },
                { label: "Avg Order Value",  value: formatCurrency(m.expected_average_order_value) },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.label}</div>
                  <div className="font-mono text-sm text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Signals + Audit */}
        <div className="space-y-6">
          {/* Risk Signals */}
          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle size={15} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900">Risk Signals</h2>
              {signals.length > 0 && <Badge tone="danger" size="xs">{signals.length}</Badge>}
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {signals.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-400 text-center">No risk signals</div>
              ) : signals.map((s: any) => (
                <div key={s.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge tone="danger" size="xs">{s.reason_code}</Badge>
                    <span className="text-[10px] text-gray-400 uppercase">{s.source}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Audit Log */}
          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock size={15} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900">Audit Log</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {audit.map((e: any) => (
                <div key={e.id} className="px-5 py-3">
                  <div className="text-sm font-semibold text-gray-900">{e.event}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.details}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(e.timestamp)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
