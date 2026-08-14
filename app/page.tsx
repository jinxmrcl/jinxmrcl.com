import Link from "next/link";
import { getStats } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import "@/lib/health";
import { StatsBar } from "@/app/status-panel";
import { StatusBadge } from "@/app/status/status-badge";
import { TabTitleTypewriter } from "@/app/tab-title";
import { LanguageSwitcher } from "@/app/language-switcher";

export const dynamic = "force-dynamic";

const siteName = process.env.SITE_NAME || "jinxmrcl";

export default async function Home() {
  const [stats, user, { locale, t }] = await Promise.all([getStats(), getCurrentUser(), getDictionary()]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:gap-10 sm:px-6 sm:py-16">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher locale={locale} labels={{ en: t.language.en, de: t.language.de }} />
        <Link
          href={user ? "/dashboard" : "/login"}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-[13px]"
        >
          {user ? t.home.dashboard : t.home.login}
        </Link>
      </div>

      <TabTitleTypewriter text={siteName} />
      <h1 className="break-all text-[15vw] font-bold uppercase leading-none tracking-tight text-white sm:text-[64px] md:text-[72px]">
        {siteName}
      </h1>

      <StatsBar
        initial={{ count: stats.count, totalSizeMB: stats.totalSize / (1024 * 1024) }}
        labels={{ uploads: t.overview.uploads, mbUsed: t.home.mbUsed }}
      />

      <StatusBadge
        labels={{
          allOperational: t.home.allSystemsNormal,
          degraded: t.status.degraded,
          down: t.status.down,
        }}
      />
    </main>
  );
}
