# Council — Architecture / Feasibility (paired with product lens)

**Scope:** feasibility, real cost, hidden complexity, and blind spots of the 8 new
"Worlds" feature classes (creative council A1–A8) + deepening the current modules.
Builds on `cc-creative-opus.txt`, `council-visual-hierarchy-critique.md`, and the
merged plan `2026-07-15-worlds-ui-ux-refinement.md` (P1–P6, currently in build;
A1–A8 are Phase 7 backlog).

**Method:** read the load-bearing code. Citations are file:line against the
worktree at time of writing.

**Two facts that reframe everything below**
1. `GenreWorld.register` is ~90% dead. `cueBeatMap` is **never read** anywhere
   (grep: only declared in `client/src/lib/genreWorld.ts`). `lexicon[0]` is used
   once (`AnchorFrame.tsx:16`); `tonePrompt` twice (`ExperienceHero.tsx:16`,
   `GenrePicker.tsx:46`). The "rich register" is a config cliff, not a feature.
2. `anchorsUsed` is **world-level** (3 titles via `selectAnchors`,
   `genreExperienceService.ts:278`), *not per-title*. Any per-card
   "matched your anchor X" provenance needs a net-new signal.

---

## (A) New-feature feasibility flags — ranked, top 8

Ordered by (impact × leverage) − (cost × risk). Each: cost + leverages-existing vs
net-new + trap flag.

