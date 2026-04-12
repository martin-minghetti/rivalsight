import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitors, watchTargets, changes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const competitor = await db.query.competitors.findFirst({
    where: eq(competitors.id, id),
  });

  if (!competitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const targets = await db
    .select()
    .from(watchTargets)
    .where(eq(watchTargets.competitorId, id));

  const recentChanges = await db
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
      targetLabel: watchTargets.label,
    })
    .from(changes)
    .leftJoin(watchTargets, eq(changes.targetId, watchTargets.id))
    .where(eq(changes.competitorId, id))
    .orderBy(desc(changes.createdAt))
    .limit(50);

  return NextResponse.json({ ...competitor, targets, recentChanges });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const allowedFields: Record<string, unknown> = {};
  if (body.name !== undefined) allowedFields.name = body.name;
  if (body.category !== undefined) allowedFields.category = body.category;
  if (body.notes !== undefined) allowedFields.notes = body.notes;
  if (body.isActive !== undefined) allowedFields.isActive = body.isActive;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db.update(competitors).set(allowedFields).where(eq(competitors.id, id));

  return NextResponse.json({ ok: true });
}
