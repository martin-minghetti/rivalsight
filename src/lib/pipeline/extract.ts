import { ExtractedDataSchema, type ExtractedData } from "./types";

const SYSTEM_PROMPT = `You are a competitive intelligence analyst. Extract structured data from the provided HTML content of a competitor's web page.

Return a JSON object with these sections (set to null if not found):

- pricing: array of {name, price (number), currency, period ("month"|"year"|null), features: string[]}
- features: array of feature/capability strings
- positioning: {tagline, claims: string[], targetAudience}
- content: array of {title, type ("blog"|"announcement"|"changelog"), summary, isBreaking: boolean}

Return ONLY valid JSON. No markdown, no explanation.`;

type ExtractOptions = {
  normalizedHtml: string;
  pageType: string;
  apiKey: string | null;
  createMessage?: (params: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: string; content: string }>;
  }) => Promise<{ content: Array<{ type: string; text: string }> }>;
  getSampleExtraction?: () => ExtractedData | null;
};

export async function extractData(opts: ExtractOptions): Promise<ExtractedData> {
  if (!opts.apiKey) {
    if (opts.getSampleExtraction) {
      const sample = opts.getSampleExtraction();
      if (sample) return sample;
    }
    throw new Error("No API key configured and no sample data available");
  }

  if (!opts.createMessage) {
    throw new Error("createMessage function required when API key is provided");
  }

  const response = await opts.createMessage({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract structured data from this ${opts.pageType} page HTML:\n\n${opts.normalizedHtml}`,
      },
    ],
  });

  const text = response.content[0].text;
  const parsed = JSON.parse(text);
  return ExtractedDataSchema.parse(parsed);
}
