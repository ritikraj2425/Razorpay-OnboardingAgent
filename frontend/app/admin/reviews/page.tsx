"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Pause, ShieldX } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Badge, Button, Panel } from "@/components/ui";
import { api } from "@/lib/api";

const actions = [
  ["Approve", "approve", Check],
  ["Request clarification", "request_clarification", CircleAlert],
  ["Lower payout limit", "lower_payout_limit", Pause],
  ["Reject", "reject", ShieldX],
];

export default function ReviewsPage() {
  const [cases, setCases] = useState<any[]>([]);
  async function load() { setCases(await api<any[]>("/api/reviews")); }
  async function act(id: number, action: string) {
    await api(`/api/reviews/${id}/action`, { method: "POST", body: JSON.stringify({ action, note: "Demo reviewer action" }) });
    await load();
  }
  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Human Review Queue</h1>
        <p className="text-sm text-slate-500">AI memo, evidence flags, and bounded reviewer actions.</p>
      </div>
      <div className="grid gap-4">
        {cases.map((item) => (
          <Panel key={item.id} className="p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item.merchant_name}</h2>
                  <Badge tone="info">{item.status}</Badge>
                  <Badge tone="warn">{item.suggested_action}</Badge>
                </div>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{item.memo}</p>
                <div className="mt-3 flex flex-wrap gap-2">{item.risk_flags.map((flag: string) => <Badge key={flag} tone="bad">{flag}</Badge>)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {actions.map(([label, value, Icon]: any) => <Button key={value} onClick={() => act(item.id, value)}><Icon size={15} />{label}</Button>)}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </Shell>
  );
}
