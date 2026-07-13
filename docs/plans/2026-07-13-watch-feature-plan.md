# `/watch` — Implementation Plan

**Design:** `docs/plans/2026-07-13-watch-feature-design.md` (approved, committed)
**Engine:** Claude Code (Opus) via `claude-code-infra`; verify with project gates.
**TDD:** each task = failing test first → implement → green → commit.

## Task P1 — `server/src/lib/sourceResolver.ts` (pure, unit-tested)
- `buildUrl(template: string, vars: {id:number|string; s?:number; e?:number}): { ok: true; url: string } | { ok: false; error: string }`
- Substitute `{id}`,`{s}`,`{e}`; URL-encode values.
- Reject if template is not https-only at parse (no `javascript:`/`data:`/relative).
- Reject if result url is not `https://`.
- **Test first:** valid build; rejects `javascript:`; rejects `http://`; encodes spaces/`&`.
- Files: new `server/src/lib/sourceResolver.ts`, new `server/src/lib/sourceResolver.test.ts`.

## Task P2 — `server/src/routes/watch.ts` + mount
- `GET /api/sources` → read `data/sources.local.json` (default `[]` if missing); return `[{name,type,trusted}]` only — NEVER templates.
- `GET /api/watch/resolve?source&tmdbId&type&season&episode` → find source by name in local file; `buildUrl`; return `{ url }` or 404/400.
- Mount `app.use("/api", watchRouter)` in `server/src/index.ts`.
- **Test first:** routes tested via `supertest`-style or in-process fetch against the express app; `/api/sources` empty when no file; names-only payload; resolve validates.
- Files: new `server/src/routes/watch.ts`; edit `server/src/index.ts` (1 line mount).

## Task P3 — `data/sources.local.example.json` + gitignore
- Generic example: ONE owned-source entry with placeholder `https://your-server.example/...{id}...`, `trusted:true`, ZERO public-embed host names.
- Confirm `.gitignore` already ignores `data/` (it does). Add a comment line noting `sources.local.json` is private.
- Do NOT commit `sources.local.json` itself.

## Task P4 — `client/src/components/WatchPlayer.tsx`
- Props: `url`, `trusted`. Renders `<iframe>` with `sandbox`.
- `trusted` → `sandbox="allow-scripts allow-same-origin"`. Else `sandbox="allow-scripts"`.
- `referrerPolicy="no-referrer-when-downgrade"`, `allow="autoplay *; fullscreen *; ..."`, `allowFullScreen`.
- Trust badge: shows `new URL(url).host` ("Playing from <host>").
- No `srcdoc`; src is always a server-validated https url.
- Files: new `client/src/components/WatchPlayer.tsx`.

## Task P5 — `client/src/components/EpisodeSidebar.tsx`
- Vertical masked scroller. Reads episode list for the title (reuse existing episode query / `EpisodeTracker` data shape).
- Each row: backdrop thumb (TMDB `still_path` via `image.tmdb.org/w780`), `S{s}E{e}` + name + `line-clamp-2` overview.
- Click → `navigate(\`/watch/tv/${tmdbId}?s=${season}&e=${episode}\`)` (SPA, no reload).
- Style: `panel`, `font-display`, masked top/bottom gradient, `text-mist-*`.
- Files: new `client/src/components/EpisodeSidebar.tsx`.

## Task P6 — `client/src/pages/Watch.tsx` + api client
- Route `/watch/:type/:tmdbId`. Query `?s=&e=`.
- Recap-first: fetch `/api/recap/:libraryId` (map tmdbId→libraryId via existing api) → render existing `RecapCard` before play; "Start playing" button mounts `WatchPlayer`.
- Source `<select>` from `GET /api/sources`; on select, `GET /api/watch/resolve` → set player url.
- Resume: default `s`/`e` from existing episode progress in library if tv.
- Add api methods: `sources()`, `resolveWatch(...)`.
- Files: new `client/src/pages/Watch.tsx`; edit `client/src/lib/api.ts` (2 methods).

## Task P7 — route + hero Play deep-link
- `App.tsx`: add `<Route path="/watch/:type/:tmdbId" element={<Watch />} />`.
- Reuse existing hero "Play" to deep-link to `/watch/:type/:tmdbId?s=&e=` using resume progress.
- Files: edit `client/src/App.tsx`; edit the Play handler in `Discover.tsx`/`TitleDetail.tsx` (whichever owns hero Play).

## Task P8 — verification
- `npm run typecheck` (server+client) green.
- `npm test` (server vitest) green — resolver + routes.
- `npm run build` green.
- Confirm `git status` shows NO `data/sources.local.json`.

## Execution
Single Claude Code (Opus 4.8) dispatch covering P1–P8 with this plan + design doc as context.
Then verify independently with the three gates above before completing.
