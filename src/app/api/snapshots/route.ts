import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { snapshots } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");

  if (!targetId) {
    return NextResponse.json({ error: "targetId is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.targetId, targetId))
    .orderBy(desc(snapshots.createdAt));

  return NextResponse.json(rows);
}
