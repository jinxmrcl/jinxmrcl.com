"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Images, HardDrive, Volume, Volume1, Volume2, VolumeX, Play } from "lucide-react";
import { RoleBadge } from "@/app/role-badge";
import { DiscordProfileCard } from "@/app/u/[username]/discord-card";
import type { Role } from "@/lib/role-types";
import { cn } from "@/lib/utils";

interface Labels {
  memberSince: string;
  uploads: string;
  storage: string;
  enter: string;
}

interface DiscordInfo {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  discordClanTag: string | null;
  discordClanBadge: string | null;
  discordClanGuildId: string | null;
  discordPremiumType: number;
  badges: { id: string; label: string }[];
}

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) return <VolumeX size={15} />;
  if (volume < 0.33) return <Volume size={15} />;
  if (volume < 0.67) return <Volume1 size={15} />;
  return <Volume2 size={15} />;
}

export function ProfileExperience({
  username,
  displayName,
  uid,
  role,
  avatar,
  hasVideo,
  hasMusic,
  defaultVolume,
  createdAtLabel,
  uploadCount,
  storageLabel,
  discord,
  labels,
}: {
  username: string;
  displayName: string;
  uid: number;
  role: Role;
  avatar: boolean;
  hasVideo: boolean;
  hasMusic: boolean;
  defaultVolume: number;
  createdAtLabel: string;
  uploadCount: number;
  storageLabel: string;
  discord: DiscordInfo | null;
  labels: Labels;
}) {
  const [entered, setEntered] = useState(!hasVideo && !hasMusic);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [volume, setVolume] = useState(() => Math.min(1, Math.max(0, defaultVolume / 100)));
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function enter() {
    setEntered(true);
    if (audioRef.current) audioRef.current.volume = volume;
    audioRef.current?.play().catch(() => {
    });
  }

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 10 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-3 overflow-hidden px-6 py-16">
      {hasVideo && (
        <video
          className="fixed inset-0 -z-20 h-full w-full object-cover"
          src={`/profile-video/${username}`}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="fixed inset-0 -z-10 bg-black/55" />

      {hasMusic && <audio ref={audioRef} src={`/profile-music/${username}`} loop />}

      {hasMusic && entered && (
        <div className="fixed left-4 top-4 z-40 flex items-center gap-3 rounded-full bg-black/80 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur-xl">
          <span className="text-white">
            <VolumeIcon volume={volume} />
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            style={{ "--slider-progress": `${Math.round(volume * 100)}%` } as CSSProperties}
            className="slider-thumb w-28"
          />
        </div>
      )}

      {!entered && (
        <button
          type="button"
          onClick={enter}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm transition-colors duration-700 hover:bg-black/55"
        >
          <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25">
            <Play size={26} className="ml-1" fill="currentColor" />
          </span>
          <span className="text-lg font-semibold tracking-wide text-white">{labels.enter}</span>
        </button>
      )}

      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        className={cn(
          "w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 ease-out",
          !entered && "pointer-events-none opacity-0"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06] text-xl font-semibold text-white/70">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/avatar/${username}`} alt="" className="h-full w-full object-cover" />
            ) : (
              username.slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{displayName}</h1>
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                UID: {uid}
              </span>
              <RoleBadge role={role} />
            </div>
            <p className="mt-1 text-sm text-white/40">
              {labels.memberSince} {createdAtLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-white/40">
              <Images size={14} />
              <p className="text-[13px]">{labels.uploads}</p>
            </div>
            <p className="text-2xl font-semibold text-white">{uploadCount}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-white/40">
              <HardDrive size={14} />
              <p className="text-[13px]">{labels.storage}</p>
            </div>
            <p className="text-2xl font-semibold text-white">{storageLabel}</p>
          </div>
        </div>
      </div>

      {discord && (
        <div
          className={cn(
            "w-full max-w-md transition-all duration-300 ease-out",
            !entered && "pointer-events-none opacity-0"
          )}
        >
          <DiscordProfileCard
            username={username}
            discordId={discord.discordId}
            discordUsername={discord.discordUsername}
            discordAvatar={discord.discordAvatar}
            discordClanTag={discord.discordClanTag}
            discordClanBadge={discord.discordClanBadge}
            discordClanGuildId={discord.discordClanGuildId}
            discordPremiumType={discord.discordPremiumType}
            badges={discord.badges}
          />
        </div>
      )}
    </main>
  );
}
