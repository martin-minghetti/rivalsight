import { db } from "@/lib/db";
import { monitorRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    running: "bg-yellow-100 text-yellow-800",
  };
  const colors = colorMap[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {status}
    </span>
  );
}

function TriggerBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    manual: "bg-blue-100 text-blue-800",
    scheduled: "bg-purple-100 text-purple-800",
  };
  const colors = colorMap[type] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {type}
    </span>
  );
}

export default async function RunsPage() {
  const runs = await db
    .select()
    .from(monitorRuns)
    .orderBy(desc(monitorRuns.startedAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Monitor Runs</h1>
      <p className="text-sm text-gray-500 mt-1">History of every monitoring run — manual or scheduled. Each run snapshots all active targets, extracts structured data, and diffs against the previous snapshot. "Skipped" means the page hadn't changed (same HTML hash), saving an API call. Runs with zero changes mean your competitors are quiet — which is useful signal too.</p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {runs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No runs yet. Trigger the monitor from the dashboard.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Trigger</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Checked</th>
                <th className="px-6 py-3 text-left">Skipped</th>
                <th className="px-6 py-3 text-left">Changes</th>
                <th className="px-6 py-3 text-left">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600">
                    {run.startedAt.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-6 py-3">
                    <TriggerBadge type={run.triggerType} />
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-6 py-3 text-gray-600">{run.targetsChecked}</td>
                  <td className="px-6 py-3 text-gray-600">{run.targetsSkipped}</td>
                  <td className="px-6 py-3 text-gray-600">{run.changesFound}</td>
                  <td className="px-6 py-3 text-gray-600">{run.alertsGenerated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
