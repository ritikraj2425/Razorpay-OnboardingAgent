"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Wand2, Shield } from "lucide-react";
import { Button, Input, Select, Textarea, Alert, Card } from "@/components/ui";
import { VerificationGraph } from "@/components/VerificationGraph";
import { api, VerificationResult } from "@/lib/api";

// ── Step definitions ──
const STEPS = ["Business", "KYC & Legal", "Banking", "Website", "Financials"];

const BUSINESS_TYPES = [
  { value: "proprietorship",  label: "Sole Proprietorship" },
  { value: "partnership",     label: "Partnership" },
  { value: "private_limited", label: "Private Limited (Pvt. Ltd.)" },
  { value: "public_limited",  label: "Public Limited Company" },
  { value: "llp",             label: "LLP" },
  { value: "ngo",             label: "NGO / Trust / Society" },
];

const CATEGORIES = [
  { value: "ecommerce",           label: "E-Commerce" },
  { value: "education",           label: "Education" },
  { value: "healthcare",          label: "Healthcare & Wellness" },
  { value: "financial_services",  label: "Financial Services" },
  { value: "food",                label: "Food & Beverage" },
  { value: "it_and_software",     label: "IT & Software" },
  { value: "gaming",              label: "Gaming" },
  { value: "travel",              label: "Travel & Hospitality" },
];

const DEMO_DATA = {
  business_type: "private_limited",
  legal_business_name: "Boat Lifestyle Pvt Ltd",
  customer_facing_business_name: "boAt",
  contact_name: "Aman Gupta",
  category: "ecommerce",
  subcategory: "electronics",
  mcc_code: "5732",
  description: "Premium audio and wearable electronics — headphones, earbuds, smartwatches.",
  pan: "AABCB1234E",
  gst: "27AABCB1234E1Z5",
  cin: "U31909DL2013PTC259929",
  stakeholder_name: "Aman Gupta",
  stakeholder_pan: "BCBPA1234E",
  stakeholder_designation: "director",
  stakeholder_ownership_pct: 35,
  registered_address: "Unit 204 & 205, D-Block, B Wing, 2nd Floor, Parsvnath Mall",
  registered_city: "Delhi",
  registered_state: "Delhi",
  registered_pincode: "110085",
  operational_address: "Same as registered",
  bank_account: "50200012345678",
  ifsc: "HDFC0000123",
  bank_name: "HDFC Bank",
  beneficiary_name: "Boat Lifestyle Pvt Ltd",
  website_url: "https://www.boat-lifestyle.com",
  support_email: "info@imaginemarketingindia.com",
  support_phone: "02269181920",
  refund_policy_url: "https://www.boat-lifestyle.com/policies/refund-policy",
  shipping_policy_url: "https://www.boat-lifestyle.com/pages/shipping-policy",
  privacy_policy_url: "https://www.boat-lifestyle.com/policies/privacy-policy",
  terms_url: "https://www.boat-lifestyle.com/policies/terms-of-service",
  expected_monthly_volume: 50000000,
  expected_average_order_value: 2500,
  social_links: "https://twitter.com/boat_india",
  documents: ["pan.pdf", "gst_cert.pdf", "cin_cert.pdf"],
};

