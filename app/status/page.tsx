import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/app/language-switcher";
import { StatusView } from "@/app/status/status-view";

export const dynamic = "force-dynamic";

const siteName = process.env.SITE_NAME || "jinxmrcl";

export default async function StatusPage() {
  const { locale, t } = await getDictionary();

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] font-medium text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={14} /> {t.status.backToHome}
        </Link>
        <LanguageSwitcher locale={locale} labels={{ en: t.language.en, de: t.language.de }} />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
          {siteName} {t.status.title}
        </h1>
        <p className="max-w-md text-sm text-white/40">{t.status.subtitle}</p>
      </div>

      <div className="w-full max-w-2xl">
        <StatusView
          labels={{
            operational: t.status.operational,
            degraded: t.status.degraded,
            down: t.status.down,
            uptime: t.status.uptime,
            hoverHint: t.status.hoverHint,
            noData: t.status.noData,
            allOperational: t.home.allSystemsNormal,
            lastUpdated: t.status.lastUpdated,
            activeIncidents: t.status.activeIncidents,
            pastIncidents: t.status.pastIncidents,
            resolved: t.status.resolved,
          }}
        />
      </div>
    </main>
  );
}
