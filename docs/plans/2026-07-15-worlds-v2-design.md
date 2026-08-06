# Worlds v2 — Immersive Genre Experience: Design

> **Status:** DESIGN (brainstorm synthesis). Not yet grill-gated, not yet a plan, not code.
> **Author:** Rune (orchestrator), synthesizing two council rounds + superpowers pipeline.
> **Supersedes:** `.hermes/plans/2026-07-15-worlds-ui-ux-refinement.md` (P1–P6 complaint-fix plan) — that plan is merged IN here, hardened by the grill findings.

## 1. Goal & framing

Turn the genre **World** (`/genre/:slug`) from a static, AI-gated, non-interactive, recolored
skeleton into a **composed, steerable, immersive, returnable place** — and close the four
original complaints *plus* the deeper "unfinished / coat-of-paint" problem *plus* ship the
council's new-feature vision.

**Hard constraints (carried from prior sessions + grill):**
- **Private, local-first, single-user.** No social graph, no collaborative filtering, no
  engagement optimization. "For you" must be *transparent* (provenance), not a black box.
- **Locked system:** fonts are two tokens (`--font-display`, `--font-sans`); motion/sound
  policy is global (`MotionConfig reducedMotion="user"`, `SOUND_KEY` mute). Per-metaphor
  font swaps are **forbidden** (ADR-W4). **GRILL CORRECTION (W4):** "accent color immersion"
  is currently hollow — every genre component hardcodes `amber-400` and `genreWorld.ts` has NO
  accent token. So differentiation today = a text label + spacing, all amber. **Must add
  `register.accent` (CSS var) and consume it** before "accent color" is a real differentiator.
- **No write side-effects during curation** (G3/ADR-W2): building/reading a World must not
  mutate the user's anchor/comparison graph.
- **Single source of truth for filter/persist state** (ADR-W3, C1): client is authority;
  server steer opts are inert until the deferred re-query ships.

## 2. What we are building (scope)

Three layers, all in this build (user decision 2026-07-15: merge the new features in, not defer):

### Layer A — Complaint fixes (P1–P6, grill-hardened)
- **A1 / #3 UI-waits-on-AI:** decouple curator `intro` AND make per-title LLM enrichment
  **lazy/streamed** (base items paint instantly; `argument`/`maker`/`credibility` fill in).
  Fix the live `logAnchor` storm (ADR-W2). (See §4 bugs.)
- **A2 / #1+#2 timeline:** sticky rail with ← → arrows; decade lifts to page scope (filters
  every module); titles become clickable `PosterCard`.
- **A3 / #4 steering:** client search + sort + tag chips (zero-latency).
- **A4 / wall-of-panels:** per-title `TitleCard` composition + module Tabs; fix `Genre ${gid}`
  labels (static `GENRE_ID_NAMES`); fix geo `name:code`; fix `CredibilityStrip` fake
  `distributor:"Available"`.
- **A5 / deep steer:** server opts (`keyword`/`decade`/`sort`/`provider`/`lang`) reserved for
  deferred re-query; "Steer this World" → Companion prefill. (Guarded, not live yet.)
- **A6 / polish:** metaphor accent color + spacing gesture; sparse-state polish.

### Layer B — Merged new features (the 8, with promotion flags)
**MUST-HAVE (ship with Layer A):**
- **B1 Metaphor as layout grammar** — but **1–2 flagship metaphors only** (Constellation
  node-map + Frontier geo-spine), the other 5 as *themed variants* of the TitleCard composition.
  NOT six bespoke snowflakes (trap: ×6 a11y + font lock caps it).
- **B2 Ambient in-world Companion** — diegetic narrator speaking `register.lexicon`/`tonePrompt`,
  pull-only, never interrupts; replaces the eject-to-`/chat` CTA. Reuses the chat stack.
  Reconcile conversation key with `ChatDock` suppression (C5).
- **B3 "Why this belongs here" provenance** — per-card: shared director / topic / counterpoint
  link. Cheap path via existing `enrichment`+`counterpoint` (precise per-title anchor match is
  net-new, defer).
