import type { ScoredChange, PipelineContext, AlertPayload } from "./types";

const ALERT_THRESHOLD: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function generateAlerts(
  scoredChanges: ScoredChange[],
  ctx: PipelineContext,
  recentFingerprints: string[],
  sendWebhook?: (payload: AlertPayload) => void
): AlertPayload[] {
  const recentSet = new Set(recentFingerprints);
  const alerts: AlertPayload[] = [];

  for (const change of scoredChanges) {
    if (ALERT_THRESHOLD[change.threatLevel] < 2) continue;
    if (recentSet.has(change.changeFingerprint)) continue;

    const alert: AlertPayload = {
      title: `${ctx.competitorName}: ${change.field}`,
      threatLevel: change.threatLevel,
      impactType: change.impactType,
      competitorName: ctx.competitorName,
      competitorId: ctx.competitorId,
      targetUrl: ctx.targetUrl,
      targetLabel: ctx.targetLabel,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      timestamp: new Date().toISOString(),
    };

    alerts.push(alert);
    if (sendWebhook) sendWebhook(alert);
  }

  return alerts;
}
