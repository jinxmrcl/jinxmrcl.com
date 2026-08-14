"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function SubdomainCard({ url, t }: { url: string; t: Dictionary }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{t.settings.subdomain}</p>
        <p className="truncate text-[13px] text-white/70">{url}</p>
        <p className="text-[12px] text-white/30">{t.settings.subdomainHint}</p>
      </div>
      <Button variant="outline" size="icon" onClick={copy} title={t.settings.copy} className="shrink-0">
        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
      </Button>
    </div>
  );
}
