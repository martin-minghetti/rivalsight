import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchTargets } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { competitorId, url, pageType, label } = body;

  if (!competitorId || !url || !pageType || !label) {
    return NextResponse.json(
      { error: "competitorId, url, pageType, and label are required" },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(watchTargets).values({
    id,
    competitorId,
    url,
    pageType,
    label,
    isActive: 1,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
