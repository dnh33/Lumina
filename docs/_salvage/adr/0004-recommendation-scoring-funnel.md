# 0004 — Recommendation scoring funnel (unified scorer + diversity/dedup)

**Status:** Proposed — awaiting design approval (brainstorm gate)
**Date:** 2026-07-13
**Author:** Rune (for dnh33)

## Context

Lumina's discovery rails (`forYou`, `becauseYouLoved`) are built on one
TMDB call each, sorted by a single signal: `vote_average` (see
`discoverService.ts:127` in the ignore-show-movie-feature worktree — that
branch already refactors discovery into `filterCatalog`/`flag`
chokepoints and is a *prerequisite* for this work).

Hard evidence gathered on `recommendation-system-upgrade`:
- `forYou` picks the user's top-3 genres then sorts purely by
  `vote_average.desc` — it ignores the taste profile's director/tag
  affinities, `avoidedGenres`, recency, and the already-collected
  IMDb/Rotten Tomatoes scores (`titles.imdb_rating`, `titles.rt_rating`).
- `becauseYouLoved` is a single seed (`favorite OR rating>=9`, most
  recent) → one TMDB `/recommendations` call. No fallback, no blending.
- Cross-rail duplication: `Discover.tsx` renders For You / Because /
  Encore / Trending / Popular / Acclaimed as independent carousels with
  **no dedup**, so the same title can appear in several.
- Critics scores are collected (v4) and usable in the Library "critics"
  sort (`libraryService.ts`), but absent from every discovery rail and
  from the LLM `matchScore` (`insightService.ts:237` feeds only
  `TMDB rating: {vote_average}`).

Inspiration was reviewed against Twitter's open-sourced
`the-algorithm`. **Conclusion: do NOT port any code or infra.** Its scale
machinery (heavy neural ranker, SimClusters/GraphJet/TwHIN graphs,
6000-feature hydration, ads) is non-transferable to a single-user,
local-first, taste-driven app. What transfers is the *architecture*:

1. **Separate candidate generation from scoring** (one `scoreCandidates`
   for all personalized rails).
2. **Score on personal fit first, quality second** (the user's taste
   profile dominates; critics consensus is a floor + tiebreaker).
3. **Diversify and dedupe before display** (author/genre caps; cross-rail
   dedup) — the single most visible UX win, and the closest analog to
   Twitter's "author diversity" / "feedback fatigue" filters.

This ADR covers **scope A+B only**: unified `scoreCandidates()` and
cross-rail diversity/dedup. Deferred (separate ADRs later): C = implicit
rec-engagement loop (`rec_events`); D = feeding critics into the LLM
`matchScore`. The uniform `ScoreFactors` data model is designed so C and
D slot in without rework.

## Decision

### 1. A single `scoreCandidates(db, items, ctx)` entry point
Located in a new `server/src/services/ranker.ts` (or folded into
`discoverService.ts` if it stays small — decision left to implementer,
but **must** be called by `forYou` and `becauseYouLoved`). Replaces the
bare `fresh.sort((a,b) => b.voteAverage - a.voteAverage)` at
`discoverService.ts:127`.

It accepts a unified `ScoreFactors` per candidate:
```
voteAverage: number | null
imdbRating:  number | null   // 0-10, from titles
rtRating:    number | null   // 0-100, from titles
genres:      number[]
director:    string | null
tags:        string[]
year:        number | null
tmdbId:      number
mediaType:   "movie" | "tv"
source:      "foryou" | "because"
seedId?:     number          // for becauseYouLoved seed
```
`ScoreFactors` is built from the candidate's already-normalized fields
plus one cheap join to `titles` for `imdb_rating`/`rt_rating` (same join
`ratingsService`/`catalog` already do — reuse, do not reinvent).

