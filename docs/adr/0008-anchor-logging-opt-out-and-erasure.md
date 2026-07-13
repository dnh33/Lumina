# 0008 — Anchor-logging opt-out + erasure (privacy)

The anti-fatigue feature logs behavioral signals (which title you opened /
compared) to a local `anchor_usage` table, and a *hint* derived from that log
reaches the AI companion's system prompt. The 4-agent adversarial review found
two privacy gaps: (a) no disclosure that this logging happens, and (b) no
erasure path (GDPR Art. 17 right-to-be-forgotten) — `anchor_usage` had INSERT/
SELECT but no DELETE, and was omitted from export.

## Decision
- **Opt-out** lives in the `settings` table (`key = 'anchorLogging'`, default
  enabled). `logAnchor` no-ops when disabled, gating the single write path
  used by all three surfaces (`compare_titles`, `insight_neighbors`, `take`).
  Exposed via `GET/POST /api/library/anchor-logging` + a **toggle** in
  Settings ("Comparison tracking").
- **Erasure** via `clearAnchorUsage()` (`DELETE FROM anchor_usage`), exposed
  via `POST /api/library/clear-anchor-usage` + a **"Clear usage data"** button
  (with a confirm dialog) in Settings.
- **Right-of-access**: `exportAll` now includes `anchorUsage`, and the
  `library` grab filters out ignored titles (mirroring in-app surfaces).
- **Disclosure**: Settings explains the tally stays on-device and only a hint
  reaches the AI.

## Trade-offs
- **`settings` row over an env var** (`LUMINA_TRACK_ANCHORS`): a row is
  toggleable from the UI without restart and composes with the existing
  `settings` table; env var would match `LUMINA_DB` style but can't be flipped
  in-app. Default-enabled keeps current behavior.
- **No server-side audit of the toggle in the UI label** — the toggle state is
  read live, so the UI can't lie about it.
- Honors the user's "no notification fatigue" bar: disclosure is a static
  Settings note, not a popup; erasure is pull-based.

## Trust boundary
Lumina is a local-first, single-user desktop app with **no API authentication**
— any process or network peer that can reach the running port can read the
library, read/write settings, and erase `anchor_usage` or export. The opt-out
and erasure guarantees above therefore assume a trusted, local-only
environment: they hold against the *user's own* intent, not against an
untrusted peer who can already reach the API. This is by-design (matching the
existing health/export endpoints) and not a defect; it is recorded here so the
privacy claims are honest about the boundary.

## Rejected alternatives
- *No opt-out at all* — rejected; local-first users must be able to disable
  on-device behavioral logging.
- *Env-var-only opt-out* — rejected; can't be toggled from the running app.
