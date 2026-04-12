import { describe, it, expect, vi } from "vitest";
import { takeSnapshot } from "@/lib/pipeline/snapshot";
import { SAMPLE_HTML, hashHtml } from "../helpers";

describe("takeSnapshot", () => {
  it("returns sample data when no playwright and sample html exists", async () => {
    const getSampleHtml = vi.fn().mockReturnValue(SAMPLE_HTML);
    const result = await takeSnapshot({
      url: "https://example.com/pricing",
      targetId: "t1",
      pageType: "pricing",
      competitorSlug: "example",
      getSampleHtml,
      playwrightAvailable: false,
      lastHtmlHash: null,
    });

    expect(result.sourceMode).toBe("sample");
    expect(result.html).toBe(SAMPLE_HTML);
    expect(result.htmlHash).toBe(hashHtml(SAMPLE_HTML));
    expect(result.screenshotPath).toBeNull();
  });

  it("returns null html when no playwright and no sample", async () => {
    const getSampleHtml = vi.fn().mockReturnValue(null);
    const result = await takeSnapshot({
      url: "https://example.com/pricing",
      targetId: "t1",
      pageType: "pricing",
      competitorSlug: "example",
      getSampleHtml,
      playwrightAvailable: false,
      lastHtmlHash: null,
    });

    expect(result.sourceMode).toBe("fallback");
    expect(result.html).toBeNull();
  });

  it("skips when html hash matches lastHtmlHash", async () => {
    const hash = hashHtml(SAMPLE_HTML);
    const getSampleHtml = vi.fn().mockReturnValue(SAMPLE_HTML);
    const result = await takeSnapshot({
      url: "https://example.com/pricing",
      targetId: "t1",
      pageType: "pricing",
      competitorSlug: "example",
      getSampleHtml,
      playwrightAvailable: false,
      lastHtmlHash: hash,
    });

    expect(result).toBeNull();
  });

  it("uses playwright when available", async () => {
    const mockPage = {
      goto: vi.fn(),
      waitForLoadState: vi.fn(),
      content: vi.fn().mockResolvedValue(SAMPLE_HTML),
      screenshot: vi.fn().mockResolvedValue(Buffer.from("png")),
      close: vi.fn(),
    };
    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    };
    const launchBrowser = vi.fn().mockResolvedValue(mockBrowser);

    const result = await takeSnapshot({
      url: "https://example.com/pricing",
      targetId: "t1",
      pageType: "pricing",
      competitorSlug: "example",
      getSampleHtml: vi.fn(),
      playwrightAvailable: true,
      lastHtmlHash: null,
      launchBrowser,
    });

    expect(result!.sourceMode).toBe("live");
    expect(result!.html).toBe(SAMPLE_HTML);
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com/pricing", { waitUntil: "networkidle" });
    expect(mockPage.close).toHaveBeenCalled();
  });
});
