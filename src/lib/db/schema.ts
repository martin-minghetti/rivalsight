import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "direct" | "indirect" | "emerging"
  notes: text("notes"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const watchTargets = sqliteTable("watch_targets", {
  id: text("id").primaryKey(),
  competitorId: text("competitor_id").notNull().references(() => competitors.id),
  url: text("url").notNull(),
  pageType: text("page_type").notNull(), // "pricing" | "features" | "changelog" | "blog" | "homepage"
  label: text("label").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const monitorRuns = sqliteTable("monitor_runs", {
  id: text("id").primaryKey(),
  triggerType: text("trigger_type").notNull(), // "manual" | "scheduled"
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  status: text("status").notNull(), // "running" | "completed" | "failed"
  targetsChecked: integer("targets_checked").notNull().default(0),
  targetsSkipped: integer("targets_skipped").notNull().default(0),
  changesFound: integer("changes_found").notNull().default(0),
  alertsGenerated: integer("alerts_generated").notNull().default(0),
});

export const snapshots = sqliteTable("snapshots", {
  id: text("id").primaryKey(),
  targetId: text("target_id").notNull().references(() => watchTargets.id),
  runId: text("run_id").notNull().references(() => monitorRuns.id),
  htmlHash: text("html_hash").notNull(),
  extractedData: text("extracted_data"), // JSON string
  sourceMode: text("source_mode").notNull(), // "live" | "sample" | "fallback"
  isBaseline: integer("is_baseline").notNull().default(0),
  screenshotPath: text("screenshot_path"),
  status: text("status").notNull(), // "ok" | "skipped" | "error"
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
});

export const changes = sqliteTable("changes", {
  id: text("id").primaryKey(),
  targetId: text("target_id").notNull().references(() => watchTargets.id),
  competitorId: text("competitor_id").notNull().references(() => competitors.id),
  snapshotId: text("snapshot_id").notNull().references(() => snapshots.id),
  runId: text("run_id").notNull().references(() => monitorRuns.id),
  category: text("category").notNull(), // "pricing" | "features" | "positioning" | "content"
  field: text("field").notNull(),
  oldValue: text("old_value"), // JSON
  newValue: text("new_value").notNull(), // JSON
  threatLevel: text("threat_level").notNull(), // "critical" | "high" | "medium" | "low"
  impactType: text("impact_type").notNull(), // "threat" | "opportunity" | "info"
  changeFingerprint: text("change_fingerprint").notNull(),
  createdAt: text("created_at").notNull(),
});

export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  changeId: text("change_id").notNull().references(() => changes.id),
  competitorId: text("competitor_id").notNull().references(() => competitors.id),
  title: text("title").notNull(),
  threatLevel: text("threat_level").notNull(),
  impactType: text("impact_type").notNull(),
  isRead: integer("is_read").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
