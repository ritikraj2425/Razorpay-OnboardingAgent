import React from "react";
import { cn } from "@/lib/utils";

/* ── Badge ── */
type Tone = "neutral" | "success" | "warning" | "danger" | "blue" | "purple";

const TONE_BADGE: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  success: "bg-success-subtle text-green-700 border-green-200",
  warning: "bg-warning-subtle text-amber-700 border-amber-200",
  danger:  "bg-danger-subtle text-red-700 border-red-200",
  blue:    "bg-accent-subtle text-rzp-blue border-blue-200",
  purple:  "bg-purple-50 text-purple-700 border-purple-200",
};

export function Badge({ children, tone = "neutral", size = "sm" }: {
  children: React.ReactNode;
  tone?: Tone;
  size?: "xs" | "sm";
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border font-medium",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]",
      TONE_BADGE[tone]
    )}>
      {children}
    </span>
  );
}

/* ── Card ── */
export function Card({ children, className, padding = true }: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl bg-white border border-gray-200 shadow-xs",
      padding && "p-6",
      className
    )}>
      {children}
    </div>
  );
}

/* ── Button ── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:   "bg-rzp-blue text-white hover:bg-rzp-blue-light shadow-xs",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-xs",
  ghost:     "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  danger:    "bg-danger text-white hover:opacity-90 shadow-xs",
};
const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-[15px] gap-2 rounded-lg",
};

export function Button({ children, className, variant = "primary", size = "md", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
}) {
  return (
    <button className={cn(
      "inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rzp-blue/30 disabled:opacity-50 disabled:cursor-not-allowed",
      BTN_VARIANT[variant],
      BTN_SIZE[size],
      className
    )} {...props}>
      {children}
    </button>
  );
}

/* ── Input ── */
export function Input({ className, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label} {props.required && <span className="text-danger">*</span>}</label>}
      <input className={cn(
        "h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition",
        "focus:outline-none focus:ring-2 focus:ring-rzp-blue/20 focus:border-rzp-blue",
        className
      )} {...props} />
    </div>
  );
}

/* ── Select ── */
export function Select({ className, label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select className={cn(
        "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition",
        "focus:outline-none focus:ring-2 focus:ring-rzp-blue/20 focus:border-rzp-blue",
        className
      )} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ── Textarea ── */
export function Textarea({ className, label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition resize-none",
        "focus:outline-none focus:ring-2 focus:ring-rzp-blue/20 focus:border-rzp-blue",
        className
      )} {...props} />
    </div>
  );
}

/* ── Alert ── */
type AlertTone = "info" | "success" | "warning" | "error";
const ALERT: Record<AlertTone, string> = {
  info:    "bg-accent-subtle border-blue-200 text-rzp-blue",
  success: "bg-success-subtle border-green-200 text-green-800",
  warning: "bg-warning-subtle border-amber-200 text-amber-800",
  error:   "bg-danger-subtle border-red-200 text-red-800",
};

export function Alert({ children, tone = "info", className }: { children: React.ReactNode; tone?: AlertTone; className?: string }) {
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm font-medium", ALERT[tone], className)}>
      {children}
    </div>
  );
}

/* ── Stat ── */
export function Stat({ label, value, sub, tone }: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
      <span className={cn("text-2xl font-bold tabular-nums", tone === "success" && "text-success", tone === "danger" && "text-danger", !tone && "text-gray-900")}>
        {value}
      </span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </Card>
  );
}

/* ── Risk Tone Helpers ── */
export function riskTone(risk: string): Tone {
  if (risk === "low")      return "success";
  if (risk === "medium")   return "warning";
  if (risk === "high")     return "danger";
  if (risk === "critical") return "danger";
  return "neutral";
}

export function statusTone(status: string): Tone {
  if (status === "APPROVED")             return "success";
  if (status === "PENDING_REMEDIATION")  return "warning";
  if (status === "MANUAL_REVIEW")        return "blue";
  if (status === "RESTRICTED")           return "purple";
  if (status === "REJECTED")             return "danger";
  return "neutral";
}
