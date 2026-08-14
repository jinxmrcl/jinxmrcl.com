"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    iFrameResize?: (options: { log: boolean; checkOrigin: boolean }, selector: string) => void;
  }
}

export function DownloaderWidget({ siteUrl }: { siteUrl: string }) {
  const [loaded, setLoaded] = useState(false);

  const cssParam = siteUrl ? `?css=${encodeURIComponent(`${siteUrl}/downloader-widget.css`)}` : "";
  const src = `https://p.savenow.to/api/widget${cssParam}`;

  return (
    <Card className="p-4">
      <div className="relative">
        {!loaded && (
          <div className="flex h-[120px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        <iframe
          id="widgetApiIframe"
          title="Video Downloader"
          width="100%"
          height="120"
          allowTransparency
          scrolling="no"
          style={{ border: "none", display: loaded ? "block" : "none" }}
          src={src}
          onLoad={() => {
            setLoaded(true);
            window.iFrameResize?.({ log: false, checkOrigin: false }, "#widgetApiIframe");
          }}
        />
      </div>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => window.iFrameResize?.({ log: false, checkOrigin: false }, "#widgetApiIframe")}
      />
    </Card>
  );
}
