"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const SERVICES = ["Website", "Database", "Upload API", "Image Delivery"] as const;

export function IncidentForm({ t }: { t: Dictionary }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"degraded" | "down">("degraded");
  const [service, setService] = useState<string>("__all__");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSending(true);
    setError(null);

    const res = await fetch("/api/staff/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        severity,
        service: service === "__all__" ? null : service,
      }),
    });

    if (res.ok) {
      setTitle("");
      setMessage("");
      setSeverity("degraded");
      setService("__all__");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({ message: "Error" }));
      setError(data.message || "Error");
    }
    setSending(false);
  }

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <p className="text-[15px] font-medium text-white">{t.incidents.createTitle}</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="incident-title">{t.incidents.titleLabel}</Label>
        <Input
          id="incident-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.incidents.titlePlaceholder}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="incident-message">{t.incidents.messageLabel}</Label>
        <Textarea
          id="incident-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.incidents.messagePlaceholder}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>{t.incidents.severityLabel}</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as "degraded" | "down")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="degraded">{t.status.degraded}</SelectItem>
              <SelectItem value="down">{t.status.down}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t.incidents.serviceLabel}</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t.incidents.allServices}</SelectItem>
              {SERVICES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-[13px] text-red-400">{error}</p>}

      <Button onClick={submit} disabled={sending || title.trim().length < 3 || message.trim().length < 3}>
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {t.incidents.create}
      </Button>
    </Card>
  );
}
