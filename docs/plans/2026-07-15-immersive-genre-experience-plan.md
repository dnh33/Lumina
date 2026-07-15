# Immersive Genre Experience — Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement. Commit after each green test.
> **Design source of truth:** `docs/plans/2026-07-15-immersive-genre-experience-design.md` (§13 per-genre layer, §13.9 grill findings, §14 forks).
> **Context snapshot:** `docs/plans/2026-07-15-genre-experience-CONTEXT-TEMP.md`.
> **Mandatory pre-build grill:** DONE (4-agent `grill-with-docs`). Findings G1-G8 folded below as hard code-review gates.

**Goal:** Ship a standalone `/genre/:slug` page that drops the user into an immersive, genre-scoped "world" — curated rails + a real structural Timeline/Era module, AI-guided optionally via the existing Companion — reusing Lumina's anti-fatigue + insight machinery, never writing anchors on impression.

**Architecture:** New server service `genreExperienceService.ts` (genre-seeded `forYou` + one batched curator call, results forced through `flag()`) behind `GET /api/discover/genre-experience`; new client page `pages/GenreExperience.tsx` composed of reused `Carousel`/`PosterCard`/`SuggestionCards` plus small presentational components (`ExperienceHero`, `GenrePicker`, `TimelineScrubber`, `AnchorFrame`). Per-genre differentiation = a `genreWorld` config map (register + which modules), not N page variants. No DB table (YAGNI); cached via `setSetting` key `genre-exp:${key}`.

**Tech Stack:** TypeScript (server Node/Express, client React+Vite), `vitest` (server `npm test`), existing `framer-motion` + `lib/motion.ts` + `lib/sound.ts`. Real tokens: `theme.css` gold-400/amber-400. **Genre components consume `var(--font-display)`/`var(--font-sans)` (never literal families)** so the whole-app Cabinet Grotesk/Geist migration (Fork 9 = B, separate workstream) is inherited automatically. Em-dash banned. Reduced-motion mandatory.

**Scope locked by §14 forks:** standalone `/genre/:slug` · single default + multi opt-in `+` · AI-guided opt-in · 5th "Worlds" Shell nav · v1 = shell + 4 devices + 4 elements + **Timeline module (all genres)**; v1.5 = genre-modules · 3 proof genres (Documentary/Sci-Fi/Horror) · hide ChatDock on `/genre` · forbid log-on-view · **Fork 9 = B: migrate to Cabinet Grotesk/Geist (separate whole-app workstream; genre components use CSS vars, inherit automatically)**.

---

## HARD CODE-REVIEW GATES (from grill G1-G8 — non-negotiable)

- **G1** — `forYou(db: DB)` has NO genre-seed param (`discoverService.ts:99`). Build a new genre-seeded engine; do NOT call `forYou` expecting a seed.
- **G2** — Every result set MUST pass through `flag(db, items)` (which injects `getExcludedGenres`). Bare `filterCatalog` silently shows ignored/genre-excluded titles. Enforced in review.
- **G3** — NEVER `logAnchor` on mount/scroll/rail-impression. Reuse `insightService.ts:262-272` (neighbor-sort ascending fatigue, logs the opened title) ONLY inside a real single-title-open action, exactly like `take`.
- **G4** — `ChatDock` is global, hidden only on `/chat` (`App.tsx:16,51`). Add `/genre` to the hide condition or it double-companions the world.
- **G5** — v1 MUST ship ≥1 real structural module (Timeline) — universal-only tier is a recolored shell, rejected.
- **G6** — "One batched LLM curation call" is NEW code (admit it). `keywords`/`origin_country` not in `normalize.ts` — F2/Geo fall back to `similar`+`topTags`.
- **G7** — v1 = shell + 4 editorial devices (Argument spine, Maker spotlight, You-Are-Here, Echoes) + 4 universal elements (Compare, Critic, Start-Here, Save/Resume) + Timeline module.
- **G8** — 3 proof genres only. Cut Quote pull-quotes + Mood/Soundtrack. Defer documentary F2/F3/F4/F5 to v1.5.

---

## Task 1: `genreWorld` config + types (server + client)

**Files:**
- Create: `server/src/services/genreWorld.ts`
- Create: `client/src/lib/genreWorld.ts` (or colocate in `client/src/lib/types.ts`)
- Test: `server/test/genreWorld.test.ts`

**Step 1: Write failing test**
```ts
import { describe, it, expect } from "vitest";
import { getGenreWorld, GENRE_WORLDS } from "../src/services/genreWorld.js";

describe("genreWorld config", () => {
  it("returns a config for a known proof genre", () => {
    const doc = getGenreWorld("documentary");
    expect(doc).toBeDefined();
    expect(doc.register.lexicon).toContain("evidence");
    expect(doc.modules).toContain("timeline");
  });
  it("falls back to a generic world for unknown genres but always enables timeline", () => {
    const g = getGenreWorld("kung-fu");
    expect(g.modules).toContain("timeline");
    expect(g.register).toBeDefined();
  });
  it("proof genres are exactly documentary, sci-fi, horror", () => {
    expect(Object.keys(GENRE_WORLDS).sort()).toEqual(["documentary", "horror", "sci-fi"]);
  });
});
```

