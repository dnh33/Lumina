# Task 6 — GenrePicker (ambient) + Shell "Worlds" nav (NavLink) + entry points

You are implementing ONE task of a TDD plan for Lumina. Follow RED→GREEN→COMMIT. Do NOT touch other tasks.

## Verified repo facts
- `client/src/components/Shell.tsx`: nav items are a JS array at :6-9 `{ to, label, icon, end }` using `NavLink` (imported :2). Icons from `lucide-react` (Compass, LibraryBig, Settings, Sparkles at :2). The array is rendered twice (desktop sidebar :38, mobile bottom :71) via `.map`. ADD a "Worlds" item: `{ to: "/genre", label: "Worlds", icon: Sparkles, end: false }` — NOTE: `/genre` is the index; the page route is `/genre/:slug`, so `end:false` is correct so `/genre/documentary` stays active. Verify the array shape by reading Shell.tsx:6-55 before editing.
- The app has NO `/genre` index route yet — you may need to add `<Route path="/genre" element={<Navigate to="/genre/documentary" replace />} />` (or a lightweight picker page) in `client/src/App.tsx` near the other routes. Prefer a real lightweight `GenrePicker` page so "Worlds" isn't a dead link.
- `genreWorld` config `GENRE_WORLDS` (client/src/lib/genreWorld.ts) lists proof genres: documentary, sci-fi, horror. `getGenreWorld(slug)` for any slug.
- `api.genres()` exists (client/src/lib/api.ts:102) → GET `/api/tmdb/genres` returns `Genre[]` (tmdbId/name). Use for the full genre list; pin proof genres first.
- Client tests: `vitest run` (client/package.json:11). Test the nav + picker with `@testing-library/react`.

## Files
- Create: `client/src/pages/GenrePicker.tsx` (or `client/src/components/genre/GenrePicker.tsx` + a thin `/genre` route)
- Modify: `client/src/components/Shell.tsx` (add Worlds nav item — both desktop + mobile via the shared array)
- Modify: `client/src/App.tsx` (add `/genre` index route)
- Test: `client/src/components/genre/GenrePicker.test.tsx` (or pages)

## Step 1: Write failing test
- Render `Shell` within a `MemoryRouter` and assert a nav link with text "Worlds" and `href` containing `/genre` exists (desktop + mobile). Mock nothing heavy; Shell is presentational over the nav array.
- Render `GenrePicker` (mock `api.genres` + `getGenreWorld`) and assert the three proof genres (Documentary, Sci-Fi, Horror) render as links to `/genre/documentary` etc, and that clicking navigates (or the link `to` is correct).

## Step 2: Run, confirm FAIL.
`npm run test --workspace client -- GenrePicker`

## Step 3: Implement
- `Shell.tsx`: append the Worlds item to the nav array (read the exact shape first). Both desktop+mobile use the same array so one edit covers both.
- `GenrePicker.tsx`: lists genres; proof genres pinned/first with their `metaphor` + `tonePrompt` as ambient microcopy; others as plain links. Each links to `/genre/<slug>`. Ambient = subtle, not a heavy hero. Consume CSS vars only.
- `App.tsx`: add `<Route path="/genre" element={<GenrePicker/>} />` (or a Navigate). Place near the `/library` route.

## Step 4: Run, confirm PASS.
`npm run test --workspace client -- GenrePicker`

## Step 5: Commit
`git add client/src/pages/GenrePicker.tsx client/src/components/Shell.tsx client/src/App.tsx client/src/components/genre/GenrePicker.test.tsx && git commit -m "feat: GenrePicker + Shell 'Worlds' nav (NavLink)"`

## Hard gates
- Use `NavLink` (NOT `Link`) — Shell already uses NavLink; consistency is a hard requirement (the plan flagged this).
- G4 is Task 7 (hide ChatDock on /genre) — do NOT touch ChatDock here; just add the route/nav.
- No new API routes. Reuse `api.genres()` + `getGenreWorld`.
- Reduced-motion respected; dark-only.
- Em-dash banned.
