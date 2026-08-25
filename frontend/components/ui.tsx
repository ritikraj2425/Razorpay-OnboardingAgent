import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-semibold border", tones[tone])}>{children}</span>;
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-line bg-panel shadow-soft", className)}>{children}</section>;
}

export function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="focus-ring h-10 w-full rounded-md border border-line bg-white px-3 text-sm" {...props} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-normal text-slate-500">{children}</label>;
}

export function riskTone(risk: string): "good" | "warn" | "bad" | "info" {
  if (risk === "low") return "good";
  if (risk === "medium") return "warn";
  if (risk === "critical") return "bad";
  return "bad";
}

export function statusTone(status: string): "good" | "warn" | "bad" | "info" {
  if (status === "APPROVED") return "good";
  if (status === "PENDING_REMEDIATION") return "warn";
  if (status === "RESTRICTED" || status === "REJECTED") return "bad";
  return "info";
}
