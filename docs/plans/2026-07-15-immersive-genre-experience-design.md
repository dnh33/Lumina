# Immersive Curated Genre-Specific Experience — Design (Brainstorm Phase 1)

> **Status:** Design (superpowers Phase 1). **NOT approved for build.** Ideation only.
> **Date:** 2026-07-15 · **Branch:** `immersive-curated-genre-specific-experience` (worktree, currently unbuilt / identical tree to `main`).
> **Method:** 6 parallel research subagents (audience, IA/flows, technical grounding, visual design, interaction/immersion, problems/metrics), each a synthesis. Consolidated here. No code written.

## 0. What this is

A **new, standalone Lumina page** — the *curated / focused / immersive* counterpart to today's breadth-first discovery. The user picks **one or a few genres** and goes *deep*: an atmospheric "world" landing plus curated rails, optionally **AI-guided** by the existing Companion (no new chat persona). It must feel like *entering a world*, not scrolling a list — while staying usable, performant, and accessible.

**Positioning (why now):** `discoverService.forYou` already OR's the user's `topGenres.slice(0,3)` into one spread (`discoverService.ts:99-133`). This feature is the inverse: **genre-scoped, narrative, deep** — reuse the same engine with an explicit genre seed instead of the user's top-3.

## 1. Open forks for the user (NOT decided by research)

