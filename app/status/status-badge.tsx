"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ServiceState, StatusResponse } from "@/lib/status-types";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<ServiceState, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

export function StatusBadge({
  labels,
}: {
  labels: { allOperational: string; degraded: string; down: string };
}) {
  const [state, setState] = useState<ServiceState | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok) {
          const data: StatusResponse = await res.json();
          setState(data.overall);
        }
      } catch {
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const label = state === "down" ? labels.down : state === "degraded" ? labels.degraded : labels.allOperational;

  return (
    <Link
      href="/status"
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-[13px]"
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          state ? DOT_COLOR[state] : "bg-white/20",
          state && state !== "operational" && "animate-pulse"
        )}
      />
      {state ? label : "…"}
    </Link>
  );
}
