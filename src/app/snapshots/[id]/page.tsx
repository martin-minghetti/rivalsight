import { db } from "@/lib/db";
import { snapshots, watchTargets, competitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import SourceModeBadge from "@/components/SourceModeBadge";
import Image from "next/image";

export default async function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rows = await db
    .select({
      id: snapshots.id,
      sourceMode: snapshots.sourceMode,
      isBaseline: snapshots.isBaseline,
      screenshotPath: snapshots.screenshotPath,
      extractedData: snapshots.extractedData,
      status: snapshots.status,
      errorMessage: snapshots.errorMessage,
      createdAt: snapshots.createdAt,
      targetLabel: watchTargets.label,
      targetUrl: watchTargets.url,
      competitorName: competitors.name,
      competitorId: competitors.id,
    })
    .from(snapshots)
    .leftJoin(watchTargets, eq(snapshots.targetId, watchTargets.id))
    .leftJoin(competitors, eq(watchTargets.competitorId, competitors.id))
    .where(eq(snapshots.id, id))
    .limit(1);

  const snapshot = rows[0];
  if (!snapshot) notFound();

  let parsedData: unknown = null;
  if (snapshot.extractedData) {
    try {
      parsedData = JSON.parse(snapshot.extractedData);
    } catch {
      parsedData = snapshot.extractedData;
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      {snapshot.competitorId && (
        <Link
          href={`/competitors/${snapshot.competitorId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to {snapshot.competitorName ?? "Competitor"}
        </Link>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">
              {snapshot.competitorName ?? "—"} · {snapshot.targetLabel ?? "—"}
            </h1>
            {snapshot.targetUrl && (
              <p className="text-xs text-gray-400 mt-1 truncate">{snapshot.targetUrl}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SourceModeBadge mode={snapshot.sourceMode} />
            {snapshot.isBaseline === 1 && (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                baseline
              </span>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Captured {snapshot.createdAt.slice(0, 16).replace("T", " ")}
        </p>
        {snapshot.errorMessage && (
          <p className="mt-2 text-sm text-red-600">{snapshot.errorMessage}</p>
        )}
      </div>

      {/* Screenshot */}
      {snapshot.screenshotPath && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Screenshot</h2>
          </div>
          <div className="p-4">
            <Image
              src={snapshot.screenshotPath}
              alt="Page screenshot"
              width={1280}
              height={800}
              className="w-full rounded border border-gray-100"
            />
          </div>
        </div>
      )}

      {/* Extracted Data */}
      {parsedData !== null && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Extracted Data</h2>
          </div>
          <div className="p-4">
            <pre className="text-xs text-gray-700 bg-gray-50 rounded p-4 overflow-auto max-h-96 whitespace-pre-wrap break-words">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
