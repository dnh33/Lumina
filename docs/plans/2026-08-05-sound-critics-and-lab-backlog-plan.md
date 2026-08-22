# Sound, Critics Follow-ups & Lab Backlog — Coordination Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` only **after** Daniel's go on a scoped slice. Steps use checkbox (`- [ ]`) syntax for tracking. **This document is coordination + readiness — not a wholesale rewrite of the Sound plan.**

**Goal:** Clear unfinished Lumina tracks (Cuelume Sound readiness, Critics gaps, lab/worktree residue) relative to Worlds & Facelift, without inventing ship status or starting code from this plan alone.

**Architecture:** Treat each track as an independent workstream with explicit go/no-go and verify gates. Sound implementation detail lives only in `docs/plans/2026-07-12-cuelume-sound-plan.md`. Critics gaps are small surgical follow-ups on the shipped OMDb bridge. Lab items are promote / renumber / delete decisions, not new product scope.

**Tech Stack:** Existing Lumina client/server (React + Vite + TS; Express + SQLite); `cuelume` for Sound; OMDb via `ratingsService.ensureRatings`; Vitest client tests where already present.

## Global Constraints

- **No Sound ship claim from this plan.** Vault WM (2026-07-12) records: plan DONE, gated on Daniel's go. Do not invent "Sound is shipped." Reconcile tree vs WM as a readiness step (see §1).
- **Point, don't rewrite:** Sound Waves A→D, coverage matrix, a11y rules, and Wave D checklist stay authoritative in `2026-07-12-cuelume-sound-plan.md`.
- **Pref / owner:** `lumina:sound` (`SOUND_KEY`); single owner `client/src/lib/sound.ts`; reduced-motion via `matchMedia("(prefers-reduced-motion: reduce)")`; errors and destructive actions stay silent.
- **Critics durable truth:** `D:\Aetherkeep\06-projects\lumina\critics-scores-2026-07-12.md` + `critics-api-contract.md`. OMDb gaps (no `imdb_id` / no RT) are by design — not bugs.
- **Daniel runs servers / git / tests.** Agents verify instructions; do not start `dev` or run git unless Daniel asks.
- **Karpathy:** surgical tasks only; no speculative recs/scoring implementation until ADR is Accepted and renumbered; no loading-bloom code until design sign-off + priority clear.
- **Priority default:** Worlds & Facelift outrank this backlog. Only parallel-safe slices may run alongside (see §4).

---

## 0. File / artifact map (coordination only)

| Artifact | Role |
|---|---|
| `docs/plans/2026-07-12-cuelume-sound-plan.md` | Authoritative Sound design + Waves A–D + §7 QA |
| `docs/plans/2026-08-05-sound-critics-and-lab-backlog-plan.md` | This backlog / go-no-go plan |
| `D:\Aetherkeep\06-projects\lumina\critics-scores-2026-07-12.md` | Critics shipped record + known gaps |
| `D:\Aetherkeep\06-projects\lumina\critics-api-contract.md` | Verified OMDb/TMDb shapes — do not re-guess |
| `server/src/services/ratingsService.ts` | `ensureRatings` — 30-day TTL, no force flag today |
| `server/src/routes/catalog.ts` | Title open → `ensureRatings` (lazy) |
| `server/src/routes/library.ts` | `POST /api/library/enrich-all` (missing scores only) |
| `client/src/pages/Settings.tsx` | Bulk "Refresh critics" only |
| `client/src/pages/TitleDetail.tsx` | No per-title force-refresh today |
| `.worktrees/recommendation-system-upgrade/docs/adr/0004-recommendation-scoring-funnel.md` | Proposed ADR — **number collision** with main `docs/adr/0004-ignore-…` |
| `.worktrees/improvement-of-luminas-take/docs/plans/2026-07-13-luminas-take-loading-bloom-{design,plan}.md` | Untracked design/plan — not on main `docs/plans/` |
| `.worktrees/immersive-curated-genre-specific-experie/` | Worlds v2 active lab (priority track) |
| `.worktrees/exploration-of-implementation-of-viewing-content-inside-the-app/` | **Orphan dir** (no `.git`) — cleanup candidate |
| Branches (refs observed 2026-08-05, no git commands): `feat/critics-branding`, `origin/ignore-show-movie-feature` | Verify merge/keep — see §3 |

---

## 1. Sound — readiness checklist + go/no-go + wave verify gates

**Canonical plan:** [`docs/plans/2026-07-12-cuelume-sound-plan.md`](./2026-07-12-cuelume-sound-plan.md) (do not duplicate §§1–7 here).

