import { takeSnapshot } from "./snapshot";
import { normalizeHtml } from "./normalize";
import { extractData } from "./extract";
import { diffExtractions } from "./diff";
import { scoreChanges } from "./score";
import { generateAlerts } from "./alert";
import type { ExtractedData, AlertPayload, ScoredChange } from "./types";

export type ActiveTarget = {
  targetId: string;
  competitorId: string;
  competitorName: string;
  url: string;
  label: string;
  pageType: string;
  competitorSlug: string;
};

export type LastSnapshot = {
  htmlHash: string;
  extractedData: string;
  isBaseline: boolean;
} | null;

export type PipelineDeps = {
  getActiveTargets: () => Promise<ActiveTarget[]>;
  getLastSnapshot: (targetId: string) => Promise<LastSnapshot>;
  getRecentFingerprints: (targetId: string) => Promise<string[]>;
  getSampleHtml: () => string | null;
  getSampleExtraction: () => ExtractedData | null;
  saveSnapshot: (params: {
    targetId: string;
    runId: string;
    html: string | null;
    htmlHash: string;
    screenshotPath: string | null;
    sourceMode: string;
    extractedData: string | null;
    isBaseline: boolean;
    status: "ok" | "skipped" | "error";
    errorMessage?: string;
  }) => Promise<string>;
  saveChanges: (params: {
    runId: string;
    targetId: string;
    competitorId: string;
    changes: ScoredChange[];
  }) => Promise<void>;
  saveAlerts: (params: {
    runId: string;
    targetId: string;
    competitorId: string;
    alerts: AlertPayload[];
  }) => Promise<void>;
  createRun: (triggerType: string) => Promise<string>;
  completeRun: (params: {
    runId: string;
    status: "completed" | "failed";
    targetsChecked: number;
    targetsSkipped: number;
    changesFound: number;
    alertsGenerated: number;
    errorMessage?: string;
  }) => Promise<void>;
  apiKey: string | null;
  playwrightAvailable: boolean;
  webhookUrl: string | null;
};

export type PipelineResult = {
  runId: string;
  status: "completed" | "failed";
  targetsChecked: number;
  targetsSkipped: number;
  changesFound: number;
  alertsGenerated: number;
};

export async function runPipeline(
  deps: PipelineDeps,
  triggerType: string
): Promise<PipelineResult> {
  const runId = await deps.createRun(triggerType);

  const stats = {
    targetsChecked: 0,
    targetsSkipped: 0,
    changesFound: 0,
    alertsGenerated: 0,
  };

  const targets = await deps.getActiveTargets();

  for (const target of targets) {
    stats.targetsChecked++;

    try {
      const lastSnapshot = await deps.getLastSnapshot(target.targetId);

      // Take snapshot
      const snapshotResult = await takeSnapshot({
        url: target.url,
        targetId: target.targetId,
        pageType: target.pageType,
        competitorSlug: target.competitorSlug,
        getSampleHtml: deps.getSampleHtml,
        playwrightAvailable: deps.playwrightAvailable,
        lastHtmlHash: lastSnapshot?.htmlHash ?? null,
      });

      // null means hash matched — skip
      if (snapshotResult === null) {
        stats.targetsSkipped++;
        await deps.saveSnapshot({
          targetId: target.targetId,
          runId,
          html: null,
          htmlHash: lastSnapshot?.htmlHash ?? "",
          screenshotPath: null,
          sourceMode: "fallback",
          extractedData: null,
          isBaseline: false,
          status: "skipped",
        });
        continue;
      }

      // No HTML returned (error case)
      if (!snapshotResult.html) {
        await deps.saveSnapshot({
          targetId: target.targetId,
          runId,
          html: null,
          htmlHash: "",
          screenshotPath: null,
          sourceMode: snapshotResult.sourceMode,
          extractedData: null,
          isBaseline: false,
          status: "error",
          errorMessage: "No HTML captured",
        });
        continue;
      }

      // Normalize and extract
      const normalizedHtml = normalizeHtml(snapshotResult.html);

      const extracted = await extractData({
        normalizedHtml,
        pageType: target.pageType,
        apiKey: deps.apiKey,
        getSampleExtraction: deps.getSampleExtraction,
      });

      const isBaseline = !lastSnapshot;

      await deps.saveSnapshot({
        targetId: target.targetId,
        runId,
        html: snapshotResult.html,
        htmlHash: snapshotResult.htmlHash,
        screenshotPath: snapshotResult.screenshotPath,
        sourceMode: snapshotResult.sourceMode,
        extractedData: JSON.stringify(extracted),
        isBaseline,
        status: "ok",
      });

      // Baseline: no diff/score/alert
      if (isBaseline) {
        continue;
      }

      // Diff against previous extraction
      let previousExtraction: ExtractedData | null = null;
      if (lastSnapshot?.extractedData) {
        try {
          previousExtraction = JSON.parse(lastSnapshot.extractedData) as ExtractedData;
        } catch {
          previousExtraction = null;
        }
      }

      const rawChanges = diffExtractions(previousExtraction, extracted, target.targetId);

      if (rawChanges.length === 0) {
        continue;
      }

      const scoredChanges = scoreChanges(rawChanges);
      stats.changesFound += scoredChanges.length;

      await deps.saveChanges({
        runId,
        targetId: target.targetId,
        competitorId: target.competitorId,
        changes: scoredChanges,
      });

      const recentFingerprints = await deps.getRecentFingerprints(target.targetId);

      const ctx = {
        targetId: target.targetId,
        competitorId: target.competitorId,
        competitorName: target.competitorName,
        targetUrl: target.url,
        targetLabel: target.label,
        pageType: target.pageType,
        runId,
      };

      const alerts = generateAlerts(scoredChanges, ctx, recentFingerprints);
      stats.alertsGenerated += alerts.length;

      if (alerts.length > 0) {
        await deps.saveAlerts({
          runId,
          targetId: target.targetId,
          competitorId: target.competitorId,
          alerts,
        });
      }
    } catch (err) {
      // Log error but continue processing other targets
      console.error(`Error processing target ${target.targetId}:`, err);
    }
  }

  await deps.completeRun({
    runId,
    status: "completed",
    ...stats,
  });

  return {
    runId,
    status: "completed",
    ...stats,
  };
}
