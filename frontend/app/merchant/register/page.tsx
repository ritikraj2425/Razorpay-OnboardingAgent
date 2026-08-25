"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, FileUp, Loader2, Send, XCircle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Button, Input, Label, Notice, Panel, statusTone } from "@/components/ui";
import { api } from "@/lib/api";

const initial = {
  business_name: "",
  owner_name: "",
  category: "",
  pan: "",
  gst: "",
  bank_account: "",
  ifsc: "",
  website_url: "",
  social_links: "",
  expected_monthly_volume: "",
  expected_average_order_value: "",
  refund_policy_url: "",
  shipping_policy_url: "",
  privacy_policy_url: "",
  terms_url: "",
  support_email: "",
  support_phone: "",
  documents: [],
};

export default function RegisterPage() {
  const [form, setForm] = useState<any>(initial);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const required = ["business_name", "owner_name", "category", "pan", "gst", "bank_account", "ifsc", "website_url", "support_email", "support_phone", "expected_monthly_volume", "expected_average_order_value"];
      if (required.some((key) => !String(form[key]).trim())) {
        setError("Complete all required fields before submitting.");
        return;
      }
      const payload = { ...form, expected_monthly_volume: Number(form.expected_monthly_volume), expected_average_order_value: Number(form.expected_average_order_value) };
      if (!Number.isFinite(payload.expected_monthly_volume) || payload.expected_monthly_volume < 0 || !Number.isFinite(payload.expected_average_order_value) || payload.expected_average_order_value < 0) {
        setError("Expected volume and average order value must be valid non-negative numbers.");
        return;
      }
      setResult(await api("/api/merchants/register", { method: "POST", body: JSON.stringify(payload) }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration could not be submitted.");
    } finally {
      setLoading(false);
    }
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
            {error && <div className="md:col-span-2"><Notice>{error}</Notice></div>}
            {fields.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input required={!['social_links', 'refund_policy_url', 'shipping_policy_url', 'privacy_policy_url', 'terms_url'].includes(key)} type={key.includes("volume") || key.includes("value") ? "number" : key.includes("email") ? "email" : key.includes("url") ? "url" : "text"} min={key.includes("volume") || key.includes("value") ? 0 : undefined} value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={label} />
              </div>
            ))}
            <div className="md:col-span-2 rounded-md border border-dashed border-line bg-field p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><FileUp size={17} />Document references</div>
              <p className="mt-1 text-sm text-slate-500">Enter filenames or storage keys separated by commas. Real file storage can be connected to S3, Cloudinary, or local uploads next.</p>
              <Input className="mt-3" placeholder="pan.pdf, gst.pdf, cancelled-cheque.pdf" onChange={(event) => setForm((current: any) => ({ ...current, documents: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
              <div className="mt-2 flex flex-wrap gap-2">{form.documents.map((doc: string) => <Badge key={doc} tone="info">{doc}</Badge>)}</div>
            </div>
            <div className="md:col-span-2"><Button disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}Run live Day-0 verification</Button></div>
          </form>
        </Panel>
        <Panel className="p-4">
          <h2 className="font-semibold">Verification Result</h2>
          {result ? (
            <div className="mt-4 space-y-4">
              <div className="text-5xl font-bold">{result.score}</div>
              <Badge tone={statusTone(result.decision)}>{result.decision}</Badge>
              <p className="text-sm leading-6 text-slate-700">{result.underwriter_memo}</p>
              {result.reason_codes?.length > 0 && <div><h3 className="text-xs font-semibold uppercase text-slate-500">Reason codes</h3><div className="mt-2 flex flex-wrap gap-2">{result.reason_codes.map((code: string) => <Badge key={code} tone="bad">{code}</Badge>)}</div></div>}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Verification steps</h3>
                {result.steps.map((step: any) => {
                  const Icon = step.status === "passed" ? CheckCircle2 : step.status === "failed" ? XCircle : CircleAlert;
                  return (
                    <div key={`${step.name}-${step.detail}`} className="rounded-md border border-line bg-white p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon size={16} className={step.status === "passed" ? "text-emerald-700" : step.status === "failed" ? "text-rose-700" : "text-amber-700"} />
                        {step.name}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                    </div>
                  );
                })}
              </div>
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
