import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const VALID_KEYS = ["anthropic_api_key", "webhook_url", "cron_expression", "cron_enabled"];

function maskApiKey(value: string): string {
  if (value.length <= 14) return "***";
  return value.slice(0, 10) + "..." + value.slice(-4);
}

export async function GET() {
  const rows = await db.select().from(appSettings);

  const result: Record<string, string> = {};
  for (const row of rows) {
    if (row.key === "anthropic_api_key" && row.value) {
      result[row.key] = maskApiKey(row.value);
    } else {
      result[row.key] = row.value;
    }
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  if (!VALID_KEYS.includes(key)) {
    return NextResponse.json(
      { error: `Invalid key. Must be one of: ${VALID_KEYS.join(", ")}` },
      { status: 400 }
    );
  }

  // If setting API key, validate it with a minimal Claude API call
  if (key === "anthropic_api_key") {
    try {
      const client = new Anthropic({ apiKey: value });
      await client.messages.create({
        model: "claude-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
    } catch {
      return NextResponse.json({ error: "Invalid Anthropic API key" }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: now },
    });

  return NextResponse.json({ ok: true });
}