**Session truth (vault WM 2026-07-12):** Plan written; **next = Daniel's go** for Waves A→D. This backlog does **not** assert implementation status beyond: reconcile before treating Sound as done.

### 1.1 Readiness checklist (pre-go)

- [ ] **Reconcile WM vs working tree.** WM says plan-only. Before any "ship" language: Daniel confirms whether Sound work on disk is intentional WIP, already merged, or needs a status reset. *Do not invent shipped.*
- [ ] **Dependency present:** `cuelume` still in client deps; recipes unchanged (plan §1 cue table).
- [ ] **Architecture still valid:** single owner module, `lumina:sound`, Settings "Interface sounds", `initSound` at app mount, reduced-motion = silence (plan §2).
- [ ] **Coverage matrix still matches UI.** Facelift / Worlds may have moved line numbers — re-map matrix rows to current files before Wave B/C edits (plan §3). Especially: `useChat` SSE paths, `ChatDock` launcher, `TitleDetail` ActionBar `done()` vs add-only `success`.
- [ ] **No Settings reduce-motion toggle** (OS-only) — still true; do not invent an app toggle.
- [ ] **Cross-input rule remembered:** meaningful cues on click / `playCue` only; hover/press/release = mouse texture on exactly two controls (plan §4).
- [ ] **Silence still required:** errors, destructive (wipe/delete/remove), trailers, notes autosave, dense nav rows (plan §§3,5).

### 1.2 Go / no-go

| Gate | Go if… | No-go if… |
|---|---|---|
| **Daniel go** | Explicit green light for Sound (or for a named wave only) | "Parked" / Worlds-first / no answer |
| **Conflict** | TitleDetail / Settings / useChat not mid-Worlds or Facelift conflict | Active Worlds UI or TitleDetail churn on same files |
| **A11y policy** | Reduced-motion → silence still accepted | Desire for sound under reduced-motion (would rewrite policy) |
| **Scope freeze** | Matrix in plan §3 is the coverage set | Desire to "add more cues" without displacing matrix rows |

**Default recommendation:** **No-go for Sound implementation until Worlds/Facelift clear TitleDetail + companion files**, unless Daniel explicitly prioritizes Wave A-only (foundation) as parallel-safe (see §4).

### 1.3 Wave verify gates (point to plan; do not rewrite)

Execute waves in order. After **each** wave:

```
npm run typecheck --workspace client
npm run build --workspace client
```

| Wave | Plan home | Done when… |
|---|---|---|
| **A — Foundation** | Plan §6 Wave A | `sound.ts` + key + Settings switch + pref × reduced-motion policy; unit-testable mute truth table if tests are part of the wave |
| **B — Declarative** | Plan §6 Wave B + §3 attrs | Matrix declarative attrs only; no new cue kinds |
| **C — Imperative** | Plan §6 Wave C + §3 imp | Companion stream + mutation successes; abort/error silent |
| **D — QA** | Plan §7 checklist | Every checkbox in plan §7 ticked on real mouse + touch-emulation + keyboard + reduced-motion |

- [ ] Wave A verify (typecheck + build) → Daniel smoke: Settings toggle persists
- [ ] Wave B verify → Daniel: nav/dial/toggles audible; hover only on launcher
- [ ] Wave C verify → Daniel: one companion turn sequence (tick → bloom → … → chime); saves = success
- [ ] Wave D verify → full plan §7 checklist; cue-name sanity test (plan §7 last item) green

**Stop rule:** If any wave adds sound on error/destructive paths, fail the wave — cut, do not "fix later."

---

## 2. Critics gaps — ordered small tasks

**Shipped baseline:** commit `ed66bfd` record in Aetherkeep `critics-scores-2026-07-12.md`. Gaps below are **NOT built** (vault). Bulk refresh exists; per-title force-refresh does not; `ensureRatings` has no bypass flag.

### Task C1 — Per-title force-refresh on TitleDetail (highest value)

**Why first:** User already has bulk Settings refresh; single-title stale/wrong scores need a surgical bypass of the 30-day TTL without re-fetching the whole library.

**Files (expected):**
- Modify: `server/src/services/ratingsService.ts` — add explicit force/bypass (e.g. `opts?: { force?: boolean }`) that skips the fresh-TTL early return
- Modify: `server/src/routes/catalog.ts` (or a small dedicated route) — expose force path
- Modify: `client/src/lib/api.ts` + `client/src/pages/TitleDetail.tsx` — control near Critics row / hero pills
- Test: server unit/integration around TTL vs force; client typecheck

