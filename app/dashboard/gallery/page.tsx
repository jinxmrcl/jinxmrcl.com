import { listFilesByOwner } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { GalleryGrid } from "@/app/dashboard/gallery/grid";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const user = await getCurrentUser();
  const files = user ? await listFilesByOwner(user) : [];
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.gallery.title}</h1>
        <p className="mt-1 text-sm text-white/40">{t.gallery.subtitle}</p>
      </div>

      <GalleryGrid initial={files} t={t} />
    </div>
  );
}
