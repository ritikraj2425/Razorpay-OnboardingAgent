"use client";

import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { ArrowLeft, PlayCircle, Bot, User, CheckCircle, Loader2, Settings } from "lucide-react";
import { api } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  isTool?: boolean;
  toolPayload?: any;
  toolStatus?: "running" | "completed" | "error";
};

export default function SimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setMessages([]);

    // 1. User Message
    const userPrompt = "Please use the SentinelPay MCP to onboard a new Private Limited company called Acme Corp (Customer brand: Acme). Their PAN is ABCDE1234F, GST is 22AAAAA0000A1Z5, website is https://acme.com. Support email is help@acme.com, phone is 9876543210. Bank account 1122334455, IFSC HDFC0001234. Contact person is Jane Doe, category is ecommerce. They expect a monthly volume of 100,000 INR with an AOV of 2,000 INR.";
    setMessages([{ role: "user", content: userPrompt }]);

    await new Promise((r) => setTimeout(r, 1000));

    // 2. AI Thinking
    setMessages((m) => [...m, { role: "assistant", content: "I'll use the `submit_merchant_application` tool to onboard this merchant for you." }]);
    await new Promise((r) => setTimeout(r, 1000));

    // 3. Tool Call
    const payload = {
      business_type: "private_limited",
      legal_business_name: "Acme Corp",
      customer_facing_business_name: "Acme",
      contact_name: "Jane Doe",
      category: "ecommerce",
      pan: "ABCDE1234F",
      gst: "22AAAAA0000A1Z5",
      bank_account: "1122334455",
      ifsc: "HDFC0001234",
      website_url: "https://acme.com",
      support_email: "help@acme.com",
      support_phone: "9876543210",
      expected_monthly_volume: 100000,
      expected_average_order_value: 2000
    };

    setMessages((m) => [...m, { 
      role: "assistant", 
      content: "Calling tool: submit_merchant_application",
      isTool: true,
      toolPayload: payload,
      toolStatus: "running"
    }]);

    // 4. API Request
    try {
      const response = await api<any>("/api/merchants/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      await new Promise((r) => setTimeout(r, 1500));

      setMessages((m) => {
        const updated = [...m];
        if (updated.length > 0) updated[updated.length - 1].toolStatus = "completed";
        return [
          ...updated,
          { 
            role: "assistant", 
            content: `Successfully onboarded the merchant! The AI system assigned Merchant ID: ${response.merchant?.id || "N/A"}.

**Onboarding Results:**
- **Decision:** ${response.decision || "N/A"}
- **Trust Score:** ${response.score || "N/A"}/100
- **Risk Level:** ${response.risk_level || "N/A"}

**AI Analysis Details:**
${response.steps && response.steps.length > 0 ? response.steps.map((s: any) => `- **${s.name}**: ${s.detail}`).join("\n") : "- None"}

**Risk Signals:**
${response.reason_codes && response.reason_codes.length > 0 ? response.reason_codes.map((c: string) => `- ${c}`).join("\n") : "- None"}

You can view the full deep-dive analysis in the SentinelPay dashboard.`
          }
        ];
      });
    } catch (err: any) {
      setMessages((m) => {
        const updated = [...m];
        if (updated.length > 0) updated[updated.length - 1].toolStatus = "error";
        return [
          ...updated,
          { 
            role: "assistant", 
            content: `Tool error: Failed to onboard the merchant. ${err.message}`
          }
        ];
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-4xl mx-auto py-8">
        <Link href="/mcp" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition mb-6">
          <ArrowLeft size={16} /> Back to Docs
        </Link>
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#649e9c]">MCP Simulator</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Watch how an AI agent uses the SentinelPay MCP to autonomously onboard a merchant. This simulation runs live against your backend API.
            </p>
          </div>
          <button 
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
            {isRunning ? "Simulating..." : "Run AI Demo"}
          </button>
        </div>

        {/* Chat Interface */}
        <div className="bg-[#fafaf8] rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[500px] flex flex-col">
          <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-3">
            <Bot size={20} className="text-emerald-600" />
            <span className="font-semibold text-gray-800">Claude Simulator</span>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {messages.length === 0 && !isRunning && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                <Bot size={48} className="mb-4" />
                <p>Click "Run AI Demo" to start the simulation.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-emerald-700" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${msg.role === "user" ? "bg-[#3d4b47] text-white" : "bg-white border border-gray-100 shadow-sm text-gray-800"} rounded-2xl px-5 py-3.5 leading-relaxed`}>
                  {msg.isTool ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                        <Settings size={16} className="animate-spin-slow" />
                        {msg.content}
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs font-mono text-emerald-400">
                          {JSON.stringify(msg.toolPayload, null, 2)}
                        </pre>
                      </div>
                      {msg.toolStatus === "running" ? (
                        <p className="text-xs text-gray-500 italic flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Sending to SentinelPay API (Running AI evaluation pipeline...)</p>
                      ) : msg.toolStatus === "completed" ? (
                        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle size={12}/> Tool execution completed successfully</p>
                      ) : (
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">Tool execution failed</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User size={18} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isRunning && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-emerald-700" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-3.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
