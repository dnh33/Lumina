# Worlds Browser QA — Guided · Companion · Sparse

**Date:** 2026-08-05  
**Target:** `http://localhost:5173` (worktree `immersive-curated-genre-specific-experie`)  
**Bar:** Highest — onboard / critique / delight + verification-before-completion  
**Scope:** Audit-first. One critical blocker fixed in-flow (URL sync). No git.

---

## Verdict

Guided Mode on Documentary is **shippable for the tour desk spine** (dials → live shelf → ranking cues → watchlist → reload resume → per-world Companion key). Companion **send** was blocked by OpenRouter model 404 (`tencent/hy3:free` in root `.env`) — **env fixed to `anthropic/claude-sonnet-5`**; re-QA after server restart. Sparse Film-Noir TV empty-state **Add works**; suggestion relevance **Pass** after affinity fix (was prestige pollution).

| Area | Score |
|------|-------|
| Guided tour desk (Documentary) | **Pass** |
| Mode URL stickiness (post-fix) | **Pass** (was Fail) |
| Companion coupling | **Soft** (prefill/thread OK; reply blocked by model) |
| Sparse / empty suggestions | **Pass** (film-noir affinity; was Fail) |
| Overall Guided G1 | **Pass with prioritized Soft/Fail follow-ups** |

---

## Checklist results

### 1. Self → Guided on Documentary

| Check | Result | Notes |
|-------|--------|-------|
| Toggle Self → Guided | **Pass** | `?mode=guided`; Tour desk mounts |
| Tour desk cues | **Pass** | Metaphor label (“Reading Room · Tour desk”), live region prompts, progress needle 0→3 |
| Tempo / Era / Risk | **Pass** | Documentary-flavored copy; choices land; progress 33/67/100 |
| Ranking feedback | **Pass** | Whisper-style cues: “Tempo → Patient cut…”, “Era → Now…”, “Risk → Fringe dossier…”; rail strip “Guided · tempo/era/risk …” |
| Preview → live shelf | **Pass** | Caption flips Preview → Live → “Tonight's three”; shelf restocks after dials |

**Delight:** Needle + live region + metaphor-specific beat prompts feel like a projection-booth curator, not a SaaS wizard.

---

### 2. Complete dials · re-dial · Retake · reload resume

| Check | Result | Notes |
|-------|--------|-------|
| Complete all three | **Pass** | “Tonight's dossier is set”; Change-Tempo/Era/Risk chips |
| Re-dial without Retake | **Pass** | Change Tempo → RE-DIAL sheet + Cancel; Sharp cut applied; cue “Tempo → Sharp cut…” |
| Retake | **Pass*** | Clears to Tempo 0/3 when exercised; mid-session RETAKE present |
| Reload resume (once) | **Pass** | Reloaded `?decade=2010s&mode=guided` → Sharp cut / Now / Fringe / “1 watchlisted” restored |

\*Earlier Retake appeared to flip to Self — root cause was **URL sync race** (below); fixed and re-verified.

---

### 3. Companion — prefill, send, tour-aware reply, streaming

| Check | Result | Notes |
|-------|--------|-------|
| Open in-world Companion (Horror Guided) | **Pass** | “Threshold Companion · IN-WORLD” |
| Prefill (no dials yet) | **Pass** | `I'm touring the horror world in Guided mode. Help me find what to watch tonight.` |
| Prefill (with dials — code path) | **Pass** | `CompanionPanel` builds `My choices so far: tempo: …; era: …; risk: …` when answers exist |
| Per-world thread key | **Pass** | Horror opens empty thread (not Documentary history); `genreCompanionConversationKey(slug, mediaType, guided)` |
| Send + tour-aware reply | **Env fixed — re-QA** | Was `OPENROUTER_MODEL=tencent/hy3:free` (OpenRouter 404: unavailable for free). Worktree DB had no `openrouter_model` override → env won. Prefill is client-only (no LLM). **Fix:** root `.env` → `anthropic/claude-sonnet-5`; clearer 404 copy in chat SSE. **Daniel:** restart worktree server; confirm OpenRouter credits; or set another live slug in Settings / `.env`. |
| Streaming cleanliness | **Blocked** | Cannot grade token buffer / flicker until LLM responds |

