import type { DB } from "../db/connection.js";

// No hard cutoff window: exponential decay already drives old usage toward 0,
// and a cutoff would drop older anchors from the map entirely (callers expect
// every logged anchor to have a score).
const HALF_LIFE_DAYS = 7;

export function logAnchor(db: DB, tmdbId: number, mediaType: string, surface: string): void {
  if (!isAnchorLoggingEnabled(db)) return;
  db.prepare(
    "INSERT INTO anchor_usage (tmdb_id, media_type, surface, created_at) VALUES (?,?,?,?)",
  ).run(tmdbId, mediaType, surface, Date.now());
}

// Opt-out: local-first users may disable anchor logging entirely. Stored in
// the settings table (key "anchorLogging"); defaults to enabled when absent.
export function setAnchorLoggingEnabled(db: DB, enabled: boolean): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('anchorLogging', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(enabled ? "1" : "0");
}

export function clearAnchorUsage(db: DB): void {
  db.prepare("DELETE FROM anchor_usage").run();
}

// Older rows never contribute (the 14-day fatigue window already ignores them),
// so prune to bound table growth on the hottest path (every companion message).
const ANCHOR_RETENTION_DAYS = 30;

export function pruneAnchorUsage(db: DB): void {
  const cutoff = Date.now() - ANCHOR_RETENTION_DAYS * 86_400_000;
  db.prepare("DELETE FROM anchor_usage WHERE created_at < ?").run(cutoff);
}

export function isAnchorLoggingEnabled(db: DB): boolean {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'anchorLogging'")
    .get() as { value: string } | undefined;
  return row ? row.value !== "0" : true;
}
// FATIGUE_WINDOW_DAYS: citations older than this contribute nothing. Keeps
// the score anchored to recent framing behavior (a title cited a lot 2 months
// ago is not "over-used" today).
const FATIGUE_WINDOW_DAYS = 14;
// MIN_CITATIONS: below this, a title is never flagged "over-used" regardless
// of recency. One or two comparisons is normal variety, not fatigue.
const MIN_CITATIONS = 3;

export function fatigueScores(db: DB): Map<string, number> {
  const now = Date.now();
  const cutoff = now - FATIGUE_WINDOW_DAYS * 86_400_000;
  const rows = db
    .prepare(
      "SELECT tmdb_id, media_type, created_at FROM anchor_usage WHERE created_at >= ?",
    )
    .all(cutoff) as { tmdb_id: number; media_type: string; created_at: number }[];
  const weighted = new Map<string, number>();
  const totals = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.media_type}:${r.tmdb_id}`;
    const ageDays = (now - r.created_at) / 86_400_000;
    const w = Math.exp(-ageDays / HALF_LIFE_DAYS);
    weighted.set(key, (weighted.get(key) ?? 0) + w);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  const out = new Map<string, number>();
  for (const [key, w] of weighted) {
    // Require a real volume of recent citations before flagging; a single
    // fresh citation must not read as "over-used".
    if ((totals.get(key) ?? 0) < MIN_CITATIONS) continue;
    const norm = w / Math.max(1, totals.get(key) ?? 1);
    out.set(key, Math.round(norm * 100) / 100);
  }
  return out;
}

export function setRetired(db: DB, libraryId: number, retired: boolean): void {
  db.prepare("UPDATE library SET anchor_retired = ? WHERE id = ?").run(retired ? 1 : 0, libraryId);
}

export function isRetired(db: DB, tmdbId: number, mediaType: string): boolean {
  const row = db
    .prepare(
      `SELECT l.anchor_retired AS r FROM library l JOIN titles t ON t.id = l.title_id
       WHERE t.tmdb_id = ? AND t.media_type = ? LIMIT 1`,
    )
    .get(tmdbId, mediaType) as { r: number } | undefined;
  return !!row && row.r === 1;
}
