"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* ── Node Data ──────────────────────────────────────────────── */
type ArchNode = {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  color: string;
  group: "input" | "core" | "ai" | "data" | "output";
  details: string[];
};

type ArchEdge = {
  from: string;
  to: string;
  label: string;
  animated?: boolean;
};

const NODES: ArchNode[] = [
  // ── Input Layer
  { id: "merchant", label: "Merchant", sublabel: "Web Form", x: 80, y: 80, color: "#3b82f6", group: "input", details: ["Next.js Registration Form", "Document Upload (PDF/Images)", "PAN / GST / Bank Details", "Business Category Selection"] },
  { id: "claude", label: "Claude / Cursor", sublabel: "AI Agent (MCP)", x: 80, y: 240, color: "#8b5cf6", group: "input", details: ["Model Context Protocol (stdio)", "submit_merchant_application tool", "Natural language → JSON extraction", "Zero-touch onboarding"] },

  // ── Core Layer
  { id: "nextjs", label: "Next.js Frontend", sublabel: "React + Tailwind", x: 350, y: 80, color: "#06b6d4", group: "core", details: ["App Router (Next.js 16)", "Server-Side Rendering", "Admin Dashboard", "MCP Simulator"] },
  { id: "mcp", label: "MCP Server", sublabel: "Python (stdio)", x: 350, y: 240, color: "#a855f7", group: "core", details: ["mcp_server.py", "httpx async HTTP client", "Environment-based API URL", "JSON schema validation"] },
  { id: "fastapi", label: "FastAPI Backend", sublabel: "Python 3.12", x: 620, y: 160, color: "#10b981", group: "core", details: ["REST API Endpoints", "SQLAlchemy ORM", "Pydantic Validation", "CORS Middleware"] },

  // ── AI Pipeline Layer
  { id: "ai_pipeline", label: "AI Verification", sublabel: "Multi-Agent Pipeline", x: 890, y: 60, color: "#f59e0b", group: "ai", details: ["Website Intelligence Agent", "GSTIN Verification Agent", "Ad Verification Agent", "Risk Scoring Engine"] },
  { id: "llm", label: "LLM (Gemini)", sublabel: "Google AI", x: 1130, y: 60, color: "#ef4444", group: "ai", details: ["gemini-2.0-flash model", "Policy analysis prompts", "Structured JSON output", "Underwriter memo generation"] },
  { id: "web_scraper", label: "Web Scraper", sublabel: "Website Intel", x: 1130, y: 200, color: "#f97316", group: "ai", details: ["BeautifulSoup4 + httpx", "Price extraction", "Policy page detection", "Semantic drift scoring"] },

  // ── Data Layer
  { id: "database", label: "PostgreSQL", sublabel: "Render DB", x: 890, y: 310, color: "#6366f1", group: "data", details: ["Merchants, Snapshots, Signals", "Trust Scores & Audit Logs", "Recheck Jobs & AI Reports", "Human Review Cases"] },
  { id: "scheduler", label: "APScheduler", sublabel: "Background Jobs", x: 620, y: 350, color: "#14b8a6", group: "data", details: ["Recurring recheck cadence", "Grace period enforcement", "Risk-based scheduling", "30-min interval checks"] },

  // ── Output Layer
  { id: "queue", label: "Notification Queue", sublabel: "asyncio.Queue", x: 1130, y: 370, color: "#ec4899", group: "output", details: ["Event-driven architecture", "Async background worker", "Email / SMS dispatch", "Onboarding & Recheck alerts"] },
  { id: "notification", label: "Notification Service", sublabel: "Email / SMS", x: 1370, y: 370, color: "#e11d48", group: "output", details: ["Merchant report delivery", "Status change alerts", "Recheck result summaries", "PDF report generation"] },
];

const EDGES: ArchEdge[] = [
  { from: "merchant", to: "nextjs", label: "Form Submit", animated: true },
  { from: "claude", to: "mcp", label: "stdio", animated: true },
  { from: "nextjs", to: "fastapi", label: "REST API" },
  { from: "mcp", to: "fastapi", label: "POST /register" },
  { from: "fastapi", to: "ai_pipeline", label: "Orchestrate", animated: true },
  { from: "ai_pipeline", to: "llm", label: "Prompts" },
  { from: "ai_pipeline", to: "web_scraper", label: "Crawl" },
  { from: "ai_pipeline", to: "database", label: "Store Results" },
  { from: "fastapi", to: "database", label: "CRUD" },
  { from: "scheduler", to: "fastapi", label: "Trigger Rechecks" },
  { from: "scheduler", to: "database", label: "Read Jobs" },
  { from: "database", to: "queue", label: "Events", animated: true },
  { from: "queue", to: "notification", label: "Dispatch", animated: true },
];

/* ── Helpers ─────────────────────────────────────────────────── */
const GROUP_COLORS: Record<string, string> = {
  input: "rgba(59,130,246,0.06)",
  core: "rgba(16,185,129,0.06)",
  ai: "rgba(245,158,11,0.06)",
  data: "rgba(99,102,241,0.06)",
  output: "rgba(236,72,153,0.06)",
};

const GROUP_LABELS: Record<string, string> = {
  input: "Input Layer",
  core: "Application Layer",
  ai: "AI Pipeline",
  data: "Data & Scheduling",
  output: "Notifications",
};

const NODE_W = 180;
const NODE_H = 72;

function getNodeCenter(n: ArchNode) {
  return { cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2 };
}

