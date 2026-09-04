"use client";

import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Globe, FileSearch, Brain, RefreshCw, LogOut } from "lucide-react";
import Link from "next/link";

const AGENTS = [
  { icon: FileSearch, title: "KYC Engine", desc: "Validates PAN, GSTIN, CIN, bank accounts, and cross-references stakeholder identity in real time." },
  { icon: Globe, title: "Web Crawler", desc: "Renders merchant websites with headless Chromium, extracts dynamic API-loaded content, products, and policies." },
  { icon: Brain, title: "LLM Risk Agent", desc: "Groq-powered AI that reads crawled content, evaluates risk signals, and generates structured decisions." },
  { icon: RefreshCw, title: "4-Tier Recheck", desc: "Post-onboarding engine that monitors merchants for content drift, transaction spikes, and complaint surges." },
];

const STATS = [
  { value: "4-Tier", desc: "Recheck pipeline with automatic cost optimization" },
  { value: "Real-time", desc: "Event-driven monitoring for transaction and complaint spikes" },
  { value: "Playwright", desc: "Full JavaScript rendering for dynamic website analysis" },
  { value: "Groq LLM", desc: "AI-powered risk investigation and underwriter reports" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#fafaf8]/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-8 h-16 max-w-screen-xl mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-tight text-gray-900">SentinelPay</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition">Dashboard</Link>
            <Link href="/admin/rechecks" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition">Rechecks</Link>
            <Link href="/architecture" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition">Architecture</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a href="https://github.com/ritikraj2425/Razorpay-OnboardingAgent" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition">
              <svg xmlns="http://www.开展w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.37 4.37 0 0 0 9 18v4"></path><path d="M12 22v-4"></path></svg>
            </a>
            <button
              onClick={() => router.push("/admin")}
              className="rounded-full bg-[#3d4b47] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c3733] transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-screen-xl mx-auto px-8 pt-28 pb-20 text-center">
        <h1 className="text-5xl md:text-[68px] font-medium leading-[1.05] tracking-tight text-[#3d3d3d] max-w-4xl mx-auto">
          Connect your AI agents <br />
          <span className="text-[#649e9c]">to merchant verification</span>
        </h1>

        <p className="mt-8 text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
          One secure API for real-time web access, KYC validation, and autonomous risk monitoring.
        </p>

        <div className="mt-6 flex justify-center">
          <Link href="/mcp" className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-100 transition cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            MCP Enabled
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => router.push("/merchant/register")}
            className="rounded-full bg-[#3d4b47] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2c3733] transition shadow-md"
          >
            Onboard
          </button>
          <Link href="/admin">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-500 shadow-sm">
              <span className="px-2 border-r border-gray-200">Dashboard</span>
              <span className="px-2 text-xs flex gap-1">
                <div className="w-4 h-4 rounded-full bg-orange-200" />
                <div className="w-4 h-4 rounded-full bg-blue-200 -ml-2 border border-white" />
                <div className="w-4 h-4 rounded-full bg-purple-200 -ml-2 border border-white" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Code Snippet / Terminal Visual */}
      <section className="max-w-4xl mx-auto px-8 pb-24 relative z-10">
        <div className="rounded-2xl border border-[#e8e9e6] bg-[#f5f6f4] shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e9e6] flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-800">integration_example.py</span>
            <div className="ml-auto flex gap-2">
              <span className="px-3 py-1 rounded-full bg-[#41433f] text-xs font-semibold text-white">extract</span>
              <span className="px-3 py-1 rounded-full bg-[#e6e7e4] text-xs font-semibold text-gray-500">crawl</span>
            </div>
          </div>
          <div className="p-6 font-mono text-xs leading-loose text-gray-700 bg-white/50 backdrop-blur-sm">
            <div className="flex mb-4 gap-6 border-b border-gray-100 pb-2">
              <span className="font-bold border-b-2 border-gray-900 pb-2 -mb-2.5">Python</span>
              <span className="text-gray-400">JavaScript</span>
              <span className="text-gray-400">cURL</span>
            </div>
            <div>
              <span className="text-gray-400 mr-4">1</span><span className="text-purple-600">from</span> sentinel_pay <span className="text-purple-600">import</span> SentinelClient<br />
              <span className="text-gray-400 mr-4">2</span>client = SentinelClient(api_key=<span className="text-green-600">"sp-YOUR_API_KEY"</span>)<br />
              <span className="text-gray-400 mr-4">3</span>response = client.verify_merchant(url=<span className="text-green-600">"https://merchant.com"</span>)<br />
              <span className="text-gray-400 mr-4">4</span><span className="text-blue-600">print</span>(response)
            </div>
          </div>
        </div>
      </section>

      {/* Agent Cards */}
      <section className="max-w-screen-xl mx-auto px-8 pb-32">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <div key={agent.title} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{agent.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{agent.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-screen-xl mx-auto px-8 pb-32">
        <p className="text-xs font-mono text-gray-400 mb-4">/proof is in the numbers</p>
        <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-12">
          Trusted in production. Proven at scale.
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => {
            const bgGradients = [
              "bg-gradient-to-br from-blue-50/50 to-white",
              "bg-gradient-to-br from-teal-50/50 to-white",
              "bg-gradient-to-br from-purple-50/50 to-white",
              "bg-gradient-to-br from-orange-50/50 to-white",
            ];
            const lineColors = [
              "bg-blue-500",
              "bg-teal-500",
              "bg-purple-500",
              "bg-orange-500",
            ];
            return (
              <div key={s.value} className={`rounded-2xl border border-gray-100 p-8 shadow-sm ${bgGradients[i]}`}>
                <p className="text-3xl font-bold text-gray-900 mb-8">{s.value}</p>
                <div className={`w-8 h-[3px] rounded-full mb-4 ${lineColors[i]}`} />
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 text-center text-sm font-medium text-gray-400">
        SentinelPay -- Built for Razorpay Hackathon 2025
      </footer>
    </div>
  );
}
