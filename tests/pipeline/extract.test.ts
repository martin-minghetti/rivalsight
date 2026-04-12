import { describe, it, expect, vi } from "vitest";
import { extractData } from "@/lib/pipeline/extract";
import type { ExtractedData } from "@/lib/pipeline/types";

const MOCK_EXTRACTION: ExtractedData = {
  pricing: [
    { name: "Starter", price: 29, currency: "USD", period: "month", features: ["5 users", "Basic"] },
    { name: "Pro", price: 79, currency: "USD", period: "month", features: ["25 users", "All features"] },
  ],
  features: ["Dashboard", "Reports", "API access"],
  positioning: {
    tagline: "Project management made simple",
    claims: ["#1 rated PM tool"],
    targetAudience: "Small teams",
  },
  content: [
    { title: "v2.0 Released", type: "changelog", summary: "Major update", isBreaking: false },
  ],
};

describe("extractData", () => {
  it("extracts structured data via Claude API", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_EXTRACTION) }],
    });

    const result = await extractData({
      normalizedHtml: "<h1>Pricing</h1><p>Starter $29/mo</p>",
      pageType: "pricing",
      apiKey: "test-key",
      createMessage: mockCreate,
    });

    expect(result).toEqual(MOCK_EXTRACTION);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("Starter $29/mo");
  });

  it("returns pre-computed sample when no API key", async () => {
    const sampleData: ExtractedData = {
      pricing: [{ name: "Free", price: 0, currency: "USD", period: "month", features: ["Basic"] }],
      features: null,
      positioning: null,
      content: null,
    };
    const getSampleExtraction = vi.fn().mockReturnValue(sampleData);

    const result = await extractData({
      normalizedHtml: "<h1>Pricing</h1>",
      pageType: "pricing",
      apiKey: null,
      getSampleExtraction,
    });

    expect(result).toEqual(sampleData);
    expect(getSampleExtraction).toHaveBeenCalled();
  });

  it("handles Claude returning partial data", async () => {
    const partial: ExtractedData = {
      pricing: [{ name: "Basic", price: 10, currency: "USD", period: "month", features: [] }],
      features: null,
      positioning: null,
      content: null,
    };
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(partial) }],
    });

    const result = await extractData({
      normalizedHtml: "<h1>Pricing</h1>",
      pageType: "pricing",
      apiKey: "test-key",
      createMessage: mockCreate,
    });

    expect(result.pricing).toHaveLength(1);
    expect(result.features).toBeNull();
  });

  it("throws on Claude API error", async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error("API rate limit"));

    await expect(
      extractData({
        normalizedHtml: "<h1>Pricing</h1>",
        pageType: "pricing",
        apiKey: "test-key",
        createMessage: mockCreate,
      })
    ).rejects.toThrow("API rate limit");
  });

  it("throws on invalid JSON from Claude", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "This is not JSON" }],
    });

    await expect(
      extractData({
        normalizedHtml: "<h1>Pricing</h1>",
        pageType: "pricing",
        apiKey: "test-key",
        createMessage: mockCreate,
      })
    ).rejects.toThrow();
  });
});
