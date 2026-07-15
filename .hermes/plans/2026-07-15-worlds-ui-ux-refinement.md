# Worlds UI/UX Refinement — Implementation Plan

> **For Hermes:** Use subagent-driven-development to implement task-by-task, two-stage review (spec compliance → code quality).

**Goal:** Turn the genre "World" page from a static, AI-gated, non-interactive stack into a responsive, steerable, composed experience — closing the four complaints (no timeline arrows / can't click titles / UI waits on AI / no steering) and the "unfinished wall-of-panels" problem.

**Architecture:** Keep the existing engine (`buildGenreExperience` + `genreWorld` matrix) but (1) split the LLM curator `intro` into its own fast endpoint so rails paint immediately, (2) lift the timeline decade filter to page scope so it drives every module, (3) compose per-title **Title Cards** instead of item-iterating each module into a vertical wall, (4) add client-side filter/sort chips over returned items plus optional server steering opts for deep re-query, (5) express `world.metaphor` in layout.

**Tech Stack:** React 18 + Vite, React Router, TanStack Query, Framer Motion, Tailwind, lucide-react (client); Node/TS + Express + TMDB/OMDb/OpenRouter (server). Existing `PosterCard`, `GenreModules`, `TimelineScrubber`, `genreWorld` are the load-bearing files.

**Council basis:** 3-lens subagent council (product / UX-craft / architecture) converged — artifacts: `docs/plans/council-visual-hierarchy-critique.md`. All three agreed on the shape below.

---

## Phase 1 — Decouple AI from rail render + lazy enrichment (closes complaint #3)

> **Grill finding (critical):** Splitting ONLY the curator `intro` does NOT make rails paint fast. `buildGenreExperience` → `enrichGenreItems` fires **N per-title `titleInsight` LLM calls** for `argument` worlds (documentary, war-politics, sci-fi, horror, …) *before* the items endpoint returns (`genreExperienceService.ts:149` → `insightService.ts:225`). On a cold cache the "UI waits on AI" complaint survives P1. So P1 must also make **per-title LLM enrichment lazy/streamed**, and must fix a latent write side-effect (below). See ADR appended below.

**Why:** `GenreExperience.tsx:72` gates the skeleton on `isLoading` (items + LLM `intro` + per-title enrichment together). Rails must appear the instant the *base* items land; curator hook + per-title enrichment (argument/maker/etc.) fill in after.

### Task 1.1 — Server: split `intro` out, return items *before* enrichment
- Modify: `server/src/services/genreExperienceService.ts`
- Add `export async function buildGenreIntro(db, opts): Promise<GenreExperienceIntro>` wrapping `curatorIntro` (recompute `selectAnchors` :278 + `profileStateOf` :276-277). **Return the FULL `GenreExperienceIntro` type (incl. `basedOn: string[]`, populated at :216-219). NOTE: there is NO `GenreCuratorIntro` type — do not invent one; use `GenreExperienceIntro`.**
- **Grill fix (P1 is defeated unless you actually delete the call):** remove `const intro = await curatorIntro(...)` at **:279** AND drop the `intro` field from the return object (currently set :293). Otherwise the items path keeps paying the LLM and Phase 1 is meaningless. `buildGenreExperience` then returns `{ items, anchorsUsed }`.
- **Grill fix (cache-key format must not drift):** the live items cache key is `mediaType:mode:genres:modules` at **:236** — keep this format VERBATIM. Do NOT reformat to `genres:mediaType:mode:modules` (would invalidate the warm 12h cache → cold stampede on first hit).
- **Grill fix (intro needs its own cache):** `curatorIntro` currently rides the whole-experience cache (`genre-exp:${key}`). The split needs a NEW `getSetting`/`setSetting` key `genre-exp-intro:${mediaType}:${mode}:${genres.join("+")}` (6h TTL) or the intro endpoint won't actually be warm as asserted.

### Task 1.2 — Server: add `/discover/genre-intro` + `/discover/genre-enrich` routes
- Modify: `server/src/routes/catalog.ts`
- `GET /discover/genre-intro?genres=&mediaType=&mode=` → `buildGenreIntro`.
- `GET /discover/genre-enrich?genres=&mediaType=&mode=&modules=` → returns `{ items: [{tmdbId, enrichment}] }` (per-title enrichment only; safe to call after base items render).
- Test: `genreExperienceRoute.test.ts` — both return 200; `/genre-enrich` JSON carries `enrichment` keyed by `tmdbId`.

### Task 1.3 — Client API: add `genreIntro` + `genreEnrich`
- Modify: `client/src/lib/api.ts` — `genreIntro: (genres, mode, mediaType)`, `genreEnrich: (genres, mode, mediaType, modules)`.

### Task 1.4 — Client: three queries; rails paint on base items; **rewire `openGuided`**
- Modify: `client/src/pages/GenreExperience.tsx`
- Three `useQuery`: `items` (base, fast), `intro` (curator hook), `enrich` (per-title enrichment). Render rails as soon as **`items`** present — NOT waiting on `intro`/`enrich`.
- **Grill fix (unstated dependency):** `openGuided` reads `data?.intro?.hook` (:27) and the Companion button renders on `data.intro?.hook` (:114). After P1, `data.intro` is `undefined` → button vanishes + prefill loses hook. **Explicitly rewire both to the `intro` query** (read `introData?.hook`). Name this in the task — it is a real break the original plan omitted.
- Show shimmer in hero hook slot (intro) and on per-card enrichment slots (enrich) until each resolves.
- Test: `GenreExperience.intro.test.tsx` — base items render while `intro`/`enrich` still loading; Companion button uses `introData.hook`; after resolve, hook + first card's argument present.

### Task 1.5 — Enrichment becomes per-card lazy `useQuery` (the actual fix for "UI waits on AI")
- Modify: `client/src/components/genre/TitleCard.tsx` (created in P4) + page
- Instead of awaiting all N `titleInsight` calls server-side before returning items, the base `items` endpoint returns items with `enrichment: null`; the client fires one `genreEnrich` (or per-card) query that fills `enrichment` progressively. Cold-cache: rails paint instantly with posters/skeleton enrichment; argument/maker/credibility fill in as each resolves. This is what actually retires complaint #3 for `argument` worlds.
- Server `enrichGenreItems` stays the implementation, but is invoked by `/discover/genre-enrich` (post-render), not inside the base `buildGenreExperience` return path.

### Task 1.6 — Kill the `logAnchor` side-effect during batch enrichment (G3 compliance)
- Modify: `server/src/llm/insightService.ts` (`titleInsight` :233 calls `logAnchor(db, …, "take")`) + `enrichGenreItems`
- **Grill finding (real G3 violation the tests hide):** `titleInsight` logs a `take` anchor on every cache-miss. Building an `argument` world therefore logs a `take` for *every title* — a whole-genre storm. The G3 test is green only because it mocks `titleInsight` (`test:81`). Fix: during batch enrichment, pass a `skipAnchorLog: true` flag (or call a read-only variant) so curation does NOT mutate the user's anchor/comparison graph. Add a server test asserting `buildGenreExperience`/`genreEnrich` does NOT write `take` anchors.

**Verify Phase 1:** client + server tests green; `npm run typecheck` both; `npm run build`. Live: `/genre/documentary` cold cache — rails paint before any `argument` text; enrichment fills progressively; Companion button works (reads `introData.hook`); no `take` anchors written for the genre.

---

## Phase 2 — Timeline scrubber: arrows + clickable + page-wide filter (closes #1, #2)

**Why:** `TimelineScrubber` is `flex-wrap` pills with local `useState`; selecting a decade filters only its own grid, and titles are plain `<li>` (not clickable). Complaints #1 + #2.

### Task 2.1 — Lift decade state to the page
- Modify: `client/src/pages/GenreExperience.tsx` + `TimelineScrubber.tsx`
- `GenreExperience` owns `activeDecade: number | null` (URL param `?decade=`). Pass `selected` + `onSelect` to `TimelineScrubber`. The page filters `data.items` by decade *before* passing to `GenreModules` (so every module below responds). Timeline no longer self-filters.

### Task 2.2 — Scrubber UI: arrows + scroll + clickable cards
- Modify: `client/src/components/genre/TimelineScrubber.tsx`
- Render decades in a horizontal `overflow-x-auto` rail with sticky `‹` / `›` buttons (scroll the container; arrows toggle via `scrollBy`). Replace the per-decade grid `<li>` with `<PosterCard item={it} />` (already links to `/title/:type/:tmdbId`, has hover quick-actions). Keep decade tab pills as the filter control.
- Test: `client/src/components/genre/TimelineScrubber.test.tsx` — selecting a decade calls `onSelect`; renders `PosterCard` (query `a[href^="/title/"]` present); arrow buttons scroll container.

### Task 2.3 — Page wires filtered items to modules
- Modify: `client/src/pages/GenreExperience.tsx`
- **Export `decadeOf`** from `TimelineScrubber.tsx:9` (currently local) so the page can use it; or hoist to a `lib/decade.ts` util.
- `const filtered = activeDecade ? items.filter(i => decadeOf(i.year)===activeDecade) : items;` pass `filtered` to `GenreModules` and the "For You" carousel. Keep `AnchorFrame` (library matches) unfiltered.
- **Grill fix (decade authority):** client decade filter is the single source of truth for the fast path. Do NOT also send a server `decade` param for the same selection (P5 server `decade` is only for *re-query* steering, not the timeline tab). See P5.1.
- Test: page test — set `?decade=2010` → modules receive only 2010s items.

**Verify Phase 2:** interaction test passes; clicking a timeline poster navigates to `/title/…` (add a `MemoryRouter` test).

---

## Phase 3 — Client-side filter / sort bar (closes #4, client part)

**Why:** No search/sort/filter exists. Over already-returned items this is zero-latency and needs no server change — the 80% fix for "can't steer."

### Task 3.1 — `FilterChips` component
- Create: `client/src/components/genre/FilterChips.tsx`
- Props: `sort`, `onSortChange`, `tags` (derived from item keywords), `activeTags`, `onToggleTag`, `query`, `onQueryChange`. Renders: a debounced text search box (filters by title/keyword), sort chips (Rating · Year · Relevance), and tag chips. All operate on the page's in-memory `filtered` list — pure client state (URL params `?q=&sort=&tags=`).
- Test: `FilterChips.test.tsx` — typing updates `onQueryChange`; picking "Rating" reorders handled by parent; tag toggle updates `activeTags`.

### Task 3.2 — Wire filter state into the page
- Modify: `client/src/pages/GenreExperience.tsx`
- `const visible = applyFilters(filtered, { query, sort, tags })` helper (sort by `voteAverage`/`year`; filter by substring + tag ids). Feed `visible` to `GenreModules` + carousel. Show a "Steering by: <X>" indicator chip when any filter active.

**Verify Phase 3:** client test — with `?sort=rating`, modules receive items sorted by `voteAverage` desc.

---

## Phase 4 — Kill the module wall → Title-Card composition + Tabs (closes "unfinished")

**Why:** `GenreModules` maps *every module over every item* → vertical wall (20 CredibilityStrips stacked, then 20 ArgumentPanels…). UX lens: compose per-title cards; offer module Tabs for dense genres.

### Task 4.1 — `TitleCard` component
- Create: `client/src/components/genre/TitleCard.tsx`
- Renders one title as an editorial card: `PosterCard` thumbnail + `MakerSpotlight` line + `CredibilityStrip` chips + `ArgumentPanel` (thesis) + `WatchOrderSequencer` (if tv) — pulling from the same maps already built in the page. Reuses existing sub-components; just composes them per title instead of stacking by module.

### Task 4.2 — `GenreModules` → composition + Tabs
- Modify: `client/src/components/genre/GenreModules.tsx`
- For each item render a `TitleCard` carrying its `maker`/`credibility`/`argument`/`watchOrder`/`geo`. Group by `TopicCluster` spine (left rail) when `topic` enabled. For genres with >N items or many modules, render module **Tabs** (e.g. Reading Room: *Evidence / Argument / Makers*) instead of one long column — Tab state is local. Keep `timeline` and `geo` as full-width sections above the title grid.
- Test: `GenreModules.test.tsx` — given items + maps, renders one `TitleCard` per item (not N stacked panels); tabs switch visible module group.

### Task 4.3 — Fix `buildTopics` labels
- Modify: `client/src/components/genre/GenreModules.tsx` `buildTopics`
- **Grill fix (no client name source):** `genreMap` is server-only + async (`tmdb/client.ts:112`); `CatalogItem` carries only `genreIds` (`types.ts:13`), no names. Pick ONE: (a) ship a **static `GENRE_ID_NAMES` constant** on the client (snapshot of TMDB genre ids→names, refreshed from `/tmdb/genres` on app boot), or (b) add a `genres` TanStack query and thread names into `buildTopics`. Plan default: **(a)** static constant (simplest, no new fetch; refresh opportunistically). Never render `Genre <id>`.
- Test: topic labels are names, not `Genre <id>`.

**Verify Phase 4:** module wall gone; one card per title; topic spines named.

---

## Phase 5 — Server steering opts + "Steer this World" (closes #4, deep part)

**Why:** Client filters cover the fast 80%; true re-curation (intent, keyword, provider, language) needs server opts. Conversational "Steer this World" re-runs the experience.

### Task 5.1 — Server: steering opts
- Modify: `server/src/services/genreExperienceService.ts` `buildGenreExperience` opts
- **Grill correction:** there is **no discover query builder abstraction** — the discover call is an inline params object at `:258-263` (only `with_genres`/`sort_by`/`vote_count.gte`/`include_adult`). `tmdbGet` (`tmdb/client.ts:41`) forwards any param verbatim, so the new opts are trivially addable — but you must **edit the inline literal and thread new fields through `GenreExperienceOpts` (`:66-72`)**, not "pass to an existing builder."
- Add optional `keyword?` (`with_keywords`), `decade?` (`primary_release_date.gte/lte`), `sort?` (`sort_by`), `provider?` (`with_watch_providers`), `lang?` (`with_original_language`) to the inline discover params. Append to cache key: `…:keyword:decade:sort:provider:lang` (unset → today's key, cache stays warm). Filtered variants get a shorter TTL (e.g. 1h) to bound row count.
- **Grill fix (decade source-of-truth + guard):** the server `decade`/`keyword`/`steer` opts are reserved for the *deferred* conversational re-query path ONLY. The client timeline tab (P2.3) is the **sole live source of truth** for decade filtering. Add a hard guard: the page's client filter state must NEVER set the server `decade` param (running both double-filters and can nuke enrichment at decade edges). The server opts are inert until the Steer re-query actually ships.
- **Grill fix (enrichment burst):** a free-text `keyword` segment creates a new full `enrichGenreItems` burst (fetchDetails + ratings + titleInsight per item, `:107-160` `Promise.all`). Gate `keyword`/`steer` re-query behind **explicit submit, never keystroke** (the P3 client debounce does NOT cover a server re-query). Rely on the per-item insight/ratings caches (`:143`,`:149`) so overlapping titles reuse warm enrichment. Don't add a `keyword` cache segment that keystroke-refreshes.
- Test: `genreExperience.test.ts` — with `keyword='nature'` the discover params object carries `with_keywords`; cache key differs from base.

### Task 5.2 — Route + API params
- Modify: `server/src/routes/catalog.ts` + `client/src/lib/api.ts` — forward `keyword/decade/sort/provider/lang` as query params; `api.genreExperience` accepts a `filters` object.

### Task 5.3 — "Steer this World" input
- Create: `client/src/components/genre/SteerWorld.tsx` (or extend the hero CTA)
- A small input + send that navigates to `/chat` with a prefilled prompt that includes active filters + the user's steering sentence (e.g. "less talking-heads, more nature — current filters: documentary, 2010s"). Reuses existing Companion handoff. Optionally a future server call can accept a free-text `steer` prompt to bias `buildGenreExperience`; for now it drives the chat (keeps scope tight, debounced).
- Test: `SteerWorld.test.tsx` — typing + send navigates to `/chat` with prefilled prompt containing the steering text + active filters.

**Verify Phase 5:** server test for opts; client test for steer→chat prefill.

---

## Phase 6 — Polish: metaphor theming + finished cues

**Why:** Every section is the identical card → flat hierarchy; `world.metaphor` only shows as a hero eyebrow. Make it feel "finished."

### Task 6.1 — Metaphor accent token (constrained to the font lock)
- Modify: `client/src/components/genre/ExperienceHero.tsx` + a small `metaphorStyle(world.metaphor)` helper (new file `client/src/lib/metaphor.ts`)
- **Grill correction (font lock):** fonts are tokenized/locked (`TimelineScrubber.tsx:37` `var(--font-display)`, `:75` `var(--font-sans)`). P6.1's original "Reading Room = **serif labels**" introduces a font outside the two locked tokens — contradicts the lock. **Express metaphor via accent COLOR + spacing/border gesture only** (e.g. Reading Room = warm paper tint + hairline rule; Constellation = dot-grid connector lines + cool accent; Threshold = vignette + hairline frame; Warm Interior = soft rounded + warm glow; Frontier = expansive leading edge; Panel = crisp divided grid). Do NOT swap per-metaphor fonts unless a serif token already exists in the locked set.
- Honest read (grill): under the locked system, P6 reads as *tasteful differentiation*, not deep immersion. Immersion comes from **composition (P4)** + **interactivity (P2/P3)**, not chrome. P6 stays "polish," last.

### Task 6.2 — Hierarchy + sparse-state polish
- Modify: `GenreModules`/`TitleCard` — vary card elevation (hero > anchor > rails > carousel); add `min-h` + "no argument yet" placeholders so sparse genres read intentional, not broken. Ensure `buildTopics` empty-state copy exists.

**Verify Phase 6:** visual boot + screenshot review (you click through `npm run dev`).

---

## Files likely to change
- Server: `genreExperienceService.ts`, `routes/catalog.ts`, `test/genreExperience.test.ts`, `test/genreExperienceRoute.test.ts`
- Client: `pages/GenreExperience.tsx` (+ `.intro.test.tsx`, `.steer.test.tsx`), `lib/api.ts`, `components/genre/TimelineScrubber.tsx` (+test), `GenreModules.tsx` (+test), `TitleCard.tsx` (new), `FilterChips.tsx` (new), `SteerWorld.tsx` (new), `TopicCluster.tsx` (label fix), `ExperienceHero.tsx`, `lib/metaphor.ts` (new), `components/genre/*.test.tsx`

## Tests / validation
- Every phase: run `npm run test --workspace server` and `npm run test --workspace client`; `npm run typecheck` both; `npm run build`.
- Interaction: timeline poster click → `/title/…`; decade tab → modules filter; filter chips → reorder; steer → `/chat` prefill.
- Live: boot server, `npm run dev`, click through `/genre/documentary` and verify rails paint before curator hook, arrows scroll timeline, titles clickable, filters work.

## Risks / tradeoffs
- **Cold-cache first load is the real cost, not filter variants** (grill): per-title `titleInsight` + detail fetches dominate first load; variants reuse warm per-title caches. Mitigated by P1.5 lazy enrichment + 1h TTL on variants.
- **`logAnchor` storm during enrichment** — fixed in Task 1.6 (`skipAnchorLog`); add a server test asserting no `take` anchors written for a built world.
- Title-Card composition is the largest UI change (P4); keep `PosterCard` hover quick-actions + ignore + watchlist intact (regression test). retire-anchor correctly stays hidden on discovery items (no `libraryId`).
- Conversational re-query ships as a chat handoff first (P5.3), not a new LLM path, to limit scope.
- Keep `NICHE_THRESHOLD` gate; ensure the **post-filter** count (not just server count) triggers the empty state for decade-with-0-titles / filtered-empty.
- P6 constrained to accent color + spacing/border (font lock) — no per-metaphor font swaps.

## Phase 7 — Council's "add value / blind angles" backlog (post-P1–P6, not in this build)
From the creative council (2 Opus runs). Ranked, deferred to a follow-up plan — each is a larger, separate build:
1. **Metaphor as layout grammar, not paint** — per-world structurally different primary interaction (Constellation=node-map, Threshold=corridor, Frontier=geo spine). Largest, highest-impact; needs a shared primitive kit to avoid 6 snowflakes.
2. **Ambient in-world Companion** — diegetic narrator speaking the world `register` (lexicon/tonePrompt exist, unused), pull-only, never interrupting; replaces the eject-to-/chat CTA.
3. **"Why this belongs here" provenance** — surface anchor matches / shared director / topic on card expand (private-app transparency superpower).
4. **World persistence** — save/resume scrub position, steer, dismissed items; deep-links like `/genre/noir?decade=1950s&mood=paranoia`.
5. **Sound + motion via `cueBeatMap`** — each world a sonic signature (paper/drone/chimes); sound-off default, reduced-motion honored.
6. **One spatial spine per world** — demote other modules to contextual detail; keep a "show everything" escape hatch.
7. **Per-world serendipity gesture** — "adjacent star" / "next door" / "ride further out" using ignored/anchor/rating signals.
8. **Library density as place** — lit vs dark stars, read vs unread spines, explored vs unexplored territory.

## ADR appendix (grill outcomes — to commit with the build)
- **ADR-W1: AI-decoupling = lazy enrichment, not just intro split.** The curator `intro` split alone does not retire "UI waits on AI" for `argument` worlds (N per-title `titleInsight` calls block the items endpoint). Decision: base items return instantly; curator hook + per-title enrichment stream in via separate queries (Tasks 1.4–1.5). Rejected: intro-only split (leaves complaint alive on cold cache).
- **ADR-W2: No anchor writes during curation.** `titleInsight`'s `logAnchor("take")` during batch enrichment logs a `take` for every title — a G3 violation the mocked test hid. Decision: `skipAnchorLog` flag for batch enrichment; curation is read-only w.r.t. the anchor graph. Rejected: status quo (whole-genre anchor storm).
- **ADR-W3: Single decade authority.** Client timeline tab = fast-path filter; server `decade`/`keyword`/`steer` opts reserved for the deferred re-query ONLY, inert until then; client filter never sets the server param.
- **ADR-W4: Metaphor = color + spacing gesture (font lock).** Per-metaphor font swaps contradict the locked font tokens; express metaphor via accent color + border/spacing only.
- **ADR-W5: Cache-key format is a contract.** The live items key `mediaType:mode:genres:modules` (`:236`) must be kept verbatim; reformatting invalidates the warm 12h cache → cold stampede. `buildGenreIntro` needs its own `genre-exp-intro:…` key (6h).
- **ADR-W6: No phantom types.** Use `GenreExperienceIntro`; there is no `GenreCuratorIntro`. Split is meaningless unless `curatorIntro` call (`:279`) + `intro` return field (`:293`) are actually deleted.

## Glossary updates (to fold into CONTEXT.md)
- **World**: a per-genre immersive page (`/genre/:slug`) driven by a `GenreWorld` config (metaphor, register, modules).
- **Enrichment**: per-title server data (`director`, `seasons`, `watchProviders`, `originCountry`, `imdbRating`/`rtRating`, LLM `argument`) attached to a `GenreItem`.
- **Anchor**: a library title used as a comparison seed; `logAnchor("take")` records when the user is shown a comparison — must NOT fire during bulk curation.
- **Metaphor**: the structural/layout identity of a world (Reading Room / Constellation / Threshold / Warm Interior / Frontier / Panel / Generic).

## Open questions (resolve in review, not blocking)
- Should "Steer this World" call a new server `steer` prompt (re-bias `buildGenreExperience`) or stay a chat handoff? Plan defaults to chat handoff (Phase 5.3).
- Module Tabs vs always-composed cards for dense genres — plan does Tabs when items>12 or modules>4.
