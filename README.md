<p align="center">
  <h1 align="center">RivalSight</h1>
  <p align="center">
    Competitive intelligence monitor that tracks competitor pages, extracts structured data via Claude, scores threats, and surfaces alerts.
  </p>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#demo-mode">Demo Mode</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black.svg" />
  <img alt="Claude API" src="https://img.shields.io/badge/Claude-BYOK-cc785c.svg" />
</p>

---

## The Problem

Product teams waste hours every week manually checking competitor websites for pricing changes, new features, and positioning shifts. By the time someone notices a change, the response is already late. Spreadsheets and screenshots don't scale, and generic web monitoring tools flag every minor CSS tweak without telling you what actually matters.

## The Solution

RivalSight automates the full cycle: capture competitor pages, extract structured data with AI, diff against previous snapshots, and score each change by business impact. You get alerts only when something actually matters — a price drop, a new feature launch, a repositioning move — not when someone updates their footer.

**Core principles:**

- **Deterministic scoring** — Threat levels are computed by rules, not vibes. You can inspect and adjust the logic.
- **Structured extraction** — Claude extracts pricing, features, positioning, and content into typed fields. No regex fragility.
- **BYOK** — Bring your own Anthropic API key. No intermediary services, no data leaving your control beyond the API call.
- **Demo-first** — Works out of the box with sample data. No API key needed to explore the full UI and pipeline.

## Quick Start

```bash
git clone https://github.com/martin-minghetti/rivalsight.git
cd rivalsight
npm install
npm run db:seed
npm run dev
```

No API key needed — demo mode shows sample data with all pipeline paths covered.

### Live Monitoring

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Add it in Settings or set `ANTHROPIC_API_KEY` in `.env`
3. Install Playwright: `npx playwright install chromium`
4. Click **"Run Monitor Now"** on the dashboard

## How It Works

RivalSight runs a six-stage pipeline on each monitoring cycle:

| Stage | What it does |
|-------|-------------|
| **Snapshot** | Captures page HTML via Playwright (or sample data fallback) |
| **Normalize** | Strips nav, footer, scripts — extracts main content, removes styling noise |
| **Extract** | Sends clean HTML to Claude for structured data extraction (pricing, features, positioning, content) |
| **Diff** | Compares current extraction against the previous snapshot for the same target |
| **Score** | Applies deterministic threat scoring rules — `critical` / `high` / `medium` / `low` |
| **Alert** | Generates alerts for medium+ threats, fires webhooks |

```
Page URL → Playwright → Normalize → Claude Extract → Diff → Score → Alert → SQLite
```

## Demo Mode

Without an API key, the app runs in demo mode with pre-computed sample data covering 4 fictional competitors across 7 watch targets. All pipeline paths are exercised:

- Baseline suppression
- Critical / high / medium / low threats
- Opportunities
- Hash-skip optimization

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, full-stack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite via Drizzle ORM + better-sqlite3 |
| AI | Anthropic Claude API (BYOK) |
| Browser | Playwright |
| Validation | Zod |
| Testing | Vitest |

## Webhook Format

When configured, alerts fire a POST webhook with this payload:

```json
{
  "title": "ProjectFlow: Starter price",
  "threatLevel": "critical",
  "impactType": "threat",
  "competitorName": "ProjectFlow",
  "field": "Starter price",
  "oldValue": "29",
  "newValue": "22",
  "timestamp": "2026-04-12T..."
}
```

## Testing

```bash
npm test
```

## Contributing

Contributions are welcome. Some ways to help:

1. **Report bugs** — Open an issue with steps to reproduce
2. **Suggest features** — Open an issue describing the use case, not just the solution
3. **Submit PRs** — Fork, branch, make your change, and open a pull request

Please keep PRs focused on a single change. If you're planning something large, open an issue first to discuss the approach.

## License

[MIT](LICENSE) — Martin Minghetti
