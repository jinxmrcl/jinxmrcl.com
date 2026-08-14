"use client";

import { useState } from "react";
import { Check, Loader2, ImageIcon } from "lucide-react";
import type { EmbedSettings } from "@/lib/db";
import { renderEmbedTemplate } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EXAMPLE_VARS = {
  filename: "screenshot.png",
  size: "2.41MB",
  uploader: "someone",
};

export function EmbedForm({
  initial,
  username,
  t,
}: {
  initial: EmbedSettings;
  username: string;
  t: Dictionary;
}) {
  const [settings, setSettings] = useState<EmbedSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof EmbedSettings>(key: K, value: EmbedSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/dashboard/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const vars = {
    filename: EXAMPLE_VARS.filename,
    size: EXAMPLE_VARS.size,
    uploader: username || EXAMPLE_VARS.uploader,
    site: settings.siteName,
  };

  const title = renderEmbedTemplate(settings.titleTemplate || "{filename}", vars);
  const description = renderEmbedTemplate(settings.descriptionTemplate || "", vars);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="embed-color">{t.embed.color}</Label>
          <div className="flex items-center gap-2">
            <input
              id="embed-color"
              type="color"
              value={settings.color}
              onChange={(e) => update("color", e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-black/40 p-1"
            />
            <Input
              type="text"
              value={settings.color}
              onChange={(e) => update("color", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="embed-site-name">{t.embed.siteName}</Label>
          <Input
            id="embed-site-name"
            type="text"
            value={settings.siteName}
            onChange={(e) => update("siteName", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="embed-title">{t.embed.titleLabel}</Label>
          <Input
            id="embed-title"
            type="text"
            value={settings.titleTemplate}
            onChange={(e) => update("titleTemplate", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="embed-description">{t.embed.description}</Label>
          <Input
            id="embed-description"
            type="text"
            value={settings.descriptionTemplate}
            onChange={(e) => update("descriptionTemplate", e.target.value)}
          />
        </div>

        <p className="text-[12px] text-muted-foreground">{t.embed.placeholderHint}</p>

        <Button onClick={save} disabled={saving} className="mt-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saving ? t.embed.saving : saved ? t.embed.saved : t.embed.save}
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-muted-foreground">{t.embed.preview}</p>
        <div className="rounded-2xl bg-[#313338] p-6">
          <div
            className="max-w-md rounded-[3px] border-l-4 bg-[#2b2d31] p-4"
            style={{ borderColor: settings.color }}
          >
            <p className="text-[13px] font-semibold text-white/50">{settings.siteName}</p>
            <p className="mt-0.5 text-[15px] font-semibold text-white">{title || " "}</p>
            {description && <p className="mt-1 text-[13px] leading-snug text-white/70">{description}</p>}
            <div
              className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-lg"
              style={{ maxWidth: 320, background: "linear-gradient(135deg, #3a3d44, #202225)" }}
            >
              <ImageIcon size={32} className="text-white/25" />
            </div>
          </div>
        </div>
        <p className="text-[12px] text-white/25">
          {t.embed.previewNote.replace("{filename}", EXAMPLE_VARS.filename)}
        </p>
      </div>
    </div>
  );
}
