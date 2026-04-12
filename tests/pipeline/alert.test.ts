import { describe, it, expect, vi } from "vitest";
import { generateAlerts } from "@/lib/pipeline/alert";
import type { ScoredChange, PipelineContext, AlertPayload } from "@/lib/pipeline/types";

const CTX: PipelineContext = {
  targetId: "t1",
  competitorId: "c1",
  competitorName: "Acme Corp",
  targetUrl: "https://acme.com/pricing",
  targetLabel: "Pricing Page",
  pageType: "pricing",
  runId: "r1",
};

function makeScoredChange(overrides: Partial<ScoredChange> = {}): ScoredChange {
  return {
    category: "pricing",
    field: "Starter price",
    oldValue: "100",
    newValue: "50",
    threatLevel: "critical",
    impactType: "threat",
    changeFingerprint: "fp-" + Math.random().toString(36).slice(2, 8),
    ...overrides,
  };
}

describe("generateAlerts", () => {
  it("generates alerts for changes with threat >= medium", () => {
    const changes: ScoredChange[] = [
      makeScoredChange({ threatLevel: "critical" }),
      makeScoredChange({ threatLevel: "high" }),
      makeScoredChange({ threatLevel: "medium" }),
      makeScoredChange({ threatLevel: "low" }),
    ];
    const alerts = generateAlerts(changes, CTX, []);
    expect(alerts).toHaveLength(3);
  });

  it("skips low threat changes", () => {
    const alerts = generateAlerts([makeScoredChange({ threatLevel: "low" })], CTX, []);
    expect(alerts).toHaveLength(0);
  });

  it("creates descriptive titles", () => {
    const change = makeScoredChange({ field: "Starter price" });
    const [alert] = generateAlerts([change], CTX, []);
    expect(alert.title).toContain("Acme Corp");
    expect(alert.title).toContain("Starter price");
  });

  it("includes all required alert fields", () => {
    const change = makeScoredChange({ threatLevel: "critical", impactType: "threat" });
    const [alert] = generateAlerts([change], CTX, []);
    expect(alert.threatLevel).toBe("critical");
    expect(alert.impactType).toBe("threat");
    expect(alert.competitorName).toBe("Acme Corp");
    expect(alert.competitorId).toBe("c1");
    expect(alert.targetUrl).toBe("https://acme.com/pricing");
    expect(alert.targetLabel).toBe("Pricing Page");
    expect(alert.timestamp).toBeDefined();
  });

  it("deduplicates by fingerprint within recent 24h", () => {
    const fp = "fp-same";
    const change = makeScoredChange({ threatLevel: "high", changeFingerprint: fp });
    expect(generateAlerts([change], CTX, [])).toHaveLength(1);
    expect(generateAlerts([change], CTX, [fp])).toHaveLength(0);
  });

  it("fires webhook when configured", () => {
    const change = makeScoredChange({ threatLevel: "critical" });
    const sendWebhook = vi.fn();
    const alerts = generateAlerts([change], CTX, [], sendWebhook);
    expect(alerts).toHaveLength(1);
    expect(sendWebhook).toHaveBeenCalledTimes(1);
    expect(sendWebhook.mock.calls[0][0]).toMatchObject({ threatLevel: "critical", competitorName: "Acme Corp" });
  });
});
