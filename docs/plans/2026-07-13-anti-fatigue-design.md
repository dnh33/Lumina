# Anti-Fatigue: Intelligent Anchor Diversity Design

> **Status:** Design (Phase 1 of superpowers pipeline). Not yet approved for build.
> **Date:** 2026-07-13
> **Branch:** ignore-show-movie-feature (worktree)

## Purpose

The user loves titles they're tired of being *compared to* (e.g. LOTR — rated
10/10, but every fantasy suggestion is framed "like LOTR"). We want to kill that
**discovery fatigue** — repetition of the same comparison frame — without
discarding the taste signal the user paid for by rating the title highly.

Hard requirement from the user: "the absolute best experience," **real and
measurable**, value-adds only, no notification fatigue.

## Design decision summary

Fatigue is **not** about the title — it's about **repetition of the same
comparison anchor**. Fix = **measure anchor usage + auto-diversify + manual
override**, layered on top of the existing ignore/genre-exclude system. This
keeps loved titles in the taste profile while stopping them from being the
knee-jerk "like X" hook.

## The 4-knob taxonomy (resolves prior ambiguity)

| Knob | Intent | Effect on taste profile | Effect on discovery |
|---|---|---|---|
| **Ignore** (exists) | Title must vanish everywhere | Removed from profile | Hidden |
| **Genre-exclude** (exists) | Bored of a genre | Untouched | Soft filter |
| **Retire-as-anchor** (NEW) | Keep in taste, never a comparison hook | **Stays** | Framing avoids it |
| **Fatigue auto-diversify** (NEW, automatic) | System softens over-used anchors | Stays | Pivots to fresh anchors |

Retire-as-anchor is the precise LOTR button: loved stays loved, framing moves on.

## Composition with genre-exclude (existing feature)

**Genre-exclude is handled entirely by `filterCatalog` and is unaffected by this
work.** Anti-fatigue never re-filters by genre. The two knobs are independent and
compose by *stage*:

- **Genre-exclude** drops a title at the catalog layer (`filterCatalog` /
  `flag()`), so an excluded-genre title never reaches the companion as a
  candidate and can never become an anchor. Nothing to do here.
- **Anti-fatigue** operates later, on *framing* of titles that *did* pass the
  catalog filter — diversifying over-used comparison anchors (e.g. pivoting from
  one loved crime film to a different shared signal) without hiding the genre.

Rule: a genre the user has excluded is absent from discovery AND from any anchor
pool; a genre they love but are fatigued of being *compared through* is still
recommended, just framed via fresh anchors.

## Architecture overview

Three layers, all server-side in the grounding path, all measured:

- **Layer 1 — Measure (`anchor_usage`).** Log every time the companion cites a
  title as a "like X" reference. Derive a real fatigue score.
- **Layer 2 — Auto-diversify (silent).** In grounding, reorder/annotate fatigued
  anchors and prefer fresh ones in `compare_titles` + insight neighbors. No chat
  announcement.
- **Layer 3 — Manual override (Retire-as-anchor).** `library.anchor_retired`
  flag + client toggle + passive "over-used" hint (threshold-gated, no noise).

## Data model

```sql
-- v6 migration
CREATE TABLE anchor_usage (
  id INTEGER PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,            -- 'movie' | 'tv'
  surface TEXT NOT NULL,               -- 'compare_titles' | 'insight_neighbors' | 'take'
  created_at INTEGER NOT NULL          -- epoch ms
);
CREATE INDEX idx_anchor_usage_key_time
  ON anchor_usage (tmdb_id, media_type, created_at);

-- on library table (or library_entry join):
ALTER TABLE library ADD COLUMN anchor_retired INTEGER NOT NULL DEFAULT 0;
```

**Fatigue score (deterministic, measured):**
`fatigue(t) = recency_weighted_citations_last_14d(t) / max(1, total_comparisons_window)`
- recency-weighted: citation age `a` days → weight `exp(-a/7)`.
- normalized so a title cited often recently scores high; threshold (e.g. ≥ 0.6
  AND ≥ 3 citations in window) marks it "over-used" → triggers the passive hint.

## Components & responsibilities

