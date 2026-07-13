# 0006 — Anti-fatigue anchors: measure, silent diversify, manual retire

The user loved titles they were tired of being *compared to* (e.g. LOTR, rated
10/10, but every fantasy suggestion framed "like LOTR"). The fix targets
**repetition of the comparison anchor**, not the title — keep the loved title in
the taste profile, stop it being the knee-jerk "like X" hook.

## Decision
Anchor usage is measured in a new `anchor_usage` table (logged via
`logAnchor`). A deterministic, recency-weighted `fatigueScores` map drives two
independent mechanisms:
- **Silent auto-diversify:** `renderTasteProfile` emits a "Diversify" directive
  when a loved title's fatigue ≥ 0.6 (pivot to other genres/directors);
  `compare_titles` and insight *neighbors* prefer fresh anchors and skip retired
  ones. No chat announcement.
- **Manual Retire-as-anchor:** `library.anchor_retired` flag + `POST/DELETE
  /api/library/:id/retire-anchor` + a one-tap card toggle + a passive,
  threshold-gated "Over-used" ribbon. Keeps the title in the profile; drops it
  from framing only.

## Trade-offs and consequences (grounded in the landed code)
- **Fatigue score is a recency-weighted *average per title*, not a windowed
  dominance ratio.** `fatigueScores` = Σexp(-age/7) / citation_count (no
  hard 14-day cutoff; `HALF_LIFE_DAYS=7` decay drives old usage → 0). The
  design doc's "≥ 3 citations in window AND normalized against total
  comparisons" was **not** implemented — there is no minimum-citation floor
  and no cross-title normalization. This is simpler and still "real/measurable,"
  but it means: a title cited 3× over 8 days crosses 0.6; fatigue measures
  *how weighted a title's own citations are*, not *how dominant it is vs others*.
  Keep this in mind before reasoning "anchor-uniqueness-per-session" from it.
- **The "take"/insight-card-open surface does NOT log anchors.** Only
  `compare_titles` and `insight_neighbors` call `logAnchor`. The design
  listed a `take` surface, but it was never wired. Consequence: the single
  most common "like X" moment — opening a title's own insight card — is
  invisible to fatigue. This is the one real measurement gap; fix by logging
  `logAnchor(db, tmdbId, mediaType, "take")` in `generateInsight` (or its
  caller) when the model grounds on a library comparison.
- **`contextBuilder.ts` was intentionally left unmodified.** `renderTasteProfile`
  self-reads `fatigueScores`, so the diversify directive reaches chat context
  without the builder changing. The design's line-41 MODIFY was redundant;
  recording that the builder needs no change here.
- **Retire and ignore are independent** (mirrors ADR-0004's ignore/library
  separation). Retiring never removes a title from the profile; ignoring does.
- **No new notifications** were introduced — all diversification is pull-based at
  grounding time, and the "Over-used" hint is a static, threshold-gated card
  state (never a popup/banner/digest). Honors the user's "no notification
  fatigue" constraint.

- **Rejected alternatives**
- *Autonomous hiding of fatigued titles* — rejected (YAGNI; user keeps
  control via the retire toggle).
- *Genre-level fatigue* — rejected; genre-exclude (ADR-0005) already covers
  genre boredom, and the two compose by stage.
- *Normalize fatigue against total comparisons per window* — deferred; the
  per-title recency average is sufficient for the silent-diversify + hint
  behaviors and avoids a global window state. Revisit if per-session
  anchor-uniqueness metrics prove the per-title score too coarse.

## Corrections (2026-07-13 — grill-with-docs post-implementation audit)

This ADR was written (commit `026f362`) AFTER the original feature code
already shipped `MIN_CITATIONS=3` and `FATIGUE_WINDOW_DAYS=14` (commit
`6e7d51c`), but the "Trade-offs" section below misdescribes that code.
Correcting the record so future readers aren't misled:

- **The fatigue score DOES have a hard time window and a minimum-citation
  floor.** `fatigueScores` (anchorService.ts) drops citations older than
  `FATIGUE_WINDOW_DAYS = 14` (the `WHERE created_at >= ?` cutoff at line
  53), and skips any title with `totals < MIN_CITATIONS` (line 72, `MIN_CITATIONS = 3`).
  The earlier claim "no hard time window and no minimum-citation floor" is
  **wrong** — the design-doc's "≥ 3 citations in window" floor *was*
  implemented. This is the better behavior (a single or double fresh citation
  must not read as "over-used"), so the code is kept; only this prose is fixed.
- **The `take` surface DOES log.** Commit `6e7d51c` originally logged `take`
  for **all 15** loved titles per card-open (the Claim #1 storm); commit
  `fff38ba` corrected it to log `take` **only for the opened title**
  (insightService.ts:233-234). The earlier claim "the `take`/insight-card-open
  surface does NOT log anchors" is **wrong** — it was never absent, it was
  just over-broad. After the fix, `take` is a real, correctly-scoped surface.
