import { createHash } from "crypto";
import type { SnapshotResult } from "./types";
import fs from "fs";
import path from "path";

type SnapshotOptions = {
  url: string;
  targetId: string;
  pageType: string;
  competitorSlug: string;
  getSampleHtml: () => string | null;
  playwrightAvailable: boolean;
  lastHtmlHash: string | null;
  launchBrowser?: () => Promise<{
    newPage: () => Promise<{
      goto: (url: string, opts?: object) => Promise<void>;
      waitForLoadState: (state?: string) => Promise<void>;
      content: () => Promise<string>;
      screenshot: (opts?: object) => Promise<Buffer>;
      close: () => Promise<void>;
    }>;
  }>;
};

function hashHtml(html: string): string {
  return createHash("sha256").update(html).digest("hex");
}

export async function takeSnapshot(opts: SnapshotOptions): Promise<SnapshotResult | null> {
  let html: string | null = null;
  let screenshotPath: string | null = null;
  let sourceMode: SnapshotResult["sourceMode"] = "fallback";

  if (opts.playwrightAvailable && opts.launchBrowser) {
    const browser = await opts.launchBrowser();
    const page = await browser.newPage();
    try {
      await page.goto(opts.url, { waitUntil: "networkidle" });
      html = await page.content();
      sourceMode = "live";

      const screenshotDir = path.join(process.cwd(), "public", "screenshots");
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const screenshotFile = `${opts.targetId}-${Date.now()}.png`;
      const fullPath = path.join(screenshotDir, screenshotFile);
      const buffer = await page.screenshot({ fullPage: true });
      fs.writeFileSync(fullPath, buffer);
      screenshotPath = `/screenshots/${screenshotFile}`;
    } finally {
      await page.close();
    }
  } else {
    html = opts.getSampleHtml();
    sourceMode = html ? "sample" : "fallback";
  }

  if (!html) {
    return { html: null, screenshotPath: null, sourceMode: "fallback", htmlHash: "" };
  }

  const hash = hashHtml(html);

  if (opts.lastHtmlHash && hash === opts.lastHtmlHash) {
    return null;
  }

  return { html, screenshotPath, sourceMode, htmlHash: hash };
}