**Verify:**
1. Fresh title (<30d) → normal open serves cache (no OMDb).
2. Force action → OMDb called (or no-key graceful null), `ratings_fetched_at` updates.
3. Still respects `OMDB_API_KEY` missing → no throw, keep cached/null.
4. Do **not** pass `tomatoes=true` (contract).

- [ ] Spec force UX (button vs long-press vs Settings-only deep link) with Daniel — one control, brand-quiet
- [ ] Implement force path + tests
- [ ] Manual: title with IMDb only / RT only / neither — UI still omits missing sources

### Task C2 — Enrich-on-first-open clarity for non-library titles

**Current behavior (by design):** `/tmdb/title` already calls `ensureRatings`. Unseen titles get scores on first open; `enrich-all` only walks rows already in `titles`. Gap is product clarity + edge cases (open aborted, OMDb fail, then never retried until TTL/force).

**Ordered substeps:**
- [ ] Confirm product intent: is lazy-on-open enough, or do Discover/Poster surfaces need pre-warm?
- [ ] If keep lazy: optional UI affordance when only TMDb shows ("Critics not fetched yet" vs silent TMDb-only) — **ask Daniel**; silent may be better
- [ ] If retry-on-fail desired: treat empty `ratings_fetched_at` after failed attempt distinctly from "OMDb has no data" (today failure can stamp fetched_at — re-read `ratingsService` before changing)
- [ ] Verify: open brand-new TMDb id → scores appear when OMDb has them; no library row required

### Task C3 — Document OMDb gaps as UX copy (optional, tiny)

- [ ] One line in Details Critics row or empty state: missing IMDb/RT can be coverage gap, not a Lumina bug
- [ ] Link operator note already in vault; no new API

### Task C4 — Out of scope / do not build

- Metacritic (present in OMDb `Ratings[]` but never in product scope)
- `tomatoes=true` parameter
- Storing critics on `library` (ADR-0001)
- Auto background crawl of all TMDb (quota: 1k/day free tier)

---

## 3. Lab / worktree cleanup vs keep

Observed under `.worktrees/` (2026-08-05, filesystem; no git commands). SHA tips read from `.git/refs` + worktree `HEAD` files.

### 3.1 Decision table

| Item | What it is | Tip vs main (`9f8b4a1…`) | Recommendation |
|---|---|---|---|
| **`recommendation-system-upgrade`** | Untracked/Proposed ADR `0004-recommendation-scoring-funnel.md` (scoring funnel) | Tip `e4ba6d8…` ≠ main | **KEEP docs.** Promote only after design approval. **Renumber** before landing on main — main already has ADR-0004…0009 (ignore, filtering, anti-fatigue, …). Suggested next free id when Accepted: **0010+**. Prerequisite called out in ADR (ignore chokepoints) appears **already on main** via ADR-0004/0005. |
| **`improvement-of-luminas-take`** | Loading-bloom design+plan present; tip **equals main** | Tip = main | **KEEP the two loading-bloom markdown files** (copy or commit to main `docs/plans/` when Daniel wants them durable). Worktree itself is **stale tip-at-main** → cleanup candidate after docs rescued. `TakeLoading` **not** in main tree. |
| **`luminas-take-improvement`** | Older take branch tip `c55fbfb…` | ≠ main | Likely **superseded** by enrichment on main — verify then remove worktree if no unique commits |
| **`what-the-llm-knows-about-me`** | Tip = main | Tip = main | **Cleanup candidate** (empty of unique tip) |
| **`immersive-curated-genre-specific-experie`** | Worlds v2 plans + hermes plans | Tip `dd7be8e…` ≠ main | **KEEP — active priority track** |
| **`exploration-of-implementation-of-viewing`** | Real worktree; branch `…viewing-content-inside-the-app` | Tip `8574f36…` | **KEEP or archive** only after Daniel decides Watch feature fate; has watch design/plan docs |
| **Orphan: `…viewing-content-inside-the-app`** | Directory **without `.git`**; only `.webclone-ref` seen | n/a | **Delete orphan dir** after Daniel confirms nothing unique vs the real worktree above |
| **`feat/critics-branding`** | Local+remote ref `def7054…` ≠ main | Diverged | **Verify:** cherry-pick / merge / drop. Do not assume merged. |
| **`origin/ignore-show-movie-feature`** | Remote tip `62a5856…` | ≠ main SHA | **Verify merge:** ignore ADRs 0004/0005 already on main — remote may be historical. Safe to leave remote until Daniel prunes; do not re-implement ignore. |

### 3.2 Cleanup task order

