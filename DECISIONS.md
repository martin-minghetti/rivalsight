# DECISIONS.md

## 1. Next.js full-stack over FastAPI + separate frontend
Portfolio already has 2 Python repos (#1 WhatsApp, #2 SDR); this is the 3rd TypeScript repo, demonstrating the pattern scales across domains. Single deploy, single process. Playwright works natively in Node without Python/asyncio overhead.

## 2. SQLite over Supabase/Postgres
Zero-config developer experience. Clone, install, run. Time-series data fits well in relational model. Drizzle ORM abstracts the driver — swap to Turso/Postgres is a config change. For a local-first portfolio demo, SQLite eliminates the "set up a database" barrier.

## 3. Playwright over fetch + parser
Many modern SaaS sites are SPAs that render pricing/features via JavaScript. A simple fetch gets empty shells. Playwright runs real Chromium, executes JS, waits for hydration, and captures the rendered page. This is genuine value — it's the only way to reliably capture dynamic pricing tables and JS-rendered changelogs.

## 4. HTML normalization before Claude
Raw HTML includes nav, footer, scripts, ads, tracking pixels. Sending all that to Claude wastes tokens (~3-5x more) and introduces noise. Stripping to main content before extraction improves accuracy and reduces cost.

## 5. Claude structured extraction over raw HTML diffing
Raw text diff is noisy and meaningless ("div class changed"). Claude understands semantic content: "price went from $29 to $19." This IS the AI portfolio signal — extraction intelligence, not string comparison.

## 6. Deterministic scoring rules over AI scoring
Threat scoring should be predictable and testable. Rules in code > "ask Claude how important this is." Easier to debug, easier to customize, easier to test.

## 7. Multi-page watch targets over single URL per competitor
Competitors have different information on different pages (pricing page, changelog, blog, features page). The watch_targets model lets users add the specific pages that matter.

## 8. node-cron optional scheduling over manual-only
Manual trigger is the default for zero-config demo, but real competitive monitoring needs to be scheduled. node-cron runs in-process, configurable via Settings page.

## 9. In-app alert feed + generic webhook over multi-channel notifications
Self-contained demo > Slack/Discord config. Generic webhook documented for real integrations. Feed UI shows UX thinking.

## 10. Pre-grabbed snapshots + pre-computed extractions (BYOK)
Without API key: full demo with sample data, "Demo Mode" banner visible. With API key: real monitoring. 30-second time-to-demo maintained.

## 11. HTML hash for skip-if-unchanged
Before sending to Claude, SHA-256 the normalized HTML. If hash matches last snapshot, skip extraction entirely. Saves API cost, reduces noise.

## 12. Playwright with graceful fallback
If Playwright binary isn't installed, pipeline falls back to sample data gracefully instead of crashing. source_mode tracks provenance.

## 13. Change fingerprinting for dedup
Hash of (target_id, category, field, new_value) prevents duplicate alerts when re-running. 24h dedup window.
