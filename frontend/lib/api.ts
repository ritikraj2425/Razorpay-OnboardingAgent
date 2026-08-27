const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type Merchant = {
  id: number;
  business_type: string;
  legal_business_name: string;
  customer_facing_business_name: string;
  contact_name: string;
  category: string;
  subcategory: string;
  website_url: string;
  status: string;
  risk_level: string;
  trust_score: number;
  support_email: string;
  support_phone: string;
  remediation_deadline: string;
  payout_limit: number;
  pan: string;
  gst: string;
  bank_account: string;
  ifsc: string;
  registered_state: string;
  registered_city: string;
  stakeholder_name: string;
};

export type VerificationStep = {
  name: string;
  status: string;
  detail: string;
  duration_ms?: number;
  category?: string;
};

export type VerificationResult = {
  merchant: Merchant;
  decision: string;
  score: number;
  risk_level: string;
  checklist: string[];
  reason_codes: string[];
  underwriter_memo: string;
  steps: VerificationStep[];
};

export type TierDetail = {
  tier: number;
  name: string;
  status: string;
  detail: string;
  duration_ms?: number;
};

export type RecheckJob = {
  id: number;
  merchant_id: number;
  merchant_name: string;
  risk_level: string;
  trigger_reason: string;
  tier_reached: number;
  status: string;
  result_summary: string;
  cost_saved: number;
  last_checked_at: string;
  next_check_due: string;
  tier_details: TierDetail[];
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed.detail)) {
        message = parsed.detail.map((item: { loc?: string[]; msg?: string }) => `${item.loc?.at(-1) ?? "field"}: ${item.msg ?? "Invalid value"}`).join("; ");
      } else if (typeof parsed.detail === "string") {
        message = parsed.detail;
      }
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

export async function getMerchants() {
  return api<Merchant[]>("/api/merchants");
}

export async function getMetrics() {
  return api<any>("/api/admin/metrics");
}

export async function getEvents() {
  return api<any[]>("/api/admin/events");
}

export async function getRechecks() {
  return api<RecheckJob[]>("/api/rechecks");
}

export async function triggerEvent(merchantId: number, eventType: string, details: string = "") {
  return api<any>(`/api/rechecks/${merchantId}/trigger-event`, {
    method: "POST",
    body: JSON.stringify({ event_type: eventType, details }),
  });
}

