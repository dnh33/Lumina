# Critics Scores (IMDb · Rotten Tomatoes) — Implementation Plan

> **For Hermes:** Implement task-by-task using the todo list. TDD where a behavior can be unit-tested; wire-only tasks get a contract test. Apply frontend-design + ui-ux-pro-max skills to the client surfaces.

**Goal:** Show IMDb and Rotten Tomatoes critics scores alongside TMDb, clearly separated from the user's personal 1–10 rating, across TitleDetail, library cards, and as a library sort option — fetched via OMDb, cached server-side, with graceful no-key / no-data handling.

**Architecture:** Critics scores belong to the *title* (shared across every library entry for a `tmdb_id`), so they live on the `titles` table (`imdb_rating`, `rt_rating`, `imdb_id`, `ratings_fetched_at`). The user's `library.rating` is never touched. Enrichment is **lazy + cached + manual backfill**: populate on TitleDetail open, serve from a 30-day cache, and a manual `POST /api/library/enrich-all` backfills the whole library within the 1k/day OMDb budget. TMDb supplies the IMDb id via `external_ids`; OMDb (`?i=<imdbId>&tomatoes=true`) supplies IMDb + RT.

**Tech Stack:** TypeScript (server + client), better-sqlite3, Express, React 19 + Vite, Tailwind, framer-motion (reduced-motion honored), Vitest.

**Scale discipline:**
- IMDb stored/displayed as 0–10 (parsed from `"8.0/10"`).
- RT stored/displayed as 0–100 (parsed from `"92%"`).
- TMDb `vote_average` stays as-is (0–10) and is the third pillar of the "Critics" cluster.

---

## Task 1 — Schema migration v4
Add `imdb_id TEXT`, `imdb_rating REAL`, `rt_rating REAL`, `ratings_fetched_at INTEGER` to `titles`. Append a v4 migration to `server/src/db/schema.ts` (never edit existing migrations).
- Test: `server/test/db.test.ts` — assert the new columns exist and a migrated row round-trips.

## Task 2 — TMDb IMDb id plumbing
- `server/src/tmdb/types.ts`: add `imdb_id?` to `RawTmdbDetails` and `imdbId: string | null` to `TitleDetails`.
- `server/src/services/libraryService.ts`: add `external_ids` to the `append_to_response` list in `fetchDetailsFromTmdb`; add `imdb_id` to `upsertTitle` write/params.
- `server/src/tmdb/normalize.ts`: map `raw.external_ids?.imdb_id` → `imdbId`.
- Test: normalize unit test for imdbId mapping.

## Task 3 — ratingsService (OMDb)
New `server/src/services/ratingsService.ts`: `ensureRatings(db, tmdbId, mediaType)` → resolves `imdb_id` (from `titles` row or `external_ids` fetch), calls OMDb `?i=<imdbId>&tomatoes=true`, parses IMDb + RT, writes `imdb_rating`/`rt_rating`/`ratings_fetched_at` (30-day TTL: skip if fresh), returns `{ imdb: number|null, rt: number|null }`. No `OMDB_API_KEY` → returns nulls, no network.
- Test: `server/test/ratingsService.test.ts` — mock `global.fetch`, assert parsing of `8.0/10` + `92%`, TTL skip on fresh row, no-fetch when key absent.

## Task 4 — Lazy enrichment on title open
`server/src/routes/catalog.ts` `/tmdb/title/:type/:id`: after `fetchDetailsFromTmdb`, `await ensureRatings(...)`, attach `imdbRating`/`rtRating` from the titles row into `details`. Server typecheck + tests.

## Task 5 — Client types
`client/src/lib/types.ts`: add `imdbRating: number | null`, `rtRating: number | null` to `LibraryEntry` and `CatalogItem`. `TitleDetails` already extends `CatalogItem`.

## Task 6 — TitleDetail Critics cluster
New `CriticsCluster` in `client/src/pages/TitleDetail.tsx` (or its own component file): beneath the user's hero rating, show **IMDb · RT · TMDb** as a tight secondary group, with a "You vs the crowd" delta when the user has rated. Honor reduced-motion, focus rings, 44px targets, contrast. Your rating remains the hero; critics are visually subordinate.
- Test: `CriticsCluster.test.tsx` — asserts three sources render, your rating is distinct, and the cluster is absent when all null.

## Task 7 — PosterCard critics micro-badge
`client/src/components/PosterCard.tsx`: add a small critics badge (IMDb/RT) shown only when present, visually distinct from the gold `myRating` badge and the existing TMDb `voteAverage` badge. Pass `imdbRating`/`rtRating` through `CatalogItem`.
- Test: badge renders only when data present; distinct from personal rating.

## Task 8 — Library sort by critics
- Server `listLibrary` (`libraryService.ts`): add `"critics"` to `ListFilters.sort`, order by `rt_rating DESC NULLS LAST, imdb_rating DESC NULLS LAST`.
- `client/src/pages/Library.tsx`: add "By critics" sort option; map `imdbRating`/`rtRating` into the `CatalogItem` passed to `PosterCard`.
- Test: server `listLibrary` critics-sort ordering; client option renders.

## Task 9 — Config + backfill endpoint
- `server/src/env.ts`: add `omdbApiKey: process.env.OMDB_API_KEY ?? ""`.
- `server/src/routes/library.ts`: `POST /api/library/enrich-all` → iterate titles lacking fresh ratings, call `ensureRatings`, return `{ enriched: number }`. Guarded: no-op (200, count 0) when no key.
- Document `OMDB_API_KEY` in `.env.example` (no key committed).

## Task 10 — Final verification
- `npm run typecheck` (server + client) exit 0.
- `npm run test --workspace server` + `CI=true npm run test --workspace client` green.
- `npm run build` succeeds.

**Out of scope (YAGNI):** Metacritic display (OMDb returns it but user asked IMDb + RT), per-title manual refresh button, auto-enrich on library listing.
