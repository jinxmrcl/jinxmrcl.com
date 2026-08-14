"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff, Download } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ApiKeyCard({ apiKey, t }: { apiKey: string; t: Dictionary }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const masked = "•".repeat(Math.min(apiKey.length, 40));

  return (
    <Card>
      <p className="text-sm text-muted-foreground">{t.overview.apiKey}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-border bg-black/40 px-3 py-2 text-[13px] text-white/80">
          {visible ? apiKey : masked}
        </code>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          title={visible ? t.overview.hideValue : t.overview.show}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </Button>
        <Button variant="outline" size="icon" onClick={copy} title={t.overview.copy}>
          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
        </Button>
      </div>
      <Button variant="outline" asChild className="w-full">
        <a href="/api/dashboard/sharex-config">
          <Download size={15} />
          {t.overview.downloadConfig}
        </a>
      </Button>
    </Card>
  );
}
