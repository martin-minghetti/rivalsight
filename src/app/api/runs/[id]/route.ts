import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitorRuns, snapshots, changes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const run = await db.query.monitorRuns.findFirst({
    where: eq(monitorRuns.id, id),
  });

  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const runSnapshots = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.runId, id));

  const runChanges = await db
    .select()
    .from(changes)
    .where(eq(changes.runId, id));

  return NextResponse.json({ ...run, snapshots: runSnapshots, changes: runChanges });
}