/* ── Component ──────────────────────────────────────────────── */
export default function ArchitecturePage() {
  const [active, setActive] = useState<ArchNode | null>(null);

  const svgW = 1560;
  const svgH = 480;

  return (
    <Shell>
      <div className="max-w-[1600px] mx-auto py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition mb-6">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#649e9c]">System Architecture</h1>
          <p className="text-sm text-gray-500 mt-1">High-Level Design of the SentinelPay AI-Powered Merchant Onboarding Platform. Hover over any component to learn more.</p>
        </div>

        {/* ── Legend ────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 mb-6">
          {Object.entries(GROUP_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="w-3 h-3 rounded-full" style={{ background: Object.values(NODES.find(n => n.group === key)?.color || "#ccc")[0] ? NODES.find(n => n.group === key)?.color : "#ccc" }} />
              {label}
            </div>
          ))}
        </div>

        {/* ── SVG Diagram ──────────────────────────── */}
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full min-w-[1000px]"
            style={{ minHeight: 480 }}
          >
            <defs>
              {/* Animated dash for data flow lines */}
              <style>{`
                @keyframes dashFlow {
                  to { stroke-dashoffset: -20; }
                }
                .edge-animated {
                  stroke-dasharray: 6 4;
                  animation: dashFlow 0.8s linear infinite;
                }
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
                .node-pulse {
                  animation: pulse 2s ease-in-out infinite;
                }
              `}</style>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" fill="#94a3b8">
                <polygon points="0 0, 8 3, 0 6" />
              </marker>
              <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" fill="#10b981">
                <polygon points="0 0, 8 3, 0 6" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Group backgrounds ─────────── */}
            <rect x="30" y="40" width="280" height="260" rx="16" fill={GROUP_COLORS.input} stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
            <text x="50" y="68" fontSize="11" fontWeight="700" fill="#3b82f6" opacity="0.6">INPUT LAYER</text>

            <rect x="300" y="40" width="280" height="340" rx="16" fill={GROUP_COLORS.core} stroke="rgba(16,185,129,0.15)" strokeWidth="1" />
            <text x="320" y="68" fontSize="11" fontWeight="700" fill="#10b981" opacity="0.6">APPLICATION LAYER</text>

            <rect x="840" y="20" width="360" height="250" rx="16" fill={GROUP_COLORS.ai} stroke="rgba(245,158,11,0.15)" strokeWidth="1" />
            <text x="860" y="48" fontSize="11" fontWeight="700" fill="#f59e0b" opacity="0.6">AI PIPELINE</text>

            <rect x="580" y="280" width="380" height="140" rx="16" fill={GROUP_COLORS.data} stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
            <text x="600" y="308" fontSize="11" fontWeight="700" fill="#6366f1" opacity="0.6">DATA & SCHEDULING</text>

            <rect x="1080" y="300" width="420" height="140" rx="16" fill={GROUP_COLORS.output} stroke="rgba(236,72,153,0.15)" strokeWidth="1" />
            <text x="1100" y="328" fontSize="11" fontWeight="700" fill="#ec4899" opacity="0.6">NOTIFICATIONS</text>

            {/* ── Edges ────────────────────────── */}
            {EDGES.map((edge, i) => {
              const fromNode = NODES.find(n => n.id === edge.from)!;
              const toNode = NODES.find(n => n.id === edge.to)!;
              const from = getNodeCenter(fromNode);
              const to = getNodeCenter(toNode);

              const isActive = active && (active.id === edge.from || active.id === edge.to);
              const midX = (from.cx + to.cx) / 2;
              const midY = (from.cy + to.cy) / 2;

              return (
                <g key={i}>
                  <line
                    x1={from.cx} y1={from.cy}
                    x2={to.cx} y2={to.cy}
                    stroke={isActive ? "#10b981" : "#cbd5e1"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    className={edge.animated ? "edge-animated" : ""}
                    filter={isActive ? "url(#glow)" : undefined}
                  />
                  <rect
                    x={midX - edge.label.length * 3.2}
                    y={midY - 8}
                    width={edge.label.length * 6.4}
                    height={14}
                    rx="4"
                    fill="white"
                    stroke={isActive ? "#10b981" : "#e2e8f0"}
                    strokeWidth="0.5"
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="600"
                    fill={isActive ? "#059669" : "#94a3b8"}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* ── Nodes ────────────────────────── */}
            {NODES.map((node) => {
              const isActive = active?.id === node.id;
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setActive(node)}
                  onMouseLeave={() => setActive(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Shadow */}
                  <rect
                    x={node.x + 2}
                    y={node.y + 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx="12"
                    fill="rgba(0,0,0,0.04)"
                  />
                  {/* Card */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx="12"
                    fill="white"
                    stroke={isActive ? node.color : "#e2e8f0"}
                    strokeWidth={isActive ? 2.5 : 1}
                    filter={isActive ? "url(#glow)" : undefined}
                  />
                  {/* Color bar */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width="6"
                    height={NODE_H}
                    rx="3"
                    fill={node.color}
                    className={isActive ? "node-pulse" : ""}
                  />
                  {/* Label */}
                  <text x={node.x + 20} y={node.y + 32} fontSize="13" fontWeight="700" fill="#1e293b">
                    {node.label}
                  </text>
                  {/* Sublabel */}
                  <text x={node.x + 20} y={node.y + 48} fontSize="10" fill="#94a3b8" fontWeight="500">
                    {node.sublabel}
                  </text>
                  {/* Active dot */}
                  {isActive && (
                    <circle cx={node.x + NODE_W - 12} cy={node.y + 12} r="4" fill={node.color} className="node-pulse" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Detail Panel ─────────────────────── */}
        <div className="mt-6 min-h-[120px]">
          {active ? (
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 transition-all duration-300"
              style={{ borderLeftColor: active.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{active.label}</h3>
                  <p className="text-xs text-gray-500">{active.sublabel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {active.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active.color }} />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-sm text-gray-400">
              Hover over a component to see implementation details
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
