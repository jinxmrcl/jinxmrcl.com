import { listPendingAppeals, getBanInfo } from "@/lib/db";
import { requireRole } from "@/lib/roles";
import { getDictionary } from "@/lib/i18n";
import { AppealCard } from "@/app/dashboard/appeals/appeal-card";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AppealsPage() {
  await requireRole("staff");
  const appeals = await listPendingAppeals();
  const withBanInfo = await Promise.all(
    appeals.map(async (a) => ({ appeal: a, ban: await getBanInfo(a.username) }))
  );
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.appeals.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.appeals.subtitle}</p>
      </div>

      {withBanInfo.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">{t.appeals.noAppeals}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {withBanInfo.map(({ appeal, ban }) => (
            <AppealCard key={appeal.id} appeal={appeal} ban={ban} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
