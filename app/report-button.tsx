"use client";

import { useState } from "react";
import { Flag, Check } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReportButton({ fileId, t }: { fileId: string; t: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setSending(true);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, reason }),
    });
    if (res.ok) setSent(true);
    setSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setOpen(true)}
        title={t.report.button}
        className="rounded-full"
      >
        <Flag size={16} />
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.report.title}</DialogTitle>
        </DialogHeader>

        {sent ? (
          <p className="flex items-center gap-2 py-4 text-[13px] text-emerald-400">
            <Check size={15} /> {t.report.sent}
          </p>
        ) : (
          <>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.report.placeholder}
              rows={3}
            />
            <Button onClick={submit} disabled={sending || reason.trim().length < 3}>
              {sending ? t.ban.sending : t.report.submit}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
