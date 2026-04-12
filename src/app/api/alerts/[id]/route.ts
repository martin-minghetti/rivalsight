import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db
    .update(alerts)
    .set({ isRead: 1 })
    .where(eq(alerts.id, id));

  return NextResponse.json({ ok: true });
}
