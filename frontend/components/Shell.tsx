import Link from "next/link";
import { Activity, ClipboardCheck, GitCompare, LayoutDashboard, ShieldCheck, Store } from "lucide-react";

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
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-lg font-bold">SentinelPay</div>
            <div className="text-xs text-slate-500">Risk orchestration</div>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-field">
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-5 py-3 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-bold">SentinelPay</Link>
        </header>
        <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
