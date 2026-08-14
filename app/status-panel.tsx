"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimatedNumber } from "@/app/use-animated-number";

interface Stats {
  count: number;
  totalSizeMB: number;
}

function Counter({ label, value, decimals = 0 }: { label: string; value: number; decimals?: number }) {
  const animated = useAnimatedNumber(value);
  const [pulse, setPulse] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`text-[32px] font-semibold leading-none tracking-tight text-white transition-transform duration-300 sm:text-[44px] ${
          pulse ? "scale-110" : "scale-100"
        }`}
      >
        {animated.toFixed(decimals)}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/35 sm:text-[12px]">{label}</span>
    </div>
  );
}

export function StatsBar({
  initial,
  labels,
}: {
  initial: Stats;
  labels: { uploads: string; mbUsed: string };
}) {
  const [stats, setStats] = useState<Stats>(initial);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (res.ok) setStats(await res.json());
      } catch {
      }
    };
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-8 sm:gap-14">
      <Counter label={labels.uploads} value={stats.count} />
      <div className="h-10 w-px bg-white/10" />
      <Counter label={labels.mbUsed} value={stats.totalSizeMB} decimals={2} />
    </div>
  );
}
