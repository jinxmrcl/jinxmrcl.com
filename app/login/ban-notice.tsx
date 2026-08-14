"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BanInfo {
  reason: string | null;
  staff: string | null;
  time: number | null;
  unbanDate: number | null;
}

export function BanNotice({
  username,
  password,
  ban,
  t,
}: {
  username: string;
  password: string;
  ban: BanInfo;
  t: Dictionary;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function submitAppeal() {
    setSending(true);
    setError(null);

    const res = await fetch("/api/appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, message }),
    });

    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json().catch(() => ({ message: "Error" }));
      setError(data.message || "Error");
    }
    setSending(false);
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-sm flex-col gap-4 rounded-[22px] border border-red-500/20 bg-red-500/[0.04] p-8 backdrop-blur-xl"
      )}
    >
      <h1 className="text-center text-xl font-semibold text-white">{t.ban.title}</h1>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-black/30 p-4 text-[13px]">
        <p>
          <span className="text-muted-foreground">{t.ban.staffMember}:</span>{" "}
          <span className="text-white">{ban.staff || "—"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t.ban.reason}:</span>{" "}
          <span className="text-white">{ban.reason || "—"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t.ban.timeOfBan}:</span>{" "}
          <span className="text-white">{ban.time ? formatDate(ban.time) : "—"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t.ban.unbanDate}:</span>{" "}
          <span className="text-white">{ban.unbanDate ? formatDate(ban.unbanDate) : t.ban.permanent}</span>
        </p>
      </div>

      {sent ? (
        <p className="flex items-center justify-center gap-2 text-center text-[13px] text-emerald-400">
          <Check size={15} /> {t.ban.appealSent}
        </p>
      ) : showForm ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.ban.appealPlaceholder}
            rows={4}
            className="rounded-xl px-3 py-2"
          />
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <Button
            onClick={submitAppeal}
            disabled={sending || message.trim().length < 5}
            className="rounded-xl"
          >
            {sending && <Loader2 size={14} className="animate-spin" />}
            {sending ? t.ban.sending : t.ban.sendAppeal}
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)} className="rounded-xl">
          {t.ban.mistakeButton}
        </Button>
      )}
    </div>
  );
}
