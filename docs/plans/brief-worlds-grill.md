# Brief — Grill-with-docs: challenge the Worlds UI/UX refinement plan (OPUS)

You are a senior engineer/architect GRILLING an implementation plan before any code is written. Your job: attack the plan against the REAL repository and return SAFE / STILL-BLOCKING verdicts with file:line evidence. Do NOT write code. Read the actual files; do not trust the plan's own claims.

## Plan under review
File: `C:/Users/Danie/Documents/Claude/Projects/Lumina/.worktrees/immersive-curated-genre-specific-experie/.hermes/plans/2026-07-15-worlds-ui-ux-refinement.md`
Read it in full. It has 6 phases:
- P1: split LLM `intro` out of `buildGenreExperience` into a separate `/discover/genre-intro` endpoint + second client `useQuery`, so rails paint before the AI responds.
- P2: Timeline → sticky horizontal rail with ← → arrows; decade selection lifted to page scope (filters every module); titles render as clickable `PosterCard`.
- P3: client-side `FilterChips` (search box + sort + tag chips) over returned items.
- P4: compose per-title `TitleCard` (poster + maker + credibility + argument + watchorder inline) instead of item-iterating each module; module Tabs for dense genres; fix `buildTopics` "GENRE 99" labels.
- P5: server steering opts (`keyword`→with_keywords, `decade`→primary_release_date, `sort`→sort_by, `provider`→with_watch_providers, `lang`→with_original_language) passed to "the existing TMDB discover query builder"; "Steer this World" input → navigates to /chat with prefilled prompt + active filters.
- P6: metaphor theming (one accent token + layout gesture per metaphor) + hierarchy/sparse-state polish.

## What I (orchestrator) already verified in the repo (re-grep yourself to confirm)
- `buildGenreExperience` returns `{ items, anchorsUsed, intro }` — `server/src/services/genreExperienceService.ts:287`; `intro: GenreExperienceIntro | null` at line 60. `curatorIntro` defined at line 187.
- Cache key: `server/src/services/genreExperienceService.ts:236` = `mediaType:mode:genres:modules`.
- TMDB discover call in genreExperienceService currently passes only `sort_by: "vote_average.desc"` (line 260). grep across `server/src/tmdb/client.ts` and `server/src/services/*.ts` found NO support for `with_keywords`, `with_watch_providers`, `primary_release_date`, or `with_original_language`. => The plan's P5 claim "pass straight to the existing TMDB discover query builder" is likely INACCURATE — the builder probably needs extension. CONFIRM by reading the discover query construction in `server/src/services/genreExperienceService.ts` (around line 255-270) and `server/src/tmdb/client.ts`.
- `PosterCard` links to `/title/:type/:tmdbId` at `client/src/components/PosterCard.tsx:158`.
- `TimelineScrubber` holds decade in local `useState` (`client/src/components/genre/TimelineScrubber.tsx:29`) and renders plain `<li>` (lines 70-78) — not clickable.
- `GenreModules` maps every enabled module over every item (`client/src/components/genre/GenreModules.tsx`) — the "wall".
- `buildTopics` labels spines `Genre ${gid}` (`GenreModules.tsx:37`).
- `ChatDock` hidden only on `/chat` (`client/src/App.tsx:56`) — it floats over `/genre` too.

## Your grill charter (return SAFE / STILL-BLOCKING per item, with file:line)
1. **Technical-fidelity**: re-verify EVERY file:line/function claim in the plan against the repo. Specifically: does `curatorIntro` split cleanly (no shared side-effects with `buildGenreExperience`)? Does the P5 "existing discover builder" actually accept those params, or does the plan invent a capability? Are the test references (e.g. `memoryDb`/`seedEntry`/`makeDetails`, `genreMap` async) real? Flag any contaminated/invented snippet.
2. **Architecture/composition**: does P1's two-endpoint split compose with the existing cache/route layer without regression? Does P2 lifting decade-to-page + P3 filter state risk double-filtering or conflicting with the server `decade` opt in P5? Does the `ChatDock`-over-`/genre` (App.tsx:56) create a double-companion regression with the new "Steer this World" CTA / Companion handoff? Cache-key explosion from free-text `keyword` + enrichment TMDB calls per filter variant — is the plan's mitigation (debounce + shorter TTL) sufficient? Does the work nest under `AnimatePresence` cleanly?
3. **Scope/blind-spot**: what does the plan MISS technically? (e.g. does it handle the filtered-empty / decade-with-0-titles state? does splitting intro break the existing `openGuided` prefill that reads `data.intro.hook`? does P4 TitleCard preserve PosterCard's hover quick-actions / ignore / retire-anchor?). Any hidden assumption that would surface only at build or click-through?
4. **UX/feel vs plan**: would P4 TitleCard + P6 metaphor theming actually read as "immersive per world" under the LOCKED system (fixed fonts/motion/sound), or is it decoration? Is the phased order right (does P1-P3 alone make the page feel done)?

Return a structured verdict: per axis SAFE or STILL-BLOCKING with the specific file:line evidence and a one-line fix recommendation. End with a "TOP 3 things most likely to break or disappoint" list. No code.