---

### 4. Watchlist / Pass · library mirror

| Check | Result | Notes |
|-------|--------|-------|
| Watchlist from shelf | **Pass** | Blackfish → cue “Watchlisted "Blackfish" - it's in your library now.”; shelf “1 watchlisted”; rail “19 unwatched” |
| Pass / Not tonight | **Soft** | UI present; exercise interrupted by hub navigation; API dismiss path exists |
| Library mirror | **Pass** | `/library` shows **Blackfish · Watchlist** at top (Recently added) |

---

### 5. Horror Guided — separate Companion thread

| Check | Result | Notes |
|-------|--------|-------|
| Separate guided session | **Pass** | Fresh 0/3; horror copy (“Stand at the door…”, Creeping / Tight coil / Breach) |
| Separate Companion thread | **Pass** | Empty welcome; horror prefill; no Documentary dial transcript |

---

### 6. Film-Noir Movies vs TV — sparse “Cross the threshold”

| Check | Result | Notes |
|-------|--------|-------|
| Movies rail | **Pass / Soft** | Full classic noir rail (20 titles) when Discover catalog is dense — **not** empty-state |
| Atlas says Empty | **Soft** | Hub “Film Noir · Empty · Unseeded” while Movies shows 20 unwatched — atlas = library anchors, not rail |
| TV sparse empty state | **Pass** | “A threshold not yet crossed”, **3 / 6 TITLES**, “Cross the threshold” |
| Suggestion relevance | **Pass** (fixed 2026-08-05) | TV empty suggests Flower of Evil / Lucifer — crime/detective-adjacent TV; **no** Shawshank / Godfather / Dark Knight; hrefs are `/title/tv/…`; why lines use lexicon (`Motive · year`) |
| Add works | **Pass** | Godfather → spinner → “already in library”; Shawshank already disabled as Anchored |
| Count after Add | **Soft** | Still **3 / 6** — adding off-rail prestige titles does not thicken the noir TV rail |

**Earlier Movies sparse** (pre-catalog fill) showed the same wrong suggestion set — root cause was empty-state ranking by `voteAverage` on TMDB search `"noir"` / crime-neighbor prestige (`GenreEmptyState.uniquePicks`). **Fixed:** affinity score (noir keywords + Crime/Thriller/Mystery genres, prestige demotion), `mediaType` on neighbor rails, query `"film noir"`, no voteAverage-only fallback for film-noir.

---

### 7. WhisperStrip / outcome cues after dials

| Check | Result | Notes |
|-------|--------|-------|
| Dial outcome cues | **Pass** | Live region + guided rail strip after each beat |
| Watchlist outcome | **Pass** | Explicit library confirmation |
| `data-guided-live` coupling | **Pass** | Page wires GuidedTour → WhisperStrip |

---

### 8. Broken / confusing guided guidance

| Issue | Severity | Notes |
|-------|----------|-------|
| Featured module ignores guided ranking | **Pass** (fixed) | Featured now follows guided rail/shelf lead (`preferGuidedFeatured` + `featuredCandidate` preserves `rankForGuided` order). Verified: shelf lead Selena = Featured Selena (was One Direction by voteAverage). |
| Era “Now” steers decade scrub to **2010s only** | **Pass** (fixed) | Era answers clear decade scrub (`ERA_DECADE.* → null`); ranking owns the year-band (≥2010). Whisper “every era”; “All eras” selected. Stale `?decade=2010s` cleared on resume when era is set. |
| Mid-tour shelf vs decade filter | **Pass** (fixed) | Same root cause as Era pin — no longer locks rail to a single decade while shelf spans the band. |
| Featured “The argument” raw JSON (Film-Noir Movies) | **Pass*** | Guard via `insightThesis` + `ArgumentPanel` sanitize — do not regress; Featured coupling reuses same path. *Sibling may still harden edge cases.* |
| Horror welcome chip “Show me something dread” | **Soft** | Grammar/onboard copy |
| Companion model 404 | **Fail (ops)** | Blocks tour-aware reply QA |
| Accidental bounce to `/genre` hub during long waits | **Soft** | Observed under multi-tab / HMR pressure; not reproduced as a single deterministic click |

