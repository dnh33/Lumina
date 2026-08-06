# Broader Worlds Council — New Features · Deepenings · Blind Spots

**Scope:** Advising the *Worlds* feature (`/genre/:slug`) on top of the prior 3-lens council
(`council-visual-hierarchy-critique.md`), the 2 Opus creative runs (`cc-creative-opus.txt`),
and the merged P1–P6 refinement plan (`.hermes/plans/2026-07-15-worlds-ui-ux-refinement.md`).
The 8 prior new-feature ideas (plan Phase 7) are now **merged into the build** — this council
goes *beyond* them. Every claim below was checked against the live repo
(`client/src/pages/GenreExperience.tsx`, `components/genre/*`, `lib/genreWorld.ts`,
`server/src/services/genreExperienceService.ts`).

**Verified anchors (so we don't re-litigate):**
- `GenreExperience.tsx:22` hardcodes `api.genreExperience([slug], "self", "movie", world.modules)` → TV and `guided` mode are unreachable.
- `AnchorFrame.tsx` renders library matches as plain `<li>` (no `/title/...` link); `ArgumentPanel.tsx:24` renders `counterpoint.title` as plain text (no link).
- `GenreModules.tsx:36` `buildTopics` emits `Genre ${gid}`; `:66` sets geo `name: code`.
- `playCue` is never called on the genre page — `register.cueBeatMap` is dead config.
- `enrichGenreItems` (`genreExperienceService.ts:149`) calls `titleInsight(...)` with **no** `skipAnchorLog` guard → the plan's P1.6 G3 fix is not yet in the code.
- `getGenreWorld` returns `GENERIC` (only `modules:["timeline"]`) for every non-proof slug.
- `ChatDock` is hidden on `/genre` (`App.tsx:56`); the Companion CTA ejects to `/chat`.

---

## (A) NEW FEATURES — top 10 (beyond the merged 8)

**1. Cross-world warp — a constellation of Worlds + in-world "neighbors" rail. (HIGHEST IMPACT)**
The 13 Worlds are siloed: the only traversal is the flat `GenrePicker` grid, and within a World there is zero path to an adjacent one. Add a persistent "Worlds map" (a navigable node layout where edges encode adjacency — sci-fi↔fantasy, noir↔thriller↔crime, documentary↔war-politics) built from a new `adjacency` map in `lib/genreWorld.ts`, plus a "Neighboring worlds" rail on every World page that links out. This gives the *whole feature* a spine and kills the one-page-at-a-time problem the prior councils named but never solved structurally. Reuses `getGenreWorld` + `PosterCard`; compose from the same primitive kit as the per-metaphor layouts so it isn't a 14th snowflake.

**2. Mood / context entry point — enter a World by feeling, not just genre.**
`register.lexicon` + `tonePrompt` are defined per World and currently do almost nothing. Add a `moods[]` field to `GenreWorld` and a front-door resolver (`mood → slug(s)`) so a user can arrive via "unsettle me / comfort me / challenge me / amaze me" instead of scanning a genre list. This is the single highest-leverage use of the dead `register` data and reframes `/genre` (the picker) from a catalog into an intent surface. Drop-in: a `MoodEntry` component on `GenrePicker` that links to `/genre/:slug`.

**3. "Why this genre for *you*" — the World's own origin story (world-level provenance).**
Distinct from the prior per-card "why this belongs here" (#3). Use the already-returned `anchorsUsed` + `profileState` to render a hero-level line: *"You've rated 14 sci-fi titles avg 8.1; seeded by Blade Runner, Arrival, Dune."* This is the private-app superpower at the *world* level — full transparency into a taste model that is genuinely the user's, and it teaches taste. Cheap: purely a client composition of `data.anchorsUsed` + `data.profileState`, no new server work.

**4. Juxtaposition / dual-World compare mode.**
`/genre/:a..:b?compare` overlays two Worlds: shared anchors, divergent theses, overlapping titles/directors, and "where your taste splits." Reuses `PosterCard` + `AnchorFrame` + `ArgumentPanel`; the server already returns per-World `items`/`anchorsUsed` so two fetches compose cleanly. For a single-user taste app this is the killer "how do my sci-fi and my noir differ" view the social apps can't offer. New surface: a `CompareWorlds` page + a "Compare with…" control on the World header.

**5. Ambient, non-modal AI whisper strip (distinct from the conversational Companion).**
The merged #2 is a *diegetic Companion* (pull-to-chat). Separate and new: a glanceable one-line "world read" that re-captions itself as you filter/scrub — e.g. narrowing to 2010s sci-fi yields *"Your 2010s leans hopeful — 3 anchors, 2 unwatched."* Driven by `intro`/`insight` + the live client filter state (P2/P3). Non-modal, silent by default, never interrupts — it *captions* the journey rather than hosting it. Reuses `curatorIntro` shape; small client component fed by existing query state.

**6. Export / save a World as a self-note (private "share-with-self").**
A local-first single-user app has no social share, but it absolutely has a "keep this" job the current design ignores. Let the user capture the current steered World — hero hook + selected titles + their own argument annotations (see B2) — as Markdown into the app's notes store, plus a printable/PDF view. Reuses `intro` + `data.items`. Fills the "I found a great warp through sci-fi, now where did I put it" gap that persistence-alone (#4 merged) doesn't cover.

**7. Marathon / watch-session builder from a World.**
Consume `watchorder` + timeline + the user's watchlist to assemble a sequenced *session* (a movie night or binge order) saveable to the library as a playlist. Reuses `WatchOrderSequencer` + `PosterCard` quick-actions (watch/watchlist). Serves the concrete "I want to actually watch these" job that pure discovery never closes — and turns `watchorder` from a stub (see B8) into a launchpad.

**8. Structured steering presets (cheaper than free-text Steer).**
P5 ships free-text "Steer this World" → chat. Add quick-pick steer chips that set the *already-existing* server opts directly: "Less well-known" (lower `vote_count.gte`), "Critically divisive" (IMDb≠RT), "From my region" (`geo`), "New to me" (`ignored`/`watchlist` exclusion). Maps onto `GenreExperienceOpts` (plan P5.1) with zero new LLM path; faster and more discoverable than typing a sentence.

**9. Taste-evolution overlay on the timeline (collaborative-with-self line).**
Plot `anchorsUsed` (with their ratings) and the user's watchlist onto the decade axis as markers, so the timeline reads *"where you are"* against the genre's arc — the "collaborative-with-self timeline" from the charter. Pure client: bucket `anchorsUsed` by `decadeOf(year)` (the helper already exists in `TimelineScrubber.tsx:9`) and overlay. Makes the timeline a personal instrument, not a TMDB sort.

**10. Cold-start World bootstrap loop (make the empty state actionable).**
`GenreEmptyState` copy says *"anchor it with a title you love"* but offers **no action** to do so — a dead exhortation. Add a real loop: search a related library title → add as anchor → re-query the World. Also the escape hatch for the `Generic` husk (C3). Turns the niche/empty state from a dead-end into the *grow-this-world* onboarding, which is the private app's real cold-start job.

---

## (B) DEEPENINGS — top 8 (modules + metaphors, beyond P1–P6)

**1. Timeline becomes the World's spine + taste overlay. (HIGHEST IMPACT)**
P2 only lifts the decade filter to page scope; deepen it into the *primary axis you travel along*: overlay `anchorsUsed` + watchlist markers (B9), add a one-line LLM era-thesis per decade (reuse `curatorIntro`/`titleInsight`), and let a decade selection *zoom* the world rather than merely filter a grid. This is the most-trafficked module and the direct cure for "dashboard, not a journey" at the spot users actually touch.

**2. Argument becomes dialogue, not broadcast.**
`ArgumentPanel` renders `counterpoint.title` as plain text (dead link) and only one perspective. Make the counterpoint a real `<Link to="/title/...">`, surface pro/con/neutral from the existing `insight.comparisons` array, and let the user *annotate* ("I disagree because…") stored locally — turning the richest module from a wall into a private conversation. This is where the "depth over breadth" premise either pays off or collapses.

**3. Metaphor as structural grammar — flagship layouts from shared primitives.**
Beyond P6's color/spacing gesture, compose each metaphor from one kit: **Constellation** = pannable node-graph where proximity = shared director/topic/anchor and pulling a star lights its lineage; **Panel** = gutter-carrying panels where crime reads case→motive→thread in order; **Threshold** = one-title-at-a-time corridor with the `warn` cue + vignette. This is merged #1/#6 realized as the differentiation engine. Do Constellation first — it's the showcase and the template the others clone.

**4. Geo: fix `name: code`, add a real region view, contrast "your region vs world."**
`GenreModules.tsx:66` sets `name: code` (so `GeoMap` shows "US" not "United States") and count is hardwired to 1. Map ISO→name, render an actual region visualization, and contrast `originCountry` against the user's own library countries (private-app angle). Make geo the *spine* for Frontier/travel (B3), not a decorative code list.

**5. Critic: surface consensus divergence + you-vs-critics + real watch action.**
`CredibilityStrip` today shows a useless `distributor: "Available"` string (`GenreExperience.tsx:53`) and only IMDb/RT. Show the *interesting* story — when IMDb≠RT — overlay the user's own `rating` from `anchorsUsed`, and make "where to watch" a deep-link to the provider. Critic is currently the thinnest *useful* module; this makes it the credibility surface the Reading Room/war-politics Worlds promise.

**6. Maker: directors index + "maker as lens" re-sort.**
Beyond a per-title director line, aggregate recurring directors across the World, show the user's affinity to each (shared anchors), and let "sort by director" re-spine the page. Low effort, high "I see my own taste" payoff — and it directly exercises the `maker` module that today is just a name + `/person` link.

**7. Topic: real theme names + topic as a navigational axis.**
Fix `buildTopics`' `Genre ${gid}` label (use a `GENRE_ID_NAMES` constant, per plan P4.3) and let clicking a spine *filter* the World; optionally derive theme spines via LLM instead of raw TMDB genre ids. Topic stops being a decorative rail and becomes a second navigable axis beside the timeline.

**8. WatchOrder: real sequencing + progress + feed the marathon builder.**
Currently `recommendedStart: 1` and bare seasons (`genreExperienceService.ts:60`). Produce a curated viewing order *across the World's titles* (or episode-level for a series), show the user's progress through it, and expose it to the marathon builder (A7). WatchOrder graduates from stub to the "what do I actually watch" engine.

**Metaphor-specific deepenings (compact):** *Reading Room* = two-column dossier, TOC spine + curatorial prose with credibility strips inline as citations, argument as spine. *Warm Interior* = cozy clustered grid, warm glow, **rewatch shelf featured** (watched titles surfaced, not buried) + ratings shown openly (intimacy). *Frontier* = horizontal journey, geo map is the spine, "ride further out" serendipity, generous leading whitespace (expanse). *Generic* = the honest degenerate case: "This genre has no world yet — here's the bare timeline, grow it (A10)" — don't pretend; turn Generic into the bootstrap entry, not a husk.

---

## (C) BLIND SPOTS — top 8 (verified against repo)

**1. TV is unreachable and `guided` mode is dead. (HIGHEST IMPACT)**
`GenreExperience.tsx:22` hardcodes `mediaType:"movie"` and `mode:"self"`. The server's `ExperienceMode = "self" | "guided"` and the TV discover path exist but are **never triggered** — every World is movie-only and self-only. Anime/comedy's `watchorder` and any series angle are inert; the "guided" branch is dead code. A whole media dimension is silently missing from a film/TV app.

**2. Dead-end affordances: AnchorFrame + ArgumentPanel counterpoint don't link.**
`AnchorFrame` renders library matches as plain `<li>` (no nav to `/title/...`); `ArgumentPanel.tsx:24` renders `counterpoint.title` as text (no link). These are two of the few "personal" surfaces in the whole page, and both promise navigation while delivering none — directly undercutting the "your taste" premise the Worlds are built on.

**3. `Generic` + "All genres" = shipped husks.**
`GenrePicker` links every non-proof genre to `getGenreWorld`, which returns `GENERIC` (only `modules:["timeline"]`). Clicking "Action"/"Drama"/"Horror" (when not a proof slug) yields a bare timeline with no metaphor, no modules, no personality — the worst "coat of paint" case, presented as a feature. The niche gate doesn't save these; only the 13 proof slugs get a World.

**4. Cold-start: an empty/young library zeroes the personal layer.**
`selectAnchors` returns `[]` when `retrieveLibrary` is empty, so `AnchorFrame` vanishes and `intro.basedOn` is "None yet." The World collapses to a generic TMDB list with none of its differentiating "for you" content — the private-app value is invisible until the user has logged many titles. No onboarding bridges this.

**5. `cueBeatMap` is dead — no sound fires on any World.**
Every `GenreWorld.register.cueBeatMap` declares cues (open/discover/warn) but `playCue` is **never called** on the genre page (only `ChatDock`/`PosterCard` use it). The entire sonic identity the config promises is unimplemented, and since P6 concedes metaphor = color only, sound is the *only* unused differentiator left. (Merged #5 addresses this — flag it must-ship, not nice-to-have.)

**6. `logAnchor` storm is still live (G3 violation not yet fixed).**
`enrichGenreItems` (`genreExperienceService.ts:149`) calls `titleInsight(...)` with no `skipAnchorLog` guard; the plan's P1.6 fix is not in the code I read. Building any `argument` World therefore writes a `take` anchor for *every title*, polluting the taste graph the Worlds claim to respect. This is a correctness bug hiding behind a green (mocked) test — fix before the 8 features merge.

**7. No persistence / no return — feed-statelessness in a local-first app.**
`GenreExperience` holds no URL state (pre-P2/P3) and no saved steer/dismiss/scrub; every visit re-renders from cache. A "World" you can't return to mid-thought contradicts the local-first premise (merged #4 covers this — it must ship with P2/P3, not after).

**8. Accessibility + error gaps at the seams.**
`TimelineScrubber` uses `role="tab"`/`role="tablist"` with **no** `aria-controls`/`aria-labelledby` on owned panels (tab semantics without panels); the genre page has no skip-link and no focus management on route change; `isError` shows a bare "Couldn't open this world" with no retry; reduced-motion is honored but sound-on-by-default can ambush AT users. Immersion dies at the seams (merged #5's risk) and a11y is weakly wired — review alongside P6.

---

## PROMOTION FLAGS — which merged Phase-7 ideas are must-have vs nice-to-have

Given the 8 are now in-build, the council ranks them:

**MUST-HAVE (ship with P1–P6, not deferred):**
- **#1 Metaphor as layout grammar** — root cause of "coat of paint"; the differentiation engine. Scope it via the shared primitive kit (B3) to avoid 6 snowflakes.
- **#2 Ambient in-world Companion** — replaces the eject-to-/chat CTA at peak engagement; uses the dead `register`. Highest emotional impact.
- **#3 "Why this belongs here" provenance** — private-app superpower, cheap, and it repairs C2's dead-ends.
- **#4 World persistence** — local-first premise; must land with P2/P3 URL state or the "place" promise is empty.
- **#6 One spatial spine per world** — the organizing principle behind B1/B3; folds into #1.

**NICE-TO-HAVE (post-P1–P6, delight layer):**
- **#5 Sound + motion via `cueBeatMap`** — strong differentiation but sound-fatigue risk; ship sound-off default, reduced-motion honored (C5 confirms it's currently fully dead, so even a minimal version is a big win).
- **#7 Per-world serendipity gesture** — depth delight; build after the spine exists.
- **#8 Library density as place** — texture, not structure; cheapest to add once B1/B3 land.

**Also promoted:** fix **C6 (`logAnchor` storm)** and **C2 (dead-end links)** *before* the 8 features merge — they are correctness/premise bugs the new features would inherit and amplify.
