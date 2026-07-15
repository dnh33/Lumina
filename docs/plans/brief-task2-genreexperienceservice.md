# Task 2 — genreExperienceService.ts (genre-seeded engine)

You are implementing ONE task of a larger TDD plan for Lumina. Follow RED→GREEN→COMMIT. Write failing test first. Do NOT touch other tasks.

## Repo facts (verified)
- `server/src/services/discoverService.ts`: `filterCatalog(db, items, opts)` at :27 does NOT read excluded genres; `flag(db, items)` at :43 DOES (it calls `getExcludedGenres(db)` internally). `forYou(db: DB)` at :99 has NO genre-seed param — you are building a NEW engine, do not call forYou expecting a seed. `CatalogItemWithFlags` (discoverService.ts:19) has ONLY fields `{...CatalogItem, inLibrary}` — there is NO `excludedGenre` field.
- `server/src/tmdb/client.ts`: `genreMap()` at :112 is ASYNC — `await` it. It maps genre slug → TMDB id.
- `server/src/tmdb/normalize.ts`: `normalizeList(raw, fallbackType?)` at :44 exists.
- `server/src/services/anchorService.ts`: `logAnchor` (:8), `fatigueScores` (:51), `isRetired`/`setRetired` (:79/:83).
- `server/src/llm/insightService.ts`: neighbor-selection + ascending-fatigue sort + single-title `logAnchor` lives at :262-272. REUSE this logic for anchor selection; do NOT log during selection (logging happens only on a real title-open later — gate G3).
- `server/src/llm/openrouter.ts`: `getSetting(db, key)` (:37), `setSetting(db, key, value)` (:44) for caching.
- `server/src/services/libraryService.ts`: `getExcludedGenres(db)` (:577), `setExcludedGenres(db, ids)` (:592).
- Test fixtures `server/test/helpers.ts`: `memoryDb()`, `seedEntry(db, {tmdbId, mediaType, titleDetails})`, `makeDetails(overrides)` are REAL.

## Files
- Create: `server/src/services/genreExperienceService.ts`
- Test: `server/test/genreExperience.test.ts`

## Step 1: Write failing test `server/test/genreExperience.test.ts`
```ts
import { describe, it, expect } from "vitest";
import { memoryDb, seedEntry, makeDetails } from "./helpers.js";
import { buildGenreExperience } from "../src/services/genreExperienceService.js";
import { setExcludedGenres } from "../src/services/libraryService.js";

describe("buildGenreExperience", () => {
  it("seeds from an explicit genre slug, not top-3", async () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 1, mediaType: "movie", titleDetails: makeDetails({ id: 1, genres: ["Documentary"] }) });
    const res = await buildGenreExperience(db, { genres: ["documentary"], mediaType: "movie" });
    expect(res.genres).toEqual(["documentary"]);
    expect(res.items.length).toBeGreaterThan(0);
  });
  it("G2: excludes ignored/genre-excluded titles (flag applied)", async () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 2, mediaType: "movie", titleDetails: makeDetails({ id: 2, genres: ["Horror"] }) });
    seedEntry(db, { tmdbId: 3, mediaType: "movie", titleDetails: makeDetails({ id: 3, genres: ["Horror"] }) });
    setExcludedGenres(db, [27]); // horror tmdb genre id — resolve via genreMap in impl
    const res = await buildGenreExperience(db, { genres: ["horror"], mediaType: "movie" });
    expect(res.items.every((i) => !i.genreIds.some((g) => [27].includes(g)))).toBe(true);
  });
  it("multi-genre via '+' is OR-combined", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, { genres: ["sci-fi", "horror"], mediaType: "movie" });
    expect(res.genres).toEqual(["sci-fi", "horror"]);
  });
});
```

## Step 2: Run, confirm FAIL (module missing).

## Step 3: Implement `genreExperienceService.ts`
- `genreSlugsToIds(genres)` → `await genreMap()` then map slugs to ids, `ids.join("|")` (mirror discoverService.ts:108-120 OR semantics).
- `tmdbGet('/discover/movie', { with_genres: ids.join('|'), sort_by: 'vote_average.desc' })` (also support `tv` via `/discover/tv`).
- `const items = normalizeList(data.results, mediaType);`
- **GATE G2:** `const flagged = flag(db, items);` then keep `flagged.filter(i => !i.excludedGenre)` — WRONG, there is no `excludedGenre` field. Instead: `flag()` already drops excluded-genre items (it calls getExcludedGenres internally), so use `flagged` directly; the G2 test asserts no item carries an excluded genre id, which `flag` guarantees.
- `anchorsUsed`: select via insightService-style neighbor logic (reuse insightService.ts:262-272 ascending-fatigue sort) — **do NOT call logAnchor here (G3)**.
- One batched curator call (NEW `genreCuratorPrompt` you add to `server/src/llm/prompts.ts`) → produces `intro: { hook, tone, basedOn }`. This is NEW code, admit it. Use `luminaSystemPrompt` shape from prompts.ts.
- Cache: `setSetting(db, \`genre-exp:${key}\`, JSON.stringify(res))`.
- Return `{ key, genres, mode, intro, items, anchorsUsed, profileState }`.
- Define + export a `GenreExperience`/`GenreItem` interface (shared type; the client api.ts will mirror it).

## Step 4: Run, confirm PASS
`npm run test --workspace server -- genreExperience`

## Step 5: Commit
`git add server/src/services/genreExperienceService.ts server/src/llm/prompts.ts server/test/genreExperience.test.ts && git commit -m "feat: genreExperienceService genre-seeded engine (G1/G2)"`

## Hard gates (do not violate)
- G1: forYou has no seed param — build new engine, never assume a seed argument exists on forYou.
- G2: results MUST pass through `flag(db, items)` — never bare `filterCatalog` (silent genre-exclude regression).
- G3: NEVER logAnchor at selection/render time. Selection only. Logging happens later on a real title-open.
- No DB schema change. Cache via setSetting only.
- Em-dash banned.
- Do NOT add the route or client code (Tasks 3+).
