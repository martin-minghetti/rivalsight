import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { COMPETITORS, TARGETS, SNAPSHOT_SEQUENCE, type SnapshotSeed, type TargetSeed, type CompetitorSeed } from "./seed-data";
import { loadSampleHtml, loadSampleExtraction } from "../samples";
import { diffExtractions } from "../pipeline/diff";
import { scoreChanges } from "../pipeline/score";
import { createHash } from "crypto";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "rivalsight.db");

function seed() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS competitors (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, notes TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS watch_targets (id TEXT PRIMARY KEY, competitor_id TEXT NOT NULL, url TEXT NOT NULL, page_type TEXT NOT NULL, label TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS monitor_runs (id TEXT PRIMARY KEY, trigger_type TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL, targets_checked INTEGER NOT NULL DEFAULT 0, targets_skipped INTEGER NOT NULL DEFAULT 0, changes_found INTEGER NOT NULL DEFAULT 0, alerts_generated INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, target_id TEXT NOT NULL, run_id TEXT NOT NULL, html_hash TEXT NOT NULL, extracted_data TEXT, source_mode TEXT NOT NULL, is_baseline INTEGER NOT NULL DEFAULT 0, screenshot_path TEXT, status TEXT NOT NULL, error_message TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS changes (id TEXT PRIMARY KEY, target_id TEXT NOT NULL, competitor_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, run_id TEXT NOT NULL, category TEXT NOT NULL, field TEXT NOT NULL, old_value TEXT, new_value TEXT NOT NULL, threat_level TEXT NOT NULL, impact_type TEXT NOT NULL, change_fingerprint TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, change_id TEXT NOT NULL, competitor_id TEXT NOT NULL, title TEXT NOT NULL, threat_level TEXT NOT NULL, impact_type TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
  `);

  const db = drizzle(sqlite, { schema });
  const now = new Date();

  // Insert competitors
  for (const c of COMPETITORS) {
    db.insert(schema.competitors).values({
      id: c.id, name: c.name, category: c.category, notes: c.notes,
      isActive: 1, createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    }).run();
  }

  // Insert targets
  for (const t of TARGETS) {
    db.insert(schema.watchTargets).values({
      id: t.id, competitorId: t.competitorId, url: t.url, pageType: t.pageType,
      label: t.label, isActive: 1, createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    }).run();
  }

  // Build lookup maps
  const targetBySlug = new Map<string, TargetSeed>();
  for (const t of TARGETS) {
    const comp = COMPETITORS.find(c => c.id === t.competitorId)!;
    targetBySlug.set(`${comp.slug}-${t.pageType}`, t);
  }
  const compById = new Map(COMPETITORS.map(c => [c.id, c]));

  // Group snapshots by daysAgo for runs
  const byDay = new Map<number, Array<SnapshotSeed & { target: TargetSeed; competitor: CompetitorSeed }>>();
  for (const snap of SNAPSHOT_SEQUENCE) {
    const target = targetBySlug.get(snap.targetSlug);
    if (!target) continue;
    const competitor = compById.get(target.competitorId);
    if (!competitor) continue;
    const arr = byDay.get(snap.daysAgo) || [];
    arr.push({ ...snap, target, competitor });
    byDay.set(snap.daysAgo, arr);
  }

  const lastExtraction = new Map<string, { data: any; hash: string }>();
  const sortedDays = [...byDay.keys()].sort((a, b) => b - a);
  let totalRuns = 0;
  let totalChanges = 0;
  let totalAlerts = 0;
  let totalSnapshots = 0;

  for (const daysAgo of sortedDays) {
    const runId = `run-${nanoid(8)}`;
    const runDate = new Date(now.getTime() - daysAgo * 86400000);
    const snapGroup = byDay.get(daysAgo)!;
    let runChanges = 0, runAlerts = 0;

    db.insert(schema.monitorRuns).values({
      id: runId, triggerType: "scheduled", startedAt: runDate.toISOString(),
      status: "running", targetsChecked: snapGroup.length,
    }).run();

    for (const snap of snapGroup) {
      const html = loadSampleHtml(snap.targetSlug, snap.version);
      const extraction = loadSampleExtraction(snap.targetSlug, snap.version);
      if (!html || !extraction) { console.warn(`Missing sample: ${snap.targetSlug} v${snap.version}`); continue; }

      const htmlHash = createHash("sha256").update(html).digest("hex");
      const prev = lastExtraction.get(snap.target.id);
      const isBaseline = !prev;
      const snapshotId = `snap-${nanoid(8)}`;

      db.insert(schema.snapshots).values({
        id: snapshotId, targetId: snap.target.id, runId, htmlHash,
        extractedData: JSON.stringify(extraction), sourceMode: "sample",
        isBaseline: isBaseline ? 1 : 0, screenshotPath: null,
        status: "ok", errorMessage: null, createdAt: runDate.toISOString(),
      }).run();
      totalSnapshots++;

      lastExtraction.set(snap.target.id, { data: extraction, hash: htmlHash });
      if (isBaseline) continue;

      const rawChanges = diffExtractions(prev!.data, extraction, snap.target.id);
      if (rawChanges.length === 0) continue;

      const scoredChanges = scoreChanges(rawChanges);
      const threshold: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

      for (const change of scoredChanges) {
        const changeId = `ch-${nanoid(8)}`;
        db.insert(schema.changes).values({
          id: changeId, targetId: snap.target.id, competitorId: snap.competitor.id,
          snapshotId, runId, category: change.category, field: change.field,
          oldValue: change.oldValue, newValue: change.newValue,
          threatLevel: change.threatLevel, impactType: change.impactType,
          changeFingerprint: change.changeFingerprint, createdAt: runDate.toISOString(),
        }).run();
        runChanges++;
        totalChanges++;

        if (threshold[change.threatLevel] >= 2) {
          db.insert(schema.alerts).values({
            id: `al-${nanoid(8)}`, changeId, competitorId: snap.competitor.id,
            title: `${snap.competitor.name}: ${change.field}`,
            threatLevel: change.threatLevel, impactType: change.impactType,
            isRead: 0, createdAt: runDate.toISOString(),
          }).run();
          runAlerts++;
          totalAlerts++;
        }
      }
    }

    db.update(schema.monitorRuns).set({
      completedAt: new Date(runDate.getTime() + 30000).toISOString(),
      status: "completed", changesFound: runChanges, alertsGenerated: runAlerts,
    }).where(eq(schema.monitorRuns.id, runId)).run();
    totalRuns++;
  }

  console.log(`Seed complete:`);
  console.log(`  ${COMPETITORS.length} competitors`);
  console.log(`  ${TARGETS.length} watch targets`);
  console.log(`  ${totalRuns} monitor runs`);
  console.log(`  ${totalSnapshots} snapshots`);
  console.log(`  ${totalChanges} changes`);
  console.log(`  ${totalAlerts} alerts`);
  sqlite.close();
}

seed();
