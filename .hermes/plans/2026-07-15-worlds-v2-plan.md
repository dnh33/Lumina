# Worlds v2 — Immersive Genre Experience: Implementation Plan

> **For Hermes:** Use subagent-driven-development to implement task-by-task. Each task = 2-5 min,
> TDD (write failing test → run fail → implement → run pass → commit). Fresh subagent per task
> with two-stage review (spec compliance, then code quality). Orchestrator = Rune.

**Goal:** Turn the genre World (`/genre/:slug`) into an immersive, steerable, composed, returnable
place — closing the 4 original complaints + the "unfinished / coat-of-paint" problem + shipping the
council's full feature vision (option B: merge ALL features, cheap-wins-first).

**Architecture:** Keep the existing react-query + server `genreExperience` shape. Split LLM
enrichment lazy (P1). Add a single `useGenreState` serializer (URL + localStorage, ADR-W8) with a
`libraryVersion` reconcile. New features are prop-driven modules + server opt plumbing; no new
framework. `register.accent` CSS var (W4). `skipAnchorLog` net-new param (K3, 2 sites). Guided mode
dropped as fiction (K1).

**Tech Stack:** React 18 + Vite + TypeScript (client); Node + TS + Express (server); react-query;
framer-motion; `cuelume`/`playCue` (sound); Vitest + @testing-library/react (client tests); node:test
or vitest (server tests).

**Reference (read before coding each phase):**
- Design doc: `docs/plans/2026-07-15-worlds-v2-design.md` (Layers A/B/C/D, §4 bugs, §5 blind spots, §6 ADRs, §9 grill).
- Prior plan (P1–P6 detail): `.hermes/plans/2026-07-15-worlds-ui-ux-refinement.md`.
- Council: `docs/plans/worlds-broader-council.md`, `docs/plans/council-architecture-feasibility.md`.

**Verification (every task):** `npm run test` (client+server), `npm run typecheck`, `npm run build`.
**Live (per phase):** boot server, `npm run dev`, click `/genre/documentary` + a TV genre.

---

## PHASE 1 — Foundations + must-fix bugs (§4)

> Unblock everything. These are correctness/premise defects the council found in SHIPPED code.

### Task 1.1: Add `skipAnchorLog` to `titleInsight` (K3, net-new, 2 write sites)

**Objective:** Stop the G3 `logAnchor` storm during batch enrichment.

**Files:**
- Modify: `server/src/services/insightService.ts:191` (signature), `:234` (take write), `:271-273` (neighbor write).
- Test: `server/test/insightService.skipAnchorLog.test.ts` (new).

**Step 1: Write failing test**
```ts
import { memoryDb } from "../helpers";
import { titleInsight } from "../../src/services/insightService";
import { listAnchors } from "../../src/services/anchorService";

test("titleInsight with skipAnchorLog writes no anchors", async () => {
  const db = await memoryDb();
  const before = (await listAnchors(db)).length;
  await titleInsight(db, 123, "movie", false, true); // skipAnchorLog = true
  const after = (await listAnchors(db)).length;
  expect(after).toBe(before);
});
```

**Step 2: Run to verify failure** — `cd server && npx vitest run insightService.skipAnchorLog` → FAIL (`titleInsight` takes 4 args, 5th undefined).

**Step 3: Implement**
- `insightService.ts:191`: `export async function titleInsight(db, tmdbId, mediaType, refresh=false, skipAnchorLog=false)`.
- `:234`: `if (!skipAnchorLog) { await logAnchor(db, …, "take"); }`
- `:271-273`: `if (!skipAnchorLog) { for (…) await logAnchor(db, …, "insight_neighbors"); }`

**Step 4: Run** — `npx vitest run insightService.skipAnchorLog` → PASS.

**Step 5: Commit** — `git commit -m "fix(insight): add skipAnchorLog, guard both write sites (K3)"`

### Task 1.2: Thread `skipAnchorLog` through `enrichGenreItems` (K3)

**Objective:** Batch enrichment no longer pollutes the taste graph.

**Files:**
- Modify: `server/src/services/genreExperienceService.ts:149` (call site).
- Test: extend `server/test/genreExperienceService.enrich.test.ts` (assert zero `take` anchors after build for an `argument` world).

**Step 1-2:** Test asserts `buildGenreExperience({mode:"self", …})` on a documentary slug writes 0 `take` anchors.
**Step 3:** `enrichGenreItems` calls `titleInsight(db, it.tmdbId, it.mediaType, false, true)`.
**Step 4:** Run test → PASS.
**Step 5:** Commit `fix(genre): skip anchors during batch enrichment (K3)`.

