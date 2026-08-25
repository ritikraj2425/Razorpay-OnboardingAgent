import { Clock, UploadCloud } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Button, Panel, statusTone } from "@/components/ui";
import { getMerchants } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MerchantPortal() {
  const merchants = await getMerchants();
  const merchant = merchants.find((item) => item.status === "PENDING_REMEDIATION") ?? merchants[0];
  const checklist = [
    "Upload supplement licensing documentation",
    "Add refund policy URL",
    "Confirm support escalation email",
    "Submit revised catalog summary",
  ];
  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Merchant Remediation Portal</h1>
        <p className="text-sm text-slate-500">{merchant.business_name} · Trust score {merchant.trust_score}</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Panel className="p-4">
          <div className="text-xs uppercase text-slate-500">Current status</div>
          <div className="mt-3"><Badge tone={statusTone(merchant.status)}>{merchant.status}</Badge></div>
          <div className="mt-5 flex items-center gap-2 text-sm text-amber-700"><Clock size={17} />38 hours remaining in grace period</div>
          <Button className="mt-5 w-full"><UploadCloud size={15} />Upload proof</Button>
        </Panel>
        <Panel>
          <div className="border-b border-line px-4 py-3 font-semibold">Required Fixes</div>
          <div className="divide-y divide-line">
            {checklist.map((item, index) => (
              <div key={item} className="flex items-center justify-between px-4 py-4 text-sm">
                <span>{item}</span>
                <Badge tone={index < 1 ? "good" : "warn"}>{index < 1 ? "submitted" : "open"}</Badge>
              </div>
            ))}
          </div>
          <div className="border-t border-line bg-field px-4 py-3 text-sm text-slate-600">Re-audit status: priority audit will run immediately after final submission. Final decision remains pending.</div>
        </Panel>
      </div>
    </Shell>
  );
}
