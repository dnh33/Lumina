# Genre Experience — Continuity Context (compaction-safe)

> Living ground-truth for the immersive genre-experience feature. **FEATURE-COMPLETE + LIVE-VERIFIED (2026-07-15).**
> Branch: `immersive-curated-genre-specific-experie` · Worktree: `.worktrees/immersive-curated-genre-specific-experie`

## What shipped
Standalone "genre world" experience at `/genre/:slug` + `/genre` picker. Genre-seeded
discovery engine (server) + a **config-driven module host** (client) rendering per-genre
module sets across **all 13 genres**, fed by **real per-title enrichment** from the server.

## v1.5 scope — ALL DONE + LIVE-WIRED
- **Module framework (T11):** `GenreModules` renders `genreWorld.modules` — one component, N configs.
- **6 modules, all rendering real data live:**
  - `timeline` (scrubber) · `topic`/TopicCluster (F2, from keywords) · `maker`/MakerSpotlight
    (director, from detail fetch) · `credibility`/CredibilityStrip (F4, watchProviders+ratings)
  - `watchorder`/WatchOrderSequencer (F5, seasons for tv) · `argument`/ArgumentPanel (F3, titleInsight thesis+counterpoint)
  - `geo`/GeoMap (originCountry)
- **Keyword normalization (G6, T10):** `TitleDetails.keywords` (movie/tv shapes).
- **13-genre matrix (T18 + spec):** `genreWorld` defines 13 worlds; `SLUG_ALIASES` extended.
- **Empty states (R6, metric 9, T17):** genre-specific + niche `<N=6` gate.
- **Real enrichment (EN, commit 711ce76):** `buildGenreExperience` accepts `modules`;
  `enrichGenreItems` fetches director/seasons/providers/originCountry/ratings/argument
  **only for enabled modules**; client builds module maps from `item.enrichment`.

## Bug caught by LIVE verification (commit 1f24887)
`buildGenreExperience` cached by `genres:mediaType:mode` **without `modules`** → a cached
no-modules build would serve a later modules-enabled request as un-enriched (modules looked
empty). Fixed: cache key now appends sorted modules. **Live-proven:** no-modules call = 0/20
enriched; with-modules call right after = 20/20 enriched, geo 20/20.

## LIVE verification — real server, real APIs (not mocks)
Booted server with TMDB + OpenRouter configured. `GET /api/discover/genre-experience?genres=documentary&modules=...` → HTTP 200, 20 items:
- geo (originCountry): **20/20** ✅  · maker (director): **20/20** ✅
- argument (thesis): **20/20** ✅  · credibility watchProviders: **16/20** ✅
- credibility IMDb/RT scores: **0/20** ⚠️ — `OMDB_API_KEY` NOT set in this dev env (OMDb
  call returns null). Code is correct; scores populate wherever OMDB_API_KEY exists.
- watchorder seasons: 0 — correct for movies (tv would populate).
**Lesson:** do NOT trust a port "listening". A zombie server was holding :4000 serving OLD
code and returned 0/20 enrichment until killed + cold-rebuilt on real code. Always kill the
port first, confirm the serving PID is YOUR process, force a cold cache rebuild, then probe.

## Verification (all green, real exit codes, last commit 1f24887)
- Client tests **87/87** (21 files) · Server tests **98/98** (16 files) — NOTE one client
  test (GenreExperience.guided) intermittently times out at 5s under full-suite contention;
  passes in isolation (778ms) + on re-run. Flaky, not a regression.
- Client typecheck 0 · Server typecheck 0 · Full build green
- Blind-spot: branch ~`0 21` ahead of `origin/main` (merge-base == origin/main tip)

## How to run / review
```bash
cd "<worktree path>"
# SERVER (needed for real enrichment): from server/ dir -> npx tsx src/index.ts  (listens :4000)
npm run dev          # opens client (Vite ~:5173) + server
# /genre (picker) · /genre/documentary · /genre/science-fiction · /genre/western · etc.
```
- Server is currently LIVE on `http://127.0.0.1:4000` (proc_861065968dfe / parent PID 23980,
  listener child 23148, TMDB+OpenRouter configured). Kill any stale holder on :4000 before
  restarting: `netstat -ano | grep :4000` → `taskkill /PID <pid> /F`.
- Every enabled module shows real data; OMDb scores blank here (no key).