**Step 2: Run — confirm FAIL** (`npx vitest run server/test/genreWorld.test.ts`) → module not found.

**Step 3: Implement** `server/src/services/genreWorld.ts`:
```ts
export interface GenreRegister {
  lexicon: string[];
  tonePrompt: string;
  cueBeatMap: string[]; // keys into lib/sound.ts cues
}
export interface GenreWorld {
  slug: string;
  metaphor: "Constellation" | "Threshold" | "Reading Room" | "Warm Interior" | "Frontier" | "Panel" | "Generic";
  register: GenreRegister;
  modules: Array<"timeline" | "maker" | "topic" | "geo" | "watchorder" | "critic">;
}
export const GENRE_WORLDS: Record<string, GenreWorld> = {
  documentary: { slug: "documentary", metaphor: "Reading Room", register: { lexicon: ["evidence", "argument", "source"], tonePrompt: "Curious, credible, analytical.", cueBeatMap: ["open"] }, modules: ["timeline", "maker", "critic"] },
  "sci-fi": { slug: "sci-fi", metaphor: "Constellation", register: { lexicon: ["wonder", "frontier", "scale"], tonePrompt: "Precise, awed, expansive.", cueBeatMap: ["open", "discover"] }, modules: ["timeline", "maker"] },
  horror: { slug: "horror", metaphor: "Threshold", register: { lexicon: ["dread", "confront", "release"], tonePrompt: "Uneasy, then visceral.", cueBeatMap: ["open", "warn"] }, modules: ["timeline"] },
};
const GENERIC: GenreWorld = { slug: "*", metaphor: "Generic", register: { lexicon: ["discover"], tonePrompt: "Curious, warm.", cueBeatMap: ["open"] }, modules: ["timeline"] };
export function getGenreWorld(slug: string): GenreWorld {
  return GENRE_WORLDS[slug.toLowerCase()] ?? { ...GENERIC, slug };
}
```
Mirror a thin client `genreWorld.ts` (same shape, imported by `GenreExperience.tsx`).

**Step 4: Run — confirm PASS.** **Step 5: Commit** `feat: genreWorld config + types`.

---

## Task 2: `genreExperienceService.ts` — genre-seeded engine (TDD)

**Files:**
- Create: `server/src/services/genreExperienceService.ts`
- Test: `server/test/genreExperience.test.ts`

**Step 1: Write failing test** (use real fixtures: `memoryDb` + `seedEntry`/`makeDetails` from `server/test/helpers.ts`)
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { memoryDb, seedEntry, makeDetails } from "./helpers.js";
import { buildGenreExperience } from "../src/services/genreExperienceService.js";
import { setExcludedGenres } from "../src/services/libraryService.js";

