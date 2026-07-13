# 0009 — `anchor_usage` created_at index + prune

`fatigueScores` queries `anchor_usage WHERE created_at >= ?` on (effectively)
every companion message. The only index was `(tmdb_id, media_type, created_at)`,
which cannot range-seek on `created_at` alone — SQLite does a full covering-index
walk. With ~15 inserts per OpenRouter call and no upper bound, the table grows
unbounded, so the hottest query keeps getting slower.

## Decision
- Add `CREATE INDEX IF NOT EXISTS idx_anchor_usage_created ON anchor_usage
  (created_at)` so the recency filter range-seeks instead of full-scanning.
- Add `pruneAnchorUsage()` (`DELETE FROM anchor_usage WHERE created_at < now -
  30d`) and call it once at boot in `index.ts`, wrapped in `try/catch`
  (fire-and-forget — a prune failure must never block boot).
- Retention is 30 days: well beyond the 14-day fatigue window, so pruning never
  removes a citation that could still contribute to a score.

## Trade-offs
- **Why 30d, not match the 14d window?** Pruning at exactly 14d would race the
  window edge (a citation aged 14d+1ms vanishes the instant it stops counting).
  30d gives headroom and still bounds growth hard.
- **Why prune at boot, not a cron?** Lumina is a single-user local app with no
  scheduler; boot-time prune is the simplest correct cadence (runs on every
  launch, which is frequent enough).
- **Why not drop the table entirely on prune?** Other surfaces (audit/export)
  may want recent history; 30d retention preserves that without unbounded growth.

## Rejected alternatives
- *No prune, rely on decay only* — rejected; decay zeroes *weight* but not
  *rows*, so the table and the hottest query still grow forever.
- *Daily cron prune* — rejected; no scheduler in a local-first app, and boot
  prune already covers it.
