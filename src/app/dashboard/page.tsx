import { db } from "@/lib/db";
import { competitors, watchTargets, changes, alerts, appSettings } from "@/lib/db/schema";
import { eq, gte, desc, sql } from "drizzle-orm";
import StatCard from "@/components/StatCard";
import DemoBanner from "@/components/DemoBanner";
import ThreatBadge from "@/components/ThreatBadge";
import ImpactIcon from "@/components/ImpactIcon";
import TrendChart from "@/components/TrendChart";
import RunMonitorButton from "@/components/RunMonitorButton";

export default async function DashboardPage() {
  // --- Stats ---
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeCompetitors, activeTargets, changesThisWeek, unreadAlerts] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(competitors)
        .where(eq(competitors.isActive, 1)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(watchTargets)
        .where(eq(watchTargets.isActive, 1)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(changes)
        .where(gte(changes.createdAt, sevenDaysAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(alerts)
        .where(eq(alerts.isRead, 0)),
    ]);

  // --- Recent alerts joined with competitors ---
  const recentAlerts = await db
    .select({
      id: alerts.id,
      title: alerts.title,
      threatLevel: alerts.threatLevel,
      impactType: alerts.impactType,
      isRead: alerts.isRead,
      createdAt: alerts.createdAt,
      competitorName: competitors.name,
    })
    .from(alerts)
    .leftJoin(competitors, eq(alerts.competitorId, competitors.id))
    .orderBy(desc(alerts.createdAt))
    .limit(10);

  // --- Trend data: changes grouped by date and threatLevel (last 30 days) ---
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const rawTrend = await db
    .select({
      date: sql<string>`date(${changes.createdAt})`,
      threatLevel: changes.threatLevel,
      count: sql<number>`count(*)`,
    })
    .from(changes)
    .where(gte(changes.createdAt, thirtyDaysAgo))
    .groupBy(sql`date(${changes.createdAt})`, changes.threatLevel)
    .orderBy(sql`date(${changes.createdAt})`);

  // Build 30-day array filled with zeros
  const trendMap = new Map<string, { critical: number; high: number; medium: number; low: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, { critical: 0, high: 0, medium: 0, low: 0 });
  }
  for (const row of rawTrend) {
    const entry = trendMap.get(row.date);
    if (entry && row.threatLevel in entry) {
      (entry as Record<string, number>)[row.threatLevel] = row.count;
    }
  }
  const trendData = Array.from(trendMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  // --- Demo mode check ---
  const apiKeySetting = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, "anthropic_api_key"),
  });
  const isDemoMode = !apiKeySetting?.value && !process.env.ANTHROPIC_API_KEY;

  return (
    <div className="space-y-6">
      {isDemoMode && <DemoBanner />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of competitor activity, threat trends, and unread alerts. The stat cards show your current monitoring scope, the chart tracks change volume over the last 30 days colored by severity, and the table below surfaces the most recent alerts so you can spot critical moves immediately.</p>
        </div>
        <RunMonitorButton />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Competitors"
          value={activeCompetitors[0]?.count ?? 0}
        />
        <StatCard
          label="Watch Targets"
          value={activeTargets[0]?.count ?? 0}
          sublabel="active"
        />
        <StatCard
          label="Changes This Week"
          value={changesThisWeek[0]?.count ?? 0}
        />
        <StatCard
          label="Unread Alerts"
          value={unreadAlerts[0]?.count ?? 0}
        />
      </div>

      {/* Trend chart */}
      <TrendChart data={trendData} />

      {/* Recent alerts table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Recent Alerts</h2>
        </div>
        {recentAlerts.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No alerts yet. Run the monitor to start tracking changes.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Alert</th>
                <th className="px-6 py-3 text-left">Competitor</th>
                <th className="px-6 py-3 text-left">Threat</th>
                <th className="px-6 py-3 text-left">Impact</th>
                <th className="px-6 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={alert.isRead ? "text-gray-500" : "text-gray-900 font-medium"}
                >
                  <td className="px-6 py-3">{alert.title}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {alert.competitorName ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    <ThreatBadge level={alert.threatLevel} />
                  </td>
                  <td className="px-6 py-3">
                    <ImpactIcon type={alert.impactType} />
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {alert.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
