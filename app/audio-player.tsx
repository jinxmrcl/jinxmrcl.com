"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.currentTime = value;
    setCurrent(value);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.volume = value;
    setVolume(value);
    setMuted(value === 0);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 p-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06]">
        <Music size={30} className="text-white/40" />
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex w-full items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90"
        >
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>

        <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-white/40">
          {formatTime(current)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={seek}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
          style={{
            background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
          }}
        />

        <span className="w-10 shrink-0 text-[12px] tabular-nums text-white/40">
          {formatTime(duration)}
        </span>

        <button onClick={toggleMute} className="shrink-0 text-white/40 transition hover:text-white">
          {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={changeVolume}
          className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
        />
      </div>
    </div>
  );
}
