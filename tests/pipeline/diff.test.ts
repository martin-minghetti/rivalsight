import { describe, it, expect } from "vitest";
import { diffExtractions } from "@/lib/pipeline/diff";
import type { ExtractedData } from "@/lib/pipeline/types";

const BASE: ExtractedData = {
  pricing: [
    { name: "Starter", price: 29, currency: "USD", period: "month", features: ["5 users"] },
    { name: "Pro", price: 79, currency: "USD", period: "month", features: ["25 users"] },
  ],
  features: ["Dashboard", "Reports"],
  positioning: {
    tagline: "Simple PM",
    claims: ["Best tool"],
    targetAudience: "Small teams",
  },
  content: [
    { title: "v1.0", type: "changelog", summary: "Initial release", isBreaking: false },
  ],
};

describe("diffExtractions", () => {
  it("returns empty array when extractions are identical", () => {
    const changes = diffExtractions(BASE, structuredClone(BASE), "t1");
    expect(changes).toEqual([]);
  });

  it("detects pricing decrease", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      pricing: [
        { name: "Starter", price: 19, currency: "USD", period: "month", features: ["5 users"] },
        { name: "Pro", price: 79, currency: "USD", period: "month", features: ["25 users"] },
      ],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(1);
    expect(changes[0].category).toBe("pricing");
    expect(changes[0].field).toBe("Starter price");
    expect(JSON.parse(changes[0].oldValue!)).toBe(29);
    expect(JSON.parse(changes[0].newValue)).toBe(19);
  });

  it("detects pricing increase", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      pricing: [
        { name: "Starter", price: 29, currency: "USD", period: "month", features: ["5 users"] },
        { name: "Pro", price: 99, currency: "USD", period: "month", features: ["25 users"] },
      ],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe("Pro price");
  });

  it("detects new pricing plan", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      pricing: [
        ...BASE.pricing!,
        { name: "Enterprise", price: 199, currency: "USD", period: "month", features: ["Unlimited"] },
      ],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(1);
    expect(changes[0].category).toBe("pricing");
    expect(changes[0].field).toBe("new plan: Enterprise");
    expect(changes[0].oldValue).toBeNull();
  });

  it("detects feature added", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      features: ["Dashboard", "Reports", "AI Assistant"],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(1);
    expect(changes[0].category).toBe("features");
    expect(changes[0].field).toBe("feature added: AI Assistant");
  });

  it("detects feature removed", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      features: ["Dashboard"],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(1);
    expect(changes[0].category).toBe("features");
    expect(changes[0].field).toBe("feature removed: Reports");
  });

  it("detects tagline change", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      positioning: { tagline: "AI-powered PM", claims: ["Best tool"], targetAudience: "Small teams" },
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes.some(c => c.category === "positioning" && c.field === "tagline")).toBe(true);
  });

  it("detects target audience change", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      positioning: { tagline: "Simple PM", claims: ["Best tool"], targetAudience: "Enterprise" },
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes.some(c => c.field === "target audience")).toBe(true);
  });

  it("detects new content entry", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      content: [
        ...BASE.content!,
        { title: "v2.0", type: "changelog", summary: "Big update", isBreaking: true },
      ],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(1);
    expect(changes[0].category).toBe("content");
    expect(changes[0].field).toContain("v2.0");
  });

  it("generates unique change fingerprints", () => {
    const current: ExtractedData = {
      ...structuredClone(BASE),
      pricing: [
        { name: "Starter", price: 19, currency: "USD", period: "month", features: ["5 users"] },
        { name: "Pro", price: 99, currency: "USD", period: "month", features: ["25 users"] },
      ],
    };
    const changes = diffExtractions(BASE, current, "t1");
    expect(changes).toHaveLength(2);
    const fingerprints = changes.map(c => c.changeFingerprint);
    expect(new Set(fingerprints).size).toBe(2);
  });

  it("handles null previous", () => {
    const changes = diffExtractions(null, BASE, "t1");
    expect(changes).toEqual([]);
  });
});
