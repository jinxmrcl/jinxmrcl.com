"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { IncidentRecord } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function IncidentCard({
  incident,
  t,
  onResolve,
  resolving,
}: {
  incident: IncidentRecord;
  t: Dictionary;
  onResolve?: (id: number) => void;
  resolving?: boolean;
}) {
  const severityLabel = incident.severity === "down" ? t.status.down : t.status.degraded;

  return (
    <Card className={cn("gap-2 p-4 sm:p-5", incident.resolved_at && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-white">{incident.title}</p>
            <Badge variant={incident.severity === "down" ? "destructive" : "warning"}>{severityLabel}</Badge>
            {incident.service && <Badge variant="outline">{incident.service}</Badge>}
          </div>
          <p className="mt-1 text-[13px] text-white/60">{incident.message}</p>
          <p className="mt-2 text-[11px] text-white/30">
            {incident.created_by} · {formatDate(incident.created_at)}
            {incident.resolved_at && ` · ${t.incidents.resolvedAt} ${formatDate(incident.resolved_at)}`}
          </p>
        </div>
        {onResolve && (
          <Button variant="outline" size="sm" onClick={() => onResolve(incident.id)} disabled={resolving}>
            <CheckCircle2 size={14} /> {t.incidents.resolve}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function IncidentList({
  open,
  recent,
  t,
}: {
  open: IncidentRecord[];
  recent: IncidentRecord[];
  t: Dictionary;
}) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  async function resolve(id: number) {
    setResolvingId(id);
    await fetch("/api/staff/incidents/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
    setResolvingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{t.incidents.open}</p>
        {open.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted-foreground">{t.incidents.noOpen}</Card>
        ) : (
          open.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              t={t}
              onResolve={resolve}
              resolving={resolvingId === incident.id}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{t.incidents.recent}</p>
        {recent.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted-foreground">{t.incidents.noRecent}</Card>
        ) : (
          recent.map((incident) => <IncidentCard key={incident.id} incident={incident} t={t} />)
        )}
      </div>
    </div>
  );
}
