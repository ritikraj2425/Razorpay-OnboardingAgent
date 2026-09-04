"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Upload, X, FileText, Zap } from "lucide-react";
import { Button, Input, Select, Card } from "@/components/ui";
import { VerificationGraph } from "@/components/VerificationGraph";
import { api, VerificationResult } from "@/lib/api";

const BUSINESS_TYPES = [
  { value: "proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "private_limited", label: "Private Limited (Pvt. Ltd.)" },
  { value: "public_limited", label: "Public Limited Company" },
  { value: "llp", label: "LLP" },
  { value: "ngo", label: "NGO / Trust / Society" },
];

const CATEGORIES = [
  { value: "ecommerce", label: "E-Commerce" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "financial_services", label: "Financial Services" },
  { value: "food", label: "Food & Beverage" },
  { value: "it_and_software", label: "IT & Software" },
  { value: "gaming", label: "Gaming" },
  { value: "others", label: "Others" },
];

const DEMO_PROFILES = [
  {
    name: "Safe E-Commerce (Approved)",
    data: {
      business_type: "private_limited",
      legal_business_name: "Myntra Designs Pvt Ltd",
      customer_facing_business_name: "Myntra",
      contact_name: "Rahul Sharma",
      category: "ecommerce",
      pan: "ABCDE1234C",
      gst: "22ABCDE1234C1ZG",
      cin: "U72200MH2020PTC123456",
      bank_account: "50200012345678",
      ifsc: "HDFC0001234",
      website_url: "https://myntra.com", // using a known safe big site to ensure good response
      support_email: "support@urbanthreads.in",
      support_phone: "9876543210",
      refund_policy_url: "https://myntra.com/refund",
      privacy_policy_url: "https://myntra.com/privacy",
      terms_url: "https://myntra.com/terms",
      shipping_policy_url: "https://myntra.com/shipping",
    }
  },
  {
    name: "EdTech Platform (Approved)",
    data: {
      business_type: "private_limited",
      legal_business_name: "Coursera India Pvt Ltd",
      customer_facing_business_name: "Coursera",
      contact_name: "Priya Patel",
      category: "education",
      pan: "BXKPR9876C",
      gst: "27BXKPR9876C1ZQ",
      cin: "U80900MH2021PTC654321",
      bank_account: "100023456789",
      ifsc: "SBIN0004321",
      website_url: "https://coursera.org",
      support_email: "hello@nextgen.edu.in",
      support_phone: "8765432109",
      refund_policy_url: "https://coursera.org/refund",
      privacy_policy_url: "https://coursera.org/privacy",
      terms_url: "https://coursera.org/terms",
      shipping_policy_url: "https://coursera.org/shipping",
    }
  },
  {
    name: "Risky Supplements (High Risk)",
    data: {
      business_type: "proprietorship",
      legal_business_name: "MuscleMax Nutrition",
      customer_facing_business_name: "MuscleMax",
      contact_name: "Vikas Kumar",
      category: "healthcare",
      pan: "CWHPS4567P",
      gst: "07CWHPS4567P1ZI",
      cin: "",
      bank_account: "987654321012",
      ifsc: "ICIC0000987",
      website_url: "https://steroids-online-fake.com",
      support_email: "vikas@musclemax.in",
      support_phone: "7654321098",
      refund_policy_url: "",
      privacy_policy_url: "",
      terms_url: "",
      shipping_policy_url: "",
    }
  },
  {
    name: "Crypto Scam (Rejected)",
    data: {
      business_type: "llp",
      legal_business_name: "Moonshot Crypto LLP",
      customer_facing_business_name: "Moonshot",
      contact_name: "Ankit Jain",
      category: "financial_services",
      pan: "DFGTH5678F",
      gst: "09DFGTH5678F1ZV",
      cin: "AAA-1234",
      bank_account: "555566667777",
      ifsc: "UTIB0000555",
      website_url: "https://crypto-doubler-scam-test.com",
      support_email: "admin@moonshot.io",
      support_phone: "9998887776",
      refund_policy_url: "",
      privacy_policy_url: "",
      terms_url: "",
      shipping_policy_url: "",
    }
  },
  {
    name: "Gaming/Betting (Review Required)",
    data: {
      business_type: "private_limited",
      legal_business_name: "Betway India Pvt Ltd",
      customer_facing_business_name: "Betway",
      contact_name: "Karan Singh",
      category: "gaming",
      pan: "ERTGY7890C",
      gst: "11ERTGY7890C1ZL",
      cin: "U92412MH2022PTC998877",
      bank_account: "112233445566",
      ifsc: "IDFB0000111",
      website_url: "https://betway.com",
      support_email: "support@luckyspin.in",
      support_phone: "8887776665",
      refund_policy_url: "https://betway.com/refund",
      privacy_policy_url: "https://betway.com/privacy",
      terms_url: "https://betway.com/terms",
      shipping_policy_url: "",
    }
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isGraphComplete, setIsGraphComplete] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(DEMO_PROFILES[0].data);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("http://localhost:8000/api/merchants/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setUploadedFiles(prev => [...prev, data.filename]);
      } catch {
        // Upload failed silently
      }
    }
  };

  const removeFile = (name: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== name));
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    setIsGraphComplete(false);
    try {
      const payload = {
        ...form,
        subcategory: "",
        mcc_code: "",
        description: "",
        cin: form.cin || "",
        stakeholder_name: form.contact_name,
        stakeholder_pan: "",
        stakeholder_designation: "director",
        stakeholder_ownership_pct: 100,
        registered_address: "123 Business St",
        registered_city: "Mumbai",
        registered_state: "Maharashtra",
        registered_pincode: "400001",
        operational_address: "123 Business St",
        bank_name: "",
        beneficiary_name: form.contact_name,
        social_links: "",
        shipping_policy_url: form.shipping_policy_url || "",
        terms_url: form.terms_url || "",
        expected_monthly_volume: 100000,
        expected_average_order_value: 2000,
        documents: uploadedFiles,
      };
      const res = await api<VerificationResult>("/api/merchants/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      let currentRes = res;
      setResult(currentRes);
      
      let isProcessing = true;
      let merchantId = res.merchant?.id;

      while (isProcessing && merchantId) {
        await new Promise((r) => setTimeout(r, 2000));
        currentRes = await api<VerificationResult>(`/api/merchants/${merchantId}/status`);
        setResult(currentRes);
        if (currentRes.decision !== "PROCESSING") {
          isProcessing = false;
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Result: Show agent verification graph ──
  if (result || loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <div className="max-w-screen-xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">SentinelPay Agent</div>
              <h1 className="text-2xl font-bold text-gray-900">Live Verification Pipeline</h1>
              <p className="text-sm text-gray-500 mt-0.5">Watch agents process {result?.merchant?.legal_business_name || form.legal_business_name}</p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              Go to Dashboard
            </button>
          </div>

          <VerificationGraph steps={result ? result.steps : []} onComplete={() => setIsGraphComplete(true)} isRunning={loading} />

          {/* Decision summary */}
          {result && (
            <div className={`transition-opacity duration-1000 ${isGraphComplete ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <Card className="text-center bg-white">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Decision</div>
                  <div className="text-lg font-bold text-gray-900">{result.decision.replace(/_/g, " ")}</div>
                </Card>
                <Card className="text-center bg-white">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Trust Score</div>
                  <div className={[
                    "text-3xl font-black",
                    result.score >= 85 ? "text-success" : result.score >= 60 ? "text-warning" : "text-danger"
                  ].join(" ")}>{result.score}/100</div>
                </Card>
                <Card className="text-center bg-white">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Risk Level</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">{result.risk_level}</div>
                </Card>
              </div>

              {result.reason_codes.length > 0 && (
                <Card className="mt-4 bg-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Risk Signals Detected</div>
                  <div className="flex flex-wrap gap-2">
                    {result.reason_codes.map(code => (
                      <span key={code} className="px-3 py-1 bg-red-50 text-rzp-red rounded-full text-xs font-semibold">
                        {code}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}


        </div>
      </div>
    );
  }

  // ── Registration Form ──
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#fafaf8]/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-8 h-16 max-w-screen-xl mx-auto w-full">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">SentinelPay</span>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="rounded-full bg-[#3d4b47] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c3733] transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-6 py-10 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant Onboarding</h1>
          <p className="text-sm text-gray-500">Register a new merchant for AI-powered verification</p>
        </div>

        {/* Demo Autofill Section */}
        <div className="mb-6 p-4 rounded-xl border border-[#e8e9e6] bg-[#f5f6f4]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Demo Autofill Profiles</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEMO_PROFILES.map((profile, i) => (
              <button
                key={i}
                onClick={() => setForm(profile.data)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm transition"
              >
                {profile.name}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-white">
          <div className="space-y-6">
            {/* Business Information */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Business Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Business Type" value={form.business_type} onChange={set("business_type")} required>
                  {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                <Select label="Category" value={form.category} onChange={set("category")} required>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
                <Input label="Legal Business Name" placeholder="Acme Pvt Ltd" value={form.legal_business_name} onChange={set("legal_business_name")} required />
                <Input label="Brand Name" placeholder="Acme" value={form.customer_facing_business_name} onChange={set("customer_facing_business_name")} />
                <Input label="Contact Person" placeholder="Full Name" value={form.contact_name} onChange={set("contact_name")} required />
              </div>
            </div>

            {/* KYC */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">KYC & Banking</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Business PAN" placeholder="ABCDE1234F" value={form.pan} onChange={set("pan")} required />
                <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" value={form.gst} onChange={set("gst")} required />
                <Input label="Bank Account Number" placeholder="1234567890" value={form.bank_account} onChange={set("bank_account")} required />
                <Input label="IFSC Code" placeholder="HDFC0001234" value={form.ifsc} onChange={set("ifsc")} required />
              </div>
            </div>

            {/* Website & Contact */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Website & Contact</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Website URL" placeholder="https://example.com" value={form.website_url} onChange={set("website_url")} required className="col-span-2" />
                <Input label="Support Email" placeholder="support@example.com" value={form.support_email} onChange={set("support_email")} required type="email" />
                <Input label="Support Phone" placeholder="9876543210" value={form.support_phone} onChange={set("support_phone")} required />
                <Input label="Refund Policy URL" placeholder="https://example.com/refund" value={form.refund_policy_url} onChange={set("refund_policy_url")} />
                <Input label="Privacy Policy URL" placeholder="https://example.com/privacy" value={form.privacy_policy_url} onChange={set("privacy_policy_url")} />
              </div>
            </div>

            {/* Policy File Upload */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Policy Documents (Optional)</h2>
              <p className="text-xs text-gray-500 mb-3">If you don't have policy URLs, upload PDF documents here.</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 flex flex-col items-center gap-2 text-gray-500 hover:border-gray-400 hover:bg-gray-100 transition"
              >
                <Upload size={20} />
                <span className="text-sm font-medium">Click to upload PDFs or images</span>
              </button>
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map(name => (
                    <div key={name} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-100">
                      <FileText size={14} className="text-gray-400" />
                      <span className="flex-1 text-gray-700 font-medium truncate">{name}</span>
                      <button onClick={() => removeFile(name)} className="text-gray-400 hover:text-red-500 transition"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 text-red-800 px-4 py-3 text-sm font-medium">{error}</div>
            )}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-xl bg-[#3d4b47] px-6 py-4 text-base font-semibold text-white hover:bg-[#2c3733] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? "Running AI Verification..." : "Submit for Verification"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
