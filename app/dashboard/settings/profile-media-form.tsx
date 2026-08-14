"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Video, Music, Volume2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

function MediaRow({
  icon: Icon,
  label,
  hint,
  currentFile,
  accept,
  endpoint,
  t,
}: {
  icon: typeof Video;
  label: string;
  hint: string;
  currentFile: string | null;
  accept: string;
  endpoint: string;
  t: Dictionary;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: formData });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({ message: "Error" }));
      setError(data.message || "Error");
    }
    setBusy(false);
  }

  async function handleRemove() {
    setBusy(true);
    await fetch(endpoint, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white/60">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-[12px] text-white/30">{hint}</p>
          <p className="truncate text-[12px] text-white/50">{currentFile ? currentFile : t.settings.noneSet}</p>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {currentFile && (
          <Button variant="outline" size="icon" onClick={handleRemove} disabled={busy} title={t.settings.remove}>
            <X size={15} />
          </Button>
        )}
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {t.settings.upload}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </div>
    </div>
  );
}

function VolumeSlider({ initialVolume }: { initialVolume: number }) {
  const [volume, setVolume] = useState(initialVolume);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function change(value: number) {
    setVolume(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetch("/api/dashboard/profile-music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: value }),
      });
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="ml-12 flex w-fit items-center gap-3 rounded-full bg-black/80 px-4 py-3">
      <Volume2 size={15} className="shrink-0 text-white" />
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => change(Number(e.target.value))}
        style={{ "--slider-progress": `${volume}%` } as CSSProperties}
        className="slider-thumb w-28"
      />
      <span className="w-9 shrink-0 text-right text-[12px] text-white/50">{volume}%</span>
    </div>
  );
}

export function ProfileMediaForm({
  profileVideo,
  profileMusic,
  profileMusicVolume,
  t,
}: {
  profileVideo: string | null;
  profileMusic: string | null;
  profileMusicVolume: number;
  t: Dictionary;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{t.settings.profileMedia}</p>
        <p className="text-[13px] text-white/30">{t.settings.profileMediaHint}</p>
      </div>
      <MediaRow
        icon={Video}
        label={t.settings.backgroundVideo}
        hint={t.settings.backgroundVideoHint}
        currentFile={profileVideo}
        accept="video/mp4,video/webm"
        endpoint="/api/dashboard/profile-video"
        t={t}
      />
      <MediaRow
        icon={Music}
        label={t.settings.backgroundMusic}
        hint={t.settings.backgroundMusicHint}
        currentFile={profileMusic}
        accept="audio/mpeg,audio/ogg,audio/wav"
        endpoint="/api/dashboard/profile-music"
        t={t}
      />
      {profileMusic && (
        <div className="flex flex-col gap-1.5">
          <p className="pl-12 text-[12px] text-white/30">{t.settings.defaultVolume}</p>
          <VolumeSlider initialVolume={profileMusicVolume} />
        </div>
      )}
    </div>
  );
}