## Notes for next session
- **PR NOT opened** — gated on Daniel's `npm run dev` review. Say "ship it" → final
  blind-spot check + `gh pr create` (NO "Generated with" trailer).
- "Polishes" — Daniel mentioned post-build UI polishes; not yet specified.
- Font migration (Fork 9 = B) still a SEPARATE whole-app workstream; genre code uses CSS vars.
- `git add -A` on EN commit swept in pre-existing untracked design docs + briefs (genre
  scope, no secrets) — acceptable, all related artifacts.
- Native signatures (Constellation/dread-spectrum/frontier-map/director-spotlight/studio-lore)
  remain a documented separate build (deferred, not drift).
- Memory note: write a cross-session lesson about killing-the-port + cold-cache before
  live-verifying (the zombie-on-4000 incident).

---

# WORLDS UX REFINEMENT — workstream context (compaction-safe, 2026-07-15)

> SEPARATE from the shipped feature above. This is the NEXT phase: investigate + plan the
> Worlds UI/UX holistically (new features + deepening + blind spots), per Daniel's directive.

## Locked decisions (this session)
- **Daniel's directive:** run a council thinking in WHOLE about Worlds UI — new value/immersion
  features, outside-the-box, blind angles — AND grill-with-docs on the plan. Then PLAN using
  `superpowers` writing skills. Save resilient context (this file).
- **Merge decision (clarify, 2026-07-15):** the council's 8 NEW feature ideas are MERGED INTO
  the build-now plan — NOT deferred to a Phase 7 backlog. (Prior plan had filed them as deferred;
  that was the miss Daniel caught: "Any new features? We literally had agents look into this.")
- **Process (superpowers):** Brainstorm → design doc (`docs/plans/YYYY-MM-DD-<topic>-design.md`,
  committed) → MANDATORY pre-build grill gate (subagents authored the research) → writing-plans →
  subagent TDD build. Do NOT write code before design approved. One question at a time.

## Council outputs (all committed)
- `docs/plans/cc-creative-opus.txt` — Opus creative council: 8 new features (ranked) + 6 blind angles.
  TOP idea: **metaphor is named not built** (all 13 worlds share one skeleton, recolored).
- `docs/plans/cc-grill-opus.txt` — Opus grill of the P1-P6 plan: found P1's premise half-true
  (splitting curator alone doesn't fix "UI waits on AI" — per-title `titleInsight` blocks items
  endpoint for `argument` worlds); + `logAnchor` storm during enrichment; + openGuided break; +
  P5 discover-builder doesn't exist; + P6 font lock; + decade authority.
- `docs/plans/council-visual-hierarchy-critique.md` — earlier 3-lens UX critique.
- `.hermes/plans/2026-07-15-worlds-ui-ux-refinement.md` — the P1-P6 plan, grill-hardened
  (commits `6257754` + `fa574ff`). Contains 6 ADRs (W1-W6: lazy enrichment, no logAnchor storm,
  single decade authority, font lock, cache-key verbatim, no phantom type) + glossary.

## The 8 new features (MERGED IN, build now)
1. Metaphor as layout grammar (Constellation node-map / Threshold corridor / Frontier geo-spine)
2. Ambient in-world Companion (diegetic narrator speaking `register`, pull-only)
3. "Why this belongs here" provenance (anchor match / shared director / topic on expand)
4. World persistence (save/resume scrub, steer, dismissed; deep-links `?decade=&mood=`)
5. Sound via existing `cueBeatMap` + `playCue` (currently fires nothing)
6. One spatial spine per world (demote other modules to contextual detail)
7. Per-world serendipity gesture (adjacent star / next door / ride further out)
8. Library density as place (lit/dark stars, read/unread spines)

## NEW broader council (COMPLETE, 2026-07-15) — `deleg_a74171be`
- `docs/plans/worlds-broader-council.md` — product lens: 10 new features BEYOND the 8, 8 deepenings,
  8 blind spots, promotion flags (must-have vs nice-to-have of the merged 8).
- `docs/plans/council-architecture-feasibility.md` — arch lens: cost/leverage/trap per feature,
  6 architecture blind spots (C1-C6).
- TOP new feature beyond the 8: **Cross-world warp** (Worlds map + neighboring-worlds rail).
- TOP deepening: **Timeline as the World's spine + taste overlay** (anchorsUsed/watchlist on decade axis).