**A1. Metaphor-as-layout-grammar** (Constellation=node-map, Threshold=corridor,
Frontier=geo-spine, Panel=grid, Reading Room=dossier, Warm Interior=cozy)
*Cost: **EXPENSIVE** (Phase-7 #1, the largest).*
*Leverage:* `PosterCard`, `playCue`, `framer-motion`, `register`, `geo` module all
exist. *Net-new:* a **shared primitive kit does not exist** — `GenreModules` /
`TitleCard` / `TimelineScrubber` are ONE skeleton (`GenreModules.tsx`,
`GenreExperience.tsx:98`). Six structurally different interaction models = 6 layout
engines + 6 a11y surfaces (see C3). The "compose from a shared kit" caveat in the
creative council is itself a major net-new design/build effort that nobody has
started.
*Trap:* **YES if scoped "build all six."** Headline feature, but the font lock
(ADR-W4, C4) caps real immersion and ×6 a11y kills velocity. **Recommend:** ship
1–2 flagship metaphors (Constellation node-map + Frontier geo-spine reuses the
existing `geo` module) as bespoke, render the other 4 as **themed variants** of the
P4 TitleCard composition. Don't promise six snowflakes.

**A2. Ambient in-world Companion** (diegetic narrator, speaks `register`, pull-only)
*Cost: **MODERATE** (good leverage).*
*Leverage:* the entire chat stack exists — `ChatDock`+`ChatThread`+`useChat`+
`openrouter` (`client/src/components/chat/*`, `server/src/llm/*`). The current
eject-CTA is `openGuided` (`GenreExperience.tsx:26`) → `/chat`; `App.tsx:56` already
**hides the global `ChatDock` on `/genre`** precisely because two chat surfaces would
collide. Embedding `ChatThread` (compact) in-page reuses that.
*Net-new:* (a) feed `world.register.lexicon`+`tonePrompt` into the system prompt —
tiny (those strings already exist, just not sent to the LLM); (b) a "re-steer"
intent ("more dread, less gore") — small; (c) reconcile embedded chat with the
ChatDock suppression (C5).
*Trap:* **No** — solid moderate win. Risk is immersion (chattiness), not cost; keep
it pull-only + silent by default (creative council A2 risk is real, not architectural).

**A3. "Why this belongs here" provenance** (per-card: matched anchor / shares
director / topic)
*Cost: **CHEAP–MODERATE** (mostly leverage).*
*Leverage:* `enrichment.argument.counterpoint` already carries one LLM comparison
per title (`genreExperienceService.ts:151`); `maps.makers` gives director
(`GenreExperience.tsx:48`); `flag()` gives `inLibrary`/`ignored`; `anchorsUsed` gives
the 3 world seeds. Client can compose "shares director with X" / "topic: surveillance"
with zero new server calls.
*Net-new:* **per-title anchor-match** ("matched your anchor *Blade Runner*") is NOT
available — `anchorsUsed` is world-level. Approximate cheaply via the existing
`counterpoint`, or add a small server signal comparing each item's features to each
anchor (MODERATE). Exposing weak matches needs graceful phrasing (creative A3 risk).
*Trap:* **No** — the cheap path (counterpoint + director + topic) ships this week;
don't over-build the precise per-title anchor match.

**A4. World persistence** (save/resume scrub, steer, dismissed; deep-links like
`/genre/noir?decade=1950s&mood=paranoia`)
*Cost: **MODERATE** but with hidden sprawl.*
*Leverage:* `localStorage` already used by `ChatDock` (`DOCK_CONVERSATION_KEY`) and
`sound` (`SOUND_KEY`, `client/src/lib/keys.ts`); deep-links = URL search params that
P2/P3/P5 already add (`?decade`,`?q`,`?sort`,`?tags`). Local-first single-user means
no sync layer needed.
*Net-new:* a per-world persistence blob + **reconcile-on-library-change** (the plan's
B6 "stale state — needs quiet reconcile" is unaddressed infra; see C2). Combining
persistence (localStorage) + filters (URL) + steer (URL) + timeline (URL) = 3+ sources
of truth → desync risk (C1).
*Trap:* **Mild** — cheap if you limit it to URL params + one localStorage blob;
EXPENSIVE if you attempt offline-first sync/reconcile. Discipline from ADR-W3
(client = sole authority) must extend to all persisted state.

**A5. Sound via `cueBeatMap`** (per-world sonic signature)
*Cost: **CHEAP** (near-zero UI cost, as the creative council said).*
*Leverage:* `cuelume` + `playCue` + mute/reduced-motion policy are live
(`client/src/lib/sound.ts`; callers across `PosterCard`/`ChatDock`/`useChat`…).
Wiring = read `world.register.cueBeatMap` and `playCue(name)` on beats.
*Net-new:* **the beats don't exist yet.** "Crossing a threshold / pulling a star /
turning a page" are A1 interactions that aren't built. On the current skeleton the
only real beats are card-open and filter-change.
*Trap:* **Expectation trap, not cost trap.** Standalone win is small (wire
`open`/`discover`/`warn` to existing open/filter beats). Full per-world signature is
gated behind A1. Ship the cheap wiring now; don't sell it as "immersion" until A1
lands. Note `cueBeatMap` is dead config today — this feature *is* the act of consuming
it (A1 fact #1).

**A6. One spatial spine per world** (demote other modules to contextual detail)
*Cost: **MODERATE–EXPENSIVE if built standalone; largely FREE if folded in.***
*Leverage:* P4 (TitleCard composition, `GenreExperience.tsx:98`) already demotes the
module wall into per-title cards + Tabs. "Pick ONE primary axis" overlaps A1.
*Net-new:* the geo-spine-for-Frontier variant is A1; the "show everything" escape
hatch is a small toggle.
*Trap:* **YES if built as a separate workstream** — it is ~80% subsumed by P4 + A1.
Fold into A1; do not staff it independently or you duplicate P4.

**A7. Per-world serendipity gesture** ("adjacent star" / "next door" / "ride further
out")
*Cost: **MODERATE** (leverage with one gap).*
*Leverage:* `retrieveLibrary` vector similarity (`server/src/rag/retrieval.ts:28`) +
`fatigueScores`/`isRetired` (`anchorService.ts`) + the TMDB `/recommendations` /
`/similar` pattern already used by `becauseYouLoved` (`discoverService.ts:229`).
*Net-new:* **taste-distance in *discovery* space doesn't exist.** `retrieveLibrary`
scores the *library*, not arbitrary TMDB titles. "Two hops from your taste" among
non-library items needs either TMDB rec-graph traversal (reuse `becauseYouLoved`
shape) or a discovery-space embedding (net-new). Calibrating distance by
ignored/anchor/rating is the hard part; the signals exist but a comparator doesn't.
*Trap:* **Mild** — ship the TMDB-rec-graph version (cheap, reuses existing pattern);
defer the true taste-distance version.

**A8. Library density as place** (lit vs dark stars, read vs unread spines)
*Cost: **CHEAP–MODERATE** (mostly leverage).*
*Leverage:* `flag()` already attaches `inLibrary`/`ignored` to every item
(`discoverService.ts:43`); `PosterCard` already renders `ignored` dimmed
(`PosterCard.tsx:196`) and `inLibrary` badge. Rendering density = map those booleans
to metaphor visuals.
*Net-new:* the per-metaphor visual treatment + a non-score "progress/texture" framing
(creative A8 risk: completionism). No new server signal.
*Trap:* **No** — cheap win; frame as texture not gamification.

**A-rank summary**
| # | Feature | Cost | Leverage? | Trap? |
|---|---------|------|-----------|-------|
| A8 | Density-as-place | CHEAP | yes (flag()) | no |
| A3 | Provenance | CHEAP–MOD | yes (enrichment) | no |
| A5 | Sound/cueBeatMap | CHEAP | yes (cuelume) | expectation |
| A2 | Ambient Companion | MODERATE | yes (chat stack) | no |
| A4 | Persistence/deep-links | MODERATE | partial (localStorage/URL) | mild sprawl |
| A7 | Serendipity | MODERATE | partial (TMDB rec-graph) | mild |
| A6 | Spatial spine | MOD/EXP standalone | P4+A1 subsume | **TRAP if separate** |
| A1 | Metaphor-as-grammar | **EXPENSIVE** | partial (PosterCard/framer) | **TRAP if all-6** |

---

## (B) Deepening cost flags — top 6

Cheap-win vs needs-new-server-signal.

**B1. "Why this genre for you" (taste-origin)** — *CHEAP WIN.*
`computeTasteProfile` (`server/src/rag/tasteProfile.ts:60`) + `profileStateOf` +
`anchorsUsed` already exist. Compose: "your top genres overlap this world; closest
titles X/Y/Z." **No new server signal.** Don't over-build it (that would be the trap).

**B2. Cross-title relationship graph** (Constellation edges, "shares director",
topic links) — *CHEAP for structural, EXPENSIVE for LLM kinship.*
Structural edges (shared director via `maps.makers`, shared topic, shared genre) are
**client-computable, free**. Richer "kinship" (beyond the single `counterpoint`)
needs N more `titleInsight` calls → LLM cost + cold-cache latency (the very thing
ADR-W1 fought). **Cheap now; expensive later.**

**B3. Per-title anchor provenance** ("matched your anchor Blade Runner") — *MODERATE
(net-new signal).* `anchorsUsed` is world-level (fact #2). Precise per-card match
requires comparing each item's features to each anchor server-side — net-new, but
small. Cheaply approximated via existing `counterpoint` (one comparison). **See A3.**

**B4. Watch-order / argument deepening (TV)** — *MODERATE.* `enrichment.seasons` +
`argument` exist (`genreExperienceService.ts:133,151`). A recommended viewing
sequence = more LLM. Reuse `argument` + `watchOrder` module; don't spin a new call.

**B5. Credibility / "where to watch" drill-down** — *CHEAP.* `enrichment.watchProviders`
+ `imdbRating`/`rtRating` already fetched (`genreExperienceService.ts:131,144`). The
provider blob is under-used today (mapped to a bare "Available" string at
`GenreExperience.tsx:54`). **Cheap win — actually render it.**

**B6. Topic clustering deepening** (sub-topics, richer TopicCluster) — *MODERATE.*
`buildTopics` + `TopicCluster` exist (plan P4.3 fixes the `Genre <id>` label bug).
Sub-topic granularity needs more TMDB keyword data or LLM — MODERATE, lower priority
than B1/B3/B5.

---

## (C) Architecture blind spots — top 6

**C1. State-management sprawl.** P2/P3/P5 put `?decade/?q/?sort/?tags` in the URL;
A4 adds `localStorage` persistence; steer adds more URL. That's **3+ sources of truth**
(URL params, localStorage blob, server steer opts). ADR-W3 already names the client
decade tab as *sole* authority — **extend that discipline to ALL persisted/filter
state** or you get desync (e.g. a persisted `?decade=1950s` disagreeing with a live
timeline tab). Single authority + one serializer.

**C2. World-level cache invalidation / reconcile is missing.** Per-title enrichment
is well-cached (`tmdb_cache` keyed by URL, `tmdb/client.ts:57`; `insight:` keyed by
title; `genre-exp:` keyed by `mediaType:mode:genres:modules`,
`genreExperienceService.ts:236`). **Good.** But *world-level* state (persisted scrub,
steer, dismissed, A4) is **not** cache-keyed and has **no reconcile path** when the
library changes. The plan's B6 flags "stale state — needs quiet reconcile" with no
mechanism. Either version the persisted blob (timestamp + library checksum) or accept
graceful-stale.

**C3. a11y of 6 bespoke layouts.** A1's snowflakes = **6 separate a11y surfaces**
(keyboard nav, focus order, screen-reader semantics, `prefers-reduced-motion`). The
current single skeleton at least has one audit. `MotionConfig reducedMotion="user"`
(`App.tsx:26`) covers motion globally, but bespoke node-maps/corridors easily violate
it. Budget 6× the a11y effort, or cap A1 at 1–2 metaphors (C-trap feedback loop with
A1).

**C4. Locked font/motion/sound system caps immersion.** Fonts are two locked tokens
(`var(--font-display)`, `var(--font-sans)` — `TimelineScrubber.tsx:37,75`); ADR-W4
**forbids per-metaphor font swaps**. "Immersion" is therefore limited to accent color
+ spacing/border (P6) + sound (A5). The creative council's deepest asks (serif Reading
Room, etc.) are **architecturally blocked** by the font lock. Set expectations: A1/A6
payoff is "tasteful differentiation," not deep immersion, until the font system is
unlocked.

**C5. Companion-on-`/genre` collision.** `App.tsx:56` deliberately hides the global
`ChatDock` on `/genre` (two chat surfaces would double-mount `ChatThread` and fight
over `conversationId` in localStorage). A2 embeds an in-world Companion on the same
page. You must reconcile: either keep the page chat as a *distinct* surface with its
own conversation key, or lift the ChatDock suppression and merge. Otherwise duplicate
streams / lost context (the remount-aborts-stream bug from `App.tsx:29` comment is the
canary).

**C6. Empty / thin / error degradation per-metaphor.** `NICHE_THRESHOLD=6`
(`GenreExperience.tsx:14`) + `GenreEmptyState` + `Generic` fallback exist, but they
are **genre-agnostic**. A bespoke "Constellation" of 3 titles isn't a constellation;
each metaphor degrades differently and must have its **own** graceful path — including
mid-load and LLM-`argument`-fail (the per-title enrichment can be `null`,
`GenreExperience.tsx:46`). This multiplies empty-state work by 6 and is the most likely
place immersion "dies at the seams" (creative B5).

**(C-bonus) G3 anchor-write discipline under new surfaces.** `titleInsight` logs
`take` + `insight_neighbors` (`insightService.ts:234,272`). Plan P1.6 adds
`skipAnchorLog` for *batch* enrichment. Any new surface (A2 chat, A7 serendipity) that
reuses `titleInsight` re-introduces anchor writes unless it threads `skipAnchorLog`.
Keep the read-only-during-curation invariant (ADR-W2) explicit at every new call site.

---

## Bottom line for the build
- **Cheap wins to take now (no new infra):** A3 (provenance via counterpoint+director),
  A5 (wire dead `cueBeatMap` to existing beats), A8 (density via `flag()`),
  B1 (taste-origin via `computeTasteProfile`), B5 (render `watchProviders` already
  fetched).
- **Moderate, high-leverage:** A2 (in-world Companion reuses chat stack), A4 (URL +
  one localStorage blob, disciplined), A7 (TMDB rec-graph variant).
- **Expensive / trap-prone — sequence carefully:** A1 (1–2 flagship metaphors only,
  not six), A6 (fold into A1/P4, don't staff separately).
- **Blind spots to design against up front:** C1 (single state authority), C2
  (world-level reconcile), C3 (×6 a11y), C4 (font lock caps immersion), C5 (chat
  collision), C6 (per-metaphor empty states).
