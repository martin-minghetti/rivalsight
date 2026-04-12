import { z } from "zod";

// --- Extraction schemas ---

export const PricingPlanSchema = z.object({
  name: z.string(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  period: z.string().nullable(),
  features: z.array(z.string()),
});

export const ExtractedDataSchema = z.object({
  pricing: z.array(PricingPlanSchema).nullable(),
  features: z.array(z.string()).nullable(),
  positioning: z.object({
    tagline: z.string().nullable(),
    claims: z.array(z.string()).nullable(),
    targetAudience: z.string().nullable(),
  }).nullable(),
  content: z.array(z.object({
    title: z.string(),
    type: z.string(),
    summary: z.string().nullable(),
    isBreaking: z.boolean().default(false),
  })).nullable(),
});

export type ExtractedData = z.infer<typeof ExtractedDataSchema>;
export type PricingPlan = z.infer<typeof PricingPlanSchema>;

// --- Pipeline step outputs ---

export type SnapshotResult = {
  html: string | null;
  screenshotPath: string | null;
  sourceMode: "live" | "sample" | "fallback";
  htmlHash: string;
};

export type Change = {
  category: "pricing" | "features" | "positioning" | "content";
  field: string;
  oldValue: string | null;
  newValue: string;
};

export type ScoredChange = Change & {
  threatLevel: "critical" | "high" | "medium" | "low";
  impactType: "threat" | "opportunity" | "info";
  changeFingerprint: string;
};

export type AlertPayload = {
  title: string;
  threatLevel: "critical" | "high" | "medium" | "low";
  impactType: "threat" | "opportunity" | "info";
  competitorName: string;
  competitorId: string;
  targetUrl: string;
  targetLabel: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  timestamp: string;
};

export type PipelineContext = {
  targetId: string;
  competitorId: string;
  competitorName: string;
  targetUrl: string;
  targetLabel: string;
  pageType: string;
  runId: string;
};
