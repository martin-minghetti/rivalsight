import { db } from "@/lib/db";
import { changes, competitors, watchTargets } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import ImpactIcon from "@/components/ImpactIcon";
import ThreatBadge from "@/components/ThreatBadge";
import FilterBar from "@/components/FilterBar";
import { Suspense } from "react";

async function getCompetitorOptions() {
  const rows = await db.select({ id: competitors.id, name: competitors.name }).from(competitors).orderBy(competitors.name);
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { competitorId, category, threatLevel, impactType } = sp;

  const conditions = [];
  if (competitorId) conditions.push(eq(changes.competitorId, competitorId));
  if (category) conditions.push(eq(changes.category, category));
  if (threatLevel) conditions.push(eq(changes.threatLevel, threatLevel));
  if (impactType) conditions.push(eq(changes.impactType, impactType));

  const rows = await db
    .select({
      id: changes.id,
      category: changes.category,
      field: changes.field,
      threatLevel: changes.threatLevel,
      impactType: changes.impactType,
      createdAt: changes.createdAt,
      competitorName: competitors.name,
      targetLabel: watchTargets.label,
    })
    .from(changes)
    .leftJoin(competitors, eq(changes.competitorId, competitors.id))
    .leftJoin(watchTargets, eq(changes.targetId, watchTargets.id))
    .where(conditions.length > 0 ? and(...(conditions as [typeof conditions[0], ...typeof conditions])) : undefined)
    .orderBy(desc(changes.createdAt))
    .limit(100);

  const competitorOptions = await getCompetitorOptions();

  const filters = [
    {
      key: "competitorId",
      label: "Competitor",
      options: competitorOptions,
    },
    {
      key: "category",
      label: "Category",
      options: [
        { value: "pricing", label: "Pricing" },
        { value: "features", label: "Features" },
        { value: "positioning", label: "Positioning" },
        { value: "content", label: "Content" },
      ],
    },
    {
      key: "threatLevel",
      label: "Threat",
      options: [
        { value: "critical", label: "Critical" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
    {
      key: "impactType",
      label: "Impact",
      options: [
        { value: "threat", label: "Threat" },
        { value: "opportunity", label: "Opportunity" },
        { value: "info", label: "Info" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Changes</h1>
      <p className="text-sm text-gray-500 mt-1">Chronological feed of every detected change across all competitors. Each entry shows what changed (pricing, features, positioning, or content), the old and new values, and a threat score. Use the filters to narrow by competitor, category, threat level, or impact type — for example, show only critical pricing threats or feature additions.</p>

      <Suspense>
        <FilterBar filters={filters} />
      </Suspense>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No changes found. Run the monitor or adjust filters.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((change) => (
              <li key={change.id} className="px-6 py-4 flex items-center gap-4">
                <ImpactIcon type={change.impactType} />
                <ThreatBadge level={change.threatLevel} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{change.competitorName ?? "—"}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-600">{change.targetLabel ?? "—"}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {change.category} · {change.field}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {change.createdAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