### Task 1.3: Fix `AnchorFrame` dead-end links (K2, safe client)

**Objective:** Library anchors become navigable.

**Files:**
- Modify: `client/src/components/genre/AnchorFrame.tsx:19-25`.
- Reuse: `PosterCard.tsx:157-158` link shape `<Link to={\`/title/${mediaType}/${tmdbId}\`}>`.
- Test: `client/src/components/genre/AnchorFrame.test.tsx`.

**Step 1-2:** Test: anchor `<li>` renders an `<a href="/title/movie/123">`.
**Step 3:** Wrap anchor in `<Link>` using its `tmdbId`+`mediaType` (already present).
**Step 4:** `npm run test` → PASS.
**Step 5:** Commit `fix(AnchorFrame): make library anchors link to /title (K2)`.

### Task 1.4: Carry `counterpoint.tmdbId` through server (K2, shape change)

**Objective:** Enable `ArgumentPanel` counterpoint links (needs server data first).

**Files:**
- Modify: `server/src/services/insightService.ts:20` (`comparisons[0]` has tmdbId — pass it),
  `genreExperienceService.ts:153` (map `{title, relation, tmdbId, mediaType}`),
  `server/src/types` (enrichment `counterpoint` type gains `tmdbId?`, `mediaType?`).
- Test: `server/test/enrichment.counterpoint.test.ts`.

**Step 1-2:** Test: `enrichment.argument.counterpoint.tmdbId` is defined for a title with a comparison.
**Step 3:** Thread tmdbId+mediaType from `insight.comparisons[0]` into the mapped object + type.
**Step 4:** PASS. **Step 5:** Commit `feat(enrich): carry counterpoint tmdbId/mediaType (K2)`.

### Task 1.5: `ArgumentPanel` counterpoint link (K2)

**Objective:** Counterpoint navigates.

**Files:**
- Modify: `client/src/components/genre/ArgumentPanel.tsx:22-25`.
- Test: `client/src/components/genre/ArgumentPanel.test.tsx`.

**Step 1-2:** Test: counterpoint renders `<a href="/title/movie/456">` when tmdbId present.
**Step 3:** Render `<Link>` when `counterpoint.tmdbId` exists; plain text otherwise.
**Step 4:** PASS. **Step 5:** Commit `fix(ArgumentPanel): link counterpoint to /title (K2)`.

### Task 1.6: Fix label/name bugs (K6)

**Objective:** Kill `Genre 99`, geo `name:code`, fake `distributor:"Available"`.

**Files:**
- Add: `client/src/lib/genreNames.ts` exporting `GENRE_ID_NAMES` (TMDB genre id→name map).
- Modify: `client/src/components/genre/GenreModules.tsx:36` (use `GENRE_ID_NAMES[gid]`), `:66` (ISO→name via a `COUNTRY_NAMES` map or `Intl.DisplayNames`),
  `client/src/pages/GenreExperience.tsx:53-54` (render real `watchProviders` instead of `distributor:"Available"`).
- Test: `client/src/components/genre/GenreModules.test.tsx`, `CredibilityStrip.test.tsx`.

**Step 1-2:** Tests assert topic label ≠ `Genre ${gid}`; geo label is a name; CredibilityStrip shows provider, not "Available".
**Step 3:** Implement constants + swaps.
**Step 4:** PASS. **Step 5:** Commit `fix: genre/topic/geo/credibility label bugs (K6)`.

### Task 1.7: Wire dead `cueBeatMap` to `playCue` (K5, B5 foundation)

**Objective:** Consume the dead `register.cueBeatMap` so sound can fire on the genre page.

**Files:**
- Modify: `client/src/pages/GenreExperience.tsx` (import `playCue` from `client/src/lib/sound.ts:72`),
  call `playCue(world.register.cueBeatMap.open)` on world open, `.discover` on filter change, `.warn` on error/empty.
- Test: `client/src/pages/GenreExperience.cue.test.tsx` (mock `playCue`, assert called on open + filter).

**Step 1-2:** Test: `playCue` called with the world's open cue on mount.
**Step 3:** Wire calls; respect `SOUND_KEY` mute + reduced-motion (sound is global-off default via existing policy).
**Step 4:** PASS. **Step 5:** Commit `feat(genre): consume register.cueBeatMap via playCue (K5/B5)`.

### Task 1.8: `register.accent` token (W4)

**Objective:** Make "accent color immersion" real, not all-amber.

