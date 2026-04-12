import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitors, watchTargets, snapshots, changes, alerts, monitorRuns, appSettings } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { runPipeline, type PipelineDeps, type ActiveTarget } from "@/lib/pipeline/run";
import { loadSampleHtml, loadSampleExtraction } from "@/lib/samples";
import Anthropic from "@anthropic-ai/sdk";
import type { ScoredChange } from "@/lib/pipeline/types";
import type { AlertPayload } from "@/lib/pipeline/types";

export async function POST(_req: NextRequest) {
  // Load API key from appSettings or env
  let apiKey: string | null = null;
  const keySetting = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, "anthropic_api_key"),
  });
  if (keySetting?.value) {
    apiKey = keySetting.value;
  } else if (process.env.ANTHROPIC_API_KEY) {
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  // Load webhook URL from settings
  let webhookUrl: string | null = null;
  const webhookSetting = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, "webhook_url"),
  });
  if (webhookSetting?.value) {
    webhookUrl = webhookSetting.value;
  }

  // Build PipelineDeps
  const deps: PipelineDeps = {
    getActiveTargets: async (): Promise<ActiveTarget[]> => {
      const rows = await db
        .select({
          targetId: watchTargets.id,
          competitorId: competitors.id,
          competitorName: competitors.name,
          url: watchTargets.url,
          label: watchTargets.label,
          pageType: watchTargets.pageType,
        })
        .from(watchTargets)
        .innerJoin(competitors, eq(watchTargets.competitorId, competitors.id))
        .where(and(eq(watchTargets.isActive, 1), eq(competitors.isActive, 1)));

      return rows.map((r) => ({
        ...r,
        competitorSlug: r.competitorName.toLowerCase().replace(/\s+/g, "-"),
      }));
    },

    getLastSnapshot: async (targetId: string) => {
      const row = await db.query.snapshots.findFirst({
        where: and(eq(snapshots.targetId, targetId), eq(snapshots.status, "ok")),
        orderBy: [desc(snapshots.createdAt)],
      });
      if (!row) return null;
      return {
        htmlHash: row.htmlHash,
        extractedData: row.extractedData ?? "",
        isBaseline: row.isBaseline === 1,
      };
    },

    getRecentFingerprints: async (targetId: string) => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const rows = await db
        .select({ changeFingerprint: changes.changeFingerprint })
        .from(changes)
        .where(and(eq(changes.targetId, targetId), gte(changes.createdAt, since)));
      return rows.map((r) => r.changeFingerprint);
    },

    getSampleHtml: () => {
      // Try versions 4 down to 1
      for (let v = 4; v >= 1; v--) {
        const html = loadSampleHtml("sample", v);
        if (html) return html;
      }
      return null;
    },

    getSampleExtraction: () => {
      for (let v = 4; v >= 1; v--) {
        const extraction = loadSampleExtraction("sample", v);
        if (extraction) return extraction;
      }
      return null;
    },

    saveSnapshot: async (params) => {
      const id = nanoid();
      const now = new Date().toISOString();
      await db.insert(snapshots).values({
        id,
        targetId: params.targetId,
        runId: params.runId,
        htmlHash: params.htmlHash,
        extractedData: params.extractedData ?? null,
        sourceMode: params.sourceMode,
        isBaseline: params.isBaseline ? 1 : 0,
        screenshotPath: params.screenshotPath ?? null,
        status: params.status,
        errorMessage: params.errorMessage ?? null,
        createdAt: now,
      });
      return id;
    },

    saveChanges: async (params: {
      runId: string;
      targetId: string;
      competitorId: string;
      changes: ScoredChange[];
    }) => {
      const now = new Date().toISOString();
      // Resolve latest snapshot ID for this target/run to use as FK
      const latestSnapshot = await db.query.snapshots.findFirst({
        where: and(eq(snapshots.targetId, params.targetId), eq(snapshots.runId, params.runId)),
        orderBy: [desc(snapshots.createdAt)],
      });
      const snapshotId = latestSnapshot?.id ?? "";
      for (const change of params.changes) {
        await db.insert(changes).values({
          id: nanoid(),
          targetId: params.targetId,
          competitorId: params.competitorId,
          snapshotId,
          runId: params.runId,
          category: change.category,
          field: change.field,
          oldValue: change.oldValue !== undefined ? JSON.stringify(change.oldValue) : null,
          newValue: JSON.stringify(change.newValue),
          threatLevel: change.threatLevel,
          impactType: change.impactType,
          changeFingerprint: change.changeFingerprint,
          createdAt: now,
        });
      }
    },

    saveAlerts: async (params: {
      runId: string;
      targetId: string;
      competitorId: string;
      alerts: AlertPayload[];
    }) => {
      const now = new Date().toISOString();
      // Resolve latest change ID for this target/run to use as FK
      const latestChange = await db.query.changes.findFirst({
        where: and(eq(changes.targetId, params.targetId), eq(changes.runId, params.runId)),
        orderBy: [desc(changes.createdAt)],
      });
      const changeId = latestChange?.id ?? "";
      for (const alert of params.alerts) {
        await db.insert(alerts).values({
          id: nanoid(),
          changeId,
          competitorId: params.competitorId,
          title: alert.title,
          threatLevel: alert.threatLevel,
          impactType: alert.impactType,
          isRead: 0,
          createdAt: now,
        });
      }
    },

    createRun: async (triggerType: string) => {
      const id = nanoid();
      const now = new Date().toISOString();
      await db.insert(monitorRuns).values({
        id,
        triggerType,
        startedAt: now,
        completedAt: null,
        status: "running",
        targetsChecked: 0,
        targetsSkipped: 0,
        changesFound: 0,
        alertsGenerated: 0,
      });
      return id;
    },

    completeRun: async (params) => {
      await db
        .update(monitorRuns)
        .set({
          status: params.status,
          completedAt: new Date().toISOString(),
          targetsChecked: params.targetsChecked,
          targetsSkipped: params.targetsSkipped,
          changesFound: params.changesFound,
          alertsGenerated: params.alertsGenerated,
        })
        .where(eq(monitorRuns.id, params.runId));
    },

    apiKey,
    playwrightAvailable: false,
    webhookUrl,
  };

  // Wire Anthropic client if API key exists
  if (apiKey) {
    const client = new Anthropic({ apiKey });
    (deps as PipelineDeps & { createMessage?: unknown }).createMessage = client.messages.create.bind(client.messages);
  }

  const result = await runPipeline(deps, "manual");
  return NextResponse.json(result);
}
