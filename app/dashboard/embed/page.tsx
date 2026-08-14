import { getEmbedSettings } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { EmbedForm } from "@/app/dashboard/embed/form";

export const dynamic = "force-dynamic";

export default async function EmbedPage() {
  const user = await getCurrentUser();
  const settings = user ? await getEmbedSettings(user) : null;
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.embed.title}</h1>
        <p className="mt-1 text-sm text-white/40">{t.embed.subtitle}</p>
      </div>

      {settings && user && <EmbedForm initial={settings} username={user} t={t} />}
    </div>
  );
}