**Files:**
- Modify: `client/src/lib/genreWorld.ts` `GenreWorld.register` gains `accent: string` (CSS var name or hex); add to all 13 worlds + `GENERIC`.
- Add: `client/src/lib/metaphor.ts` `accentVar(world)` → returns the var.
- Modify: `ExperienceHero.tsx:11-12`, `TimelineScrubber.tsx:54`, `GeoMap.tsx:31`, `WatchOrderSequencer.tsx:30,38` — replace hardcoded `amber-400` with `accentVar(world)` (or `var(--world-accent)` set on the page root).
- Test: `client/src/lib/metaphor.test.ts`.

**Step 1-2:** Test: `accentVar` returns world's accent; components consume it (snapshot or className check).
**Step 3:** Implement token + swap `amber-400` → accent across the 4 components.
**Step 4:** PASS. **Step 5:** Commit `feat(metaphor): add register.accent token, consume (W4)`.

### Task 1.9: Give non-proof genres a real `GenreWorld` (K4)

**Objective:** Kill `Generic` husks — every picker genre gets a minimal World.

**Files:**
- Modify: `client/src/lib/genreWorld.ts` `getGenreWorld` — for unknown slugs, return a minimal
  `GenreWorld` (timeline + a couple of cheap modules) instead of bare `GENERIC`, OR (preferred)
  register the main TMDB genres as real worlds. Test: `genreWorld.test.ts`.

**Step 1-2:** Test: `getGenreWorld("action")` returns modules beyond `["timeline"]`.
**Step 3:** Add a `GENERIC_LITE` world (timeline + credibility + argument) used as fallback; keep `GenreEmptyState` honest for empty libraries.
**Step 4:** PASS. **Step 5:** Commit `fix(genre): non-proof genres get a real world, not husk (K4)`.

---

## PHASE 2 — Layer A complaint fixes (P1–P6)

> From `.hermes/plans/2026-07-15-worlds-ui-ux-refinement.md` (already grill-hardened). Key
> corrections baked in: P1 deletes `curatorIntro` call at `:279` + intro return; cache key
> `mediaType:mode:genres:modules` (`:236`) kept verbatim; `openGuided` rewired to new intro query.

### Task 2.1: Split `intro` into `/discover/genre-intro` + `buildGenreIntro` (P1.1)
- `server/src/services/genreExperienceService.ts`: delete `curatorIntro` call at `:279` + `intro` return field at `:293`; add `buildGenreIntro(db, opts): Promise<GenreExperienceIntro>` calling `selectAnchors` itself (`:169`/`:278`) + `curatorIntro`; new cache key `genre-exp-intro:${key}` (reuse `getSetting`/`setSetting`).
- Test: `server/test/genreExperience.intro.test.ts` (items endpoint returns no `intro`; intro endpoint returns hook; both cache-warm).

### Task 2.2: Make per-title enrichment lazy/streamed (P1.2–1.6)
- `client/src/pages/GenreExperience.tsx:72` gates skeleton on `isLoading` — change to gate on items only; render `argument`/`maker`/`credibility` cards with their own per-title query that fills after. Return type: `items` first, enrichment streamed.
- Test: `GenreExperience.lazy.test.tsx` (rails render before argument text on cold cache — mock delay).

### Task 2.3: Rewire `openGuided` to new intro query (P1 break-fix)
- `GenreExperience.tsx:26-27,114` `openGuided` reads `data?.intro?.hook` → read from the new `useGenreIntro` query instead.
- Test: `GenreExperience.openGuided.test.tsx`.

### Task 2.4: Timeline arrows + page-scope filter (P2)
- `client/src/components/genre/TimelineScrubber.tsx`: add ← → buttons; `export decadeOf` (`:9`); page (`GenreExperience.tsx`) filters ALL modules by `decadeOf(year)`, not just its own grid.
- Test: `TimelineScrubber.arrows.test.tsx` + page filter test.

### Task 2.5: Titles clickable `PosterCard` in rails (P2)
- Rails render `PosterCard` (`:158` link to `/title/:type/:tmdbId`); preserve hover quick-actions.
- Test: `GenreModules.poster.test.tsx`.

### Task 2.6: Client search + sort + tag chips (P3)
- `GenreExperience.tsx`: `?q&?sort&?tags` URL params; client filter/sort over `items`.
- Test: `GenreExperience.filter.test.tsx`.

### Task 2.7: TitleCard composition + Tabs + label fix (P4)
- `GenreModules.tsx`: per-title `TitleCard` (poster+maker+credibility+argument+watchorder inline) + module `Tabs`; `buildTopics` uses `GENRE_ID_NAMES` (Task 1.6).
- Test: `GenreModules.tabs.test.tsx`.