- `server/src/services/anchorService.ts` (NEW)
  - `logAnchor(db, tmdbId, mediaType, surface)`
  - `fatigueScores(db): Map<string, number>` keyed `"mediaType:tmdbId"`
  - `isRetired(db, tmdbId, mediaType): boolean` (reads `library.anchor_retired`)
  - `retireAnchor(db, tmdbId, mediaType)` / `unretireAnchor(...)`
- `server/src/rag/tasteProfile.ts` (MODIFY `renderTasteProfile`, ~line 208)
  - Insert a "diversify" directive when fatigued/retired loved titles are present:
    annotate them as *reference-exhausted*, and explicitly instruct the model to
    pivot to `topGenres` / `favoriteDirectors` instead. Loved title stays listed.
- `server/src/llm/tools.ts` (MODIFY `compare_titles`, ~line 571)
  - Filter candidate anchors by fatigue+retired; prefer fresh, representative
    shared signals. Log each chosen anchor via `logAnchor`.
- `server/src/llm/insightService.ts` (MODIFY neighbor retrieval, ~line 247)
  - Exclude retired + down-rank fatigued from "closest titles"; log chosen anchors.
- `server/src/rag/contextBuilder.ts` (MODIFY, ~line 41)
  - Pass fatigue+retired state into `renderTasteProfile` so chat context diversifies.
- `client/src/components/PosterCard.tsx` (MODIFY) + `Settings.tsx` (MODIFY)
  - Retire-as-anchor toggle on library cards; passive "over-used" hint
    (threshold-gated, static ribbon — NOT a popup/notification).
- `client/src/lib/api.ts` + `server/src/routes/library.ts`
  - `POST /api/library/:id/retire-anchor`, `DELETE` to unretire; reflect in types.

## Data flow

1. User chats / opens a Take → `buildChatContext` / `generateInsight` runs.
2. `computeTasteProfile` builds profile (ignored titles already excluded — ADR-0004).
3. `renderTasteProfile` reads `fatigueScores` + `isRetired`; annotates fatigued
   loved titles as "pivot elsewhere," keeps them in the profile.
4. `compare_titles` / insight neighbors select anchors, preferring fresh ones,
   skipping retired; each chosen anchor → `logAnchor`.
5. Over-used titles (fatigue ≥ threshold) get a passive hint on their library card.

## Anti-notification-fatigue rules (explicit constraints)

- **No proactive messages.** Companion is pull-based; fatigue is applied at
  grounding time only. Never emitted as a chat message or notification.
- **Silent auto-diversify.** Pivots happen without announcement. Optional single
  inline marker on first pivot per session — default OFF.
- **Passive hint only.** "over-used" indicator is a static card state behind the
  fatigue threshold; never a popup, banner, or digest.
- **One-tap, one-time retire.** No reminders, no re-confirmation nudges.
- **Threshold gating.** Hint appears only after measured fatigue crosses the bar;
  rarely-referenced titles never show it.

## Testing strategy (TDD, per superpowers)

- `anchorService.test.ts`: logAnchor persists; fatigueScores recency-weighting
  correct; retired flag honored.
- `tasteProfile.test.ts` (extend): fatigued loved title still appears in profile
  but is annotated "pivot"; retired title excluded from anchor suggestions.
- `tools.test.ts` (extend): `compare_titles` prefers fresh anchors over fatigued;
  retired anchors never chosen; chosen anchors logged.
- `insightService.test.ts` (extend): neighbor list excludes retired, down-ranks
  fatigued; anchors logged.
- Integration: a title cited N times crosses threshold → hint flag true; a
  retired title never surfaces as an anchor anywhere.

## Out of scope (YAGNI)

- For-you feed card framing variation (feed is TMDB-ranked posters, no prose
  frame to vary; fatigue lives in companion/insight only).
- Genre-level fatigue (genre-exclude already covers genre boredom).
- Autonomous hiding of titles the system "thinks" you're tired of.

## Success criteria (measurable)

- Anchor-uniqueness-per-session increases after rollout.
- Repeat-anchor rate per title drops below threshold.
- Retired titles never appear as anchors in any surface (test-proven).
- Zero proactive notifications introduced.
