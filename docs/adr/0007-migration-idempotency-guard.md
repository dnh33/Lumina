# 0007 — Migration idempotency guard (anti-fatigue v6)

The v6 migration (`anchor_usage` table + `library.anchor_retired` column) was
originally written with a bare `ALTER TABLE library ADD COLUMN` that has no
`IF NOT EXISTS` (SQLite DDL has none). `migrate()` was gated only on
`user_version`, and `connection.ts` called it uncaught. A drifted state
(manual DDL, partial restore, version behind but column present) would hit
"duplicate column" and brick boot — a hard fail-loud loop.

## Decision
Guard the `ALTER` with a `pragma_table_info('library')` existence probe; only
run the `ALTER` when the column is absent. Keep all other v6 steps
(`CREATE TABLE/INDEX IF NOT EXISTS`) idempotent. Wrap `migrate()` in
`connection.ts` with a `try/catch` that rethrows an **actionable** error
(stating `user_version` + a backup-restore hint) instead of a silent
uncaught crash.

## Trade-offs
- **Why a probe instead of a new migration version?** A fresh version bump
  can't fix an *already-drifted* DB — the probe is the only thing that makes
  the column additive-safe on any starting state. It's a few lines and
  zero-risk (read-only check before a write).
- **Why fail-loud rather than swallow?** A genuinely corrupt DB should not
  boot into a half-migrated state. The wrapper turns a confusing stack trace
  into an operator-readable message; it does NOT suppress real corruption.
- Verified by a drift test (`db.test.ts`: set `user_version` back, keep column,
  re-run `migrate` → no throw) and a live-DB probe (real `lumina.db`,
  134 rows, 134 rows after migrate — **zero data loss**).

## Rejected alternatives
- *Bump to v7 and move the ALTER there* — doesn't repair a DB already at v6
  with the column; only helps future clean installs.
- *Swallow migration errors and boot anyway* — risks a schema/code mismatch
  surfacing later as cryptic runtime failures.
