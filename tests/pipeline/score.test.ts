import { describe, it, expect } from "vitest";
import { scoreChanges } from "@/lib/pipeline/score";
import type { Change } from "@/lib/pipeline/types";

function makeChange(overrides: Partial<Change> & { changeFingerprint?: string }): Change & { changeFingerprint: string } {
  return {
    category: "pricing",
    field: "test",
    oldValue: null,
    newValue: '"test"',
    changeFingerprint: overrides.changeFingerprint || "fp-test",
    ...overrides,
  };
}

describe("scoreChanges", () => {
  it("scores price decrease >10% as critical threat", () => {
    const change = makeChange({ category: "pricing", field: "Starter price", oldValue: "100", newValue: "80" });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("critical");
    expect(scored.impactType).toBe("threat");
  });

  it("scores price increase >10% as medium opportunity", () => {
    const change = makeChange({ category: "pricing", field: "Starter price", oldValue: "100", newValue: "120" });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("medium");
    expect(scored.impactType).toBe("opportunity");
  });

  it("scores small price change (<= 10%) as low info", () => {
    const change = makeChange({ category: "pricing", field: "Starter price", oldValue: "100", newValue: "95" });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("low");
    expect(scored.impactType).toBe("info");
  });

  it("scores new pricing plan as high threat", () => {
    const change = makeChange({ category: "pricing", field: "new plan: Enterprise", oldValue: null, newValue: "199" });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("high");
    expect(scored.impactType).toBe("threat");
  });

  it("scores new feature as high threat", () => {
    const change = makeChange({ category: "features", field: "feature added: AI Assistant", oldValue: null, newValue: '"AI Assistant"' });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("high");
    expect(scored.impactType).toBe("threat");
  });

  it("scores feature removed as medium info", () => {
    const change = makeChange({ category: "features", field: "feature removed: Legacy", oldValue: '"Legacy"', newValue: '"removed"' });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("medium");
    expect(scored.impactType).toBe("info");
  });

  it("scores target audience change as high threat", () => {
    const change = makeChange({ category: "positioning", field: "target audience", oldValue: '"Small teams"', newValue: '"Enterprise"' });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("high");
    expect(scored.impactType).toBe("threat");
  });

  it("scores tagline change as medium info", () => {
    const change = makeChange({ category: "positioning", field: "tagline", oldValue: '"Old"', newValue: '"New"' });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("medium");
    expect(scored.impactType).toBe("info");
  });

  it("scores regular content as low info", () => {
    const change = makeChange({ category: "content", field: "new blog: Post", oldValue: null, newValue: JSON.stringify({ title: "Post", type: "blog", isBreaking: false }) });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("low");
    expect(scored.impactType).toBe("info");
  });

  it("scores breaking changelog as medium threat", () => {
    const change = makeChange({ category: "content", field: "new changelog: v2.0", oldValue: null, newValue: JSON.stringify({ title: "v2.0", type: "changelog", isBreaking: true }) });
    const [scored] = scoreChanges([change]);
    expect(scored.threatLevel).toBe("medium");
    expect(scored.impactType).toBe("threat");
  });

  it("preserves all original change fields", () => {
    const change = makeChange({ category: "pricing", field: "Starter price", oldValue: "100", newValue: "50", changeFingerprint: "fp-123" });
    const [scored] = scoreChanges([change]);
    expect(scored.category).toBe("pricing");
    expect(scored.field).toBe("Starter price");
    expect(scored.oldValue).toBe("100");
    expect(scored.newValue).toBe("50");
    expect(scored.changeFingerprint).toBe("fp-123");
  });
});
