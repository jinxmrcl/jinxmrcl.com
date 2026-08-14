import { getDictionary } from "@/lib/i18n";
import { DownloaderWidget } from "@/app/dashboard/downloader/widget";

const siteUrl = process.env.SITE_URL || "";

export default async function DownloaderPage() {
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.downloader.title}</h1>
        <p className="mt-1 text-sm text-white/40">{t.downloader.subtitle}</p>
      </div>

      <DownloaderWidget siteUrl={siteUrl} />
    </div>
  );
}
