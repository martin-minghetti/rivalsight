import type { Change, ScoredChange } from "./types";

type RawChange = Change & { changeFingerprint: string };

function scorePricing(change: RawChange): Pick<ScoredChange, "threatLevel" | "impactType"> {
  if (change.field.startsWith("new plan:")) {
    return { threatLevel: "high", impactType: "threat" };
  }

  const oldPrice = change.oldValue ? Number(JSON.parse(change.oldValue)) : null;
  const newPrice = Number(JSON.parse(change.newValue));

  if (oldPrice != null && oldPrice > 0) {
    const pctChange = ((newPrice - oldPrice) / oldPrice) * 100;
    if (pctChange < -10) return { threatLevel: "critical", impactType: "threat" };
    if (pctChange > 10) return { threatLevel: "medium", impactType: "opportunity" };
    return { threatLevel: "low", impactType: "info" };
  }

  return { threatLevel: "medium", impactType: "info" };
}

function scoreFeatures(change: RawChange): Pick<ScoredChange, "threatLevel" | "impactType"> {
  if (change.field.startsWith("feature added:")) return { threatLevel: "high", impactType: "threat" };
  if (change.field.startsWith("feature removed:")) return { threatLevel: "medium", impactType: "info" };
  return { threatLevel: "medium", impactType: "info" };
}

function scorePositioning(change: RawChange): Pick<ScoredChange, "threatLevel" | "impactType"> {
  if (change.field === "target audience") return { threatLevel: "high", impactType: "threat" };
  return { threatLevel: "medium", impactType: "info" };
}

function scoreContent(change: RawChange): Pick<ScoredChange, "threatLevel" | "impactType"> {
  try {
    const val = JSON.parse(change.newValue);
    if (val.isBreaking) return { threatLevel: "medium", impactType: "threat" };
  } catch {}
  return { threatLevel: "low", impactType: "info" };
}

const SCORERS: Record<string, (c: RawChange) => Pick<ScoredChange, "threatLevel" | "impactType">> = {
  pricing: scorePricing,
  features: scoreFeatures,
  positioning: scorePositioning,
  content: scoreContent,
};

export function scoreChanges(changes: RawChange[]): ScoredChange[] {
  return changes.map((change) => {
    const scorer = SCORERS[change.category] || (() => ({ threatLevel: "low" as const, impactType: "info" as const }));
    const score = scorer(change);
    return { ...change, ...score };
  });
}
