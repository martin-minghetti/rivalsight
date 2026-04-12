import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changes, competitors, watchTargets } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitorId = searchParams.get("competitorId");
  const category = searchParams.get("category");
  const threatLevel = searchParams.get("threatLevel");
  const impactType = searchParams.get("impactType");

  const conditions = [];
  if (competitorId) conditions.push(eq(changes.competitorId, competitorId));
  if (category) conditions.push(eq(changes.category, category));
  if (threatLevel) conditions.push(eq(changes.threatLevel, threatLevel));
  if (impactType) conditions.push(eq(changes.impactType, impactType));

  const rows = await db
    .select({
      id: changes.id,
      targetId: changes.targetId,
      competitorId: changes.competitorId,
      snapshotId: changes.snapshotId,
      runId: changes.runId,
      category: changes.category,
      field: changes.field,
      oldValue: changes.oldValue,
      newValue: changes.newValue,
      threatLevel: changes.threatLevel,
      impactType: changes.impactType,
      changeFingerprint: changes.changeFingerprint,
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

  return NextResponse.json(rows);
}
