"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutGrid, RefreshCw, PlusCircle } from "lucide-react";

const NAV = [
  { href: "/admin",           icon: LayoutGrid,  label: "Merchants" },
  { href: "/admin/rechecks",  icon: RefreshCw,   label: "Rechecks" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-56 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900">SentinelPay</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin</p>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (pathname.startsWith(href + "/") && href !== "/admin");
            return (
              <Link key={href} href={href} className={[
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              ].join(" ")}>
                <Icon size={16} className={active ? "text-white" : "text-gray-400"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom action */}
        <div className="border-t border-gray-100 p-3">
          <Link href="/merchant/register" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent hover:bg-accent-subtle transition-all">
            <PlusCircle size={16} />
            Onboard Merchant
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 flex flex-col min-h-screen">
        <div className="flex-1 px-8 py-8 max-w-screen-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
