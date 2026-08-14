import { listOpenReports } from "@/lib/db";
import { requireRole } from "@/lib/roles";
import { getDictionary } from "@/lib/i18n";
import { ReportCard } from "@/app/dashboard/reports/report-card";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole("staff");
  const reports = await listOpenReports();
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.reports.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.reports.subtitle}</p>
      </div>

      {reports.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">{t.reports.noReports}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