### MUST-FIX BUGS the council found in SHIPPED code (not just plan gaps)
These are correctness/premise defects — fix BEFORE merging the 8 features (they'd inherit/amplify):
- **B1/TV unreachable + guided dead:** `GenreExperience.tsx:22` hardcodes `mediaType:"movie"`+`mode:"self"`.
  Server TV + guided paths exist but never triggered. Whole media dimension missing.
- **B2/Dead-end links:** `AnchorFrame` (plain `<li>`, no /title link) + `ArgumentPanel` counterpoint
  (plain text, no link) — two "personal" surfaces promise nav, deliver none.
- **B6/`logAnchor` storm STILL LIVE:** `enrichGenreItems` (`genreExperienceService.ts:149`) calls
  `titleInsight` w/ no `skipAnchorLog` guard. P1.6 fix NOT in code. G3 violation.
- **B3/`Generic` husks:** non-proof slugs → bare timeline, no metaphor/modules.
- **B5/`cueBeatMap` dead:** `playCue` never called on genre page; `register` ~90% unexpressed.
- Also live: `buildTopics` `Genre ${gid}`, geo `name:code`, `CredibilityStrip` fake `distributor:"Available"`.

### Promotion flags (merged 8)
- MUST-HAVE (ship w/ P1-P6): #1 metaphor grammar (1-2 flagships, not 6), #2 ambient Companion,
  #3 provenance, #4 persistence (w/ P2/P3 URL state), #6 spatial spine (fold into #1).
- NICE-TO-HAVE: #5 sound (cheap wiring now), #7 serendipity, #8 density-as-place.
- Cheap wins to take now (arch council): provenance via counterpoint, wire dead cueBeatMap,
  density via flag(), taste-origin via computeTasteProfile, render watchProviders already fetched.
- TRAPS: A1 metaphor = EXPENSIVE if all 6 (font lock caps immersion, ×6 a11y); A6 spatial spine
  TRAP if staffed separately (subsumed by P4+A1).

### Architecture blind spots to design against (C1-C6)
C1 state sprawl (URL+localStorage+server steer = 3+ sources of truth → single authority),
C2 world-level reconcile missing (persisted state no invalidate-on-library-change),
C3 ×6 a11y surfaces if all metaphors, C4 font lock caps immersion (color/spacing/sound only),
C5 Companion-on-/genre chat collision (App.tsx:56 hides ChatDock; reconcile conversation keys),
C6 per-metaphor empty states (generic empty state insufficient for bespoke layouts).

## Next action (do NOT start coding)
1. ✅ Await broader council → DONE (above).
2. ✅ Design doc `docs/plans/2026-07-15-worlds-v2-design.md` — WRITTEN + grill-gated (4 lenses).
3. ✅ GRILL GATE → 4 lenses; caught overstated claims (K3 net-new, K1 guided fiction, K2 server
   shape, W4 accent hollow, B1 net-new engine, C1/C2/C5 state unbuilt, C5 whisper deterministic).
4. ✅ SCOPE DECISION (clarify 2026-07-15): **option B — merge ALL features, cheap-wins-first.**
   (Earlier doc contradiction §7 Q1 vs line 30 resolved; all C1-C10 ship in v2.)
5. ✅ PLAN `docs/plans/2026-07-15-worlds-v2-plan.md` (writing-plans) — 7 phases, bite-sized TDD
   tasks, exact file:line, verification. Committed `f51e110`.
6. ⟶ BUILD via subagent-driven-development (delegate_task, fresh per task, 2-stage review).
   Daniel: "do it properly + pro-actively save temp context + use subagents to save context."
   → Phase 1 (Tasks 1.1-1.9, must-fix bugs) dispatched first.

## BUILD STATE (update as phases complete)
- **PHASE 1 COMPLETE + VERIFIED** (orchestrator: server 102 tests, client 110 tests, both
  typechecks clean). All 9 must-fix bugs shipped:
  * 1.1 `6c8be40` skipAnchorLog (2 sites) · 1.2 `7a9daa0` thread via enrichGenreItems
  * 1.3 `ef4a162` AnchorFrame links · 1.4 `eba0ff4` server counterpoint tmdbId (K2 complete)
  * 1.5 `13c26fd` ArgumentPanel link · 1.6 `4906880` label bugs (K6)
  * 1.7 `3cd85de` cueBeatMap→playCue · 1.8 `a96e7ca` register.accent (W4)
  * 1.9 `17d2136` non-proof genres real modules (K4)
- **PHASE 2 (Layer A complaint fixes P1-P6) STARTED.**
  * Wave 2.1 DONE + REVIEWED (1ad8e30): split intro → /discover/genre-intro + buildGenreIntro
    (own cache key), openGuided rewired to non-blocking intro query. Orchestrator: server 107,
    client 111 tests. PASS — rails no longer block on LLM intro.
  * Wave 2.2 DONE + REVIEWED (5d1f0b1): lazy per-title argument enrichment. Orchestrator:
    server 109, client 114 tests. Rails paint instantly (no LLM in items endpoint). PASS.
  * Wave 2.3 DONE + REVIEWED (3a9dbf6): page-scope decade filter + arrows; K2 locked.
    Orchestrator: client 123 tests. (2.5 was no-op — K2 already done; locked with test.)
  * Wave 2.4a DONE + REVIEWED (5d12d90): 2.6 search/sort/tags + 2.8 mode/mediaType steer.
    Orchestrator: client 127 tests. Subagent corrected brief type error (it.tags→genreIds). PASS.
  * Wave 2.4b/2.4c DONE + REVIEWED (b29d18f): 2.7 composed TitleCard + 2.9 world-accent CTA.
    Orchestrator: client 129 tests. PHASE 2 COMPLETE (P1-P6 complaints all fixed + verified).
  * PHASE 3 (cheap value-provers, plan tasks 3.1-3.7) STARTED.
    - Batch 1 DONE + REVIEWED: 3.1 (7af24ee provenance), 3.3 (b5d25e5 mood
      entry), 3.4 (timeline overlay C9). Orchestrator: client 140 tests. All additive, parallel
      cross-edits on shared files verified safe.
    - Batch 2 DONE + REVIEWED: 3.2 (888cf68 world-origin), 3.5 (presets), 3.6 (whisper strip),
      3.7 (10066e5 bootstrap). Orchestrator: client 152 tests. PHASE 3 COMPLETE (3.1-3.7).
  * PHASE 4 (differentiation engine) STARTED — expensive, sequenced per option B.
    - Wave 4a DISPATCHED (deleg_6d6f63d0): 4.4 persistence (B4) — useGenreState + GENRE_STATE_KEY
      + server libraryVersion. Single state authority (W8). Touches page state wiring.
    - Wave 4b (after 4.4): 4.1 metaphor grammar (B1) — 1-2 flagship bespoke (Constellation
      node-backdrop, Frontier geo-spine) + themed TitleCard variants (NOT full graph engine).
    - Wave 4c (after 4.1): 4.3 ambient Companion (B2) — ChatThread on /genre, distinct
      GENRE_DOCK_CONVERSATION_KEY, no remount-across-slug (fix App.tsx pathname key).
  * PHASE 5 (structural nav, LAST): 5.1 cross-world warp (C1), 5.2 decade zoom (D1), 5.3 density
    (B8). PHASE 6 (deepenings): 6.1 argument dialogue (D2), 6.2 geo/Frontier (D4), 6.3 critic (D5),
    6.4 compare (C4), 6.5 export (C6), 6.6 marathon (C7). PHASE 7: TV genre (K1) + a11y + final
    verify + PR (gated on Daniel's /npm run dev review).
- PHASES 5-7: pending (structural nav, deepenings, TV+a11y). See wave breakdown above.
- VERIFIED GATE: re-run `npm run test` (server+client) + typecheck + build after each wave.
- RESILIENCE: at ~62% context — CONTEXT-TEMP is the compaction-survival doc; commit it often.
- COMMITS so far (this workstream): `b2873b2` broader council, `1122d6e` design, `09ac32f` grill
  fold, `6ae2b78` scope resolve, `f51e110` plan. (Feature code commits land as subagents finish.)

## Env / run-state
- Branch `immersive-curated-genre-specific-experie`, ahead of origin/main. Worktree:
  `.worktrees/immersive-curated-genre-specific-experie`.
- Server previously killed (port 4000 free). `.env` symlinked from primary repo (NOT committed).
- CC quota 429 wall persists → direct `delegate_task` (sonnet/opus leaf) for TDD build.
- No "Generated with" PR trailer. Human review (Daniel) required before merge.
