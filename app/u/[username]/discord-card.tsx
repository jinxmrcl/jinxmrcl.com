"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Handshake,
  Sparkles,
  Bug,
  Flame,
  Gem,
  Scale,
  Star,
  Code,
  BadgeCheck,
  Hammer,
  Zap,
} from "lucide-react";
import { DiscordIcon } from "@/app/discord-icon";

const BADGE_ICON: Record<string, typeof ShieldCheck> = {
  staff: ShieldCheck,
  partner: Handshake,
  hypesquad: Sparkles,
  bug_hunter_1: Bug,
  bug_hunter_2: Bug,
  house_bravery: Flame,
  house_brilliance: Gem,
  house_balance: Scale,
  early_supporter: Star,
  verified_bot_dev: Code,
  certified_moderator: BadgeCheck,
  active_developer: Hammer,
};

const STATUS_COLOR: Record<string, string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-500",
  dnd: "bg-red-500",
  offline: "bg-white/25",
};

interface Badge {
  id: string;
  label: string;
}

interface Presence {
  status: string;
  customStatusText: string | null;
  customStatusEmoji: string | null;
  customStatusEmojiId: string | null;
  customStatusEmojiAnimated: boolean;
}

export function DiscordProfileCard({
  username,
  discordId,
  discordUsername,
  discordAvatar,
  discordClanTag,
  discordClanBadge,
  discordClanGuildId,
  discordPremiumType,
  badges,
}: {
  username: string;
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  discordClanTag: string | null;
  discordClanBadge: string | null;
  discordClanGuildId: string | null;
  discordPremiumType: number;
  badges: Badge[];
}) {
  const [presence, setPresence] = useState<Presence | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/discord-presence/${username}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPresence(data.presence);
        }
      } catch {
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [username]);

  const avatarUrl = discordAvatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.${discordAvatar.startsWith("a_") ? "gif" : "png"}`
    : null;

  const clanBadgeUrl =
    discordClanBadge && discordClanGuildId
      ? `https://cdn.discordapp.com/clan-badges/${discordClanGuildId}/${discordClanBadge}.png`
      : null;

  const emojiUrl = presence?.customStatusEmojiId
    ? `https://cdn.discordapp.com/emojis/${presence.customStatusEmojiId}.${presence.customStatusEmojiAnimated ? "gif" : "png"}`
    : null;

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-white/[0.06]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#5865F2]">
                <DiscordIcon size={18} />
              </div>
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0a] ${
              STATUS_COLOR[presence?.status ?? "offline"]
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold text-white">{discordUsername}</span>
            {discordPremiumType > 0 && <Zap size={13} className="shrink-0 text-[#ff73fa]" />}
            {discordClanTag && (
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">
                {clanBadgeUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clanBadgeUrl} alt="" className="h-3 w-3" />
                )}
                {discordClanTag}
              </span>
            )}
            {badges.map((badge) => {
              const Icon = BADGE_ICON[badge.id] ?? Star;
              return (
                <span key={badge.id} title={badge.label} className="shrink-0 text-white/40">
                  <Icon size={13} />
                </span>
              );
            })}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/40">
            {emojiUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={emojiUrl} alt="" className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{presence?.customStatusText || " "}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
