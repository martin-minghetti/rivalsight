import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { snapshots, watchTargets, competitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await db
    .select({
      id: snapshots.id,
      targetId: snapshots.targetId,
      runId: snapshots.runId,
      htmlHash: snapshots.htmlHash,
      extractedData: snapshots.extractedData,
      sourceMode: snapshots.sourceMode,
      isBaseline: snapshots.isBaseline,
      screenshotPath: snapshots.screenshotPath,
      status: snapshots.status,
      errorMessage: snapshots.errorMessage,
      createdAt: snapshots.createdAt,
      targetLabel: watchTargets.label,
      competitorName: competitors.name,
    })
    .from(snapshots)
    .leftJoin(watchTargets, eq(snapshots.targetId, watchTargets.id))
    .leftJoin(competitors, eq(watchTargets.competitorId, competitors.id))
    .where(eq(snapshots.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
