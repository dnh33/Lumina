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
  font swaps are **forbidden** (ADR-W4). Immersion = accent color + spacing/border + sound,
  NOT chrome/font swaps.
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
  from B2 Companion).
- **C6 Export/save World as note** — Markdown into notes store + printable.
- **C7 Marathon builder** — sequence from `watchorder`+watchlist, save as playlist.
- **C8 Steering presets** — quick chips mapping to existing server opts (no new LLM).
- **C9 Taste-evolution overlay on timeline** — `anchorsUsed`+watchlist markers on decade axis.
- **C10 Cold-start bootstrap loop** — empty state action: search→add anchor→re-query.

### Layer D — Deepenings (modules + metaphors)
From `worlds-broader-council.md` (B-section). Highest-impact:
- **D1 Timeline = World's spine + taste overlay** (anchors/watchlist on decade axis, per-decade
  LLM era-thesis, decade *zooms* not just filters).
- **D2 Argument = dialogue** (counterpoint becomes real `/title` link; user annotation stored
  locally; surface pro/con/neutral from `insight.comparisons`).
- **D3 Metaphor layouts** (B1 realized): Constellation node-map, Panel gutters, Threshold
  corridor — from one shared primitive kit.
- **D4 Geo fix** (ISO→name, real region view, your-region-vs-world; spine for Frontier).
- **D5 Critic deepen** (consensus divergence IMDb≠RT, you-vs-critics, provider deep-link).
- **D6 Maker index** (recurring directors, affinity, sort-by-director).
- **D7 Topic as navigational axis** (click spine filters; LLM themes optional).
- **D8 WatchOrder sequence** (cross-title order + progress; feeds C7 marathon).

## 3. Proposed build order (phases, TBD at plan step)

1. **Foundations + must-fix bugs** (§4) — unblock everything else; fix correctness/premise.
2. **Layer A complaint fixes** (P1–P6) — makes the page interactive + composed.
3. **Layer B must-haves** (B1–B4, B6) — the differentiation engine.
4. **Layer C top picks** (C1 cross-world warp, C2 mood entry, C3 world-origin) — structural.
5. **Deepenings D1–D8** — per-module depth.
6. **Layer B nice-to-have + remaining C** (B5 sound, B7, B8, C4–C10) — delight layer.

## 4. MUST-FIX bugs in SHIPPED code (fix before merging Layer B — they'd inherit/amplify)

| ID | Bug | Evidence | Fix |
|---|---|---|---|
| K1 | **TV + `guided` mode unreachable** | `GenreExperience.tsx:22` hardcodes `mediaType:"movie"`+`mode:"self"`; server TV/guided paths exist but never triggered | Parameterize mediaType/mode from route + UI toggle |
| K2 | **Dead-end links** | `AnchorFrame` plain `<li>` (no `/title`); `ArgumentPanel` counterpoint plain text (no link) | Wrap in `<Link to="/title/...">`; reuse `PosterCard` link shape |
| K3 | **`logAnchor` storm STILL LIVE** | `enrichGenreItems` (`genreExperienceService.ts:149`) calls `titleInsight` w/ no `skipAnchorLog` | Implement ADR-W2 `skipAnchorLog`; add server test asserting no `take` writes |
| K4 | **`Generic` husks** | non-proof slugs → `getGenreWorld` returns bare timeline, no metaphor/modules | Give every genre a real (if minimal) `GenreWorld`; or honest bootstrap (C10) |
| K5 | **`cueBeatMap` dead** | `playCue` never called on genre page; `register` ~90% unexpressed | Wire B5 (consume `cueBeatMap`) |
| K6 | **Label/name bugs** | `buildTopics` `Genre ${gid}`; geo `name:code`; `CredibilityStrip` fake `distributor:"Available"` | `GENRE_ID_NAMES` const; ISO→name; render real `watchProviders` |

## 5. Architecture blind spots to design against (C1–C6)

- **C1 State sprawl** — URL + `localStorage` + server steer = 3+ sources of truth. **Single
  authority + one serializer** (extend ADR-W3 to all persisted/filter state).
- **C2 World-level reconcile missing** — persisted scrub/steer/dismiss have no invalidate-on-
  library-change. Version the persisted blob (timestamp + library checksum) or accept graceful-stale.
- **C3 ×6 a11y surfaces** if all metaphors built bespoke. Cap B1 at 1–2 flagships; audit each.
- **C4 Font lock caps immersion** — set expectation: payoff = "tasteful differentiation," not
  deep immersion, until font system unlocks.
- **C5 Companion-on-`/genre` collision** — `App.tsx:56` hides `ChatDock`; B2 embeds in-world chat.
  Reconcile conversation keys (distinct key, or lift suppression + merge). Avoid remount-aborts-stream.
- **C6 Per-metaphor empty states** — generic empty state insufficient for bespoke layouts; each
  metaphor needs its own graceful degradation (incl. mid-load + LLM-`argument`-fail where
  `enrichment` is `null`).

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

## 7. Open questions for design approval (ask ONE at a time)

1. **Layer C scope:** build all 10 new-council features, or a prioritized subset (C1/C2/C3 first)?
2. **B1 metaphor count:** ship Constellation + Frontier as bespoke, rest themed? Or fewer/more?
3. **TV/`guided` (K1):** enable TV + guided mode now (real work — UI toggle + server path
   already exists), or defer?
4. **C4 compare-mode / C7 marathon:** in this build or later?

## 8. Verification philosophy (all phases)
- TDD per task (write failing test → implement → pass → commit).
- Every phase: `npm run test` (client+server), both typechecks, `npm run build`.
- Live: boot server, `npm run dev`, click through `/genre/documentary` + a TV genre + a compare
  URL; verify rails paint before AI, arrows scroll, titles clickable, filters work, sound fires
  on beats (sound-off default), no `take` anchors written, persistence survives reload.
- No "Generated with" PR trailer; human review required before merge.
