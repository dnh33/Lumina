# Council Critique — Genre World: Visual Hierarchy & Composition

**Lens:** visual/UX craft. **Verdict:** the page is a concatenated *stack of full-width sections*, and modules are *item-iterated* — so it reads as a wall, not a curated composition. The timeline is a sealed widget. Nothing below the poster rails is clickable.

## What the code actually shows
- `GenreModules` maps **every enabled module over all items** → for documentary (6 modules) you get Timeline, then N `MakerSpotlight`, N `CredibilityStrip`, TopicCluster, N `ArgumentPanel`, N `WatchOrderSequencer` — a vertical wall with zero composition.
- `TimelineScrubber` holds `selected` in local `useState`; it filters **only its own grid**, never the page. That is the "slider doesn't filter" complaint. It's `flex-wrap` pills — no arrows, no scrub, wraps awkwardly past ~8 decades.
- `buildTopics` labels spines `Genre ${gid}` → the literal "GENRE 99" from the stale screenshot. Not human-readable.
- Titles in the timeline grid and module rows are plain `<p>/<li>` — **no links**. Only `TopicCluster` + "For You" use `PosterCard` (which links to `/title/...`). Hence "can't click into titles."
- No search/sort/filter affordance exists anywhere.
- `world.metaphor` (Reading Room / Constellation / Threshold / …) appears **only as a hero eyebrow** — never expressed in layout. Every section is the identical `rounded-2xl border-white/[0.06] bg-white/[0.02]` card, so hierarchy is flat: hero, anchor, timeline, and the module wall carry equal weight.

## Recommended layout (section order + composition)
1. **Hero** (keep) — promote metaphor to a real label.
2. **AnchorFrame** (keep).
3. **Timeline = true filter bar**: sticky, horizontal-scroll rail with ← → arrows; selecting a decade sets the *page's* active decade and filters the items fed to every module below.
4. **Compose modules into Title Cards, not module walls.** Each title → one editorial card (poster thumbnail + Maker + Credibility chips + Argument + WatchOrder where present). Use a 12-col grid: `TopicCluster` as a left "spine" rail; titles render as curated rows carrying their per-title modules inline. Where a genre is dense, offer **module Tabs** (Reading Room: *Evidence / Argument / Makers*) instead of a scroll-wall.
5. **For You** carousel (keep). 6. **Companion CTA** (keep).

## Top visual fixes (the "finished" cues)
- **Express the metaphor with one accent token + one layout gesture**: Reading Room = serif labels, warm paper tint; Constellation = dot-grid connector lines between related titles; Threshold = vignette + hairline frame. Drive styling off `world.metaphor`.
- **Differentiate hierarchy**: hero > anchor > curated rails > carousel. Vary card elevation; extend `PosterCard`'s `group-hover` ring+lift to title cards.
- **Make everything clickable**: timeline items + cards link to `/title/:media/:id`.
- **Fix `buildTopics`** to use real genre names.
- **Partial-state polish**: add min-heights + "no argument yet" placeholders so sparse genres read intentional, not broken.
