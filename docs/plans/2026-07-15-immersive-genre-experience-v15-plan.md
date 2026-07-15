# Immersive Genre Experience — v1.5 Implementation Plan

> Reverses the 2026-07-15 decision 3-A (empty-states deferred). v1.5 is now IN-SCOPE for this PR alongside v1.
> v1 (Tasks 1-9) is built + verified (71/71 client, 93/93 server, both builds green). This plan covers the deferred surface.
> Design authority: `2026-07-15-immersive-genre-experience-design.md` §13.5 / §13.7 / §13.8, R6 (line 123), G6 (line 25), metric 9.

## v1.5 scope (from design doc)
**Architecture rule (§13.8):** genre-modules are switched on per genre via `genreWorld` config, rendered by **ONE parameterized `GenreModules` component** — NOT N page variants. v1 already ships `TimelineScrubber` (doc F7) as the proof module.

### Modules to add (gated config)
| Key | Feature | Design ref | Powered by (real asset) |
|---|---|---|---|
| `topic` | Topic/theme threading (F2) | §13.4 F2 | `normalize.ts` keywords + `tasteProfile.topTags` + `retrieveLibrary` (RAG) — **needs keyword norm (G6)** |
| `argument` | "The Argument" panel (F3) | §13.4 F3 | `insightService.titleInsight` `text`/`hook`/`comparisons.relation` → `compare_titles` |
| `credibility` | Credibility/source strip (F4) | §13.4 F4 | `TitleDetails.watchProviders` + OMDb `ensureRatings` + `ratingsService` + `insightService` `Take` |
| `watchOrder` | Watch-order Sequencer (F5) | §13.4 F5 | `normalizeDetails.seasons` (`normalize.ts:171-199`) + `discoverService.upNext` (`discoverService.ts:154-203`) |
| `geo` | Geo Map | §13.8 | new — region/map view for Travel/War/History archetypes (highest ambiguity; see Notes) |

### Other v1.5 surface
- **Keyword normalization (G6):** add `raw.keywords → TitleDetails.keywords` in `normalize.ts` so `topic` module is real, not `similar`+`topTags` fallback.
- **Empty states (R6, metric 9):** 3 genre-specific empties (Western / Music / War&Politics) + a **niche `<N` titles gate** — when a genre has fewer than N titles, render a tailored empty/sparse state instead of a blank rail.
- **Wire modules into the 3 proof genres** via `genreWorld`: Documentary → `topic`+`argument`+`credibility`+`watchOrder`; Sci-Fi/Horror → appropriate subset (constellation/threshold archetypes).

## Execution notes
- **CC quota wall is UP this session** (T4/T5/T6 aborted ~23s, exit 1, 0-byte JSON). Per `claude-code-infra` REPEATED-WALL RULE: execute v1.5 **directly in Hermes** (write failing test → implement → `npm run test`/`typecheck`/`build` → commit). Do NOT re-dispatch to CC.
- **Font migration (Fork 9 = B):** still a SEPARATE whole-app workstream — NOT in these tasks. Components consume `var(--font-display)`/`var(--font-sans)`.
- **Monorepo vitest:** run from `client/` dir (`cd client && npx vitest run <file>`), not root `--workspace client` (jsdom/env drift). Capture REAL exit codes; `npm run build` is the gate `tsc` misses.
- **Server-side changes are minimal** (only `normalize.ts` keyword field). Most modules are client-side, reusing existing services — lower risk than v1.

## Tasks (TDD)
- **T10 — Keyword normalization (G6).** `normalize.ts`: map `raw.keywords` → `TitleDetails.keywords: {id,name}[]`. Server test asserts shape. Enables `topic`.
- **T11 — GenreModule framework.** `client/src/components/genre/GenreModules.tsx` + `genreWorld.modules: ModuleKey[]` per genre. Renders enabled modules over `world` + `experience`. Test: given a world with `['topic']`, renders TopicCluster; given `[]`, renders nothing extra.
- **T12 — Topic Cluster (F2).** `TopicCluster.tsx`: pick keyword → vertical spine of titles, cross-linked to watched (via `retrieveLibrary`). Test with mocked `api`/`retrieveLibrary`.
- **T13 — Credibility strip (F4).** `CredibilityStrip.tsx`: provenance (distributor, theatrical-vs-streaming, critics consensus, LLM stance tag) for a title. Test asserts fields render from a fixture.
- **T14 — Watch-order Sequencer (F5).** `WatchOrderSequencer.tsx`: seasons as chapters + recommended start + in-library progress. Test with a fixture season set.
- **T15 — "The Argument" panel (F3).** `ArgumentPanel.tsx`: per-title thesis + counterpoint pointer to divergent neighbor (`compare_titles`). Test with fixture insights.
- **T16 — Geo Map module.** `GeoMap.tsx`: region/map view for geo archetypes. **Fidelity TBD** — see Notes; confirm with Daniel before building (highest ambiguity).
- **T17 — Empty states (R6, metric 9).** `GenreEmptyState.tsx` with 3 genre-specific copies (Western/Music/War&Politics) + niche `<N` gate in `GenreExperience` (if `items.length < N` → render empty state, not blank rail). Test: <N items → empty state; ≥N → rails. N default 6 (configurable).
- **T18 — Wire modules into 3 proof genres.** Extend `genreWorld` with `modules` per genre; verify each proof genre renders its modules.
- **T19 — Full gate sweep + smoke.** Server tests + client tests + both typechecks + both builds. Blind-spot check. Then PR (human review).

## Decisions / assumptions
- Proof-genre scope stays **3 genres** (Documentary/Sci-Fi/Horror) unless Daniel expands to the 13-genre matrix (see open question).
- Niche threshold N = 6 (configurable in `genreWorld`); design says "<N" without a number.
- `geo` module fidelity (real map lib vs. stylized region view) is the one open implementation question — flagged, not assumed.

## Open question for Daniel (BEFORE T16/T18)
Does "every planned feature" mean (a) full v1.5 across the **3 proof genres** only, or (b) also expand to the **full 13-genre matrix** (design §13.3, noted as ~2-3× one build)? This changes T18 + total size materially.
