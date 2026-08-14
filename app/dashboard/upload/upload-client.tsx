"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { Upload, Check, X, Copy, Link2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCodeButton } from "@/app/qr-code-button";
import { cn } from "@/lib/utils";

interface UploadResult {
  name: string;
  status: "uploading" | "done" | "error";
  url?: string;
  message?: string;
}

const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024 * 1024;

export function UploadClient({ t }: { t: Dictionary }) {
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [urlValue, setUrlValue] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setResults((prev) => [
          { name: file.name, status: "error", message: t.upload.tooLarge },
          ...prev,
        ]);
        continue;
      }

      setResults((prev) => [{ name: file.name, status: "uploading" }, ...prev]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        setResults((prev) =>
          prev.map((r) =>
            r.name === file.name && r.status === "uploading"
              ? res.ok
                ? { ...r, status: "done", url: data.url }
                : { ...r, status: "error", message: data.message }
              : r
          )
        );
      } catch {
        setResults((prev) =>
          prev.map((r) =>
            r.name === file.name && r.status === "uploading" ? { ...r, status: "error", message: "Network error" } : r
          )
        );
      }
    }
  }, []);

  async function uploadFromUrl(e: FormEvent) {
    e.preventDefault();
    const url = urlValue.trim();
    if (!url) return;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setResults((prev) => [{ name: url, status: "error", message: t.upload.invalidUrl }, ...prev]);
      return;
    }

    setUrlBusy(true);
    setResults((prev) => [{ name: url, status: "uploading" }, ...prev]);
    setUrlValue("");

    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.toString() }),
      });
      const data = await res.json();

      setResults((prev) =>
        prev.map((r) =>
          r.name === url && r.status === "uploading"
            ? res.ok
              ? { ...r, status: "done", url: data.url }
              : { ...r, status: "error", message: data.message }
            : r
        )
      );
    } catch {
      setResults((prev) =>
        prev.map((r) => (r.name === url && r.status === "uploading" ? { ...r, status: "error", message: "Network error" } : r))
      );
    }
    setUrlBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.upload.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.upload.subtitle}</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-8 text-center transition sm:p-16",
          dragging ? "border-white/40 bg-white/[0.04]" : "border-white/15 bg-white/[0.02]"
        )}
      >
        <Upload className="text-muted-foreground" size={28} />
        <p className="font-medium text-white">{t.upload.dropzone}</p>
        <p className="text-sm text-white/30">{t.upload.dropzoneHint}</p>
        <p className="text-xs text-white/20">{t.upload.maxSize}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wide text-white/25">{t.upload.orDivider}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={uploadFromUrl} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder={t.upload.urlPlaceholder}
            className="h-10 pl-9"
          />
        </div>
        <Button type="submit" variant="outline" disabled={urlBusy || !urlValue.trim()}>
          {t.upload.addFromUrl}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r, i) => (
            <Card key={i} className="flex-col items-start justify-between gap-2 p-4 text-sm sm:flex-row sm:items-center">
              <span className="min-w-0 truncate text-white/70">{r.name}</span>
              {r.status === "uploading" && <span className="text-muted-foreground">{t.upload.uploading}</span>}
              {r.status === "error" && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <X size={15} />
                  {r.message || "Error"}
                </span>
              )}
              {r.status === "done" && r.url && (
                <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate text-emerald-400 hover:underline"
                  >
                    {r.url}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url!)}
                    className="shrink-0 text-white/40 hover:text-white"
                    title="Copy"
                  >
                    <Copy size={15} />
                  </button>
                  <QrCodeButton
                    url={r.url}
                    fileName={r.name}
                    t={t}
                    variant="ghost"
                    iconSize={15}
                    className="size-7 shrink-0 text-white/40 hover:text-white"
                  />
                  <Check size={15} className="shrink-0 text-emerald-400" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