| Fork | Options | Research lean | Decision needed |
|---|---|---|---|
| **Routing** | (a) standalone route `/genre/:slug` vs (b) mode inside Discover | **(a)** standalone — deep-linkable, keeps Discover lean, fits `AnimatePresence` | ? |
| **Genre count default** | single (deepest world) vs multi (`/sci-fi+fantasy`, OR'd) | **single default**, multi opt-in via `+` in URL (reuses `discover_titles` OR-combine). Some strands leaned multi to mirror `forYou`; we recommend single-first for immersion density | ? |
| **AI-guided default** | opt-in (`?guided=1` or "Guide me" toggle) vs auto | **opt-in, pull-based** (honors ADR-0006 no-notification) | ? |
| **Genre picker** | ambient ~38-genre grid (seeded by `topGenres`) vs raw multiselect | **ambient grid, `topGenres` pinned first** — kills choice overload | ? |

## 2. Audience & jobs-to-be-done (synthesis)

**Personas (realistic):**
- **Marisol Vetlesen** — cinephile, rates *Arrival* 10 / *Severance* 9; wants a guided descent through a world she already loves.
- **Tobias Lindqvist** — weekend viewer; wants *one* genre surfaced from his taste, zero config.
- **Priya Raghunathan** — genre fan (horror); wants deep cuts + the canon, not the popular floor.
- **Anders Bratholm** — critic-adjacent; wants anchor-framing ("like X, but diverges") and to retire over-used comparisons.

**Prioritized stories (sample):**
- *Must:* As Tobias, I want my top genres offered as one-tap worlds so that I enter immersion without a 38-item picker.
- *Must:* As Marisol, I want an AI-guided arc through Sci-Fi so that I get curation, not a grid.
- *Must:* As Priya, I want "deep cuts" + "canon" rails in Horror so that I see beyond the popular floor.
- *Should:* As Anders, I want over-used anchors dimmed/retired so that the world stays fresh (anti-fatigue).
- *Should:* As any user, I want a niche genre with <N TMDB titles to show a real empty state (not a blank rail).
- *Could:* Save/resume a journey; share a world via deep link.

## 3. IA & user flows (synthesis)

**Entry points:** Discover hero CTA + `topGenres` chips (E1) · Library genre chips "Enter world" (E2) · SearchOmnibar genre-match slot (E3) · Companion SuggestionCard (E4) · TitleDetail genre tag (E5) · bare deep link `/genre` (E6 → ambient picker).

**No 5th Shell nav item** — entry is pull-based (honors ADR-0006). New route nests in `App.tsx` alongside `/library`, `/title`, keyed by `location.pathname` for clean `AnimatePresence` in/out.

**Master flow:**
```
Discover/Library/Search/Companion ──E1–E5──▶ [SELECT]
                                            │ has genre? ─yes─▶ [DIVE /genre/:slug]
                                            │ no genre ─▶ AMBIENT PICKER (~38 via api.genres())
                                                            │
                              ┌─────────────────────────┼─────────────────────────┐
                    SELF-DIRECTED (default)                        AI-GUIDED (?guided=1)
                    rails + PosterCard, ChatDock idle          Companion arc + SuggestionCards
                              └────────── "Show me the world" ─────────┘
                                            │
                                        [EXIT] → Shell nav / Exit btn / deep-link
```

**Session states (URL-derived, no new store):** `landed` · `selecting` · `immersing` · `guided` · `closing`.

**Clash flags:** Do NOT re-implement `forYou`'s generic tier — world is *genre-scoped + narrative*. Library chip offers both "Filter library" and "Enter world" (distinct intents). Reuse `compare_titles` for anchor framing; never fork `becauseYouLoved`.

## 4. Architecture grounding (what's reusable — real file:line)

**Server / discovery:**
- `discoverService.forYou` (`discoverService.ts:99-133`) — the genre→TMDB curated-set engine; generalize genre seed from top-3 to explicit 1-or-few.
- `filterCatalog` + `flag` (`discoverService.ts:27-50`) — **mandatory chokepoint**; every result set must pass through or Ignore/Genre-exclude silently break (CONTEXT.md:26).
- `tasteProfile.ts` — `topGenres` (`:114-121`), `favoriteDirectors` (`:128-136`), `fatiguedLovedTitles` (`:191-193`); `renderTasteProfile` already self-reads `fatigueScores`.

**Anti-fatigue (the "curated + no fatigue" engine):**
- `anchorService.ts` — `logAnchor` (`:8-13`), `fatigueScores` (`:51-77`, `HALF_LIFE_DAYS=7`, `FATIGUE_WINDOW_DAYS=14`, `MIN_CITATIONS=3`), `isRetired`/`setRetired` (`:79-91`).
- `insightService.ts:263-273` — drop retired, **sort neighbors ascending by fatigue**, log only chosen anchors. The world reuses this verbatim per title.

**Insight / grounding / companion:**
- `insightService.titleInsight` (`:191-329`) — per-title AI "Take"; `hook` (`:39`,`:132-135`) is the narrative-hook shape; `comparisons` carries `relation: echoes|warns|diverges`. Cache via `getSetting`/`setSetting` key `insight:${mediaType}:${tmdbId}` (`:197-222`).
- `contextBuilder.buildChatContext` (`:36-55`) — reused as-is for AI-guided path.
- `chatService.runChatTurn` (`:127-273`) — no new engine; guided = prefill message + focused prompt.
- `tools.ts` — `discover_titles` (`:401-440`, genre OR-combined, slices 12), `compare_titles` (`:217-246`); `ToolRibbon` exposes usage.

**Client / components (reused, no card changes needed):**
- `Discover.tsx` Hero (`:39-110`) → template for `ExperienceHero`; health-gate (`:187-221`) copy.
- `Carousel.tsx`, `PosterCard.tsx` (anchor/Over-used ribbon + retire/ignore already built `:202-279`), `UpNextRail.tsx`, `SuggestionCards.tsx` (cinematic `posterDeal` + `DEFAULT_SUGGESTIONS`), `MemoryConstellation.tsx` (transform/opacity-only a11y reference), `ToolRibbon.tsx`→`ToolTrace`, `ChatDock.tsx` (global, hidden only on `/chat`).
- `lib/motion.ts` (`EASE_OUT_EXPO`, `stagger60`, `posterDeal`), `lib/sound.ts` (cue-only policy, reduced-motion gated), `App.tsx` (`AnimatePresence mode="wait"`, `MotionConfig reducedMotion="user"`).

## 5. What's NEW (small surface)

- **Server:** `GET /api/discover/genre-experience?genres=Sci-Fi,Thriller&mode=guided` → returns `{ key, genres, mode, intro:{hook,tone,basedOn}, items[], anchorsUsed[], profileState }`. Backed by **new `genreExperienceService.ts`** (~120 LoC): `genreMap`→`ids.join("|")` (mirror `discoverService.ts:108-120`), `tmdbGet('/discover/...')`, through `filterCatalog`+`flag`, **one batched LLM curation call** (NOT N `titleInsight` calls on load), anchor selection reuses `insightService.ts:263-273`, cache via `setSetting` key `genre-exp:${key}`.
- **Prompt:** `genreCuratorPrompt` in `prompts.ts` (focused; reuses `luminaSystemPrompt` + `buildChatContext`).
- **Client:** new `pages/GenreExperience.tsx` + small presentational components `ExperienceHero`, `GenrePicker` (chip grid of `api.genres()`), `AnchorFrame` (per-title "like X" capsule), `NarrativeHook` (prefill deep-link to `/chat` or compact `ChatThread`). `api.genreExperience(...)` in `api.ts`. Route in `App.tsx`; nav entry in `Shell.tsx` (recommended as a 5th item OR pull-based chips — see Fork 1).
- **Types:** `GenreExperience` / `GenreItem` in `client/src/lib/types.ts`.
- **No DB table for v1** (YAGNI). Experience is deterministic from `(genres, mediaType, sort, profile, fatigue)`; cached via `setSetting` TTL. Resume cursor = one `settings` key `lastGenreJourney` or `localStorage`. If "saved journeys" later confirmed: append v7 migration to `schema.ts` per ADR-0007 (`CREATE TABLE IF NOT EXISTS` + `pragma_table_info` probe; `migrate()` already `try/catch`-wrapped in `connection.ts:22-30`).

## 6. Visual design language (anti-slop, design-taste-frontend)

- **Design Read:** cinematic discovery mode, atmospheric editorial-immersion, dark-first, genre supplies the mood.
- **Dials:** `DESIGN_VARIANCE 7` (asymmetry, but poster grids punish chaos) · `MOTION_INTENSITY 6` (atmosphere within INP<200ms / CLS<0.1) · `VISUAL_DENSITY 4` (cinematic breathing room).
- **Theme lock:** **dark**, justified (film watched in dim rooms; genre atmosphere reads stronger on near-black; consistent with dark-native Companion). Light parity via semantic tokens (`--surface`, `--text-primary`, `--accent`, `--scrim`) — **token remap, not redesign**.
- **Color:** cool-charcoal spine (`--surface #0B0D10`, `--text-primary #ECEEF1`) + **single accent — REAL token `gold-400 #e8b84b`** (active/rating) with distinct `amber-400 #fbbf24` reserved for passive "over-used" nudge. Earlier draft said "Projector Amber #E0A868" — WRONG, corrected from `theme.css`. Genre atmosphere = capped `--genre-tint` duotone on hero/ambient layers ONLY (noir steel-blue, sci-fi teal, horror oxblood-black, etc.) — immersion without touching chrome/text/contrast.
- **Typography (VERIFIED from `theme.css:32-33`):** `--font-display: "Fraunces", serif` + `--font-sans: "Inter", sans-serif`. Earlier draft said Cabinet Grotesk/Geist — WRONG (unverified assumption). Per-genre = *register* variation (weight/tracking/tempo), NOT new families. **Open question for build:** keep the real Fraunces/Inter tokens, or migrate to Cabinet Grotesk/Geist per the original Phase-1 brief? Decide in §14/Phase-2. em-dash (—) banned.
- **5 distinct layout families** (≥4 rule met): Media-Mask Hero · Asymmetric Bento (exact cell count) · Horizontal Scroll-Snap Rails · Split-Focus Companion Panel · Editorial Coda.

## 7. Interaction & immersion (synthesis)

- **Genre-gate entry:** full-bleed color-wipe (chosen tint floods screen) via `AnimatePresence mode="wait"` keyed by pathname — "crossing the threshold," not a form submit. Reuse `EASE_OUT_EXPO` + `stagger60`.
- **Scroll storytelling:** sticky-stack chapter spine (Threshold → Canon → Your Echoes → Divergence → The Take) **+** one horizontal-pan rail for curated shelves. Separate DOM subtrees so they don't compound into jank. Canonical GSAP `start:'top top', pin:true` with `useEffect` cleanup, or Motion `useScroll`/`useTransform` (zero per-frame React renders). **No `window.addEventListener('scroll')`.**
- **AI-guided = docent presence, NO chat box:** `SparkAvatar` narrates chapter transitions; `ToolRibbon` repurposed as a per-chapter "Grounded in" ribbon. Per-title "Take" surfaces as inline narrative cards (reuse `InsightBody`), not chat bubbles.
- **Anti-fatigue keeps it fresh:** each "Echoes" card picks the neighbor with the **lowest** fatigue score; on view it logs an anchor; next visit rotates. Retired anchors visually dimmed.
- **Micro-interactions:** hover lift + gold ring (spring), magnetic ≤6px (MotionValue, disabled under reduced-motion), `:active` scale, focus-visible gold ring (never hover-only).
- **Sound:** opt-in one-shot cues only via `lib/sound.ts`; **no ambient loops, no autoplay** (anti-slop + no-autoplay law).
- **WebGL particles: CUT for v1** — CSS/SVG bloom sufficient.

## 8. Problems, edge cases & a11y (critical synthesis)

**12 risks; 4 are HARD pre-build gates:**

| # | Risk | Sev | Gate |
|---|---|---|---|
| R3 | **Experience-fatigue irony** — page must NEVER `logAnchor` on impressions/scrollbacks/render (would recreate the ADR-0006 anchor storm). Reader of fatigue, not writer. **Verified nuance (ADR-0006 §Corrections):** the `take`/insight-card-open surface *does* log, but scoped to the **single opened title** (post-`fff38ba` fix, `insightService.ts:233-234`). So the rule is: log only on a real, single title-open action — exactly like `take` — never on mount/scroll/rail-impression. New genre code must reuse `insightService.ts:263-273` (single-anchor, per-title), not introduce bulk impression logging. | High | **No-Go until enforced in code review** |
| R1 | Immersion vs usability — hero ≤4 text elements, persistent Shell nav, design tokens locked | High | **Go only if locked** |
| R4 | Reduced-motion / vestibular — every animation uses `lib/motion.ts` + `useReducedMotion` | High | **Go if audited** |
| R12 | Contrast / anti-purple — gold-only accent, ink-950 scrim floor, axe 4.5:1 | Med-High | **Go if axe passes** |
| R2 | Choice overload (38 genres) — pre-seed `topGenres` chips | High | Go |
| R5 | Mobile perf (LCP<2.5s / INP<200ms / CLS<0.1) — route-split, reserve space, `content-visibility:auto`, cut autoplay video | High | Go if budgets met |
| R6 | Niche-genre empty states (Western/Music/War&Politics) — 3 genre-specific empties + library-empty gate | Med-High | Go if built |
| R7 | Persona consistency — reuse existing chat pipeline, NO second LLM persona / new system prompt | Med-High | Go if no fork |
| R8 | Deep-link/share — URL-param route, deterministic fetch | Med | Go |
| R9 | Exit/resume — reuse conversation persistence (`localStorage`) | Med | Go |
| R10 | Anchor-uniqueness metric = distinct-count of cited `tmdbIds`, NOT derived from `fatigueScores` | Med | Go |
| R11 | OR vs AND semantics explicit in copy ("tighten to intersection" vs "wander adjacent") | Med | Go |

**Anti-patterns banned:** AI-purple/blue blobs · em-dash · 3 equal cards · div fake-screenshots · hover-only reveals · low-contrast over backdrops · missing focus rings · horizontal scroll on mobile.

**a11y guardrails:** 4.5:1 contrast (AA) · alt text (backdrops `alt=""` decorative) · keyboard nav + visible focus rings · heading hierarchy · reduced-motion (mandatory when MI>3) · color-not-only · 44×44px touch targets · 8px+ spacing · loading feedback (skeletons).

## 9. Success metrics (measurable)

1. Session depth in a world > breadth-feed session depth.
2. Genre-dive completion rate (reach Coda / exit via "done").
3. Return rate to a previously entered world (deep-link/resume).
4. Anchor-uniqueness in guided mode = distinct cited `tmdbIds` per session (increases post-launch).
5. **Zero new notification fatigue** (ADR-0006 holds — no proactive messages).
6. Median `fatigueScores` of loved titles does NOT rise after launch (R3 regression check).
7. LCP < 2.5s · INP < 200ms · CLS < 0.1 on mid-tier Android.
8. axe-core 4.5:1 contrast pass on sampled worlds.
9. Niche-genre empty-state coverage = 100% (all 3 empties built).

## 10. YAGNI ledger (cuts)

- **Cut:** bespoke autoplay video backgrounds (perf + no-autoplay ban) → `backdrop()` stills + CSS bloom.
- **Cut:** second LLM "guide" agent / new system prompt (R7) → reuse `chatService` + `tools`.
- **Cut:** genre-level fatigue (ADR-0006 already rejected; genre-exclude covers it).
- **Cut:** world notifications/digests (violates no-fatigue).
- **Cut:** light/dark toggle (app dark-only).
- **Cut:** WebGL hero particles for v1.
- **Cut:** free-text genre field on the page (Omnibar owns this).

## 11. Build sequencing (for Phase 2 writing-plans, after approval)

1. Route + `GenreExperience.tsx` skeleton + `ExperienceHero` (reuse `Discover.tsx` Hero) + health-gate.
2. `genreExperienceService.ts` + `/api/discover/genre-experience` + `api.ts` + types (TDD: empty/topGenres/niche empties).
3. Rails via `Carousel`+`PosterCard`; `AnchorFrame` reusing `insightService.ts:263-273`.
4. `GenrePicker` (ambient, `topGenres` pinned) + entry points (Discover/Library/Omnibar/Companion).
5. AI-guided: `NarrativeHook` prefill → `/chat` + `ToolRibbon` repurpose; reduced-motion + dark/light parity pass; axe audit.
6. Metrics instrumentation (anchor distinct-count, fatigue regression).

## 12. Blind spots / things to confirm before Phase 2

- **Fork decisions (§1 + §14) must be made by the user** — they change routing, the multi-genre operator, nav, and per-genre richness scope.
- Confirm **font choice for the feature**: the app's real tokens are `--font-display: "Fraunces"` + `--font-sans: "Inter"` (`theme.css:32-33`). The original Phase-1 brief proposed Cabinet Grotesk/Geist (unverified, since corrected). Decide: keep Fraunces/Inter (consistent with app) or migrate to Cabinet Grotesk/Geist.
- The full subagent outputs (with deeper rationale + extended risk register + the full per-genre matrix + the documentary exemplar + the emotional-feel design) are saved under `AppData/Local/hermes/profiles/runeforge-coder/cache/delegation/`.

---

## 13. PER-GENRE EXPERIENCE LAYER (added after user steer: "is it feature-rich enough? think about the FEEL")

### 13.0 The correction this layer answers
The original v1 (§3-§7) is **a recolored poster-rail shell**: one universal interaction graph (tinted hero + 4 identical `Carousel`/`PosterCard` rails + bolted-on Companion), with genre expressed **only through decoration** (color tint + anchor framing). A documentary deep-dive and a sci-fi deep-dive would merely *recolor*. That fails `design-taste-frontend` §4.7 Layout-Repetition Ban (one layout family across 5 sections) and uses ~2 of the skill's 60+ named patterns. **Verdict from the feature-richness audit: NOT feature-rich enough as drawn.** A deep-dive must be **structurally different per genre**, not a tint swap.

### 13.1 Feel is a PARAMETER MAP, not new assets (critical constraint)
Per the "feel"/sensory strand, every per-genre differentiation modulates the **locked** system — no new fonts/easings/cues:
- **Dark + gold accent locked.** Real `client/src/theme.css` (lines 4-30): `ink-950 #08080d` surface; **gold-400 `#e8b84b`** = active/rating (RARE, glow only on live states); distinct **amber-400 `#fbbf24`** = passive "over-used" nudge. Per-genre ≠ new accent. The master doc's earlier "Projector Amber #E0A868 / Cabinet Grotesk / Geist" was WRONG — corrected here from the real theme tokens.
- **Fonts fixed (verified):** `--font-display: "Fraunces", serif` + `--font-sans: "Inter", sans-serif` (`theme.css:32-33`). Per-genre = *register* variation (weight/tracking/tempo), NOT new families. (The Phase-1 brief's Cabinet Grotesk/Geist choice was an unverified assumption — the app actually ships Fraunces/Inter. Confirm before build whether to migrate, or adopt the real tokens.)
- **Motion fixed (verified):** `--ease-out-expo: cubic-bezier(0.22,1,0.36,1)` + `--ease-state: cubic-bezier(0.4,0,0.2,1)` (`theme.css:36-37`); `rise`/`pulseSoft`/`shimmer` keyframes; `prefers-reduced-motion` block (`:103-112`) zeroing durations. Per-genre = *character* modulation, all transform/opacity-only.
- **Sound:** `lib/sound.ts` has only **10 fixed cues** — NO per-genre audio possible. Genre = *beat-mapping* of existing cues, opt-in, reduced-motion-gated. No ambient loops, no autoplay.
- **Companion = ONE agent** (`luminaSystemPrompt`). Per-genre ≠ second LLM. It is a *register block* (lexicon/tempo/opening-question) layered on the one voice. No persona fork (honors ADR-0006 + no-fatigue).

### 13.2 Six spatial metaphors ("the world")
| Genre | Metaphor | Feel arc (entry → immersion → guided → closure) |
|---|---|---|
| Science Fiction | **Constellation** | precision → glacial awe → mapped → return to orbit |
| Horror | **Threshold** | dread → visceral hold → confront → release |
| Documentary | **Reading Room** | curiosity → absorption → counter-argument → understanding |
| Romance | **Warm Interior** | anticipation → intimacy → reflection → warmth |
| Western | **Frontier** | restlessness → expanse → trial → settlement |
| Anime | **Panel** | discovery → kinetic immersion → lore → closure |

Each metaphor drives hero composition + one signature gesture + the Companion register — **structurally**, not just a tint.

### 13.3 Experience archetypes (group the ~35 TMDB genres)
1. **Non-Fiction/Doc world** → maker-driven, topic-threaded, credibility-literate (Documentary, War & Politics, News, History).
2. **Narrative-Fiction world** → auteur/theme arcs, "the argument" of tone (Drama, Romance, Crime/Mystery).
3. **Procedural/Crime world** → case/thread logic, comparison matrices (Thriller, Crime, Mystery, Film Noir).
4. **Episodic/TV-series world** → watch-order sequencer, arcs (TV Movie, Soap, Reality, Comedy-series).
5. **Animated world** → kinetic/panel metaphor, studio/lore (Animation, Anime, Family).
6. **Mood/Aesthetic world** → atmospheric, soundtrack-layer, era scrubber (Horror, Fantasy, Music, Travel).

### 13.4 The Documentary deep-dive EXEMPLAR (concrete, 11 signature features)
Each wired to a **real Lumina asset** (proves the layer is buildable, not vapor):

| # | Signature feature | Interaction | Powered by (real file) |
|---|---|---|---|
| F1 | **Voices rail** (filmmaker spotlight) | horizontal maker cards → maker view of `directingCredits` grouped by subject | `catalog.ts /tmdb/person/:id` → `normalizePerson` (`normalize.ts:214-259`) + `tasteProfile.favoriteDirectors` |
| F2 | **Topic/theme threading** | pick keyword → connected vertical spine of docs, cross-linked to watched titles | TMDB `keywords`/`similar` (`normalize.ts:132-170`) + `tasteProfile.topTags` + RAG `retrieveLibrary` |
| F3 | **"The Argument"** (narrative structure) | per-title thesis + counterpoint pointer to a *divergent* neighbor | `insightService.titleInsight` `text`/`hook`/`comparisons.relation` (`insightService.ts:16-26,191-329`) → `compare_titles` |
| F4 | **Credibility/source framing** | provenance strip: distributor, theatrical-vs-streaming, critics consensus, LLM stance tag | `TitleDetails.watchProviders` + OMDb `ensureRatings` + `ratingsService` + `insightService` `Take` |
| F5 | **Watch-order for docu-series** | seasons as chapters + recommended start + in-library progress | `normalizeDetails.seasons` (`normalize.ts:171-199`) + `discoverService.upNext` (`discoverService.ts:154-203`) |
| F6 | **"Where to start" on-ramp** | one canonical starter + 2-3 escalating picks, personalized | `discoverService.forYou` generalized + `filterCatalog`/`flag` chokepoint |
| F7 | **Era/recency scrubber** | decade/recency filter re-seeds the world via TMDB date filters | TMDB discover `primary_release_date`/`first_air_date` |
| F8 | **Sub-genre split** (true-crime/nature/music) | chip row scopes the *entire* experience via `genreMap` | `genreMap` (`tmdb/client.ts:112-118`) + `tasteProfile.avoidedGenres` |
| F9 | **Anchor-framed "Like X, but…" Echoes** | lowest-fatigue neighbor shown first, on-view log, retire control | `insightService.ts:263-273` + `anchorService.fatigueScores`/`isRetired` |
| F10 | **"If you trust this filmmaker"** (title-level maker cross-poll) | maker capsule → more from director, flagged in-library | `/tmdb/person/:id` `directingCredits` |
| F11 | **Commitment-cost / runtime band** | ≤90min / feature / limited-series / binge filter + runtime badge | `TitleDetails.runtime`/`episodesCount` |

**Doc-defining differentiators (most design investment):** F3 "The Argument" + F4 "Credibility" are unique to non-fiction. F2/F5/F6/F9/F11 are the reusable non-fiction backbone. **Real gap flagged:** `keywords` normalization isn't yet wired in `normalize.ts` — F2 needs a small `raw.keywords → TitleDetails.keywords` addition, or falls back to `similar` + `topTags`.

**Scene walkthrough ("deep in documentaries"):** (1) Threshold `/genre/documentary` — amber color-wipe, hero "You watch docs for **climate** and **music**" from `topTags`; F8 sub-genre chips + F7 era scrubber. (2) Voices + On-ramp — F1 Herzog/Morris/Johnson cards (`favoriteDirectors` first) + F6 "New to climate docs? Start with *Chasing Ice*…". (3) A title — F3 "Argument" panel + F4 provenance strip (distributor, IMDb 8.2/RT 94%, stance: advocacy) + F9 echo. (4) Topic thread — F2 surveillance spine across F7 eras + F5 watch-path for *The Confession Tapes* with `upNext` progress; pull-based "Keep going" strip, **no notification** (ADR-0006).

### 13.5 Contextual/comparative element inventory (reusable building blocks)
10 enumerated blocks, each with interaction mechanics + real data source + genre fit + a11y (keyboard/reduced-motion/44px) + tier:
1. Timeline/Era scrubber · 2. Director/Maker spotlight · 3. Topic/Theme cluster graph · 4. Map/Geo view · 5. Watch-order Arc sequencer · 6. Comparison Matrix/Slider · 7. Score/Soundtrack mood layer · 8. Critic/Community + credibility · 9. "Start Here" onboarding · 10. Save/Resume journey shelf + related-topics branching.

**Universal (all genres, built on already-shipped services/components):** #6 Comparison Matrix (`compare_titles`), #8 Critic/Credibility (`CriticBadge`), #9 Start-Here onboarding, #10 Save/Resume shelf.
**Genre-module (gated config):** #1 Timeline, #2 Maker Spotlight, #3 Topic Cluster, #4 Geo, #5 Watch-order.
**Cut:** #7 Mood/soundtrack layer (pure atmosphere, off-by-default — banned as AI-slop mesh-gradient).

### 13.6 Per-genre feature matrix (13 genres × 2-4 genre-native signatures)
Sci-Fi · Horror · Film-Noir/Thriller · Romance · **Documentary** (see §13.4) · Animation/Anime · Western · Fantasy · Crime/Mystery · Comedy · Music · War & Politics · History · Travel — each gets 2-4 genre-native signatures (e.g. Sci-Fi: Constellation map + Hard-SF-vs-space-opera split + "sense of wonder" on-ramp; Horror: sub-genre dread-spectrum + era cycles + "comfort horror" vs "extreme" toggle; Western: frontier map + director (Ford/Leone) spotlight + era scrubber). Full matrix in subagent cache (`subagent-summary-0-...-002122.txt`).

### 13.7 Feature-richness verdict + recommended minimum set
**Verified verdict (post-grill 2026-07-15):** v1-as-drawn (universal devices only, all genre-agnostic) is **richer but still ONE structure** — a richer recolored shell, not structurally different. The "8 interaction families" label conflated device *count* with structural *differentiation*. True structural differentiation arrives only at **v1.5 genre-modules**. The original §13.7 "lift from ~2 to ~8 families = rich enough" was an overclaim and is corrected here.
- **v1 (recommended MVP, not a recolored shell):** universal shell + 4 cheap editorial devices (Argument spine, Maker spotlight, You-Are-Here arc, Echoes) + the 4 universal elements (#6 Compare, #8 Critic/Credibility, #9 Start-Here, #10 Save/Resume) + **ONE cross-genre module proof: the Timeline/Era scrubber (doc F7)**, parameterized via `genreWorld` config, live for ALL genres (every title has a release date). This is the only cut that is NOT a recolored shell while staying cheap — it proves the "one component, N configs" thesis with a single concrete instance and delivers a real scrubbable temporal axis.
- **v1.5 genre-modules (gated config):** Timeline/Era scrubber (proven in v1), Geo Map, Topic Cluster, Watch-order Sequencer, Critic/Credibility nuance — switched on per genre via `genreWorld`.
- **Cut from v1:** Quote pull-quotes + Mood/Soundtrack cue-mapping (decorative, off-by-default); ambient generative art (AI-slop ban); autoplay trailers; second LLM narrator; genre-level fatigue; world notifications. Documentary F2 (keywords gap), F3/F4 (heaviest), F5 deferred to v1.5.
- **Proof-genre scope:** ship **3 proof genres** (Documentary, Sci-Fi, Horror) with distinct registers — not the full 13-genre matrix (that is ~2-3× one build). Register = type + Companion lexicon + cue beat-map, zero new assets.

### 13.8 Tiered model (answers the "when" fork)
- **v1 = Universal shell + 4 editorial devices + 4 universal elements + ONE cross-genre module (Timeline scrubber)**, live for all genres via `genreWorld` config. NOT the "8 universal devices" original — that was the recolored shell. This is the minimum that is structurally different (a real scrubbable temporal axis), not just aesthetically varied.
- **v1.5 = Genre modules.** The `genreWorld` config switches on archetype-specific blocks (timeline for History/War, geo for Travel/War, watch-order for TV/Reality, topic-cluster for Documentary). Driven by the ONE component parameterized over the config — not N page variants.

---

## 13.9 GRILL FINDINGS (2026-07-15, 4-agent `grill-with-docs` team) — pre-plan must-fix

Verified against the repo (file:line), not agent-assertion-only. All findings folded into §13.7/§14/§15.

**STILL-BLOCKING (must resolve before/within Phase 2):**
- **G1 — `forYou` has NO genre-seed param** (`discoverService.ts:99`). "Reuse with explicit seed" = modification, not drop-in call. Phase-2 scopes a new/modified engine (explicit genre seed → `ids.join("|")` OR logic).
- **G2 — bare `filterCatalog` is a silent composition regression.** It does NOT read `getExcludedGenres` (default `[]`); only `flag()` does (`discoverService.ts:27-50`). New service MUST call `flag(db, items)` (or pass `excludedGenres: getExcludedGenres(db)`) — bare `filterCatalog` silently shows ignored/genre-excluded titles. Hard code-review gate.
- **G3 — doc self-contradicts on anchor logging** (§7 "on view logs anchor" vs R3 "never on view"). Current code logs only on title-open (`insightService.ts:234` take, `:272` insight_neighbors ×3, `tools.ts:586` compare_titles). MUST forbid log-on-view in the world; reuse `:263-273` only inside a real open action.
- **G4 — ChatDock collision.** Global, hidden ONLY on `/chat` (`App.tsx:16,51`) → floats over `/genre`, colliding with the world's own Companion surface. **Decision: hide ChatDock on `/genre` too** (recommended).
- **G5 — v1-universal-only is STILL a recolored shell.** Corrected in §13.7: true structural differentiation needs v1.5 genre-modules; v1 must include ≥1 real module (Timeline) to not be a tint-swap.

**VERIFIED-SAFE (held framing for Phase 2):** "one batched LLM call" is admitted-NEW code (not drop-in); `keywords`/`origin_country` gap real (F2/Geo need normalize.ts extension or `similar`+`topTags` fallback); anchorService exports + `discover_titles` OR/year caps + ChatDock existence all confirmed; documentary exemplar F1/F10 anchors ALL REAL (`tasteProfile.favoriteDirectors` `:128-209`, `normalizePerson` `normalize.ts:214-256`, `catalog /tmdb/person/:id` `:95-110`, `retrieveLibrary` `retrieval.ts:28`, `ratingsService.ensureRatings` `ratingsService.ts:66`). One UX grill agent falsely claimed these "don't exist" — rejected after re-grep.

---

## 14. REVISED open forks (your go/no-go)

| # | Fork | Recommendation |
|---|---|---|
| 1 | Routing | **Standalone** `/genre/:slug` (confirmed) |
| 2 | Genre-count default | **Single default; multi opt-in via `+`** (OR'd grab-bag weakens "world") |
| 3 | AI-guided default | **Opt-in** (honors ADR-0006) |
| 4 | Shell nav | **5th "Worlds" nav item** (justified by richness) |
| 5 | Per-genre richness scope | **v1 = universal shell + 4 devices + 4 elements + Timeline module (all genres); v1.5 = genre-modules via `genreWorld`** — do NOT ship universal-only (recolored shell) |
| 6 | Proof-genre scope | **3 proof genres: Documentary, Sci-Fi, Horror** (distinct registers); defer full 13-genre matrix |
| 7 | ChatDock on `/genre` | **Hide it** (avoid double-companion collision, G4) |
| 8 | Anchor logging | **Forbid log-on-view; reuse `insightService.ts:263-273` only inside real open** (G3) |
| 9 | Font stack | Keep real **Fraunces/Inter** (verified) OR migrate to Cabinet Grotesk/Geist — decide (affects feel-doc type registers) |

---

## 15. Next concrete step
Revise per your go on §14 forks, then run Phase 2 (writing-plans → TDD build via CC, two-stage review). Build stays gated on your approval. The documentary exemplar (§13.4) is the reference implementation target for the v1.5 genre-module system.
