"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Ban, X, ExternalLink } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import type { FileRecord, ReportRecord } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DURATIONS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

export function ReportCard({
  report,
  t,
}: {
  report: ReportRecord & { file: FileRecord | null };
  t: Dictionary;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [banning, setBanning] = useState(false);
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState<number | null>(null);

  async function resolve() {
    await fetch("/api/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id }),
    });
    router.refresh();
  }

  async function dismiss() {
    setBusy(true);
    await resolve();
    setBusy(false);
  }

  async function deleteFile() {
    if (!report.file) return;
    setBusy(true);
    await fetch("/api/staff/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: report.file.id }),
    });
    await resolve();
    setBusy(false);
  }

  async function ban() {
    if (!report.file) return;
    setBusy(true);
    await fetch("/api/staff/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: report.file.uploader, reason, durationHours: hours }),
    });
    await resolve();
    setBusy(false);
    setBanning(false);
  }

  const isImage = report.file?.mime.startsWith("image/");

  return (
    <Card className="flex-row gap-3 p-4 sm:gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black sm:h-24 sm:w-24">
        {report.file && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/raw/${report.file.stored_name}`} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-white/20">
            {report.file ? report.file.mime.split("/")[0] : t.reports.fileDeleted}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-white">
              {report.file?.original_name || t.reports.fileDeleted}
            </p>
            {report.file && (
              <p className="text-[12px] text-muted-foreground">
                {formatBytes(report.file.size)} · <span className="text-white/60">{report.file.uploader}</span>
              </p>
            )}
          </div>
          {report.file && (
            <a
              href={`/${report.file.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-white"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        <div className="mt-2 rounded-lg bg-black/30 p-2.5 text-[13px] text-white/70">{report.reason}</div>
        <p className="mt-1 text-[11px] text-white/30">
          {t.reports.reported} {formatDate(report.created_at)}
          {report.reporter_username
            ? ` ${t.reports.reportedBy} ${report.reporter_username}`
            : report.reporter_ip
              ? ` ${t.reports.reportedByIp} ${report.reporter_ip}`
              : ""}
        </p>

        {banning ? (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-black/30 p-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.users.banReason}
              rows={2}
              className="resize-none text-[12px]"
            />
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setHours(d.hours)}
                  className={`rounded-lg border px-2 py-1 text-[11px] transition ${
                    hours === d.hours ? "border-white/30 bg-white/10 text-white" : "border-border text-muted-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
              <button
                onClick={() => setHours(null)}
                className={`rounded-lg border px-2 py-1 text-[11px] transition ${
                  hours === null ? "border-white/30 bg-white/10 text-white" : "border-border text-muted-foreground"
                }`}
              >
                {t.ban.permanent}
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={ban}
                disabled={busy || reason.trim().length < 3}
                className="flex-1"
              >
                {t.reports.confirmBan}
              </Button>
              <Button variant="outline" onClick={() => setBanning(false)}>
                {t.users.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            {report.file && (
              <Button variant="outline" size="sm" onClick={deleteFile} disabled={busy}>
                <Trash2 size={13} /> {t.reports.deleteFile}
              </Button>
            )}
            {report.file && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanning(true)}
                disabled={busy}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Ban size={13} /> {t.reports.banUser}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={dismiss} disabled={busy} className="ml-auto text-muted-foreground">
              <X size={13} /> {t.reports.dismiss}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
