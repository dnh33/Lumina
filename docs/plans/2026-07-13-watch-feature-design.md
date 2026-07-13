# `/watch` — In-App Viewing (Design)

**Date:** 2026-07-13
**Status:** Approved (design) — ready for Phase 2 plan + TDD build
**Author:** Rune (runeforge-coder), with Daniel (dnh33)

---

## 0. Why this exists

Lumina is a local-first cinematic journal. Today it can *record* what you watch (library,
episodes, recaps) but not *play* it. This feature lets you open a title you already track and
watch it from inside your journal — fitted to Lumina's editorial identity (ink/gold, recap-first),
not cloned from a piracy portal.

## 1. Hard constraints (from the roast, non-negotiable)

A 5-agent roast (product / security / technical / legal / premise-audit) ran on the original
"clone 1flex" plan. Verdicts: Product REDESIGN, Security REDESIGN/SCRAP, Technical
REDESIGN/SCRAP-Tier-B, Legal SCRAP. The constraints below are what survived:

1. **No curated public-source list ships in the repo.** A repo that ships zero infringing
   URLs is dual-use (like VLC/Kodi/Jellyfin) — GitHub's AUP §3 only bites on *illegal content*,
   which an empty resolver is not.
2. **Real sources live in a gitignored local file** (`data/sources.local.json`). `.gitignore`
   already ignores `data/`, so this is the existing convention. Never commit it.
3. **Docs name no infringing hosts.** README/comments say "configure your own media source
   endpoints" — no `vidfast`/`vidlink` style names, no pasted templates. This is the legal
   agent's "smoking gun" avoidance: the documented example template = *Filmspeler* facilitation.
4. **No byte-proxy.** The resolver is a **URL-builder** (fills `{id}/{s}/{e}` into a template
   the user supplied locally). The `/watch` page loads a cross-origin `<iframe src>` directly.
   No server-side fetch/transform of video bytes → no SSRF sink, no range/cors treadmill.
5. **Security hardening on the iframe** (from security roast):
   - Origin allowlist: only hosts the user explicitly listed may be used as an iframe src.
   - `sandbox="allow-scripts allow-same-origin"` is NOT forced; for opt-in remote embeds use
     `sandbox="allow-scripts"` (drops popups + same-origin DOM access). Owned/subscribed
     sources (Plex/Jellyfin/WebDAV) are same-origin-ish trusted and may relax this.
   - Validate the built URL: must be `https://` (no `javascript:`/`data:`), template vars
     URL-encoded, schema-checked before render.
   - `postMessage` listener (if added later for progress sync) MUST pin origin + JSON-schema
     validate; never `JSON.parse` untrusted data into state without validation.
6. **Recap-before-play is the differentiator, not a bolt-on.** Before the iframe mounts, show
   the existing `RecapCard` ("Previously on…") fed by `/api/recap/:libraryId`. 1flex has nothing
   here; this is where Lumina wins.

## 2. Scope

### In scope
- `GET /api/sources` — returns the user's configured source list (names + which are "trusted",
  **not** raw templates) from `data/sources.local.json`. Empty array if absent.
- `GET /api/watch/resolve?source=<name>&tmdbId=&type=&season=&episode=` — server-side URL builder.
  Reads the template for `<name>` from the local file, substitutes `{id}` (TMDB id), `{s}`, `{e}`,
  returns `{ url }` after validation (https-only, encoded). **Does not fetch the URL.**
- `src/pages/Watch.tsx` — `/watch/:type/:tmdbId` route. Recap-first surface + clean player.
- `WatchPlayer` component — the `<iframe>` with sandbox + origin allowlist + a "this play
  contacts `<host>`" trust badge.
- `EpisodeSidebar` — vertical masked scroller reusing `EpisodeTracker` data; click sets
  `season`/`episode` and updates the route (SPA `navigate`, no full reload — smoother than
  1flex's reload, and we control it).
- Source `<select>` over `GET /api/sources`.
- Resume: use existing episode-progress in `library`/`episodes` tables; deep-link from hero
  "Play" to the exact `season`/`episode`.
- `data/sources.local.example.json` — committed, **generic**: one owned-source shape
  (e.g. a `{ "name": "...", "type": "webdav", "template": "https://your-server/...{id}" }`
  with a placeholder `your-server` host), zero public-embed references.

### Out of scope (explicitly cut)
- Any resolver tier that ships public-host templates. (Legal SCRAP.)
- Byte-proxy / server-side stream fetch. (Security + tech rot.)
- Cloning 1flex's dark-embed chrome. (Product REDESIGN — we are recap-first, not a pirate portal.)
- A backend "server list" endpoint like 1flex's `servers.1flex.org`. (Not needed; local file.)
- Multi-user / auth. (Personal app.)

## 3. Architecture

```
client/src/pages/Watch.tsx        /watch/:type/:tmdbId
  ├─ RecapCard (existing, /api/recap/:libraryId)   ← shown before play
  ├─ EpisodeSidebar (reuses EpisodeTracker data)
  │     └─ click → navigate(`/watch/tv/${id}?s=&e=`)
  ├─ source <select>  ← GET /api/sources
  └─ WatchPlayer  → <iframe sandbox src={resolvedUrl}>
                       ↑ GET /api/watch/resolve?source&tmdbId&type&season&episode

server/src/routes/watch.ts
  GET /api/sources        → read data/sources.local.json (safe defaults if missing)
  GET /api/watch/resolve  → validate + substitute template → { url }
  resolver util: server/src/lib/sourceResolver.ts (pure, unit-tested)
```

### Source config shape (`data/sources.local.json`)
```json
{
  "sources": [
    {
      "name": "My Jellyfin",
      "type": "jellyfin",
      "template": "https://your-server.example/media/{id}?s={s}&e={e}",
      "trusted": true
    }
  ]
}
```
- `trusted: true` → iframe may use relaxed sandbox (same-origin scripts allowed).
- `trusted: false` (or absent) → opt-in remote embed → strict `sandbox="allow-scripts"`.
- Server returns only `{ name, type, trusted }` to the client; the `template` string never
  leaves the server except inside a validated, https-only resolved URL.

### Resolver rules (unit-tested)
- Substitute `{id}`→tmdbId, `{s}`→season, `{e}`→episode.
- Reject if result is not `https://`.
- URL-encode each substituted value.
- Reject `javascript:`/`data:`/anything non-http(s) at template-parse time.
- Reject templates containing raw JS / unescaped control chars.

## 4. Security model (recap from roast)
- **local file, never committed** → no repo/ToS exposure.
- **server-side validation** → client never builds iframe src from raw user input; XSS sink closed.
- **origin allowlist** → only user-listed hosts loadable.
- **sandbox** → third-party scripts can't touch Lumina's DOM / open popups.
- **trust badge** → user sees exactly which host a play contacts.
- **no proxy** → no SSRF, no egress-to-LAN risk.

## 5. Success criteria
- `npm run typecheck`, `npm test` (server vitest), `npm run build` all green.
- A test proves the resolver: builds a valid https URL; rejects javascript:/non-https; encodes vars.
- A test proves `/api/sources` returns [] when no local file; returns names-only (no templates) when present.
- Manual: with a `sources.local.json` pointing at an owned/trusted endpoint, `/watch` plays it;
  recap renders first; episode sidebar navigates; resume deep-link works.
- `data/sources.local.json` is gitignored and absent from `git status`.

## 6. Open follow-ups (not blocking)
- `postMessage` progress sync (pin origin + validate) — optional, later.
- "Open in external player" fallback — security agent's preferred alternative to embedding.
