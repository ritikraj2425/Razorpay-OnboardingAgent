"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { RefreshCw, ServerCog } from "lucide-react";

export default function Loading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <Shell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#649e9c]/20 blur-xl rounded-full" />
          <div className="relative bg-white border border-[#649e9c]/20 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
            <ServerCog className="w-10 h-10 text-[#649e9c] animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white border border-gray-100 rounded-full p-1.5 shadow-sm">
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          Connecting to API
        </h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          Retrieving live merchant data from the SentinelPay backend...
        </p>
        
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span>
            <span className="font-semibold">Free Tier Notice:</span> If the backend was sleeping, this may take up to <span className="font-bold">45 seconds</span> to wake up.
          </span>
        </div>
      </div>
    </Shell>
  );
}
