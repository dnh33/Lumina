# Task 5 — Timeline scrubber module (structural differentiator, Bento layout)

You are implementing ONE task of a TDD plan for Lumina. Follow RED→GREEN→COMMIT. Do NOT touch other tasks. Task 4 (GenreExperience page) may still be in flight — coordinate by NOT editing the same files (you create a NEW component + a NEW test).

## Verified repo facts
- The genre page (`client/src/pages/GenreExperience.tsx`) will render modules. Add Timeline as a self-contained component the page imports. It must accept props, not reach into the API itself.
- `framer-motion` is available; App wraps in `MotionConfig reducedMotion="user"` (App.tsx:23). Respect `useReducedMotion()`.
- TMDB era data: there is NO dedicated era API. Timeline is a PRESENTATIONAL scrubber over a derived decade/era axis. Derive decades from the items' `year` (number|null) passed in as props, OR accept a static `eras` prop. Keep it client-side, no new server call (YAGNI — design cut autoplay/particles; keep it lean).
- Reuse tokens: `var(--font-display)`, `var(--font-sans)`, gold/amber accents via existing CSS classes (match Discover.tsx). No hardcoded fonts.
- Em-dash banned.

## Files
- Create: `client/src/components/genre/TimelineScrubber.tsx`
- Create: `client/src/components/genre/TimelineScrubber.test.tsx`

## Step 1: Write failing test
Using `@testing-library/react` + `vitest`. Render `<TimelineScrubber items={sample} />` where `sample = [{tmdbId:1, year:1999,...},{tmdbId:2, year:2005,...},{tmdbId:3, year:2014,...}]` (Cast `items` to `CatalogItem`-shaped minimums). Assert:
- it groups items into decades (e.g. a label "1990s", "2000s", "2010s" is present),
- scrubbing (fireEvent on an era tab/button) filters the visible items to that decade (assert the off-decade title is removed from the DOM after click).
This proves it is a real interactive module, not decoration.

## Step 2: Run, confirm FAIL.
`npm run test --workspace client -- TimelineScrubber`

## Step 3: Implement `TimelineScrubber.tsx`
Props: `{ items: CatalogItem[] }` (or a minimal `{tmdbId,title,year,mediaType,posterPath,...}[]`).
- Compute decades: `Math.floor((year??0)/10)*10`; group items by decade.
- Render an era rail of buttons (one per present decade) + a `motion.div` list of the currently-selected decade's items (PosterCard or simple cards). Default selection = earliest decade.
- On era-button click, set selected decade (useState). Reduced-motion: wrap transitions in `useReducedMotion()` guard.
- Must compose with the page (Bento-style: a wide panel). Visual language matches Discover.

## Step 4: Run, confirm PASS.
`npm run test --workspace client -- TimelineScrubber`

## Step 5: Commit
`git add client/src/components/genre/TimelineScrubber.tsx client/src/components/genre/TimelineScrubber.test.tsx && git commit -m "feat: TimelineScrubber module (decade-scrubbable, Bento layout)"`

## Hard gates
- G5: this IS the structural differentiator for v1 (design §14 fork 5: Timeline module all-genres). Make it genuinely interactive (scrub = filter), not a tint.
- No new server route/LLM call. Pure client presentational + state.
- Reuse `CatalogItem` shape (import type from `../lib/types`). Do not invent a new item type.
- Do NOT wire it into GenreExperience.tsx routing logic beyond a simple import+render — if Task 4 hasn't landed yet, just create the component + test; the page-integration edit can be a tiny follow-up. Prefer: if GenreExperience.tsx exists, add `<TimelineScrubber items={data.items}/>` to it and include that file in the commit.
