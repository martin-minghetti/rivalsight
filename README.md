# RivalSight — Competitive Intelligence Monitor + Alerts

> RivalSight helps product teams track competitor changes automatically without manually checking dozens of pages — and scores how much each change matters.

## Quick Start

```bash
git clone <repo-url>
cd rivalsight
npm install
npm run db:seed
npm run dev
```

No API key needed — demo mode shows sample data with all pipeline paths covered.

### Live Monitoring

1. Get an Anthropic API key from console.anthropic.com
2. Add it in Settings or set ANTHROPIC_API_KEY in .env
3. Install Playwright: `npx playwright install chromium`
4. Click "Run Monitor Now" on the dashboard

## Stack

- Next.js 16 (App Router, full-stack)
- TypeScript
- Tailwind CSS 4
- Drizzle ORM + SQLite (better-sqlite3)
- Anthropic Claude API (BYOK)
- Playwright (browser automation)
- Zod (validation)
- Vitest (testing)

## Architecture

Next.js App → API Routes → Pipeline (snapshot → normalize → extract → diff → score → alert) → SQLite

## Pipeline

1. **Snapshot** — Capture page HTML via Playwright (or sample data fallback)
2. **Normalize** — Strip nav/footer/scripts, extract main content, remove styling attributes
3. **Extract** — Send to Claude for structured data extraction (pricing, features, positioning, content)
4. **Diff** — Compare current extraction against previous for same target
5. **Score** — Apply deterministic threat scoring rules (critical/high/medium/low)
6. **Alert** — Generate alerts for medium+ threats, fire webhooks

## Demo Mode

Without an API key, the app runs in demo mode with pre-computed sample data covering 4 fictional competitors across 7 watch targets. All pipeline paths are exercised: baseline suppression, critical/high/medium/low threats, opportunities, hash-skip optimization.

## Testing

```bash
npm test
```

## Webhook

When configured, alerts fire a POST webhook:

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

## License

MIT
