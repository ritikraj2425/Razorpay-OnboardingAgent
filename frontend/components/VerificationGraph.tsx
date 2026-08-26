"use client";

import { useMemo, useEffect, useState } from "react";
import { ReactFlow, Controls, Background, MarkerType, Node, Edge, useNodesState, useEdgesState, Position, Handle } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, CheckCircle, XCircle, AlertCircle, Cpu, Database, FileSearch, Landmark, Globe, Shield, AlertTriangle, Key, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentStep } from "./AgentTerminal";

const CATEGORY_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  registration: { icon: Cpu,        label: "Registry",    color: "text-gray-600",   bg: "bg-gray-100" },
  documents:    { icon: Database,   label: "Documents",   color: "text-blue-600",   bg: "bg-blue-100" },
  kyc:          { icon: FileSearch, label: "KYC Engine",  color: "text-purple-600", bg: "bg-purple-100" },
  banking:      { icon: Landmark,   label: "Banking",     color: "text-teal-600",   bg: "bg-teal-100" },
  website:      { icon: Globe,      label: "Web Crawler", color: "text-orange-600", bg: "bg-orange-100" },
  compliance:   { icon: Shield,     label: "Compliance",  color: "text-indigo-600", bg: "bg-indigo-100" },
  risk:         { icon: AlertTriangle,label: "Risk Engine", color: "text-red-600",    bg: "bg-red-100" },
  decision:     { icon: Key,        label: "Decision",    color: "text-emerald-600", bg: "bg-emerald-100" },
  activation:   { icon: Zap,        label: "Activation",  color: "text-yellow-600", bg: "bg-yellow-100" },
  ai:           { icon: Brain,      label: "LLM Agent",   color: "text-violet-600", bg: "bg-violet-100" },
  general:      { icon: Cpu,        label: "Agent",       color: "text-gray-600",   bg: "bg-gray-100" },
};

function StatusIcon({ status, running }: { status: string; running?: boolean }) {
  if (running) return <Loader2 size={14} className="animate-spin text-blue-500" />;
  if (status === "passed" || status === "info") return <CheckCircle size={14} className="text-success" />;
  if (status === "failed" || status === "flagged") return <XCircle size={14} className="text-danger" />;
  if (status === "warning") return <AlertCircle size={14} className="text-warning" />;
  return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />;
}

// ── Custom Node ──
function AgentNode({ data }: { data: any }) {
  const { step, phase } = data;
  const meta = CATEGORY_META[step.category || "general"] || CATEGORY_META.general;
  const Icon = meta.icon;
  const running = phase === "running";
  const done = phase === "done";
  
  return (
    <div className={cn(
      "relative rounded-xl border bg-white p-4 min-w-[320px] transition-all duration-500 ease-out",
      running ? "border-blue-500 ring-8 ring-blue-50 shadow-2xl shadow-blue-500/20 scale-105 z-50" : 
      done && (step.status === "passed" || step.status === "info") ? "border-green-200 shadow-sm" :
      done && (step.status === "failed" || step.status === "flagged") ? "border-red-200 shadow-sm" :
      done && step.status === "warning" ? "border-amber-200 shadow-sm" : "border-gray-200 opacity-50 scale-95"
    )}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-300 border-none" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", meta.bg, meta.color)}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{meta.label}</div>
          <div className="text-sm font-bold text-gray-900 truncate">{step.name}</div>
        </div>
        <StatusIcon status={step.status} running={running} />
      </div>

      {/* Output / Detail */}
      {(running || done) && (
        <div className="mt-3 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-lg border border-gray-100 leading-relaxed font-mono animate-in fade-in slide-in-from-top-2">
          {running ? "Processing..." : step.detail}
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-300 border-none" />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

import { ReactFlowProvider, useReactFlow } from "@xyflow/react";

function FlowCanvas({ steps }: { steps: AgentStep[] }) {
  const [visibleStep, setVisibleStep] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setCenter } = useReactFlow();

  // Sequence runner
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const advance = () => {
      setVisibleStep(prev => {
        if (prev >= steps.length) return prev;
        const dur = (steps[prev]?.duration_ms || 400) + 800;
        timeout = setTimeout(advance, Math.min(dur, 2500));
        return prev + 1;
      });
    };
    timeout = setTimeout(advance, 800);
    return () => clearTimeout(timeout);
  }, [steps]);

  // Build nodes & edges
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    let currentX = 0;
    let currentY = 0;
    let lastNodeId = "";
    
    const catY: Record<string, number> = {
      registration: 0,
      documents: 150,
      kyc: -150,
      banking: 300,
      website: -300,
      compliance: 0,
      risk: 150,
      decision: 0,
      activation: -150,
      ai: 300,
      general: 0
    };

    steps.forEach((step, i) => {
      const id = `step-${i}`;
      const phase = i < visibleStep ? "done" : i === visibleStep ? "running" : "waiting";
      
      const cat = step.category || "general";
      const yOffset = catY[cat] || 0;
      
      newNodes.push({
        id,
        type: "agentNode",
        position: { x: currentX, y: currentY + (i % 2 === 0 ? 0 : 60) + yOffset },
        data: { step, phase },
      });

      if (lastNodeId) {
        const isActive = i <= visibleStep;
        newEdges.push({
          id: `e-${lastNodeId}-${id}`,
          source: lastNodeId,
          target: id,
          animated: isActive && i === visibleStep,
          type: "smoothstep",
          style: { 
            stroke: isActive && i === visibleStep ? "#3b82f6" : isActive ? "#93c5fd" : "#e5e7eb", 
            strokeWidth: isActive && i === visibleStep ? 4 : isActive ? 2 : 2 
          },
        });
      }
      
      lastNodeId = id;
      currentX += 400; // Increased spacing
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, visibleStep, setNodes, setEdges]);

  // Auto-pan to center the active node
  useEffect(() => {
    if (nodes.length > 0 && visibleStep < nodes.length) {
      const activeNode = nodes[visibleStep];
      if (activeNode) {
        setCenter(activeNode.position.x + 160, activeNode.position.y + 80, { zoom: 1.1, duration: 800 });
      }
    } else if (visibleStep >= nodes.length && nodes.length > 0) {
       // When done, zoom out to show whole graph
       const lastNode = nodes[nodes.length - 1];
       setCenter(lastNode.position.x / 2, 0, { zoom: 0.6, duration: 1200 });
    }
  }, [visibleStep, nodes, setCenter]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={1.5}
      attributionPosition="bottom-right"
      className="bg-gray-50/50"
    >
      <Background color="#e5e7eb" gap={20} size={2} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function VerificationGraph({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-2xl overflow-hidden shadow-inner">
      <ReactFlowProvider>
        <FlowCanvas steps={steps} />
      </ReactFlowProvider>
    </div>
  );
}
