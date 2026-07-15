# Genre Experience — Continuity Context (compaction-safe)

> Living ground-truth for the immersive genre-experience feature. v1.5 COMPLETE (2026-07-15).
> Branch: `immersive-curated-genre-specific-experience` · Worktree: `.worktrees/immersive-curated-genre-specific-experie`

## What shipped
Standalone "genre world" experience at `/genre/:slug` + `/genre` picker. A genre-seeded
discovery engine (server) + a **config-driven module host** (client) rendering per-genre
module sets across **all 13 genres**.

## v1.5 scope — ALL DONE
- **Module framework (T11):** `GenreModules` renders `genreWorld.modules` — one component, N configs (design §13.8). Not N page variants.
- **6 modules built + wired:** `timeline` (T11, pre-existing) · `topic`/TopicCluster (F2, T12) · `credibility`/CredibilityStrip (F4, T13) · `watchorder`/WatchOrderSequencer (F5, T14) · `argument`/ArgumentPanel (F3, T15) · `geo`/GeoMap (T16, region share-bars, no map lib).
- **Keyword normalization (G6, T10):** `TitleDetails.keywords` + `RawTmdbDetails.keywords` (movie `keywords` / tv `keywords.results`). 3 server tests.
- **13-genre matrix (T18 + spec):** `genreWorld` now defines 13 worlds (modules per authored+grilled matrix spec `2026-07-15-genre-v15-matrix-spec.md`). `SLUG_ALIASES` extended so server resolves all 13 slugs (war-politics/film-noir/anime/science-fiction).
- **Empty states (R6, metric 9, T17):** `GenreEmptyState` with Western/Music/War&Politics-specific copy + generic fallback. Niche `<N` gate (N=6) in `GenreExperience` hides rails → empty state.
- **AI-guided CTA (T8, prior):** prefills Companion chat with world hook.

## Explicitly DEFERRED (not drift — documented in spec)
The bespoke *native signatures* named in the design (Constellation map, dread-spectrum,
frontier map, director-spotlight, studio-lore) require NEW components not built here.
The 13-genre matrix uses the 6 real modules. These signatures are a SEPARATE build.

## Verification (all green, real exit codes)
- Client tests **86/86** (21 files) · Server tests **96/96** (16 files)
- Client typecheck 0 · Server typecheck 0 · Full build `built in ~827ms` exit 0
- Blind-spot: branch `0 20` ahead of `origin/main` (merge-base == origin/main tip `9f8b4a1`).

## How to run / review
```bash
cd "<worktree path>"
npm run dev          # open client URL (~:5173)
# /genre (picker) · /genre/documentary · /genre/science-fiction · /genre/western · etc.
```
- Niche gate visible on a genre with <6 titles (e.g. a thin `western` world shows the frontier empty state).
- PR: **NOT yet opened** — human review required first (Daniel clicks through `npm run dev`).

## Notes for next session
- "Polishes" — Daniel mentioned post-build UI polishes; not yet specified.
- The module data (credibility/watchOrder/arguments/geo maps) is prop-driven; the server
  `genreExperience` response doesn't yet populate them, so modules render empty in live
  app until a server enrichment pass feeds real per-title data. Tested via prop injection.
- Font migration (Fork 9 = B) still a SEPARATE whole-app workstream; genre code uses CSS vars.
