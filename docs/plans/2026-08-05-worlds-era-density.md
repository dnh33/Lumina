# Worlds — Era density + rail quality (2026-08-05)

Complement to multi-page discover: more titles only help if each decade’s suggestions are **valuable**, not vote/popularity filler.

## Ownership split

| Layer | Owner | What |
|-------|--------|------|
| Discover pool size | Sibling | `DISCOVER_PAGES` + popularity sort + vote_count floors in `genreExperienceService` |
| Quality / ranking / diversification | This note | `eraRailQuality.ts` + sparse-decade backfill + `selectEraBalancedRail` after `flag()`, before enrich / guided |

Cache key: **`v6:`** (v3 multi-page → v5 backfill → v6 doc craft floor).

## Quality rules (shipped)

1. **Per-decade balance** — Soft-min (~2) then round-robin fill; hard cap **8 / decade** so one mega-decade cannot eat All-eras.
2. **Sparse-decade backfill** — If popularity pages leave a target decade under soft-min (e.g. Documentary **1970s**), fetch one vote-sorted page bounded to that decade and merge before trim. Caps still apply.
3. **Integrity over vote spam** — `worldIntegrityScore` soft-caps `voteAverage` (≤ 8.2 × 10). Vote is a signal, not a monopoly.
4. **Genre / metaphor integrity**
   - **documentary:** require genre id `99` when ids present; craft floor `voteAverage >= 6.8` (drops Jackass-tier noise); boost real docs; demote thin overview + high-pop / low-vote junk.
   - **film-noir:** same affinity thinking as `GenreEmptyState` (keyword + thriller/mystery; prestige demotion). Floor drops Shawshank/Godfather-class pollution before diversification.
5. **Featured / Guided stay sharp** — Quality **filters the pool**; it does not replace shelf logic. Self Featured still vote-picks among steered; Guided still `rankForGuided` on the curated set. Junk never enters, so shelves stay pointed.
6. **Enrich after trim** — Detail/ratings fetches only run on titles that survive the rail.

## Timeline feel

Era tabs should read as stocked shelves of *plausible world titles*, not a popularity dump. Cap + soft-min + backfill keep 1970s Documentary from looking barren next to 2010s when the raw popularity pool is recent-heavy.

## Verify

- Documentary → **2010s** and **1970s** both show multiple plausible docs (not random fiction / prestige leak).
- film-noir empty-state + experience rail both refuse prestige-by-vote.
- Guided Tonight shelf still reorders from beats after quality trim.

## Density sibling verify (2026-08-06)

- Pages fetched: **1–3** (`fetchDiscoverPages`), dedupe by id; sort **`popularity.desc`**; floors movie **250** / tv **100**
- Unit: `genreExperience.discoverPages.test.ts` **3/3 PASS**; guided Tonight still **3** picks on 60-item list
- Documentary movie counts (live TMDB probe; browser still stale until API restart):

| | Total | 2010s | 2020s | 2000s |
|--|------:|------:|------:|------:|
| Before (running API) | 20 | 10 | 3 | 2 |
| After pool (pages 1–3) | 60 | 24 | 21 | 9 |
| After quality trim (v4 path sampled) | 30 | 8 | 8 | 8 |

**Daniel must restart the API** — server-only change; Vite HMR will not apply it.
