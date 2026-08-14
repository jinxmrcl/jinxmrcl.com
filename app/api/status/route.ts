import { NextResponse } from "next/server";
import { getHealthHistory, todayKey, listOpenIncidents, listRecentIncidents, type HealthStatus } from "@/lib/db";
import { runHealthChecks, SERVICES } from "@/lib/health";

const HISTORY_DAYS = 90;
const SEVERITY_RANK: Record<HealthStatus, number> = { operational: 0, degraded: 1, down: 2 };

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  await runHealthChecks();

  const today = todayKey();
  const dayKeys: string[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) dayKeys.push(dateNDaysAgo(i));

  const [openIncidents, recentIncidents] = await Promise.all([listOpenIncidents(), listRecentIncidents(10)]);

  const services = await Promise.all(
    SERVICES.map(async (name) => {
      const history = await getHealthHistory(name, HISTORY_DAYS);
      const byDate = new Map(history.map((h) => [h.date, h.status]));
      const filledHistory = dayKeys.map((date) => ({ date, status: byDate.get(date) ?? null }));

      const known = filledHistory.filter((h) => h.status !== null);
      const operationalDays = known.filter((h) => h.status === "operational").length;
      const uptimePercent = known.length > 0 ? (operationalDays / known.length) * 100 : 100;

      let currentStatus: HealthStatus = byDate.get(today) ?? "operational";

      for (const incident of openIncidents) {
        if (incident.service !== null && incident.service !== name) continue;
        if (SEVERITY_RANK[incident.severity] > SEVERITY_RANK[currentStatus]) {
          currentStatus = incident.severity;
        }
      }

      return {
        name,
        status: currentStatus,
        uptimePercent,
        history: filledHistory,
      };
    })
  );

  let overall: HealthStatus = "operational";
  for (const service of services) {
    if (SEVERITY_RANK[service.status] > SEVERITY_RANK[overall]) overall = service.status;
  }
  for (const incident of openIncidents) {
    if (SEVERITY_RANK[incident.severity] > SEVERITY_RANK[overall]) overall = incident.severity;
  }

  return NextResponse.json({
    services,
    rangeStart: dayKeys[0],
    rangeEnd: dayKeys[dayKeys.length - 1],
    overall,
    incidents: {
      open: openIncidents,
      recent: recentIncidents,
    },
  });
}
