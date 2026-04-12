import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alerts, competitors } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unread = searchParams.get("unread");
  const threatLevel = searchParams.get("threatLevel");

  const conditions = [];
  if (unread === "true") conditions.push(eq(alerts.isRead, 0));
  if (threatLevel) conditions.push(eq(alerts.threatLevel, threatLevel));

  const rows = await db
    .select({
      id: alerts.id,
      changeId: alerts.changeId,
      competitorId: alerts.competitorId,
      title: alerts.title,
      threatLevel: alerts.threatLevel,
      impactType: alerts.impactType,
      isRead: alerts.isRead,
      createdAt: alerts.createdAt,
      competitorName: competitors.name,
    })
    .from(alerts)
    .leftJoin(competitors, eq(alerts.competitorId, competitors.id))
    .where(conditions.length > 0 ? and(...(conditions as [typeof conditions[0], ...typeof conditions])) : undefined)
    .orderBy(desc(alerts.createdAt))
    .limit(100);

  return NextResponse.json(rows);
}

export async function POST() {
  await db
    .update(alerts)
    .set({ isRead: 1 })
    .where(eq(alerts.isRead, 0));

  return NextResponse.json({ ok: true });
}