---

## Critical fix applied in-flow

### P0 — `mode=guided` dropped when decade/scrub wrote URL

**Symptom:** Answering Era (or any `setDecade`) could leave `?decade=2010s` **without** `mode=guided`, and Self appeared pressed after remount/race.

**Cause:** `useGenreState` URL sync cloned `searchParams` and rewrote scrub params while **not** asserting `steer.mode` / `steer.mediaType`. Raced with `GenreExperience`’s separate `setModeParam` / `setMediaTypeParam` writers.

**Fix (surgical):**
- `client/src/lib/useGenreState.ts` — rebuild URL from state; always emit `mode=guided` and `mediaType=tv` from steer.
- `client/src/pages/GenreExperience.tsx` — mode/media toggles only update steer; URL owned by `useGenreState`.

**Verified:** Era → Now navigates with `mode=guided` preserved (decade pin no longer forced — see follow-up).

---

## Fix applied — Featured ↔ guided + Era scrub (2026-08-05 follow-up)

### P1 — Featured ignored guided ranking

**Symptom:** Tonight shelf / guided rail led with tour-ranked titles; Featured stayed highest-`voteAverage` Self pick (e.g. One Direction).

**Cause:** `featuredCandidate` and `GenreModules.pickFeatured` always sorted by rating, discarding server `rankForGuided` order.

**Fix:**
- `GenreExperience.tsx` — when `mode=guided`, Featured candidate = first of steered rail (guided order); Self keeps rating pick.
- `GenreModules.tsx` — `preferGuidedFeatured` preserves rail order (first with thesis, else `items[0]`); subtitle “Tonight's lead…”.
- Insight sanitize path (`insightThesis` / `ArgumentPanel`) left intact — no regression of JSON-leak guard.

**Verified (browser):** Documentary Guided, dials complete — shelf lead **Selena Gomez: My Mind & Me** = Featured Selena; caption “Tonight's lead — same ranking as the guided shelf”.

### P1 — Era “Now” → 2010s-only scrub

**Symptom:** Era=Now set `decade=2010`, filtering rail to 2010–2019 while shelf still ranked 2020s (`eraMatch` ≥2010).

**Fix:**
- `GuidedTour.tsx` — `ERA_DECADE` all `null`; answering era / resume with era set clears scrub pin.
- `guidedCurator.ts` — era feedback copy matches “ranking band · scrub open”.

**Verified:** Whisper “every era”; Timeline “All eras” selected; 2022 shelf title visible alongside 2010s without scrub lying.

### P1 — Film-Noir empty suggestions (prestige pollution)

**Symptom:** “Cross the threshold” ranked Shawshank / Godfather / Dark Knight / Green Mile (and movies on TV).

**Cause:** Neighbor crime/thriller rails + `uniquePicks` sorted by `voteAverage`; neighbor fetch hardcoded `mediaType: "movie"`; search query `"noir"`.

**Fix (surgical):**
- `GenreEmptyState.tsx` — affinity score (noir keywords + Crime/Thriller/Mystery; demote vote≥8 without keyword); refuse voteAverage-only fallback for film-noir; pass steer `mediaType` into neighbor `genreExperience`; query `"film noir"`; lexicon why picks a matching word when possible.
- `GenreExperience.tsx` — pass `mediaType` into empty state.
- Tests: `GenreEmptyState.affinity.test.tsx` (+ bootstrap Chinatown).