- [ ] Rescue: copy loading-bloom design+plan into main `docs/plans/` (or commit from worktree) — **docs only**
- [ ] Rescue: decide ADR scoring funnel → renumber to next free ADR id + Status Proposed on main, or leave in worktree until Worlds cools
- [ ] Delete orphan `.worktrees/exploration-of-implementation-of-viewing-content-inside-the-app` (no gitlink)
- [ ] Remove tip-at-main worktrees: `what-the-llm-knows-about-me`, `improvement-of-luminas-take` (after doc rescue)
- [ ] Daniel verifies `feat/critics-branding` and `origin/ignore-show-movie-feature` with his git tooling

---

## 4. Priority relative to Worlds & Facelift

**Worlds** live lab: `.worktrees/immersive-curated-genre-specific-experie` + hermes Worlds v2 plans. **Facelift** plans on main: `2026-07-12-companion-facelift-{design,plan}.md` (companion presence/streaming craft).

### Recommendation: **after Worlds/Facelift**, except parallel-safe only

| Track | vs Worlds / Facelift | Verdict |
|---|---|---|
| Sound Waves B–C | Touches `useChat`, ChatDock/Thread, TitleDetail, Shell — high conflict with Facelift/Worlds | **After** companion/Worlds file freeze |
| Sound Wave A only | `sound.ts`, keys, Settings switch | **Parallel-safe** if Settings not mid-edit |
| Sound Wave D QA | Read-only manual | **Parallel-safe** anytime after code exists and Daniel goes |
| Critics C1 force-refresh | TitleDetail + ratingsService — mild TitleDetail conflict with Worlds | **After or tight slice** when TitleDetail quiet; server-only force flag can land first |
| Critics C2–C3 | Mostly product/copy | **Parallel-safe** |
| Recs scoring ADR | Discover rails / ranker — orthogonal to Worlds genre page if files don't overlap; still product-priority lower | **Docs promote OK parallel; implementation after Worlds** |
| Loading bloom | TitleDetail take surfaces — conflicts with Worlds/TitleDetail | **After** TitleDetail stability; design already drafted |
| Worktree cleanup | No product risk | **Parallel-safe now** (docs rescue + orphan delete) |

**Stacking order (when Daniel picks this backlog up):**
1. Lab cleanup / doc rescue (cheap, unblocks mental RAM)
2. Critics C1 (server force + quiet TitleDetail control) — if TitleDetail free
3. Sound only on explicit go — Wave A then B→D, or Wave D-only if reconcile says code already present
4. Loading bloom + recs ADR implementation — parked behind Worlds

---

## 5. Open questions

1. **Sound status reconcile:** Is the on-disk Cuelume wiring intentional WIP, already accepted, or should WM stay "plan-only" until Wave D passes? (Do not invent the answer.)
2. **Sound go:** Green-light all waves, Wave A only, or park until Worlds ships?
3. **Critics force UX:** Visible refresh control on TitleDetail, or Settings-only / hidden gesture?
4. **Non-library enrich:** Keep silent lazy-on-open, or surface "critics pending / unavailable"?
5. **`feat/critics-branding`:** Merge, cherry-pick branding bits, or delete branch?
6. **`origin/ignore-show-movie-feature`:** Confirm fully superseded by main ADR-0004/0005 — prune remote?
7. **Loading bloom:** Sign off design as-is (honest SparkAvatar wait, no fake phases) and schedule after Worlds, or drop?
8. **Recs ADR-0004 (worktree):** Accept + renumber, keep Proposed in lab, or supersede after anti-fatigue ADRs?
9. **Watch exploration worktree:** Keep, archive, or kill with the orphan clone dir?
10. **Worlds ownership:** Is immersive worktree the only Worlds source of truth, or should Worlds plans also live under main `docs/plans/`?

---

## Self-review (plan author)

1. **Spec coverage:** Sound readiness/go/gates → §1; Critics ordered tasks → §2; lab keep/cleanup → §3; priority → §4; questions → §5. Existing Sound plan not rewritten.
2. **No ship invention:** Sound treated as gated + reconcile; Critics gaps still "NOT built" per vault.
3. **ADR number consistency:** Flagged collision between worktree scoring `0004` and main ignore `0004`.

---

## Execution handoff

Plan saved to `docs/plans/2026-08-05-sound-critics-and-lab-backlog-plan.md`.

**Do not start implementation from this doc alone.** When Daniel answers open questions / gives go:

1. **Subagent-Driven** — one fresh subagent per accepted task (C1, Wave A, doc rescue, …) with review between tasks  
2. **Inline** — same gates, single session  

Which slice first: lab cleanup, Critics C1, or Sound (after go)?
