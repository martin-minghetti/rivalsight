import fs from "fs";
import path from "path";
import type { ExtractedData } from "./pipeline/types";

const SAMPLES_DIR = path.join(process.cwd(), "data", "samples");

export function loadSampleHtml(slug: string, version: number): string | null {
  const filePath = path.join(SAMPLES_DIR, "html", `${slug}-v${version}.html`);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function loadSampleExtraction(slug: string, version: number): ExtractedData | null {
  const filePath = path.join(SAMPLES_DIR, "extractions", `${slug}-v${version}.json`);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