### Task 2.8: Server steering opts + "Steer this World" (P5)
- `genreExperienceService.ts`: add `keyword`/`decade`/`sort`/`provider`/`lang` to the **inline discover params object** (NOT a phantom builder); `decade`/`keyword` reserved inert until re-query ships; "Steer" button prefills Companion with filters + sentence.
- Test: `genreExperience.steer.test.ts` (params constructed correctly; `decade` ignored by client path).

### Task 2.9: Metaphor accent + polish (P6)
- `ExperienceHero.tsx` + `metaphor.ts` (Task 1.8): accent color + spacing gesture per metaphor; sparse-state polish. Locked to font lock (no font swaps).
- Test: `metaphor.test.ts` + visual snapshot.

---

## PHASE 3 — Cheap value-provers (lead, prove alive)

### Task 3.1: Provenance (B3) — per-card "why this belongs here"
- `client/src/components/genre/TitleCard.tsx`: show "shares director with X" (from `maps.makers`) / "topic: surveillance" (from `enrichment.argument.topic`) / counterpoint link (Task 1.5). No new server call.
- Test: `TitleCard.provenance.test.tsx`.

### Task 3.2: World-origin line (C3)
- `GenreExperience.tsx` hero: "You've rated N sci-fi avg 8.1; seeded by Blade Runner, Arrival, Dune" from `data.anchorsUsed` + `data.profileState`. Client-only.
- Test: `GenreExperience.origin.test.tsx`.

### Task 3.3: Mood entry (C2)
- `genreWorld.ts`: add `moods: string[]` to each world; `client/src/components/GenrePicker.tsx`: `MoodEntry` component resolving mood→slug(s) → links `/genre/:slug`.
- Test: `GenrePicker.mood.test.tsx`.

### Task 3.4: Taste-evolution overlay on timeline (C9)
- `TimelineScrubber.tsx`: overlay `anchorsUsed` (bucketed by `decadeOf`) + watchlist markers on the decade axis.
- Test: `TimelineScrubber.overlay.test.tsx`.

### Task 3.5: Steering presets (C8)
- `GenreExperience.tsx`: quick chips → existing server opts ("Less well-known" lowers `vote_count.gte`, "From my region" sets `geo`, etc.). No new LLM.
- Test: `GenreExperience.presets.test.tsx`.

### Task 3.6: Whisper strip (C5, deterministic)
- New `client/src/components/genre/WhisperStrip.tsx`: filter→string template (NOT routed through Companion persona). e.g. "Your 2010s leans hopeful — 3 anchors, 2 unwatched."
- Test: `WhisperStrip.test.tsx`.

### Task 3.7: Cold-start bootstrap loop (C10)
- `GenreEmptyState.tsx`: action → search related library title → add as anchor → re-query. Reuses `selectAnchors` path.
- Test: `GenreEmptyState.bootstrap.test.tsx`.

---

## PHASE 4 — Differentiation engine

### Task 4.1: Metaphor grammar — 1–2 flagship bespoke + themed variants (B1, W7)
- `metaphor.ts`: `Constellation` = node-backdrop (decorative lines) + themed `TitleCard` grid (NOT full graph engine — grill correction); `Frontier` = geo-spine variant. Other 5 = themed `TitleCard` variants (accent + spacing + module emphasis).
- Test: `metaphor.layout.test.tsx` (each metaphor renders; Constellation shows backdrop).

### Task 4.2: Spatial spine (B6)
- Fold into 4.1/P4 (TitleCard composition already demotes module wall). Add "show everything" escape hatch toggle.
- Test: `GenreModules.spine.test.tsx`.

### Task 4.3: Ambient in-world Companion (B2, C5 collision fix)
- Embed `ChatThread` (compact) on `/genre` with **distinct `GENRE_DOCK_CONVERSATION_KEY`**; feed `world.register.lexicon`+`tonePrompt` into system prompt; **do NOT remount across slug changes** (lift or pause stream — fix `App.tsx:32-37` pathname-keyed motion that remounts `GenreExperience`).
- Test: `GenreExperience.companion.test.tsx` (distinct key; no remount on `/genre/a`→`/genre/b`).

### Task 4.4: Persistence (B4, C1/C2 state arch)
- `client/src/lib/keys.ts`: add `GENRE_STATE_KEY`. New `client/src/lib/useGenreState.ts` serializing `{decade,q,sort,tags}`→URL + `{scrub,steer,dismissed}`→localStorage in ONE writer; react-query reads from it (ADR-W8).
- `server/src/services/libraryService.ts`: add `libraryVersion(db)` = `MAX(updated_at)` + row count; stamp persisted blob, compare on load (C2 reconcile).
- Test: `useGenreState.test.ts` + `libraryService.version.test.ts`.

---

