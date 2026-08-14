"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { AppealRecord, BanInfo } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AppealCard({ appeal, ban, t }: { appeal: AppealRecord; ban: BanInfo; t: Dictionary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approved" | "denied") {
    setBusy(true);
    await fetch("/api/appeals/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appealId: appeal.id, username: appeal.username, decision }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-white">{appeal.username}</p>
        <p className="text-[11px] text-white/30">{formatDate(appeal.created_at)}</p>
      </div>

      <div className="rounded-lg bg-black/30 p-2.5 text-[12px] text-white/50">
        <p>
          <span className="text-white/30">{t.appeals.banReason}:</span> {ban.reason || "—"}
        </p>
        <p>
          <span className="text-white/30">{t.appeals.staff}:</span> {ban.staff || "—"} ·{" "}
          <span className="text-white/30">{t.appeals.unban}:</span>{" "}
          {ban.unbanDate ? formatDate(ban.unbanDate) : t.ban.permanent}
        </p>
      </div>

      <div className="rounded-lg bg-white/[0.04] p-3 text-[13px] text-white/80">{appeal.message}</div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => decide("approved")}
          disabled={busy}
          className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
        >
          <Check size={13} /> {t.appeals.approve}
        </Button>
        <Button variant="outline" size="sm" onClick={() => decide("denied")} disabled={busy} className="text-muted-foreground">
          <X size={13} /> {t.appeals.deny}
        </Button>
      </div>
    </Card>
  );
}