const INITIAL = {
  business_type: "private_limited",
  legal_business_name: "",
  customer_facing_business_name: "",
  contact_name: "",
  category: "ecommerce",
  subcategory: "",
  mcc_code: "5999",
  description: "",
  pan: "",
  gst: "",
  cin: "",
  stakeholder_name: "",
  stakeholder_pan: "",
  stakeholder_designation: "director",
  stakeholder_ownership_pct: 100,
  registered_address: "",
  registered_city: "",
  registered_state: "",
  registered_pincode: "",
  operational_address: "",
  bank_account: "",
  ifsc: "",
  bank_name: "",
  beneficiary_name: "",
  website_url: "",
  support_email: "",
  support_phone: "",
  refund_policy_url: "",
  shipping_policy_url: "",
  privacy_policy_url: "",
  terms_url: "",
  expected_monthly_volume: 500000,
  expected_average_order_value: 1000,
  social_links: "",
  documents: [] as string[],
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api<VerificationResult>("/api/merchants/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Result: Show agent terminal ──
  if (result) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-screen-xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">SentinelPay Agent</div>
              <h1 className="text-2xl font-bold text-gray-900">Live Verification Running</h1>
              <p className="text-sm text-gray-500 mt-0.5">Watch the AI pipeline process {result.merchant?.legal_business_name}</p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/admin")}>
              Go to Dashboard
            </Button>
          </div>

          <VerificationGraph steps={result.steps} />

          {/* Decision summary below terminal */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Decision</div>
              <div className="text-lg font-bold text-gray-900">{result.decision.replace(/_/g, " ")}</div>
            </Card>
            <Card className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Trust Score</div>
              <div className={[
                "text-3xl font-black",
                result.score >= 85 ? "text-success" : result.score >= 60 ? "text-warning" : "text-danger"
              ].join(" ")}>{result.score}</div>
            </Card>
            <Card className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Risk Level</div>
              <div className="text-lg font-bold text-gray-900 capitalize">{result.risk_level}</div>
            </Card>
          </div>

          {result.reason_codes.length > 0 && (
            <Card className="mt-4">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Flags Raised by Agent</div>
              <div className="flex flex-wrap gap-2">
                {result.reason_codes.map(code => (
                  <span key={code} className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{code}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto w-full px-6 py-10 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">SentinelPay</div>
              <div className="text-sm font-bold text-gray-900">Merchant Onboarding</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm(DEMO_DATA as any)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
          >
            <Wand2 size={13} /> Autofill Demo Data
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    i < step  ? "bg-gray-900 text-white" :
                    i === step ? "bg-gray-900 text-white ring-4 ring-gray-200" :
                    "bg-gray-100 text-gray-400"
                  ].join(" ")}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <div className={["text-[10px] mt-1.5 font-semibold whitespace-nowrap", i === step ? "text-gray-900" : "text-gray-400"].join(" ")}>
                    {label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={["flex-1 h-px mx-2 mb-5", i < step ? "bg-gray-900" : "bg-gray-200"].join(" ")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900">Business Details</h2>
                <Select label="Business Type" required name="business_type" value={form.business_type} onChange={set("business_type")}>
                  {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                <Input label="Legal Business Name" required name="legal_business_name" placeholder="As per PAN / ROC" value={form.legal_business_name} onChange={set("legal_business_name")} />
                <Input label="Brand / DBA Name" name="customer_facing_business_name" placeholder="Customer-facing name" value={form.customer_facing_business_name} onChange={set("customer_facing_business_name")} />
                <Input label="Primary Contact Name" required name="contact_name" value={form.contact_name} onChange={set("contact_name")} />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Category" required name="category" value={form.category} onChange={set("category")}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                  <Input label="Subcategory" name="subcategory" placeholder="e.g. electronics" value={form.subcategory} onChange={set("subcategory")} />
                </div>
                <Input label="MCC Code" name="mcc_code" placeholder="e.g. 5732" value={form.mcc_code} onChange={set("mcc_code")} />
                <Textarea label="Business Description" name="description" rows={3} placeholder="What do you sell or offer?" value={form.description} onChange={set("description")} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900">KYC & Legal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Business PAN" required name="pan" placeholder="AABCB1234E" value={form.pan} onChange={set("pan")} />
                  <Input label="GSTIN" required name="gst" placeholder="27AABCB1234E1Z5" value={form.gst} onChange={set("gst")} />
                </div>
                <Input label="CIN (Pvt Ltd / LLP)" name="cin" placeholder="Required for companies" value={form.cin} onChange={set("cin")} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Authorized Signatory Name" name="stakeholder_name" value={form.stakeholder_name} onChange={set("stakeholder_name")} />
                  <Input label="Signatory PAN" name="stakeholder_pan" placeholder="Individual PAN (4th char = P)" value={form.stakeholder_pan} onChange={set("stakeholder_pan")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Designation" name="stakeholder_designation" value={form.stakeholder_designation} onChange={set("stakeholder_designation")}>
                    <option value="director">Director</option>
                    <option value="partner">Partner</option>
                    <option value="proprietor">Proprietor</option>
                    <option value="executive">Executive</option>
                  </Select>
                  <Input label="Ownership %" type="number" min="0" max="100" name="stakeholder_ownership_pct" value={form.stakeholder_ownership_pct} onChange={set("stakeholder_ownership_pct")} />
                </div>
                <Textarea label="Registered Address" name="registered_address" rows={2} value={form.registered_address} onChange={set("registered_address")} />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="City" name="registered_city" value={form.registered_city} onChange={set("registered_city")} />
                  <Input label="State" name="registered_state" value={form.registered_state} onChange={set("registered_state")} />
                  <Input label="Pincode" name="registered_pincode" value={form.registered_pincode} onChange={set("registered_pincode")} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900">Bank Account Details</h2>
                <p className="text-sm text-gray-500">These will be validated via penny-drop simulation.</p>
                <Input label="Account Number" required name="bank_account" value={form.bank_account} onChange={set("bank_account")} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="IFSC Code" required name="ifsc" placeholder="HDFC0000123" value={form.ifsc} onChange={set("ifsc")} />
                  <Input label="Bank Name" name="bank_name" value={form.bank_name} onChange={set("bank_name")} />
                </div>
                <Input label="Beneficiary Name" name="beneficiary_name" value={form.beneficiary_name} onChange={set("beneficiary_name")} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900">Website & Compliance</h2>
                <p className="text-sm text-gray-500">The AI agent will crawl your website and validate policy pages in real time.</p>
                <Input label="Website URL" required type="url" name="website_url" placeholder="https://" value={form.website_url} onChange={set("website_url")} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Support Email" required type="email" name="support_email" value={form.support_email} onChange={set("support_email")} />
                  <Input label="Support Phone" required name="support_phone" value={form.support_phone} onChange={set("support_phone")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Privacy Policy URL" type="url" name="privacy_policy_url" value={form.privacy_policy_url} onChange={set("privacy_policy_url")} />
                  <Input label="Terms & Conditions URL" type="url" name="terms_url" value={form.terms_url} onChange={set("terms_url")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Refund Policy URL" type="url" name="refund_policy_url" value={form.refund_policy_url} onChange={set("refund_policy_url")} />
                  <Input label="Shipping Policy URL" type="url" name="shipping_policy_url" value={form.shipping_policy_url} onChange={set("shipping_policy_url")} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900">Financial Profile</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expected Monthly Volume (₹)" required type="number" name="expected_monthly_volume" value={form.expected_monthly_volume} onChange={set("expected_monthly_volume")} />
                  <Input label="Average Order Value (₹)" required type="number" name="expected_average_order_value" value={form.expected_average_order_value} onChange={set("expected_average_order_value")} />
                </div>
                <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-400">
                  <div className="font-semibold text-gray-600 mb-1">Supporting Documents</div>
                  <div>PAN copy, GST certificate, CIN certificate</div>
                  <Input className="mt-3" name="documents" placeholder="pan.pdf, gst_cert.pdf, cin_cert.pdf"
                    value={form.documents.join(", ")}
                    onChange={e => setForm(f => ({ ...f, documents: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0 || loading}>
              <ArrowLeft size={15} /> Back
            </Button>
            <Button type="submit" disabled={loading} className="min-w-40">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : step === STEPS.length - 1 ? (
                <><Shield size={15} /> Submit & Run Agent</>
              ) : (
                <>Continue <ArrowRight size={15} /></>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
