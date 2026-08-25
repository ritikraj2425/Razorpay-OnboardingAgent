import Link from "next/link";
import { Activity, ClipboardCheck, GitCompare, LayoutDashboard, Radar, ShieldCheck, Store } from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rechecks", label: "Rechecks", icon: Activity },
  { href: "/admin/reviews", label: "Reviews", icon: ClipboardCheck },
  { href: "/merchant/register", label: "Register", icon: Store },
  { href: "/merchant/portal", label: "Merchant Portal", icon: ShieldCheck },
  { href: "/admin/diff/3", label: "Diff Demo", icon: GitCompare },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800 bg-ink px-4 py-5 text-white lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-lg font-bold">SentinelPay</div>
            <div className="text-xs text-slate-300">Merchant risk command</div>
          </div>
        </Link>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-300">
            <Radar size={14} />
            Live Controls
          </div>
          <div className="mt-2 text-sm font-semibold">Crawler + scheduler active</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">Groq-ready structured reports with quote verification.</div>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white">
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-5 py-3 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-bold">SentinelPay</Link>
        </header>
        <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
