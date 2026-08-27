"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Merchants" },
  { href: "/admin/rechecks", label: "Rechecks" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#fafaf8]/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-8 h-16 max-w-screen-xl mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Link href="/">
              <span className="text-[15px] font-bold tracking-tight text-gray-900">SentinelPay</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            {NAV.map(({ href, label }) => {
              const active = pathname === href || (pathname.startsWith(href + "/") && href !== "/admin");
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "text-sm font-semibold transition-all",
                    active
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/merchant/register"
              className="rounded-full bg-[#3d4b47] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c3733] transition"
            >
              Onboard Merchant
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-screen-xl px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
