import Link from "next/link";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Bot, Settings, Code2, PlayCircle, Info } from "lucide-react";
import { Card, Badge } from "@/components/ui";

export default function MCPDocsPage() {
  return (
    <Shell>
      <div className="max-w-4xl mx-auto py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition mb-6">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#649e9c]">Model Context Protocol (MCP)</h1>
              <Badge tone="success" size="sm">v1.0</Badge>
            </div>
            <p className="text-sm text-gray-500 max-w-2xl">
              SentinelPay supports the official Model Context Protocol. This allows AI agents like Claude Desktop to automatically execute onboarding tasks for you, without touching a web UI.
            </p>
          </div>
          
          <Link 
            href="/mcp/simulator" 
            className="flex items-center gap-2 rounded-lg bg-[#3d4b47] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2c3733] transition shadow-md whitespace-nowrap"
          >
            <PlayCircle size={18} />
            Launch Interactive Simulator
          </Link>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0 mt-1">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">How it works</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The SentinelPay MCP server exposes a local tool called <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-xs">submit_merchant_application</code> to your AI agent. When you chat with Claude and ask it to onboard a merchant, Claude will automatically parse your prompt, format the data into the correct JSON structure, and securely send it directly to our backend API.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0 mt-1">
                <Settings size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Instructions (Claude Desktop)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Open your Claude Desktop configuration file and add the following JSON block. Note that the Python script must be executed on your local machine.
                </p>
                
                <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-inner mb-4">
                  <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
{`"mcpServers": {
  "sentinelpay": {
    "command": "python",
    "args": [
      "/Absolute/Path/To/Your/Local/Repo/backend/mcp_server.py"
    ],
    "env": {
      "SENTINELPAY_API_URL": "https://razorpay-onboardingagent.onrender.com"
    }
  }
}`}
                  </pre>
                </div>
                
                <div className="flex gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Important details for the config:</p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                      <li><strong>args:</strong> You must replace <code className="bg-white/50 px-1 rounded text-amber-900">/Absolute/Path/To/...</code> with the real path where you cloned this repository. Claude needs to know exactly where the Python script lives on your hard drive.</li>
                      <li><strong>env:</strong> You do NOT need to modify any local <code className="bg-white/50 px-1 rounded text-amber-900">.env</code> files. Claude will automatically inject the `SENTINELPAY_API_URL` directly into the script when it runs it.</li>
                      <li><strong>Dependencies:</strong> Ensure your global python environment has the <code className="bg-white/50 px-1 rounded text-amber-900">mcp</code> and <code className="bg-white/50 px-1 rounded text-amber-900">httpx</code> packages installed (`pip install mcp httpx`).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
