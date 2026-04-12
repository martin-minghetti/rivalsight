import { db } from "@/lib/db";
import { competitors, watchTargets, changes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import ThreatBadge from "@/components/ThreatBadge";
import ImpactIcon from "@/components/ImpactIcon";

export default async function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const competitor = await db.query.competitors.findFirst({
    where: eq(competitors.id, id),
  });

  if (!competitor) notFound();

  const targets = await db
    .select()
    .from(watchTargets)
    .where(eq(watchTargets.competitorId, id))
    .orderBy(watchTargets.label);

  const recentChanges = await db
    .select({
      id: changes.id,
      category: changes.category,
      field: changes.field,
      threatLevel: changes.threatLevel,
      impactType: changes.impactType,
      createdAt: changes.createdAt,
      targetLabel: watchTargets.label,
    })
    .from(changes)
    .leftJoin(watchTargets, eq(changes.targetId, watchTargets.id))
    .where(eq(changes.competitorId, id))
    .orderBy(desc(changes.createdAt))
    .limit(50);

  const pageTypeColors: Record<string, string> = {
    pricing: "bg-indigo-100 text-indigo-800",
    features: "bg-indigo-100 text-indigo-800",
    changelog: "bg-indigo-100 text-indigo-800",
    blog: "bg-indigo-100 text-indigo-800",
    homepage: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/competitors" className="text-sm text-blue-600 hover:underline">
        ← Back to Competitors
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{competitor.name}</h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">{competitor.category}</p>
          </div>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              competitor.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {competitor.isActive ? "active" : "paused"}
          </span>
        </div>
        {competitor.notes && (
          <p className="mt-3 text-sm text-gray-600">{competitor.notes}</p>
        )}
      </div>

      {/* Watch Targets */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Watch Targets</h2>
        </div>
        {targets.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No watch targets configured.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {targets.map((target) => (
              <li key={target.id} className="px-6 py-4 flex items-center gap-4">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    pageTypeColors[target.pageType] ?? "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  {target.pageType}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{target.label}</p>
                  <p className="text-xs text-gray-400 truncate">{target.url}</p>
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    target.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {target.isActive ? "active" : "paused"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Change Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Change Timeline</h2>
        </div>
        {recentChanges.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No changes detected yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentChanges.map((change) => (
              <li key={change.id} className="px-6 py-4 flex items-center gap-4">
                <ImpactIcon type={change.impactType} />
                <ThreatBadge level={change.threatLevel} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{change.targetLabel ?? "—"}</span>
                    <span className="text-gray-500 mx-1">·</span>
                    <span className="text-gray-600 capitalize">{change.category}</span>
                    <span className="text-gray-500 mx-1">·</span>
                    <span className="text-gray-600">{change.field}</span>
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
