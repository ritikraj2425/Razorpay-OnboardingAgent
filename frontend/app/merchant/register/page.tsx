"use client";

import { useState } from "react";
import { FileUp, Send } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Button, Input, Label, Panel, statusTone } from "@/components/ui";
import { api } from "@/lib/api";

const initial = {
  business_name: "Northstar Apparel",
  owner_name: "Ritika Sen",
  category: "Clothing",
  pan: "NORTH1234A",
  gst: "27NORTH1234A1Z5",
  bank_account: "121212121212",
  ifsc: "HDFC0004567",
  website_url: "https://northstar-apparel.example",
  social_links: "https://instagram.com/northstar",
  expected_monthly_volume: 800000,
  expected_average_order_value: 1100,
  refund_policy_url: "https://northstar-apparel.example/refunds",
  shipping_policy_url: "https://northstar-apparel.example/shipping",
  privacy_policy_url: "https://northstar-apparel.example/privacy",
  terms_url: "https://northstar-apparel.example/terms",
  support_email: "support@northstar-apparel.example",
  support_phone: "+919811223344",
  documents: ["pan-card.pdf", "bank-proof.pdf"],
};

export default function RegisterPage() {
  const [form, setForm] = useState<any>(initial);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: key.includes("volume") || key.includes("value") ? Number(value) : value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(await api("/api/merchants/register", { method: "POST", body: JSON.stringify(form) }));
    setLoading(false);
  }

  const fields = [
    ["business_name", "Business name"], ["owner_name", "Owner name"], ["category", "Business category"], ["pan", "PAN"], ["gst", "GST"],
    ["bank_account", "Bank account"], ["ifsc", "IFSC"], ["website_url", "Website URL"], ["social_links", "Social links"],
    ["expected_monthly_volume", "Expected monthly volume"], ["expected_average_order_value", "Expected average order value"],
    ["refund_policy_url", "Refund policy URL"], ["shipping_policy_url", "Shipping policy URL"], ["privacy_policy_url", "Privacy policy URL"], ["terms_url", "Terms URL"],
    ["support_email", "Support email"], ["support_phone", "Support phone"],
  ];

  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Merchant Registration</h1>
        <p className="text-sm text-slate-500">Day-0 KYB, website baseline, policy checks, and risk decision.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel className="p-4">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input value={form[key]} onChange={(event) => update(key, event.target.value)} />
              </div>
            ))}
            <div className="md:col-span-2 rounded-md border border-dashed border-line bg-field p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><FileUp size={17} />Document upload mock</div>
              <div className="mt-2 flex flex-wrap gap-2">{form.documents.map((doc: string) => <Badge key={doc} tone="info">{doc}</Badge>)}</div>
            </div>
            <div className="md:col-span-2"><Button disabled={loading}><Send size={15} />Run Day-0 verification</Button></div>
          </form>
        </Panel>
        <Panel className="p-4">
          <h2 className="font-semibold">Verification Result</h2>
          {result ? (
            <div className="mt-4 space-y-4">
              <div className="text-5xl font-bold">{result.score}</div>
              <Badge tone={statusTone(result.decision)}>{result.decision}</Badge>
              <p className="text-sm leading-6 text-slate-700">{result.underwriter_memo}</p>
              <div className="space-y-2">
                {result.checklist.map((item: string) => <div key={item} className="rounded-md bg-field px-3 py-2 text-sm">{item}</div>)}
                {!result.checklist.length && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">API keys generated and recurring rechecks scheduled.</div>}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Submit the form to see the trust score, decision, and remediation checklist.</p>
          )}
        </Panel>
      </div>
    </Shell>
  );
}