- **B4 World persistence** — URL params (`?decade&?q&?sort&?tags`) + one `localStorage` blob
  (scrub/steer/dismissed); deep-links. Land WITH A2/A3 URL state (C1/C2).
- **B6 One spatial spine per world** — fold into B1/P4; demote other modules to contextual
  detail; keep "show everything" escape hatch. (Do NOT staff separately — trap.)

**NICE-TO-HAVE (delight layer, post-Layer-A):**
- **B5 Sound via `cueBeatMap`** — wire the dead `register.cueBeatMap` to existing `playCue`
  beats (open/filter/card-open). Sound-off default, reduced-motion honored. Cheap, high win.
- **B7 Per-world serendipity gesture** — TMDB rec-graph variant (cheap); true taste-distance defer.
- **B8 Library density as place** — lit/dark stars, read/unread spines via `flag()` booleans.

### Layer C — New council features *beyond* the 8 (prioritized, proposed for this build)
Pulled from `worlds-broader-council.md` (top of each list). Proposed MUST-CONSIDER:
- **C1 Cross-world warp** — Worlds map (new `adjacency` in `genreWorld.ts`) + "Neighboring
  worlds" rail on every page. Gives the whole feature a spine; kills one-page-at-a-time.
- **C2 Mood / context entry** — `moods[]` on `GenreWorld` + front-door resolver on `GenrePicker`
  ("unsettle me / comfort me"). Highest-leverage use of dead `register`.
- **C3 "Why this genre for you"** (world-level) — hero line from `anchorsUsed`+`profileState`.
  Cheap, private-app superpower.
- **C4 Juxtaposition / compare mode** — `/genre/:a..:b?compare` overlays two Worlds.
- **C5 Ambient whisper strip** — one-line world-read that re-captions as you filter (distinct
  from B2 Companion). **GRILL CORRECTION:** define C5 as a **deterministic filter→string
  template**, explicitly NOT routed through the Companion persona (else double-narration with B2).
- **C6 Export/save World as note** — Markdown into notes store + printable.
- **C7 Marathon builder** — sequence from `watchorder`+watchlist, save as playlist.
- **C8 Steering presets** — quick chips mapping to existing server opts (no new LLM).
- **C9 Taste-evolution overlay on timeline** — `anchorsUsed`+watchlist markers on decade axis.
- **C10 Cold-start bootstrap loop** — empty state action: search→add anchor→re-query.

### Layer D — Deepenings (modules + metaphors)
From `worlds-broader-council.md` (B-section). Highest-impact:
- **D1 Timeline = World's spine + taste overlay** (anchors/watchlist on decade axis, per-decade
  LLM era-thesis, decade *zooms* not just filters). **IMPLEMENTED (B6a, 2026-07-16):** selecting a
  decade applies a layout-affecting `zoomed-decade` emphasis on `#world-main` AND swaps the
  deterministic fallback thesis for a lazily-fetched LLM era-thesis (cached per `(slug, decade)`,
  graceful fallback). No longer the visual-only / LLM-free reshaped version noted in the review.
- **D2 Argument = dialogue** (counterpoint becomes real `/title` link; user annotation stored
  locally; surface pro/con/neutral from `insight.comparisons`).
- **D3 Metaphor layouts** (B1 realized): **GRILL CORRECTION — Constellation node-map is a LARGE
  net-new layout engine** (no node-graph/coordinate/edge/pan-zoom model exists; `GenreModules`
  is one skeleton, `GeoMap` is a per-title bar). Scope Constellation as **"node backdrop +
  themed TitleCard"** (decorative constellation lines behind existing cards), NOT a full
  graph engine — or add an explicit engine line-item with its own estimate. Frontier geo-spine
  is closer but still bar-not-spine; Panel gutters + Threshold corridor are feasible themed
  variants. From one shared primitive kit.
- **D4 Geo fix** (ISO→name, real region view, your-region-vs-world; spine for Frontier).
- **D5 Critic deepen** (consensus divergence IMDb≠RT, you-vs-critics, provider deep-link).
- **D6 Maker index** (recurring directors, affinity, sort-by-director).
- **D7 Topic as navigational axis** (click spine filters; LLM themes optional).
- **D8 WatchOrder sequence** (cross-title order + progress; feeds C7 marathon).

