import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitors, watchTargets } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeFilter = searchParams.get("active");

  const targetCountSq = db
    .select({
      competitorId: watchTargets.competitorId,
      count: sql<number>`count(*)`.as("target_count"),
    })
    .from(watchTargets)
    .groupBy(watchTargets.competitorId)
    .as("target_counts");

  let query = db
    .select({
      id: competitors.id,
      name: competitors.name,
      category: competitors.category,
      notes: competitors.notes,
      isActive: competitors.isActive,
      createdAt: competitors.createdAt,
      targetCount: sql<number>`coalesce(${targetCountSq.count}, 0)`,
    })
    .from(competitors)
    .leftJoin(targetCountSq, eq(competitors.id, targetCountSq.competitorId))
    .orderBy(competitors.name)
    .$dynamic();

  if (activeFilter === "true") {
    query = query.where(eq(competitors.isActive, 1));
  }

  const rows = await query;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, notes } = body;

  if (!name || !category) {
    return NextResponse.json({ error: "name and category are required" }, { status: 400 });
  }

  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(competitors).values({
    id,
    name,
    category,
    notes: notes ?? null,
    isActive: 1,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
