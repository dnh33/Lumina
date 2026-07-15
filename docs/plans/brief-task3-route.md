# Task 3 — Route GET /api/discover/genre-experience + client api method + types

You are implementing ONE task of a larger TDD plan for Lumina. Follow RED→GREEN→COMMIT. Do NOT touch other tasks (engine already exists from Task 2).

## Repo facts (verified)
- Routes: `server/src/routes/catalog.ts` — `catalogRouter` already has `/discover/up-next`, `/discover/encore`, `/discover/for-you`, `/discover/because` (around :115-127). Add a new GET before those.
- The server handler has access to `req.app.locals.db` (DB). Confirm by reading an existing handler in catalog.ts.
- `server/src/services/genreExperienceService.ts` exports `buildGenreExperience(db, { genres, mediaType, mode })`.
- Client `client/src/lib/api.ts`: an `api` object starts at :47; add a method there. `genres: () => get<Genre[]>("/api/tmdb/genres")` exists at :102. Add `GenreExperience`/`GenreItem` to `client/src/lib/types.ts`.
- Client uses `react-router-dom` (App.tsx imports Route etc).
- Server test runner: `npm run test --workspace server`. If a handler-level test is awkward, a thin unit test that imports the router handler is acceptable; otherwise test the wire by asserting the route is registered.

## Files
- Modify: `server/src/routes/catalog.ts` (add `catalogRouter.get("/discover/genre-experience", ...)`)
- Modify: `client/src/lib/api.ts` (add `genreExperience`)
- Modify: `client/src/lib/types.ts` (add `GenreExperience` / `GenreItem`)
- Test: `server/test/genreExperienceRoute.test.ts`

## Step 1: Write failing test
A test that imports the route handler (or mounts `catalogRouter` via `supertest` if available) and asserts `GET /api/discover/genre-experience?genres=documentary&mode=self` returns 200 with JSON `{ genres: ["documentary"], items: [...] }`. If supertest isn't a dep, write a unit test that calls the exported handler function with a mock req/res and asserts `res.json` received the right shape.

## Step 2: Run, confirm FAIL.

## Step 3: Implement
Server route:
```ts
catalogRouter.get("/discover/genre-experience", async (req, res) => {
  const genres = String(req.query.genres ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const mode = req.query.mode === "guided" ? "guided" : "self";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  const result = await buildGenreExperience(req.app.locals.db, { genres, mediaType, mode });
  res.json(result);
});
```
Client `api.ts` (inside the `api` object near :47):
```ts
genreExperience: (genres: string[], mode: "self" | "guided" = "self", mediaType: "movie" | "tv" = "movie") =>
  get<GenreExperience>(`/api/discover/genre-experience?genres=${encodeURIComponent(genres.join(","))}&mode=${mode}&mediaType=${mediaType}`),
```
Add to `client/src/lib/types.ts`:
```ts
export interface GenreItem { tmdbId: number; mediaType: string; title: string; year?: number; genreIds: number[]; inLibrary: boolean; }
export interface GenreExperience { key: string; genres: string[]; mode: "self" | "guided"; intro: { hook: string; tone: string; basedOn: string }; items: GenreItem[]; anchorsUsed: unknown[]; profileState: unknown; }
```
(Keep field names consistent with what `buildGenreExperience` actually returns from Task 2 — read it and match exactly.)

## Step 4: Run, confirm PASS
`npm run test --workspace server -- genreExperienceRoute` AND `npm run typecheck --workspace client`

## Step 5: Commit
`git add server/src/routes/catalog.ts client/src/lib/api.ts client/src/lib/types.ts server/test/genreExperienceRoute.test.ts && git commit -m "feat: genre-experience route + client api method"`

## Hard gates
- G2 honored upstream (engine already calls flag); route just forwards.
- Keep `genres` query OR-combined (comma = list).
- Em-dash banned.
- Do NOT build the page/components (Tasks 4+).
