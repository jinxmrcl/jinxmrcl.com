"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import type { FileRecord } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StaffFileGrid({ files: initial, t }: { files: FileRecord[]; t: Dictionary }) {
  const [files, setFiles] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/staff/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: id }),
    });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
    setDeletingId(null);
  }

  if (files.length === 0) {
    return (
      <Card className="py-16 text-center text-sm text-muted-foreground">{t.gallery.noUploads}</Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => {
        const isImage = file.mime.startsWith("image/");
        return (
          <Card key={file.id} className="group gap-0 overflow-hidden p-0">
            <div className="relative aspect-square bg-black">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/raw/${file.stored_name}`} alt={file.original_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/20">
                  {file.mime.split("/")[0]}
                </div>
              )}
              <div className="absolute inset-x-0 top-0 flex justify-end gap-1.5 p-2 opacity-0 transition group-hover:opacity-100">
                <Button variant="secondary" size="icon" asChild className="size-8 rounded-full bg-black/70 backdrop-blur">
                  <a href={`/${file.id}`} target="_blank" rel="noopener noreferrer" title={t.gallery.open}>
                    <ExternalLink size={15} />
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  title={t.gallery.delete}
                  className="size-8 rounded-full bg-black/70 text-red-400 backdrop-blur"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <p className="truncate text-[13px] text-white/70">{file.original_name}</p>
              <p className="text-[12px] text-muted-foreground">
                {formatBytes(file.size)} · {formatDate(file.created_at)}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
