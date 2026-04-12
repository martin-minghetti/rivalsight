import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitorRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(monitorRuns)
    .orderBy(desc(monitorRuns.startedAt))
    .limit(50);

  return NextResponse.json(rows);
}
