import { requireRole } from "@/lib/roles";
import { listOpenIncidents, listRecentIncidents } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { IncidentForm } from "@/app/dashboard/incidents/incident-form";
import { IncidentList } from "@/app/dashboard/incidents/incident-list";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  await requireRole("owner");
  const [open, recent, { t }] = await Promise.all([
    listOpenIncidents(),
    listRecentIncidents(10),
    getDictionary(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.incidents.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.incidents.subtitle}</p>
      </div>

      <IncidentForm t={t} />
      <IncidentList open={open} recent={recent} t={t} />
    </div>
  );
}
