"use client";

import { useCallback, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { QrCode, Download, Copy, Check } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function resolveUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function QrCodeButton({
  url,
  fileName,
  t,
  variant = "secondary",
  className,
  iconSize = 16,
}: {
  url: string;
  fileName?: string;
  t: Dictionary;
  variant?: "secondary" | "ghost" | "outline";
  className?: string;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<QRCodeStyling | null>(null);

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      qrRef.current = new QRCodeStyling({
        width: 260,
        height: 260,
        type: "svg",
        data: resolveUrl(url),
        margin: 12,
        qrOptions: { errorCorrectionLevel: "H" },
        dotsOptions: { type: "extra-rounded", color: "#000000", roundSize: false },
        cornersSquareOptions: { type: "dot", color: "#000000" },
        cornersDotOptions: { type: "dot", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
      });
      qrRef.current.append(node);
    },
    [url]
  );

  function handleDownload() {
    qrRef.current?.download({ name: fileName ? `qr-${fileName}` : "qr-code", extension: "png" });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(resolveUrl(url));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={variant}
        size="icon"
        onClick={() => setOpen(true)}
        title={t.qr.button}
        className={cn("rounded-full", className)}
      >
        <QrCode size={iconSize} />
      </Button>

      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{t.qr.title}</DialogTitle>
          <DialogDescription>{t.qr.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center rounded-2xl bg-white p-4 shadow-inner">
          <div ref={setContainerRef} />
        </div>

        <p className="truncate text-center text-xs text-white/40">{resolveUrl(url)}</p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? t.qr.copied : t.qr.copyLink}
          </Button>
          <Button className="flex-1" onClick={handleDownload}>
            <Download size={15} />
            {t.qr.download}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
