import { createHash } from "crypto";
import type { ExtractedData, Change } from "./types";

function fingerprint(targetId: string, category: string, field: string, newValue: string): string {
  return createHash("sha256")
    .update(`${targetId}:${category}:${field}:${newValue}`)
    .digest("hex")
    .slice(0, 16);
}

function makeChange(
  targetId: string,
  category: Change["category"],
  field: string,
  oldValue: unknown | null,
  newValue: unknown
): Change & { changeFingerprint: string } {
  const oldStr = oldValue != null ? JSON.stringify(oldValue) : null;
  const newStr = JSON.stringify(newValue);
  return {
    category,
    field,
    oldValue: oldStr,
    newValue: newStr,
    changeFingerprint: fingerprint(targetId, category, field, newStr),
  };
}

export function diffExtractions(
  previous: ExtractedData | null,
  current: ExtractedData,
  targetId: string
): Array<Change & { changeFingerprint: string }> {
  if (!previous) return [];

  const changes: Array<Change & { changeFingerprint: string }> = [];

  // --- Pricing ---
  if (current.pricing && previous.pricing) {
    const prevByName = new Map(previous.pricing.map(p => [p.name, p]));
    const currByName = new Map(current.pricing.map(p => [p.name, p]));

    for (const [name, plan] of currByName) {
      if (!prevByName.has(name)) {
        changes.push(makeChange(targetId, "pricing", `new plan: ${name}`, null, plan.price));
      }
    }

    for (const [name, currPlan] of currByName) {
      const prevPlan = prevByName.get(name);
      if (prevPlan && prevPlan.price !== currPlan.price) {
        changes.push(makeChange(targetId, "pricing", `${name} price`, prevPlan.price, currPlan.price));
      }
    }
  } else if (current.pricing && !previous.pricing) {
    for (const plan of current.pricing) {
      changes.push(makeChange(targetId, "pricing", `new plan: ${plan.name}`, null, plan.price));
    }
  }

  // --- Features ---
  if (current.features && previous.features) {
    const prevSet = new Set(previous.features);
    const currSet = new Set(current.features);

    for (const f of currSet) {
      if (!prevSet.has(f)) {
        changes.push(makeChange(targetId, "features", `feature added: ${f}`, null, f));
      }
    }
    for (const f of prevSet) {
      if (!currSet.has(f)) {
        changes.push(makeChange(targetId, "features", `feature removed: ${f}`, f, "removed"));
      }
    }
  }

  // --- Positioning ---
  if (current.positioning && previous.positioning) {
    if (current.positioning.tagline !== previous.positioning.tagline && current.positioning.tagline) {
      changes.push(makeChange(targetId, "positioning", "tagline", previous.positioning.tagline, current.positioning.tagline));
    }
    if (current.positioning.targetAudience !== previous.positioning.targetAudience && current.positioning.targetAudience) {
      changes.push(makeChange(targetId, "positioning", "target audience", previous.positioning.targetAudience, current.positioning.targetAudience));
    }
  }

  // --- Content ---
  if (current.content && previous.content) {
    const prevTitles = new Set(previous.content.map(c => c.title));
    for (const entry of current.content) {
      if (!prevTitles.has(entry.title)) {
        changes.push(makeChange(targetId, "content", `new ${entry.type}: ${entry.title}`, null, {
          title: entry.title,
          type: entry.type,
          isBreaking: entry.isBreaking,
        }));
      }
    }
  }

  return changes;
}