### 2. The scoring formula (personal-fit-first)
```
tasteFit  = tasteAffinity(ctx.profile, factors)   // 0..1
quality   = coalesce(imdbRating, rtRating/10, voteAverage/10) / 10  // 0..1, null-safe
freshness = 1 - min(1, (2026 - year)/40)           // 0..1, optional
avoided   = 1 if any factors.genre in profile.avoidedGenres else 0
dismissed = 1 if seedId set and ctx.dismissedSeeds.has(seedId) else 0

score = 100 * ( A*tasteFit + B*quality + C*freshness
                - D*avoided - E*dismissed )
clamp 0..100
```
**Starting weights: A=0.60, B=0.15, C=0.05, D=0.15, E=0.05.**
Taste dominates; critics consensus is a secondary tiebreaker only.

`tasteAffinity` reuses the existing `computeTasteProfile` output:
genre average-rating affinity, director affinity (if profile tracks it),
tag overlap with loved titles. Implementation must be **deterministic
and cheap** — pure functions over the profile, no LLM, no extra network.

### 3. Quality floor (Twitter "visibility filter" analog)
After scoring, suppress candidates with `imdbRating && imdbRating < 5.5`
AND `rtRating && rtRating < 60` (both present and both panned). Soft
suppress, not hard-delete — keep them only if the rail would otherwise be
empty. Null scores never trigger suppression.

### 4. Diversity + dedup layer (the highest-value change)
A `diversify(items, { maxPerDirector, maxPerGenre, exclude })` applied
per rail and **across** rails in `Discover.tsx`:
- `maxPerDirector = 2`, `maxPerGenre = 4` per rail (tunable constants).
- Cross-rail dedup: `Discover.tsx` collects a `seen` set of
  `mediaType:tmdbId` as it renders For You → Because → Encore → Trending,
  and drops already-seen titles from later rails. (Encore is
  library-owned and exempt from dedup against discovery — decide during
  design review if it should be exempt from *within*-discovery dupes.)

### 5. Ignored + excluded-genres already handled
`filterCatalog` (from the ignore branch) already drops ignored titles
and `getExcludedGenres`. The scorer runs **after** `filterCatalog`, so it
operates only on visible candidates. No re-implementation.

### 6. Critics hydration caveat
Recommended titles are, by definition, unseen → their `imdb_rating`/
`rt_rating` are likely **null** in `titles` (OMDb hydration only fires on
title-page view). Therefore `quality` MUST `COALESCE` to `vote_average`.
**No lazy OMDb call during discovery** in this scope (deferred with C/D).
The floor at §3 uses `&&` so null scores skip suppression.

## Consequences

**Positive**
- One scoring path → consistent, testable, extensible (C/D drop in).
- Taste profile finally drives rail ordering, not just genre selection.
- Cross-rail dedup removes the "same film in 3 carousels" papercut.
- Critics used as a *guardrail + tiebreaker*, not a generic sort — brand
  preserved ("knows YOUR taste").

**Negative / risks**
- New surface for bugs in `tasteAffinity` (must be unit-tested cold).
- Weights are a guess; will need tuning against real profile data. Plan
  includes a tuning note, not a tuning task.
- `diversify` per-rail can thin a rail if the candidate pool is small
  (TMDB `discover` returns ~20; caps of 2/4 are safe).

**Rejected alternatives**
- Porting Twitter code / infra — non-transferable, over-engineered.
- Making critics the primary sort — generic-izes Lumina, fights the
  product's reason to exist.
- Local content-vector embeddings (Twitter `representation-scorer`) —
  TMDB `/similar` + `/recommendations` already provide catalog similarity;
  building local embeddings duplicates it and adds latency. Deferred/likely
  dropped.
- Collaborative filtering / social graph — single-user app, no data.

## Open questions (resolve during design approval)
1. Should Encore be exempt from *within-discovery* dedup, or only from
   being a dedup *source*? (Recommend: exempt as a source, still
   dedup against itself.)
2. Are `maxPerDirector=2` / `maxPerGenre=4` the right caps, or should they
   scale with rail length?
3. Scope guard: this ADR is A+B only. C (rec-events loop) and D (LLM
   critics) are explicitly out — confirm.
