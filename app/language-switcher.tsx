"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Locale } from "@/lib/locale-types";
import { cn } from "@/lib/utils";

const FLAGS: Record<Locale, string> = { en: "🇬🇧", de: "🇩🇪" };

export function LanguageSwitcher({
  locale,
  labels,
  className,
}: {
  locale: Locale;
  labels: { en: string; de: string };
  className?: string;
}) {
  const router = useRouter();

  async function change(next: string) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <Select value={locale} onValueChange={change}>
      <SelectTrigger
        size="sm"
        className={cn(
          "gap-1.5 rounded-full border-white/10 bg-white/[0.04] px-2.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white",
          className
        )}
      >
        <Globe size={14} className="text-white/40" />
        <SelectValue>{locale.toUpperCase()}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[10rem]">
        <SelectItem value="en">
          <span className="text-[15px] leading-none">{FLAGS.en}</span> {labels.en}
        </SelectItem>
        <SelectItem value="de">
          <span className="text-[15px] leading-none">{FLAGS.de}</span> {labels.de}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