describe("buildGenreExperience", () => {
  it("seeds from an explicit genre slug, not top-3", async () => {
    const db = memoryDb();
    // seed a documentary title so the engine has something to return
    seedEntry(db, { tmdbId: 1, mediaType: "movie", titleDetails: makeDetails({ id: 1, genres: ["Documentary"] }) });
    const res = await buildGenreExperience(db, { genres: ["documentary"], mediaType: "movie" });
    expect(res.genres).toEqual(["documentary"]);
    expect(res.items.length).toBeGreaterThan(0);
  });
  it("G2: excludes ignored/genre-excluded titles (flag applied)", async () => {
    const db = memoryDb();
    // seed two horror titles, then exclude the Horror genre via the real setter
    seedEntry(db, { tmdbId: 2, mediaType: "movie", titleDetails: makeDetails({ id: 2, genres: ["Horror"] }) });
    seedEntry(db, { tmdbId: 3, mediaType: "movie", titleDetails: makeDetails({ id: 3, genres: ["Horror"] }) });
    setExcludedGenres(db, [/* horror tmdb genre id — resolve via genreMap in impl */ 27]);
    const res = await buildGenreExperience(db, { genres: ["horror"], mediaType: "movie" });
    // every returned item must be free of an excluded genre id
    expect(res.items.every(i => !i.genreIds.some(g => [27].includes(g)))).toBe(true);
  });
  it("multi-genre via '+' is OR-combined", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, { genres: ["sci-fi", "horror"], mediaType: "movie" });
    expect(res.genres).toEqual(["sci-fi", "horror"]);
  });
});
```

**Step 2: Run — FAIL** (module missing).

**Step 3: Implement** `genreExperienceService.ts`:
- `genreSlugsToIds(genres, genreMap)` → `await genreMap()` then `ids.join("|")` (mirror `discoverService.ts:108-120`; `genreMap` is async per `tmdb/client.ts:112`).
- `tmdbGet('/discover/movie', { with_genres: ids.join('|'), sort_by: 'vote_average.desc' })` (OR semantics).
- `const items = normalizeList(data.results, 'movie');`
- **G2:** `const flagged = flag(db, items);` then filter to `flagged.filter(i => !i.excludedGenre)`.
- `anchorsUsed` via `insightService` neighbor selection (reuse `:262-272` logic, do NOT log here — G3).
- One batched curator call (NEW `genreCuratorPrompt`) → `intro: { hook, tone, basedOn }`. Cache `setSetting(db, \`genre-exp:${key}\`, JSON.stringify(res), TTL)`.
- Return `{ key, genres, mode, intro, items, anchorsUsed, profileState }`.

**Step 4: Run PASS.** **Step 5: Commit** `feat: genreExperienceService genre-seeded engine (G1/G2)`.

---

## Task 3: Route `GET /api/discover/genre-experience` + api.ts method

**Files:**
- Modify: `server/src/routes/catalog.ts` (add router.get before `:115`)
- Modify: `client/src/lib/api.ts` (add `genreExperience`)
- Test: `server/test/genreExperienceRoute.test.ts` (supertest-style or handler unit)

**Step 1: Failing test** — `GET /api/discover/genre-experience?genres=documentary&mode=self` returns 200 + `{ genres:["documentary"], items: [...] }`.

**Step 2: Implement** route:
```ts
catalogRouter.get("/discover/genre-experience", async (req, res) => {
  const genres = String(req.query.genres ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const mode = req.query.mode === "guided" ? "guided" : "self";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  const result = await buildGenreExperience(req.app.locals.db, { genres, mediaType, mode });
  res.json(result);
});
```
Add `api.genreExperience = (genres, mode, mediaType='movie') => get<GenreExperience>(`/api/discover/genre-experience?genres=${encodeURIComponent(genres.join(','))}&mode=${mode}&mediaType=${mediaType}`)` to `client/src/lib/api.ts` (`:47` object). Add `GenreExperience`/`GenreItem` types to `client/src/lib/types.ts`.

**Step 3/4: Run PASS.** **Step 5: Commit** `feat: genre-experience route + client api method`.

---

## Task 4: `GenreExperience.tsx` page skeleton + route + ExperienceHero

**Files:**
- Create: `client/src/pages/GenreExperience.tsx`
- Modify: `client/src/App.tsx` (add `<Route path="/genre/:slug" element={<GenreExperience />} />` before `path="*"` at `:47`)
- Test: `client/src/pages/GenreExperience.test.tsx` (render test: fetches, shows hero with genre name)

**Step 1: Failing test** — render with `slug="documentary"` → heading contains "Documentary" (or hook), no crash, Shell nav present.

**Step 2: Implement** page:
- Read `:slug`; `api.genreExperience([slug], mode)` (mode from `?guided=1` → opt-in, Fork 3).
- `ExperienceHero`: full-bleed color-wipe threshold via `AnimatePresence` keyed by slug (reuse `lib/motion.ts` `EASE_OUT_EXPO`+`stagger60`); hero ≤4 text elements (R1); reads `intro.hook` + `genreWorld.metaphor`.
- Render rails via reused `Carousel` + `PosterCard` (anchor/Over-used ribbon already built).
- `AnchorFrame` per title: reuse `insightService`-shaped neighbor (lowest-fatigue first) — **G3: no logging on render**.

**Step 3/4: Run PASS** (`npx vitest run client/src/pages/GenreExperience.test.tsx`). **Step 5: Commit** `feat: GenreExperience page skeleton + hero (R1/R4)`.

---

## Task 5: Timeline/Era scrubber module (the structural differentiator, G5)

**Files:**
- Create: `client/src/components/genre/TimelineScrubber.tsx`
- Test: `client/src/components/genre/TimelineScrubber.test.tsx`

**Step 1: Failing test** — given items with `releaseDate`, renders a scrubbable axis; selecting a decade filters the visible items (callback fires with filtered set). Keyboard-accessible (arrow keys move decade), `prefers-reduced-motion` honored.

**Step 2: Implement** — parameterized component over `items`, groups by decade (TMDB `release_date`), emits `onRangeChange({from,to})` re-seeding the world via `api.genreExperience([slug], mode, {yearFrom, yearTo})` (F7). Real temporal axis = the non-recolored structural cut. Single component, all genres (G5).

**Step 3/4: Run PASS.** **Step 5: Commit** `feat: Timeline/Era scrubber module (G5)`.

---

## Task 6: GenrePicker + entry points (Fork 1/E1-E6)

**Files:**
- Create: `client/src/components/genre/GenrePicker.tsx`
- Modify: `client/src/components/Shell.tsx` (5th "Worlds" item, Fork 4), `Discover.tsx` (hero CTA + topGenres chips), `Library.tsx` (genre chip "Enter world"), `App.tsx` Omnibar slot if present.
- Test: `client/src/components/genre/GenrePicker.test.tsx`

**Step 1: Failing test** — GenrePicker renders `api.genres()` chip grid with `topGenres` pinned first (R2); clicking a chip navigates to `/genre/:slug`.

**Step 2: Implement** picker (ambient grid, `topGenres` pinned). Add Shell 5th nav `<Link to="/genre">Worlds</Link>` near `:36-55`. Wire Discover/Library chips to `/genre/:slug`.

**Step 3/4: Run PASS.** **Step 5: Commit** `feat: GenrePicker + Worlds nav + entry points`.

---

## Task 7: Hide ChatDock on /genre (G4) + anchor-logging gate (G3)

**Files:**
- Modify: `client/src/App.tsx` (`:16,51`) — `const onChatPage = location.pathname.startsWith("/chat") || location.pathname.startsWith("/genre");`
- Test: `client/src/App.test.tsx` (ChatDock not rendered on `/genre/:slug`)

**Step 1: Failing test** — navigate to `/genre/documentary` → `ChatDock` not in DOM.

**Step 2: Implement** the hide condition. Separately, add a unit/integration test in `server/test/insightService.test.ts` asserting the world's neighbor selection does NOT call `logAnchor` at selection time (G3) — logging happens only on the subsequent real title-open (mirror `insightService.ts:272`).

**Step 3/4: Run PASS.** **Step 5: Commit** `fix: hide ChatDock on /genre; assert no impression logging (G3/G4)`.

---

## Task 8: AI-guided path (opt-in, Fork 3) + reduced-motion/axe pass

**Files:**
- Create: `client/src/components/genre/NarrativeHook.tsx` (prefill deep-link to `/chat` or compact ChatThread)
- Modify: `client/src/App.tsx` or `GenreExperience.tsx` to pass `?guided=1`
- Test: `client/src/components/genre/NarrativeHook.test.tsx`

**Step 1: Failing test** — with `?guided=1`, NarrativeHook renders a "Guide me" entry that deep-links `/chat` with a prefilled first message using `genreWorld.register.lexicon`.

**Step 2: Implement** — reuse `chatService.runChatTurn` + `contextBuilder.buildChatContext` (no new LLM). Reduced-motion audit: every `motion.*` uses `useReducedMotion`/`MotionConfig` (already `MotionConfig reducedMotion="user"` at `App.tsx`). axe: gold-only accent, ink-950 scrim floor, 4.5:1 (R12).

**Step 3/4: Run PASS.** **Step 5: Commit** `feat: opt-in AI-guided NarrativeHook + a11y pass (R4/R12)`.

---

## Task 9: Full gate sweep + smoke (pre-merge safety)

**Files:** none new; run gates.
- `npm run test --workspace server` — server vitest all green.
- `npm run test --workspace client` — client vitest (GenreExperience/TimelineScrubber/GenrePicker/etc.) all green. (Root `npm test` is server-only — run client explicitly.)
- `npm run typecheck` — server + client clean.
- `npm run build` — both workspaces build.
- Manual: `npm run dev`, open `/genre/documentary`, scroll Timeline, open a title (verify anchor logs ONCE via a test DB + `fatigueScores`), confirm ChatDock absent, reduced-motion honored.

**Commit only after all three gates pass.** Then finish-branch (Phase 5): merge/PR/handoff per superpowers.

---

## Notes / risks carried from design
- `keywords` not normalized (G6): F2/topic-cluster deferred v1.5; v1 uses `similar`+`topTags`.
- **Empty states (R6, metric 9: 3 genre-specific empties + niche `<N` gate) DEFERRED to v1.5** per user decision 2026-07-15 (option A). v1 ships proof-genres only; success-criterion #9 intentionally unmet at launch. Record as v1.5 acceptance.
- **Fork 9 = B (Cabinet Grotesk/Geist) is a SEPARATE whole-app workstream**, NOT one of these 9 tasks. Genre components consume `var(--font-display)`/`var(--font-sans)` so they inherit the migration automatically when it lands. Do NOT scope the font migration into Task 1-9.
- No DB migration (YAGNI); cache via `setSetting`. If "saved journeys" later confirmed, append v7 migration per ADR-0007 (probe `pragma_table_info`, `CREATE TABLE IF NOT EXISTS`).
- Session-quota 429 on Claude Code: if a `claude -p` task no-ops, execute the TDD loop directly (same RED→GREEN→COMMIT discipline).
- Don't trust subagent JSON verdicts — run the gates yourself and read the actual diff.
