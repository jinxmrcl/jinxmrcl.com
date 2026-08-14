"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => setCurrent(video.currentTime);
    const onMeta = () => setDuration(video.duration);
    const onEnd = () => setPlaying(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("ended", onEnd);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("ended", onEnd);
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.currentTime = value;
    setCurrent(value);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const value = Number(e.target.value);
    video.volume = value;
    setVolume(value);
    setMuted(value === 0);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  }

  function toggleFullscreen() {
    containerRef.current?.requestFullscreen();
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="group relative w-full"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        className="max-h-[70vh] w-full cursor-pointer"
      />

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black">
            <Play size={26} fill="currentColor" className="ml-1" />
          </span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button onClick={togglePlay} className="text-white transition hover:text-white/70">
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <span className="text-[12px] tabular-nums text-white/70">{formatTime(current)}</span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={seek}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full accent-white"
          style={{
            background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
          }}
        />

        <span className="text-[12px] tabular-nums text-white/70">{formatTime(duration)}</span>

        <button onClick={toggleMute} className="text-white transition hover:text-white/70">
          {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={changeVolume}
          className="h-1 w-14 cursor-pointer appearance-none rounded-full accent-white"
        />

        <button onClick={toggleFullscreen} className="text-white transition hover:text-white/70">
          <Maximize size={17} />
        </button>
      </div>
    </div>
  );
}