## PHASE 5 — Structural nav (expensive, sequenced LAST)

### Task 5.1: Cross-world warp (C1)
- `genreWorld.ts`: add `adjacency: string[]` to each world. New `client/src/components/genre/WorldsMap.tsx` (node layout, edges = adjacency) + "Neighboring worlds" rail on every page linking out. Client-only.
- Test: `WorldsMap.test.tsx` + `NeighborRail.test.tsx`.

### Task 5.2: Timeline = World's spine + decade zoom (D1)
- `TimelineScrubber.tsx`: selecting a decade *zooms* the world (not just filters); per-decade LLM era-thesis (reuse `curatorIntro`/`titleInsight` shape, new endpoint or opts).
- Test: `TimelineScrubber.zoom.test.tsx`.

### Task 5.3: Density-as-place (B8)
- `PosterCard.tsx`: map `flag()` `inLibrary`/`ignored` to metaphor visuals (lit/dark stars, read/unread spines).
- Test: `PosterCard.density.test.tsx`.

---

## PHASE 6 — Deepenings + remaining C

### Task 6.1: Argument dialogue (D2) — uses Task 1.4 tmdbId
- `ArgumentPanel.tsx`: pro/con/neutral from `insight.comparisons`; local user annotation stored in localStorage.
- Test: `ArgumentPanel.dialogue.test.tsx`.

### Task 6.2: Geo fix + Frontier spine (D4)
- ISO→name (Task 1.6 map); real region view; your-region-vs-world (compare `originCountry` to library countries).
- Test: `GeoMap.region.test.tsx`.

### Task 6.3: Critic deepen (D5)
- `CredibilityStrip.tsx`: show IMDb≠RT divergence; overlay user's `rating` from `anchorsUsed`; provider deep-link.
- Test: `CredibilityStrip.critic.test.tsx`.

### Task 6.4: Maker index (D6)
- `GenreModules.tsx`: aggregate recurring directors; affinity to user; sort-by-director re-spines page.
- Test: `MakerIndex.test.tsx`.

### Task 6.5: Topic as axis (D7)
- `GenreModules.tsx`: clicking a topic spine filters the World.
- Test: `TopicCluster.axis.test.tsx`.

### Task 6.6: WatchOrder sequence (D8) + Marathon (C7)
- `WatchOrderSequencer.tsx`: cross-title order + progress; `client/src/components/genre/MarathonBuilder.tsx` sequences from watchorder+watchlist, saves as playlist.
- Test: `WatchOrder.test.tsx` + `MarathonBuilder.test.tsx`.

### Task 6.7: Compare mode (C4)
- New `client/src/pages/CompareWorlds.tsx`: `/genre/:a..:b?compare` overlays two Worlds (shared anchors, divergent theses, overlap).
- Test: `CompareWorlds.test.tsx`.

### Task 6.8: Export/save as note (C6)
- `client/src/components/genre/ExportWorld.tsx`: capture hero hook + selected titles + annotations as Markdown into notes store + printable view.
- Test: `ExportWorld.test.tsx`.

---

## PHASE 7 — TV + a11y + polish

### Task 7.1: Ship TV (K1)
- `GenreExperience.tsx:22`: parameterize `mediaType` from route + UI toggle (TV discover path real at `genreExperienceService.ts:258`). **Drop `guided` fiction** — remove the `mode:"guided"` differentiator (or build genuine branching in v2.x). Do NOT ship a no-op.
- Test: `GenreExperience.tv.test.tsx`.

### Task 7.2: Per-metaphor empty states (C6)
- Parameterize `GenreEmptyState` by `metaphor` (mid-load + `argument`-fail degradation).
- Test: `GenreEmptyState.metaphor.test.tsx`.

### Task 7.3: a11y audit per bespoke layout (C3)
- `TimelineScrubber` tablist needs `aria-controls`/`aria-labelledby`; skip-link + focus mgmt on route change; `isError` retry button; sound-off default honored. Per-metaphor keyboard/focus/screen-reader pass for Constellation + Frontier.
- Test: `a11y.test.tsx` (axe or manual assertions).

---

## CROSS-CUTTING
- **ADRs (enforce in review):** W1 lazy enrichment · W2 skipAnchorLog · W3 single decade authority (client sole truth) · W4 font lock (accent only) · W5 cache-key verbatim · W6 no phantom types · W7 1–2 flagship metaphors · W8 single state authority.
- **No "Generated with" PR trailer.** Human review required before merge.
- **Live verify before "done":** rails paint before AI; arrows scroll; titles clickable; filters work; sound fires (off default); no `take` anchors written; persistence survives reload; TV genre works; compare URL works.
