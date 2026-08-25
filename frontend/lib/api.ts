const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type Merchant = {
  id: number;
  business_name: string;
  owner_name: string;
  category: string;
  website_url: string;
  status: string;
  risk_level: string;
  trust_score: number;
  support_email: string;
  support_phone: string;
  remediation_deadline: string;
  payout_limit: number;
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
