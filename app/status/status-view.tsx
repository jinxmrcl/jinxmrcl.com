"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Database,
  UploadCloud,
  Image as ImageIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ServiceState, ServiceHistoryDay, ServiceStatus, StatusResponse, IncidentInfo } from "@/lib/status-types";
import { cn } from "@/lib/utils";

const STATUS_TEXT_COLOR: Record<ServiceState, string> = {
  operational: "text-emerald-500",
  degraded: "text-amber-500",
  down: "text-red-500",
};

const STATUS_ICON_BG: Record<ServiceState, string> = {
  operational: "bg-emerald-500/10 text-emerald-500",
  degraded: "bg-amber-500/10 text-amber-500",
  down: "bg-red-500/10 text-red-500",
};

const BAR_COLOR: Record<string, string> = {
  operational: "bg-emerald-500 hover:bg-emerald-400",
  degraded: "bg-amber-500 hover:bg-amber-400",
  down: "bg-red-500 hover:bg-red-400",
  none: "bg-white/10 hover:bg-white/20",
};

const DOT_COLOR: Record<string, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  none: "bg-white/20",
};

const SERVICE_ICON: Record<string, LucideIcon> = {
  Website: Globe,
  Database: Database,
  "Upload API": UploadCloud,
  "Image Delivery": ImageIcon,
};

const BANNER_STYLE: Record<ServiceState, { wrap: string; icon: string }> = {
  operational: { wrap: "border-emerald-500/20 bg-emerald-500/[0.06]", icon: "text-emerald-500" },
  degraded: { wrap: "border-amber-500/20 bg-amber-500/[0.06]", icon: "text-amber-500" },
  down: { wrap: "border-red-500/20 bg-red-500/[0.06]", icon: "text-red-500" },
};

const BANNER_ICON: Record<ServiceState, LucideIcon> = {
  operational: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
};

function formatRangeLabel(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Labels {
  operational: string;
  degraded: string;
  down: string;
  uptime: string;
  hoverHint: string;
  noData: string;
  allOperational: string;
  lastUpdated: string;
  activeIncidents: string;
  pastIncidents: string;
  resolved: string;
}

function OverallBanner({ state, labels, updatedAt }: { state: ServiceState; labels: Labels; updatedAt: Date }) {
  const Icon = BANNER_ICON[state];
  const text = state === "operational" ? labels.allOperational : state === "degraded" ? labels.degraded : labels.down;

  return (
    <div className={cn("flex w-full items-center gap-4 rounded-3xl border p-5 sm:p-6", BANNER_STYLE[state].wrap)}>
      <Icon className={cn("size-9 shrink-0", BANNER_STYLE[state].icon)} />
      <div className="min-w-0">
        <p className="text-lg font-semibold text-white sm:text-xl">{text}</p>
        <p className="text-[12px] text-white/35">
          {labels.lastUpdated} {updatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function IncidentCard({ incident, labels }: { incident: IncidentInfo; labels: Labels }) {
  const wrap = incident.resolved_at ? "border-white/10 bg-white/[0.03]" : BANNER_STYLE[incident.severity].wrap;

  return (
    <div className={cn("rounded-3xl border p-5 text-left sm:p-6", wrap)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-white">{incident.title}</p>
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          {incident.service && <span className="rounded-full border border-white/10 px-2 py-0.5">{incident.service}</span>}
          <span>
            {incident.resolved_at
              ? `${labels.resolved} ${formatDateTime(incident.resolved_at)}`
              : formatDateTime(incident.created_at)}
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-[13px] text-white/60">{incident.message}</p>
    </div>
  );
}

function ServiceCard({ service, labels }: { service: ServiceStatus; labels: Labels }) {
  const [hovered, setHovered] = useState<ServiceHistoryDay | null>(null);
  const Icon = SERVICE_ICON[service.name] ?? Activity;

  const statusLabel: Record<ServiceState, string> = {
    operational: labels.operational,
    degraded: labels.degraded,
    down: labels.down,
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur-xl transition hover:bg-white/[0.045] sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-2xl", STATUS_ICON_BG[service.status])}>
            <Icon size={17} />
          </span>
          <span className="text-[15px] font-medium text-white">{service.name}</span>
        </div>
        <span className={cn("text-[13px] font-medium", STATUS_TEXT_COLOR[service.status])}>
          {statusLabel[service.status]}
        </span>
      </div>

      <div className="mb-2 flex h-4 items-center text-[12px]">
        {hovered ? (
          <span className="flex items-center gap-1.5 text-white/70">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_COLOR[hovered.status ?? "none"])} />
            {formatFullDate(hovered.date)} — {hovered.status ? statusLabel[hovered.status] : labels.noData}
          </span>
        ) : (
          <span className="text-white/25">{labels.hoverHint}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="flex h-8 min-w-[600px] items-stretch gap-[3px] sm:min-w-0">
          {service.history.map((day) => (
            <button
              key={day.date}
              type="button"
              onMouseEnter={() => setHovered(day)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(day)}
              onClick={() => setHovered(day)}
              aria-label={`${day.date}: ${day.status ?? "no data"}`}
              className={cn(
                "flex-1 rounded-[3px] outline-none transition focus-visible:ring-2 focus-visible:ring-white/50",
                BAR_COLOR[day.status ?? "none"],
                hovered?.date === day.date && "ring-2 ring-white/50"
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[12px] text-white/35">
        <span>{formatRangeLabel(service.history[0]?.date ?? "")}</span>
        <span>
          {service.uptimePercent.toFixed(2)}% {labels.uptime}
        </span>
        <span>{formatRangeLabel(service.history[service.history.length - 1]?.date ?? "")}</span>
      </div>
    </div>
  );
}

export function StatusView({ labels }: { labels: Labels }) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok) {
          setData(await res.json());
          setUpdatedAt(new Date());
        }
      } catch {
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data || !updatedAt) {
    return (
      <div className="flex w-full flex-col gap-3">
        <div className="h-24 w-full animate-pulse rounded-3xl bg-white/[0.03]" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <OverallBanner state={data.overall} labels={labels} updatedAt={updatedAt} />

      {data.incidents.open.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-[13px] font-medium text-white/40">{labels.activeIncidents}</p>
          {data.incidents.open.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} labels={labels} />
          ))}
        </div>
      )}

      {data.services.map((service) => (
        <ServiceCard key={service.name} service={service} labels={labels} />
      ))}

      {data.incidents.recent.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="px-1 text-[13px] font-medium text-white/40">{labels.pastIncidents}</p>
          {data.incidents.recent.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}