## 3. Build order (RESOLVED: full merge / option B, cheap-wins-first)

Daniel's call (2026-07-15): **option B — merge ALL features, kitchen-sink, but build
cheap-wins-first** so the World proves itself alive before the expensive nav layers land.
This manages the grill's "4 concurrent interaction models" risk (B1 + C1 + D1 + B2) by
sequencing, not by cutting. Everything ships in v2.

1. **Foundations + must-fix bugs (§4)** — K3 `skipAnchorLog` (net-new, 2 sites), K2 dead-end
   links (AnchorFrame safe; ArgumentPanel needs server shape change), K4 Generic husks,
   K5 cueBeatMap wire, K6 label/name bugs. Unblock everything.
2. **Layer A complaint fixes (P1–P6)** — AI-decouple + lazy enrichment, timeline arrows +
   page-scope + clickable, search/sort/tags, TitleCard composition + tabs + label fixes, deep-steer
   plumbing, metaphor accent + polish. Page becomes interactive + composed.
3. **Cheap value-provers (lead, prove alive):** B3 provenance (counterpoint+director+topic),
   B5 sound (wire dead cueBeatMap), C3 world-origin (anchorsUsed+profileState), C2 mood entry
   (register.moods[] + GenrePicker resolver), C9 taste-overlay (anchors/watchlist on decade),
   C8 steering presets, C5 whisper strip (deterministic template), C10 cold-start bootstrap.
4. **Differentiation engine:** B1 metaphor grammar (1–2 flagship bespoke + themed variants),
   W4 accent token (register.accent), B6 spatial spine (fold into B1/P4), B2 ambient Companion
   (distinct GENRE_DOCK_CONVERSATION_KEY, no remount-across-slug), B4 persistence (GENRE_STATE_KEY
   + useGenreState; libraryVersion reconcile DEFERRED — persisted blob is filter/steer-only and
   library-agnostic, live items come from react-query, so no reconcile needed; revisit only if the
   blob starts caching library-derived payload).
5. **Structural nav (expensive, sequenced LAST):** C1 cross-world warp (adjacency + neighbor
   rail), D1 timeline becomes World's spine + decade zoom + taste overlay, B8 density-as-place.
6. **Deepenings D2–D8:** Argument dialogue (server counterpoint.tmdbId), Geo fix + Frontier
   spine, Critic deepen (IMDb≠RT, provider link), Maker index, Topic axis, WatchOrder sequence,
   D4–D7. C4 compare mode, C6 export-as-note, C7 marathon (feeds D8) land here.
7. **TV (K1):** ship TV (client mediaType param — path real); **drop `guided` fiction** (either
   build genuine guided branching in a v2.x or remove the claim — NOT shipped as a no-op).
8. **Polish + a11y pass per metaphor (C3/C6):** parameterized GenreEmptyState by metaphor;
   audit each bespoke layout's keyboard/focus/screen-reader semantics.

## 4. MUST-FIX bugs in SHIPPED code (fix before merging Layer B — they'd inherit/amplify)