**Verified (browser):** `/genre/film-noir?mediaType=tv` → Flower of Evil, Lucifer (`/title/tv/…`, `Motive · year`); no prestige movie pollution.

---

## Prioritized fixes (remaining)

### P0
1. **Companion OpenRouter model slug** — **fixed locally 2026-08-05:** root `.env` had `tencent/hy3:free` (dead free tier). Set to `anthropic/claude-sonnet-5`. Chat errors now name the rejected model + Settings/.env. **Still needs Daniel re-QA** after server restart (credits / alternate free slug if preferred).
2. **Argument thesis JSON leak** — guard present via `insightThesis` + `ArgumentPanel`; sibling may harden further. Do not regress when touching Featured.

### P1
3. ~~**Empty-state suggestions for niche worlds**~~ — **done (film-noir):** affinity + mediaType + `"film noir"`; prestige-by-vote refused. Other niches still voteAverage-rank (watch if they pollute).
4. ~~**Featured follows guided rail**~~ — **done** (see follow-up above).
5. ~~**Era “Now” ↔ decade scrub**~~ — **done** (see follow-up above).

### P2
6. Atlas Empty vs dense Discover rail — clarify copy (“no library anchors” vs “no titles”).
7. Horror chip copy: “Show me something dread” → “Show me something with dread”.
8. Empty-state Add that doesn’t move threshold count — after Add, invalidate genre-experience / explain that only world-rail titles count toward 6.

---

## Heuristic snapshot (Guided desk only)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 4 | Needle + live cues |
| 2 | Match real world | 4 | Era band vs scrub aligned |
| 3 | User control | 4 | Re-dial + Retake + Cancel |
| 4 | Consistency | 4 | Featured = guided shelf lead |
| 5 | Error prevention | 3 | Mode URL race (fixed) |
| 6 | Recognition over recall | 4 | Dial chips show current labels |
| 7 | Flexibility | 4 | Re-dial without Retake |
| 8 | Aesthetic / minimal | 4 | Instrument Ink, metaphor voice |
| 9 | Error recovery | 2 | Companion 404 only offers Retry |
| 10 | Help / docs | 3 | Inline cues strong; chips soft |
| **Total** | | **36/40** | **Strong** once Companion model re-QA lands |

**Anti-slop:** Guided desk passes — Cabinet/Geist, world accent, no purple SaaS wizard. Film-Noir empty CTAs lean Threshold-accent; suggestions now crime/detective-adjacent, not Top-250 prestige.

---

## Persona red flags

- **Daniel (power cinephile):** Companion model 404 breaks the “talk to something that knows my dials” aha. Featured now tracks the guided lead (Selena = shelf lead under current dials).
- **First-timer on Film-Noir TV:** ~~“Cross the threshold” with Godfather/Shawshank~~ **Cleared** — strip now shows crime/detective-adjacent TV with lexicon why. Remaining Soft: Add still may not move 3/6 if off-rail.

---

## Suggested next commands

1. Restart worktree server (picks up new `OPENROUTER_MODEL`) → re-run Companion stream QA  
2. ~~`/clarify` empty-state noir suggestions + mediaType filter~~ **Done**  
3. Re-run this checklist once (single browser tab, no parallel agents)

---

## Evidence notes

- Isolated QA tab: `guided-qa-final-v3`
- Documentary answers after run: `tempo=kinetic` (Sharp cut), `era=now`, `risk=stretch`
- Featured follow-up verify: shelf + Featured = Selena Gomez; Timeline All eras; whisper “every era”
- Library: Blackfish Watchlist mirrored (in-library → lower guided score; shelf lead moved)
- Companion Horror: prefill OK; LLM 404 on send (model slug updated locally — needs server restart)
- Film-Noir TV: empty 3/6; suggestions **Pass** after affinity fix (Flower of Evil, Lucifer — tv only); prestige set gone
