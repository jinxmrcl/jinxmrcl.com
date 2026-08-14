"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

export function AvatarUpload({
  username,
  avatarUrl,
  title = "Change profile picture",
}: {
  username: string;
  avatarUrl: string | null;
  title?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl);

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/dashboard/avatar", { method: "POST", body: formData });
    if (res.ok) {
      setPreview(`/avatar/${username}?t=${Date.now()}`);
      router.refresh();
    }
    setUploading(false);
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06] text-xl font-semibold text-white/70 transition hover:opacity-90"
      title={title}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        username.slice(0, 1).toUpperCase()
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
        {uploading ? <Loader2 size={18} className="animate-spin text-white" /> : <Camera size={18} className="text-white" />}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </button>
  );
}