| ID | Bug | Evidence | Fix |
|---|---|---|---|
| K1 | **TV + `guided` mode unreachable** | `GenreExperience.tsx:22` hardcodes `mediaType:"movie"`+`mode:"self"`. TV discover path IS real (`genreExperienceService.ts:258` `/discover/${mediaType}`, route parses `tv`). **BUT `guided` is fiction:** `mode` only enters the cache key + `res.mode` — `curatorIntro`/`enrichGenreItems` never branch on it, so `guided` ≡ `self`. Fix = real guided branching OR drop the claim; NOT "just wire a toggle." | Parameterize client from route+UI; add genuine guided server behavior (or remove). |
| K2 | **Dead-end links** | `AnchorFrame` plain `<li>` (carries tmdbId → SAFE `<Link>`). `ArgumentPanel` counterpoint plain text AND has **no tmdbId** (server drops it at `enrichGenreItems:153`; `insight.comparisons[0]` has tmdbId but isn't passed through). Fix needs a **server shape change** (pass tmdbId/mediaType), not just a client `<Link>`. | AnchorFrame: wrap in `<Link>`. ArgumentPanel: server must carry counterpoint.tmdbId first. |
| K3 | **`logAnchor` storm STILL LIVE** | `enrichGenreItems` (`:149`) calls `titleInsight(db, tmdbId, mediaType)` — `skipAnchorLog` **does not exist** (signature `(db, tmdbId, mediaType, refresh=false)`, `insightService.ts:191`). Must be **ADDED**, guarding BOTH write sites: `logAnchor(…,"take")` (`:234`) + neighbor loop `logAnchor(…,"insight_neighbors")` (`:271-273`). | Add `skipAnchorLog` param to `titleInsight`; thread through both sites; server test asserts no writes. |
| K4 | **`Generic` husks** | non-proof slugs → `getGenreWorld` returns bare timeline, no metaphor/modules | Give every genre a real (if minimal) `GenreWorld`; or honest bootstrap (C10) |
| K5 | **`cueBeatMap` dead** | `playCue` never called on genre page; `register` ~90% unexpressed | Wire B5 (consume `cueBeatMap`) |
| K6 | **Label/name bugs** | `buildTopics` `Genre ${gid}`; geo `name:code`; `CredibilityStrip` fake `distributor:"Available"` | `GENRE_ID_NAMES` const; ISO→name; render real `watchProviders` |

## 5. Architecture blind spots to design against (C1–C6)

- **C1 State sprawl** — **GRILL: the "single authority + one serializer" is currently HAND-WAVED,
  not built.** `GenreExperience.tsx` reads only `useParams` slug + one react-query; no URL
  params, no genre localStorage key (`keys.ts` has none). Must ADD `GENRE_STATE_KEY` +
  `useGenreState` serializing `{decade,q,sort,tags}`→URL and `{scrub,steer,dismissed}`→
  localStorage in ONE writer; react-query reads from it.
- **C2 World-level reconcile DEFERRED** — persisted blob is filter/steer-only and library-agnostic;
  live items come from react-query, so no reconcile needed; revisit only if the blob starts caching
  library-derived payload. (Originally scoped as `libraryVersion(db)` = `MAX(updated_at)`+row count
  stamped on the blob and compared on load — dropped as an orphaned net-UX-regression risk.)
- **C3 ×6 a11y surfaces** if all metaphors built bespoke. Cap B1 at 1–2 flagships; audit each.
- **C4 Font lock caps immersion** — set expectation: payoff = "tasteful differentiation," not
  deep immersion, until font system unlocks.
- **C5 Companion-on-`/genre` collision** — **GRILL: collision is REAL and specific.** `App.tsx:56`
  hides `ChatDock`; `ChatDock` reads/writes global `DOCK_CONVERSATION_KEY`. Embedding B2's
  `ChatThread` with the same key = two threads fight one id; AND `App.tsx:32-37` keys motion by
  `pathname`, so `/genre/a`→`/genre/b` remounts `GenreExperience` → remounts embedded thread →
  aborts in-flight stream. Fix: distinct `GENRE_DOCK_CONVERSATION_KEY` + don't remount thread
  across slug changes (lift or pause stream).
- **C6 Per-metaphor empty states** — generic empty state insufficient for bespoke layouts; each
  metaphor needs its own graceful degradation (incl. mid-load + LLM-`argument`-fail where
  `enrichment` is `null`). Parameterize `GenreEmptyState` by `metaphor`.

## 6. ADRs (carried + new)

- **W1** AI-decoupling = lazy enrichment, not just intro split.
- **W2** No anchor writes during curation (`skipAnchorLog`).
- **W3** Single decade authority (client = sole truth; server opts inert until re-query).
- **W4** Metaphor = color + spacing gesture (font lock).
- **W5** Cache-key format is a contract (`mediaType:mode:genres:modules` verbatim).
- **W6** No phantom types (`GenreExperienceIntro`, not `GenreCuratorIntro`).
- **W7 (proposed)** Metaphor differentiation = 1–2 flagship bespoke layouts + themed variants,
  not six snowflakes (cost/a11y trap).
- **W8 (proposed)** Single state authority for all filter/persist state (URL + one localStorage
  blob, serialized once).

## 7. Open questions (RESOLVED — 2026-07-15, full merge / option B)

1. **Layer C scope:** **RESOLVED → option B (merge all 10).** All C1–C10 ship in v2,
   cheap-wins-first (see §3). No deferral of new features (except `guided` fiction, which is
   dropped/deferred as a no-op, not a feature).
2. **B1 metaphor count:** **RESOLVED → 1–2 flagship bespoke (Constellation node-backdrop +
   Frontier geo-spine), rest themed TitleCard variants** (W7). Constellation scoped as node
   backdrop + themed cards, not a full graph engine (grill B1 correction).
3. **TV/`guided` (K1):** **RESOLVED → ship TV** (client mediaType param; path real). **Drop
   `guided` fiction** — not shipped as a no-op; genuine guided branching is a v2.x if wanted.
4. **C4 compare-mode / C7 marathon:** **RESOLVED → in v2** (phase 6, deepenings).

## 8. Verification philosophy (all phases)
- TDD per task (write failing test → implement → pass → commit).
- Every phase: `npm run test` (client+server), both typechecks, `npm run build`.
- Live: boot server, `npm run dev`, click through `/genre/documentary` + a TV genre + a compare
  URL; verify rails paint before AI, arrows scroll, titles clickable, filters work, sound fires
  on beats (sound-off default), no `take` anchors written, persistence survives reload.
- No "Generated with" PR trailer; human review required before merge.

---

## 9. Grill findings (pre-build multi-agent gate — 2026-07-15)

Four-lens grill team (technical-fidelity, architecture/composition, UX/feel, scope/richness)
attacked the design against the repo. **Verdict: design is sound in structure but several
claims were OVERSTATED and are corrected inline above (K1/K2/K3, W4, B1, C1/C2/C5, C5-whisper).**
All SAFE: K6 labels, W-type (GenreExperienceIntro, cache key, playCue), C6 (parameterized),
cache-key vs moods/adjacency, AnchorFrame link.

### Corrections folded into the doc (most impactful)
1. **K3 `skipAnchorLog` is NET-NEW**, not "threaded" — `titleInsight(db,tmdbId,mediaType,
   refresh=false)` has no such param. Must be ADDED, guarding BOTH write sites (`:234` take +
   `:271` insight_neighbors). Missing the neighbor loop = storm persists.
2. **K1 `guided` mode is FICTION** — type/plumbing exist but `curatorIntro`/`enrichGenreItems`
   never branch on `mode`; behaviorally `guided` ≡ `self`. Real branching needed, or drop claim.
   (TV path itself IS real and fixable via client param.)
3. **K2 ArgumentPanel link needs a SERVER shape change** — counterpoint has no tmdbId (server
   drops it at `enrichGenreItems:153`). AnchorFrame link is a safe client `<Link>`.
4. **W4 accent is hollow** — components hardcode `amber-400`; no `register.accent` token.
   "Accent color immersion" is decoration until `register.accent` (CSS var) is added + consumed.
5. **B1 Constellation = net-new layout engine** — scope to "node backdrop + themed TitleCard",
   not a full graph engine, or estimate separately.
6. **C1/C5 state architecture UNBUILT** — no serializer, ChatDock key collision on slug-change
   remount. Must be built (GENRE_STATE_KEY, GENRE_DOCK_CONVERSATION_KEY + no remount-across-slug).
   C2 reconcile is DEFERRED: persisted blob is filter/steer-only and library-agnostic, live items
   come from react-query, so no reconcile needed; revisit only if the blob starts caching
   library-derived payload.
7. **C5 whisper strip must be a deterministic filter→string template**, NOT routed through the
   Companion persona (avoids double-narration with B2).

### Grill gate verdict
All four lenses run. Design is structurally SAFE after corrections. The scope fork (§7 Q1) is
RESOLVED — option B (merge all features, cheap-wins-first). Remaining work is execution, not
design. Proceed to writing-plans.
