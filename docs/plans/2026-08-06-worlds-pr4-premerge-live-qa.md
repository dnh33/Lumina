# Worlds PR4 pre-merge live QA — 2026-08-06

**Auditor:** Chrome DevTools MCP (live clicks + network). cursor-ide-browser failed to hold a tab; CDP Chrome on `:5173` used instead.  
**Worktree:** `.worktrees/immersive-curated-genre-specific-experie`  
**Servers:** Vite `:5173` + API `:4000` already up (probed 200; no restart).  
**Scope:** 7 pre-merge fix behaviors (hub peek/TV resume/Enter·Resume, era inherit, claim loop, peer activate, guided decade scrub).

## Overall

**PASS on 1–7** with one **new P1 bug** found mid-claim (stale shelf peer after dial reweight) — **P1 re-verify PASS** after `syncShelfAfterDial` fix (see below). Untouched worlds stayed null after hub visits.

---

## Scorecard

| # | Behavior | Verdict | Evidence |
|---|----------|---------|----------|
| 1 | No empty-session pollution (hub peek) | **PASS** | Hub `GET`×16 `…/guided-session?slug=…&peek=1` (reqids 7927–7942 / 8059–8074). Romance peek body `{"session":null,"beats":[]}`. After full session, untouched peeks still null: romance/western/film-noir/travel/music. Resume chips only on worlds with real progress (not every door). |
| 2 | TV Resume chip + mediaType | **PASS** | Seeded anime TV tempo via `POST …/answer` `{slug:anime,mediaType:tv,beatId:tempo}`. Hub chip: `Resume Anime guided tour` → `/genre/anime?mode=guided&mediaType=tv`. Click → URL kept `mode=guided&mediaType=tv`; Guided+TV `aria-pressed=true`. Hub peeks are untyped `peek=1` (server movie-then-TV). |
| 3 | Enter vs Resume | **PASS** | Enter hrefs `…?mode=self` (e.g. Romance). Click Romance Enter → Self pressed (`aria-pressed=true`), Guided false. (URL may omit default `mode=self` and land `?decade=…` — still Self, not silent Guided.) Resume hrefs `…?mode=guided` (+ `&mediaType=tv` when TV). Click Anime Resume → Guided. |
| 4 | Era inherit on Resume/URL Guided | **PASS** | Thriller Self `?mode=self&decade=1980s` (1980s tab selected). Navigate `?mode=guided&decade=1980s` with session era unanswered (tempo only). Status: **“Guided · Classic from 1980s”**; footer **“Classic band”**; Era dial UP NEXT. |
| 5 | Claim loop → Library `?status=watchlist` | **PASS** | Watchlisted After Hours + Caliber 9 on Guided shelf. Tonight bag showed Caliber 9 + link `Open in Library` → `/library?status=watchlist`. Click → Watchlist tab pressed; After Hours + Caliber 9 present. |
| 6 | Peer poster activate-only | **PASS** | On Guided claim: click The Shining peer → stayed `…/thriller?decade=1980s&mode=guided` (no `/title/…`); actions moved to Shining (`Open The Shining`). Same for After Hours / Caliber 9. |
| 7 | Decade scrub keeps `mode=guided` | **PASS** | Widen → `?decade=1970s&mode=guided`. Click Timeline tab **1980s** → `?decade=1980s&mode=guided` (mode retained). Also: answering Era Classic cleared decade but kept `?mode=guided`. |

---

## Interaction log (abbrev)

1. Hub `/genre` — network peeks `peek=1`; Enter/Resume href audit.  
2. Seed anime TV + thriller tempo-only for Resume/era tests.  
3. Romance Enter → Self. Anime Resume → Guided TV.  
4. Thriller Self 1980s → Guided URL → Classic inherit.  
5. Peer Shining activate; Pass; Classic+Risk dials; Watchlist After Hours / Caliber 9; Tonight bag → Library.  
6. Widen → scrub 1970s→1980s; mode stayed guided.  
7. Final peek pollution check on five untouched worlds → all `null`.

---

## New bugs found

### P1 — Guided shelf peer stale after dial reweight (act 400)

- **Symptom:** After Risk answer, UI still offered **Aliens 1986** with Watchlist. Clicks posted `POST /api/discover/guided-session/act` with `tmdbId:679` and got **400** `{"error":"tmdbId not in guided picks"}`. Server picks were Rosemary / Train to Busan / **Caliber 9**.  
- **Console:** `Failed to load resource: 400` (×3).  
- **Recovery:** Full reload of Guided page re-synced UI to server picks; Caliber 9 watchlist then succeeded and Tonight bag appeared.  
- **Likely source:** client shelf not replacing picks when answer/invalidate returns a new pick set (or a race leaving the previous third peer clickable).  
- **Impact:** Dead Watchlist clicks; silent failure unless network watched. Not a merge-blocker for the 7 named fixes, but should ship a follow-up.

### P1 re-verify — dial→shelf sync (2026-08-06 evening)

**Verdict: PASS** (Chrome DevTools MCP, no reload, no server restart).

Fix under test: `GuidedTour.syncShelfAfterDial` awaits genre-experience then replaces session picks / clears orphaned `shelfActiveKey`.

| Step | Evidence |
|------|----------|
| Baseline shelf | Rosemary's Baby `805` · Train to Busan `396535` · Dirty Harry `984` (Risk stretch → comfort kept same three — no peer churn). |
| Era Classic→Now (no reload) | UI shelf → Train to Busan · Rosemary's Baby · **Parasite**; **Dirty Harry gone**. Net: `POST answer` 9552 → `GET genre-experience` **200** 9553 → `GET guided-session` 9554 with picks `396535` / `805` / `496243`. |
| Watchlist new peer | Activate Parasite → `POST …/act` **200** reqid **9558** body `tmdbId:496243` action watchlist. Flash: Watchlisted "Parasite". Tonight bag: Parasite + Library link. Console: no errors. |
| Risk comfort→stretch (original bug path) | Shelf → Train to Busan · Rosemary's Baby · **Whiplash**; **Parasite left** (no stale Watchlist). Answer 9561 already returned `244786` Whiplash; UI matched without reload. |
| Watchlist after Risk | `POST …/act` **200** reqid **9565** `tmdbId:244786` Whiplash. Tonight bag: Whiplash only (coherent — prior bag title left picks). No `400 tmdbId not in guided picks`. |

### Notes (not failures)

- Enter link advertises `?mode=self` but landing URL often drops `mode` when Self is default — behavior still Self.  
- Tonight bag only lists watchlisted titles **still on current picks**; titles that leave the shelf after reweight vanish from the bag (by design in `tonightBag.ts`).

---

## Environment

- Browser: Chrome DevTools MCP page `http://127.0.0.1:5173`  
- No git commit. No server restart.
