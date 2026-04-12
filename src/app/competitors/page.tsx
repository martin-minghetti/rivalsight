import { db } from "@/lib/db";
import { competitors, watchTargets, changes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

export default async function CompetitorsPage() {
  const rows = await db
    .select({
      id: competitors.id,
      name: competitors.name,
      category: competitors.category,
      isActive: competitors.isActive,
      targetCount: sql<number>`(
        SELECT count(*) FROM watch_targets WHERE watch_targets.competitor_id = competitors.id
      )`,
      changeCount: sql<number>`(
        SELECT count(*) FROM changes WHERE changes.competitor_id = competitors.id
      )`,
    })
    .from(competitors)
    .orderBy(competitors.name);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Competitors</h1>
      <p className="text-sm text-gray-500 mt-1">Manage the companies you're tracking and their monitored pages.</p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No competitors yet. Add one to start tracking.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Targets</th>
                <th className="px-6 py-3 text-left">Changes</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">
                    <Link
                      href={`/competitors/${row.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600 capitalize">{row.category}</td>
                  <td className="px-6 py-3 text-gray-600">{row.targetCount}</td>
                  <td className="px-6 py-3 text-gray-600">{row.changeCount}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        row.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {row.isActive ? "active" : "paused"}
                    </span>
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
