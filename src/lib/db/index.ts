import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "rivalsight.db");

function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      notes TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS watch_targets (
      id TEXT PRIMARY KEY, competitor_id TEXT NOT NULL REFERENCES competitors(id),
      url TEXT NOT NULL, page_type TEXT NOT NULL, label TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS monitor_runs (
      id TEXT PRIMARY KEY, trigger_type TEXT NOT NULL, started_at TEXT NOT NULL,
      completed_at TEXT, status TEXT NOT NULL, targets_checked INTEGER NOT NULL DEFAULT 0,
      targets_skipped INTEGER NOT NULL DEFAULT 0, changes_found INTEGER NOT NULL DEFAULT 0,
      alerts_generated INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY, target_id TEXT NOT NULL REFERENCES watch_targets(id),
      run_id TEXT NOT NULL REFERENCES monitor_runs(id), html_hash TEXT NOT NULL,
      extracted_data TEXT, source_mode TEXT NOT NULL, is_baseline INTEGER NOT NULL DEFAULT 0,
      screenshot_path TEXT, status TEXT NOT NULL, error_message TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS changes (
      id TEXT PRIMARY KEY, target_id TEXT NOT NULL REFERENCES watch_targets(id),
      competitor_id TEXT NOT NULL REFERENCES competitors(id),
      snapshot_id TEXT NOT NULL REFERENCES snapshots(id),
      run_id TEXT NOT NULL REFERENCES monitor_runs(id),
      category TEXT NOT NULL, field TEXT NOT NULL, old_value TEXT, new_value TEXT NOT NULL,
      threat_level TEXT NOT NULL, impact_type TEXT NOT NULL,
      change_fingerprint TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY, change_id TEXT NOT NULL REFERENCES changes(id),
      competitor_id TEXT NOT NULL REFERENCES competitors(id),
      title TEXT NOT NULL, threat_level TEXT NOT NULL, impact_type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);

  return drizzle(sqlite, { schema });
}

export const db = getDb();
