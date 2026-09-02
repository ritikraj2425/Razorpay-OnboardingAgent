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
          <div className="flex items-center gap-4">
            <a href="https://github.com/ritikraj2425/Razorpay-OnboardingAgent" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.37 4.37 0 0 0 9 18v4"></path><path d="M12 22v-4"></path></svg>
            </a>
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
