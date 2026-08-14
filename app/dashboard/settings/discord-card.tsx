"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Unlink } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DiscordIcon } from "@/app/discord-icon";

export function DiscordCard({
  discordId,
  discordUsername,
  discordAvatar,
  t,
}: {
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  t: Dictionary;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  const error = searchParams.get("discord_error");
  const justLinked = searchParams.get("discord") === "linked";

  async function disconnect() {
    setBusy(true);
    await fetch("/api/dashboard/discord/disconnect", { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  const avatarUrl = discordId && discordAvatar ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png` : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[#5865F2]/15 text-[#5865F2]">
            <DiscordIcon />
          </span>
          {discordId ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback className="text-[11px]">{discordUsername?.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-white">{discordUsername}</p>
                <p className="text-[12px] text-emerald-400">{t.settings.discordConnected}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">{t.settings.discord}</p>
              <p className="text-[12px] text-white/30">{t.settings.discordHint}</p>
            </div>
          )}
        </div>
        {discordId ? (
          <Button variant="outline" onClick={disconnect} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Unlink size={15} />}
            {t.settings.discordDisconnect}
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <a href="/api/auth/discord">{t.settings.discordConnect}</a>
          </Button>
        )}
      </div>
      {justLinked && <p className="pl-12 text-[12px] text-emerald-400">{t.settings.discordConnected}</p>}
      {error && <p className="pl-12 text-[12px] text-red-400">{t.settings.discordError}</p>}
    </div>
  );
}
