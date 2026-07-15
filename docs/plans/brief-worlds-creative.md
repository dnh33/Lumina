# Brief — Creative Council: Worlds UI immersion + blind angles (OPUS)

You are a senior product/UX designer doing an OUT-OF-THE-BOX critique of one screen in a private, local-first film cataloging app called **Lumina**. Do NOT write code. Return a ranked, concrete design opinion.

## What "Worlds" is (verified against the real repo)
A standalone immersive genre page at `/genre/:slug`. The user picks a genre and goes DEEP (not a breadth-first list). There are 13+ worlds, each defined by a `GenreWorld` config:
- `metaphor`: one of `Reading Room | Constellation | Threshold | Warm Interior | Frontier | Panel | Generic`
- `register`: `{ lexicon: string[], tonePrompt: string, cueBeatMap: string[] }`
- `modules`: subset of `timeline | maker | critic | topic | geo | watchorder | argument`

Examples: documentary=Reading Room ("Curious, credible, analytical", modules timeline/maker/critic/topic/argument/watchorder); sci-fi/fantasy=Constellation; horror/film-noir/thriller=Threshold; romance/comedy=Warm Interior; western/travel=Frontier; anime/crime/mystery/music=Panel.

### Current page composition (code-grounded)
1. `ExperienceHero` — gradient hero, metaphor eyebrow + title + tonePrompt.
2. `AnchorFrame` — "Closest in your library" chips (titles you already have, matched by genre).
3. `TimelineScrubber` — decade TABS (no arrows yet); selecting a decade filters only its own little grid, NOT the page. (Plan will make it a page-wide scrubber with arrows + clickable PosterCards.)
4. `GenreModules` — parameterized host rendering the world's enabled modules over the items: timeline grid, TopicCluster (spines by genre), CredibilityStrip (distributor/streaming/IMDb chips), WatchOrderSequencer (tv seasons), ArgumentPanel (LLM thesis+counterpoint), GeoMap (production countries), MakerSpotlight (director).
5. "For You in this World" — a `Carousel` of `PosterCard`s.
6. "Explore with the Companion" CTA → navigates to `/chat` with a prefilled prompt (the existing AI chat, called Companion).

### Key capabilities that already exist (reuse, don't rebuild)
- `PosterCard` is fully clickable → `/title/:type/:tmdbId` (a real title detail page exists), with hover quick-actions: save to watched/watchlist, ignore (drops from taste), and "retire as anchor" (anti-fatigue for over-cited comparison titles).
- Sound: `playCue(name)` exists (open, discover, warn…) — the app has a sound layer.
- Motion: framer-motion everywhere (reduced-motion respected).
- The server `buildGenreExperience` returns per-title `enrichment`: director, seasons, watchProviders, originCountry, imdbRating/rtRating, and an LLM `argument` (thesis + counterpoint). Plus `intro` (curator hook/tone) and `anchorsUsed` (library matches).
- `ChatDock` (global companion) is hidden only on `/chat` — it currently floats over `/genre` too.
- Positioning constraint: Lumina is PRIVATE, local-first, single-user. No social graph, no collaborative filtering, no engagement-optimization. Honor that.

## Your task
Think HOLISTICALLY and OUTSIDE THE BOX about the Worlds experience. Two deliverables:

### A. Value-adding / immersive elements to ADD
Propose interactions & elements (beyond the already-planned filter / steer / title-cards / timeline-scrubber) that would genuinely increase VALUE and IMMERSION. Use the `metaphor` system as a primary design lever — each world could FEEL structurally different, not just be recolored. Consider (but don't be limited to): immersion loops, spatial/kinetic interaction, personalization that uses the existing taste signals (library, anchors, ignored titles, ratings), continuity (save/resume a world, deep-link), sound/motion as feedback, the Companion as a co-pilot rather than a handoff, "why this belongs here" provenance, serendipity vs control balance. For each idea: what it does, which world/metaphor it shines in, why it adds value, and one risk/tradeoff.

### B. Blind angles
Identify what the CURRENT Worlds UI and feature set COMPLETELY MISSES or gets wrong — interaction dead-ends, unmet jobs-to-be-done, metaphors that are asserted but not expressed, moments where the experience feels like "a list with a coat of paint," accessibility/empty-state/error gaps, or places where the private/single-user nature creates a different need than a social app would. Be specific and ranked by impact.

Return: a tight ranked list for A (top ~8) and B (top ~6), each item 2-4 sentences, no code, no filler. Lead with the single highest-impact idea.