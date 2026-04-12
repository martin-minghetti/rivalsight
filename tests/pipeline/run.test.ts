import { describe, it, expect, vi } from "vitest";
import { runPipeline, type PipelineDeps } from "@/lib/pipeline/run";
import type { ExtractedData } from "@/lib/pipeline/types";
import { SAMPLE_HTML } from "../helpers";

const MOCK_EXTRACTION: ExtractedData = {
  pricing: [
    { name: "Starter", price: 29, currency: "USD", period: "month", features: ["5 users"] },
  ],
  features: ["Dashboard"],
  positioning: { tagline: "Simple PM", claims: null, targetAudience: "Teams" },
  content: null,
};

const CHANGED_EXTRACTION: ExtractedData = {
  pricing: [
    { name: "Starter", price: 19, currency: "USD", period: "month", features: ["5 users"] },
  ],
  features: ["Dashboard", "AI"],
  positioning: { tagline: "Simple PM", claims: null, targetAudience: "Teams" },
  content: null,
};

function makeDeps(overrides: Partial<PipelineDeps> = {}): PipelineDeps {
  return {
    getActiveTargets: vi.fn().mockResolvedValue([
      {
        targetId: "t1",
        competitorId: "c1",
        competitorName: "Acme",
        url: "https://acme.com/pricing",
        label: "Pricing",
        pageType: "pricing",
        competitorSlug: "acme",
      },
    ]),
    getLastSnapshot: vi.fn().mockResolvedValue(null),
    getRecentFingerprints: vi.fn().mockResolvedValue([]),
    getSampleHtml: vi.fn().mockReturnValue(SAMPLE_HTML),
    getSampleExtraction: vi.fn().mockReturnValue(MOCK_EXTRACTION),
    saveSnapshot: vi.fn().mockResolvedValue("snap-1"),
    saveChanges: vi.fn().mockResolvedValue(undefined),
    saveAlerts: vi.fn().mockResolvedValue(undefined),
    createRun: vi.fn().mockResolvedValue("run-1"),
    completeRun: vi.fn().mockResolvedValue(undefined),
    apiKey: null,
    playwrightAvailable: false,
    webhookUrl: null,
    ...overrides,
  };
}

describe("runPipeline", () => {
  it("runs complete pipeline for a single target (sample mode)", async () => {
    const deps = makeDeps();
    const result = await runPipeline(deps, "manual");
    expect(deps.createRun).toHaveBeenCalledWith("manual");
    expect(deps.saveSnapshot).toHaveBeenCalledTimes(1);
    expect(deps.completeRun).toHaveBeenCalled();
    expect(result.targetsChecked).toBe(1);
    expect(result.status).toBe("completed");
  });

  it("baseline run generates no changes or alerts", async () => {
    const deps = makeDeps();
    const result = await runPipeline(deps, "manual");
    expect(deps.saveChanges).not.toHaveBeenCalled();
    expect(deps.saveAlerts).not.toHaveBeenCalled();
    expect(result.changesFound).toBe(0);
    expect(result.alertsGenerated).toBe(0);
  });

  it("second run with changes generates alerts", async () => {
    const deps = makeDeps({
      getLastSnapshot: vi.fn().mockResolvedValue({
        htmlHash: "different-hash",
        extractedData: JSON.stringify(MOCK_EXTRACTION),
        isBaseline: false,
      }),
      getSampleExtraction: vi.fn().mockReturnValue(CHANGED_EXTRACTION),
    });
    const result = await runPipeline(deps, "manual");
    expect(deps.saveChanges).toHaveBeenCalled();
    expect(result.changesFound).toBeGreaterThan(0);
  });

  it("skips target when html hash matches", async () => {
    const { createHash } = await import("crypto");
    const deps = makeDeps({
      getLastSnapshot: vi.fn().mockResolvedValue({
        htmlHash: createHash("sha256").update(SAMPLE_HTML).digest("hex"),
        extractedData: JSON.stringify(MOCK_EXTRACTION),
        isBaseline: false,
      }),
    });
    const result = await runPipeline(deps, "manual");
    expect(result.targetsSkipped).toBe(1);
    expect(result.targetsChecked).toBe(1);
  });

  it("handles target error gracefully", async () => {
    const deps = makeDeps({
      getSampleHtml: vi.fn().mockImplementation(() => { throw new Error("disk error"); }),
    });
    const result = await runPipeline(deps, "manual");
    expect(result.status).toBe("completed");
    expect(deps.completeRun).toHaveBeenCalled();
  });
});
