# Task 4 — GenreExperience page (the actual /genre/:slug surface)

You are implementing ONE task of a TDD plan for Lumina. Follow RED→GREEN→COMMIT. Do NOT touch other tasks (engine/route/types already exist — Tasks 1-3 committed).

## Verified repo facts
- Route wiring lives in `client/src/App.tsx` — `Routes` at :37-48 (`<Route path="/" element={<Discover/>}/>` etc). Add `<Route path="/genre/:slug" element={<GenreExperience/>} />` near :42 (after /person). GenreExperience is a DEFAULT export page like `Discover` (`client/src/pages/Discover.tsx`, default-exported function at :185, uses `@tanstack/react-query` `useQuery` + `api.*`).
- Client data layer: `api.genreExperience(genres, mode, mediaType)` exists (`client/src/lib/api.ts:62`) → GET `/api/discover/genre-experience?genres=...`. Returns `GenreExperience` (`client/src/lib/types.ts:317`) with `items: GenreItem[]` (= CatalogItem, has `posterPath`, `title`, `tmdbId`, `mediaType`, `year`, `genreIds`, `inLibrary`).
- `genreWorld` config: `getGenreWorld(slug)` + `GENRE_WORLDS` (`client/src/lib/genreWorld.ts`) → `{ metaphor, register:{lexicon,tonePrompt,cueBeatMap}, modules[] }`. Use `register.tonePrompt` as the hero subtitle seed; `metaphor` drives hero treatment.
- Reuse (do NOT rebuild): `Carousel` (`client/src/components/Carousel.tsx` — props `{title, eyebrow, children}`, it wraps children in a rail), `PosterCard` (`client/src/components/PosterCard.tsx` — `item: CatalogItem`, `memo`'d). Render rails as `<Carousel title="..."><PosterCard item={it}/></Carousel>`.
- Motion: pages use `framer-motion` `motion.section` (see Discover.tsx:45). App already wraps in `MotionConfig reducedMotion="user"` (App.tsx:23) — just respect `useReducedMotion()`.
- Fonts: consume `var(--font-display)` / `var(--font-sans)` ONLY (theme.css). Do NOT hardcode font families (whole-app font migration is a separate workstream).
- Em-dash banned in any strings.

## Files
- Create: `client/src/pages/GenreExperience.tsx`
- Create: `client/src/components/genre/ExperienceHero.tsx` (small presentational)
- Create: `client/src/components/genre/AnchorFrame.tsx` (small presentational, shows `anchorsUsed`)
- Test: `client/src/pages/GenreExperience.test.tsx`

## Step 1: Write failing test `GenreExperience.test.tsx`
Use `@testing-library/react` + `vitest`. Mock `api.genreExperience` (vi.mock `../lib/api`). Render `<GenreExperience/>` inside a `MemoryRouter initialEntries={["/genre/documentary"]}`. Assert:
- hero shows the genre slug capitalized ("Documentary") and the world metaphor/tone ("Reading Room" / "Curious, credible, analytical.") somewhere in the document.
- a rail heading "For You in this World" (or similar) is present after data resolves.
- `PosterCard` receives items with `posterPath` (i.e. the rail renders cards) — assert at least one element with aria-label matching a returned title.
If react-query needs a wrapper, provide `QueryClientProvider` with a `new QueryClient()`.

## Step 2: Run, confirm FAIL (module/route missing).
`npm run test --workspace client -- GenreExperience`

## Step 3: Implement
- `GenreExperience.tsx` (default export): `useParams<{slug}>()`, `const world = getGenreWorld(slug!)`. `useQuery({ queryKey:["genre-experience", slug], queryFn: () => api.genreExperience([slug!]) })`. On loading show a skeleton/empty; on error show graceful message. Render `<ExperienceHero world={world} slug={slug!}/>` then rails:
  - `<Carousel title="For You in this World"><PosterCard item={it} key={it.tmdbId+'/'+it.mediaType} /></Carousel>` mapping `data.items`.
  - `<AnchorFrame anchors={data.anchorsUsed} world={world}/>` (the "your library closest to this world" framing).
- `ExperienceHero.tsx`: presentational; props `{slug, world}`. Renders the metaphor + tonePrompt as the hero copy, genre name as H1. No animation that ignores reduced-motion.
- `AnchorFrame.tsx`: lists `anchors` (title + rating) as "Why this world, from your library".
- Wire the route in App.tsx:46-ish.

## Step 4: Run, confirm PASS
`npm run test --workspace client -- GenreExperience`

## Step 5: Commit
`git add client/src/pages/GenreExperience.tsx client/src/components/genre/ExperienceHero.tsx client/src/components/genre/AnchorFrame.tsx client/src/App.tsx client/src/pages/GenreExperience.test.tsx && git commit -m "feat: GenreExperience page (hero + rails via Carousel/PosterCard + AnchorFrame)"`

## Hard gates
- G5: this page is the "shell"; the structural-differentiator (Timeline module) is Task 5. Do NOT try to build genre-modules here.
- G3: NEVER call logAnchor / any impression logging from this page. Reader only.
- No new API routes; use existing `api.genreExperience`.
- Reduced-motion respected; dark-only (app is dark).
- Make it actually look intentional (use existing CSS classes / token vars; match Discover.tsx visual language) — this is a user-facing page, not a stub.
