# Worlds (Immersive) — Ship-Ready Finish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Plan mode note (2026-08-05):** This plan was authored after code re-verification. It supersedes the stale “fixes pending” checklist in `2026-07-15-worlds-v2-5axis-review.md` §8. Do **not** re-implement the original 7 blockers unless a gate below fails.
>
> **G1 = A expanded (2026-08-05 evening):** ship-ready → live QA → PR → merge (full Worlds), and ship-ready **includes real Guided Mode**. Not park/slice. Not Wave 0–2 alone. Guided plan: `docs/plans/2026-08-05-worlds-guided-mode-plan.md`. Daniel runbook: `docs/plans/2026-08-05-worlds-daniel-ship-runbook.md` (worktree + main `docs/plans/`).

**Goal:** Get the Immersive Worlds branch merge-ready to `main` with Daniel’s live review **and guided MVP+rich UX** as hard merge gates.

**Architecture:** Worlds is a self-contained client+server feature (`/genre`, `/genre/:slug`, `/compare/...`) built entirely on branch `immersive-curated-genre-specific-experience` in worktree `.worktrees/immersive-curated-genre-specific-experie`. `main` has **zero** genre/world routes. Defect fixes from the 5-axis review are already in tree; remaining work is **guided mode (in scope)**, verification, hygiene, PR, and merge.

**Tech Stack:** React 19 + Vite + TanStack Query (client); Express + SQLite + TMDB/OpenRouter (server); Vitest + `tsc --noEmit`; Framer Motion route transitions.

**Source-of-truth docs (read before coding):**
- Guided mode (G1 expanded): `docs/plans/2026-08-05-worlds-guided-mode-plan.md`
- Review + historical fix briefs: `docs/plans/2026-07-15-worlds-v2-5axis-review.md`
- Design (claims corrected inline): `docs/plans/2026-07-15-worlds-v2-design.md`
- Continuity (partially stale Wave A mid-fix section): `docs/plans/2026-07-15-genre-experience-CONTEXT-TEMP.md`
- Optional polish (Instrument Ink): `docs/plans/2026-07-16-worlds-ui-refinement-plan.md`

## Global Constraints

- Daniel runs tests, git, and `npm run dev` — agents do **not** start dev servers, do **not** auto-commit, do **not** push unless Daniel asks.
- No `git add -A` — stage explicit paths only (historical Worlds discipline).
- No “Generated with …” PR trailer.
- No merge without Daniel’s live `/npm run dev` pass **including Guided mode**.
- Root `npm test` runs **server only**; client tests are `npm run test --workspace client`.
- Root gate: `npm run typecheck` (server+client) + `npm run build`.
- Prefer surgical residue fixes over refactors. `libraryVersion` wiring remains DEFERRED. **Guided mode is in-scope (see guided-mode plan).**

---

## 1. Current state vs `main` (verified 2026-08-05)

### On `main` (absent)

- No `/genre` routes, no `GenreExperience` / `GenrePicker` / `CompareWorlds`, no `client/src/components/genre/*`, no genre experience server service.
- App shell: Discover / Library / Title / Person / Chat / Settings only.

### On worktree branch (present — built)

| Layer | What shipped |
|-------|----------------|
| Routes | `/genre`, `/genre/:slug`, `/compare/:a`, `/compare/:a/:b`; ChatDock hidden on genre pages |
| Client | ~50 genre components; `useGenreState` URL+localStorage authority; metaphors, Companion dock, Marathon, Export, Worlds map, Neighbor rail, Whisper, Zoom/era-thesis, Instrument Ink tokens (Cabinet/Geist, ghost numerals, etched rules) |
| Server | `genreExperienceService` + intro split + lazy insight; `skipAnchorLog` on insight path |
| Tests | Client ~68 `*.test.*` files under `client/src`; server ~22 under `server/test` (historical claim: 258 client / 111+ server — **re-run to confirm**, do not trust stale counts) |
| Ahead of main | Parent snapshot ~96 commits; review-era ~82–90. Branch tracks `origin/main`, **not** its own remote branch tip — push/`-u` needed before PR |

### Working tree hygiene (parent snapshot — re-check before Wave 0)

- Modified: `MarathonBuilder.tsx` (N7 watched-skip already present in file body — confirm whether dirty diff is substantive or whitespace)
- Untracked: plans (incl. this file + review), `.hermes/`, stray artifacts — **do not** sweep into PR via `git add -A`

### Doc drift (important)

| Doc claim | Code truth (2026-08-05) |
|-----------|-------------------------|
| Review header / §8 “fixes pending” | **Stale.** Defects are implemented in tree |
| Review §4 “all 16 resolved + gate green” | **Matches code shape**; test counts need fresh Daniel run |
| CONTEXT-TEMP “Wave A JSX broken” | **Stale.** `GenreExperience.tsx` fragment balance OK; CompanionPanel at index 0 in loading/error/success |
| UI refinement plan “Fraunces/Inter + blue glow” | **Partially superseded** — theme now Cabinet/Geist + warm gold radial; signature Wave 3 (needle-settle / particle field) not clearly present |

**Verdict:** Feature is **build-complete**. Unfinished work is **ship-complete** (verify → live QA → PR → merge), not another feature phase.

---

## 2. The blockers — verified status (update)

### Original “7 STILL-BLOCKING” (review §2)

| ID | Defect | Status 2026-08-05 | Evidence |
|----|--------|-------------------|----------|
| B1 / K3 | Anchor storm on bulk `/insight` | **FIXED** | `misc.ts` passes `skipAnchorLog`; `api.insight(..., skipAnchorLog)`; `GenreExperience` prefetch + decade path pass `true`; server tests `insightRoute.skipAnchorLog.test.ts` |
| B2 / K1 | `guided` no-op fiction | **FIXED** | No guided toggle / `openGuided` in `GenreExperience.tsx`; `guided.test.tsx` removed; mode pinned to `"self"` in comments. **Residue:** `GenreMode` / `ExperienceMode` still union `"guided"` |
| B3 / C2 | `libraryVersion` orphaned | **DROPPED** (by design) | No `libraryVersion` refs in client/server src; design marks C2 **DEFERRED** |
| B4 / C5 | Companion remount across slug | **FIXED** | `App.tsx` stable key `"genre"`; CompanionPanel first child in all branches; `genreRemount.test.tsx` |
| B5 / D7 | Topic filter unwired | **FIXED** | `onTopicSelect` passed from `GenreExperience` → `GenreModules` → `TopicCluster`; `GenreExperience.topic.test.tsx` |
| B6 / B2 | Eject-to-`/chat` CTA | **FIXED** | No “Explore with the Companion” button; `GenreExperience.eject.test.tsx` |
| B7 / B5 | Sound default ON + autoplay | **FIXED** | `sound.ts` `raw === null ? false`; mount cue gated by `getSoundEnabled()` |

### Expanded register (review §7) — also code-present

HIGH extras (N8, B6a) and MEDIUM/MINOR set (N1, B5b, N7, W4, N9, N4, N5, N6) all have corresponding implementations/tests in tree. Known **cosmetic residue only:**

- `ExportWorld.tsx` still uses `text-emerald-400/80` for saved state (W4 leak)
- `guided` remains in type unions (dead fiction type)
- Design contradictions (triple-narration; two accent owners) documented historically — accent mostly unified to `--world-accent`; narration still Whisper + Companion + intro hook by design intent (no code change required for merge unless Daniel objects)

**Corrected blocker count for this plan:** **0 still-blocking code defects.** **1 hard process blocker:** Daniel live browser review. **N soft ship risks:** dirty tree, branch not pushed, stale continuity docs, optional Instrument Ink Wave 3 polish.

---

## 3. Ordered waves → ship-ready merge

### Wave 0 — Working-tree honesty (15–30 min)

**Goal:** Know exactly what would enter a PR.

- [ ] **Step 0.1:** Daniel runs `git status` + `git diff` in the worktree (agents: do not run git per standing rule).
- [ ] **Step 0.2:** Classify every dirty/untracked path:
  - **Must ship:** feature code + tests under `client/` / `server/`
  - **Docs optional:** `docs/plans/*` (review intentionally untracked historically — decide keep-out vs commit CONTEXT-TEMP only)
  - **Never ship:** `.hermes/`, `client/vout.txt`, secrets, caches
- [ ] **Step 0.3:** If `MarathonBuilder.tsx` diff is only noise, discard; if substantive, keep and cover with existing `MarathonBuilder.test.tsx`.
- [ ] **Step 0.4:** Update this plan’s Wave 0 checkbox after classification.

**Verify:** Clean mental inventory — no surprise files in the eventual commit/PR.

---

### Wave 1 — Automated gate (Daniel runs)

**Goal:** Prove the tree is green *now*, not on 2026-07-16 memory.

- [ ] **Step 1.1 — Server tests**

```bash
cd "<worktree>"
npm run test --workspace server
```

Expected: all pass (historical ~111–113; accept current count).

- [ ] **Step 1.2 — Client tests**

```bash
npm run test --workspace client
```

Expected: all pass. Pay attention to: `genreRemount`, `GenreExperience.eject`, `.cue`, `.topic`, `.b6a`, `.b5b`, `NeighborRail`, `MarathonBuilder`.

- [ ] **Step 1.3 — Typecheck + build**

```bash
npm run typecheck
npm run build
```

Expected: exit 0 both.

- [ ] **Step 1.4 — Spot-grep regression (5 min, no server)**

Confirm still true:

| Check | Command / look for |
|-------|--------------------|
| K3 | `skipAnchorLog` in `misc.ts`, `api.ts`, GenreExperience prefetch |
| C5 | `App.tsx` key `"genre"`; CompanionPanel index 0 |
| B5 | `sound.ts` default `false` |
| N8 | NeighborRail `navigate(\`/genre/${slug}${location.search}\`)` |
| D7 | `onTopicSelect=` in GenreExperience |

**Verify:** Wave 1 green → proceed. Any red → **stop**; treat as a new defect (log 5–7 hypotheses, add logs, then fix) — do not open PR.

---

### Wave 2 — Live browser QA (Daniel; hard merge gate)

**Goal:** Close the only remaining checklist item from review §4 Post-fix.

Boot (Daniel):

```bash
cd "<worktree>"
# Kill stale :4000 / :5173 first (zombie-server lesson in CONTEXT-TEMP)
npm run dev
```

Manual checklist:

- [ ] `/genre` picker loads; open `/genre/documentary`
- [ ] **Sound:** first load silent with default prefs (no surprise cue)
- [ ] **K3:** load world; confirm taste/anchors not flooded (spot-check DB or behavior — no “everything suddenly anchored”)
- [ ] **TV deep-link:** `/genre/documentary?mediaType=tv` shows TV; Movies/TV toggle does not flash wrong default
- [ ] **N8:** from TV world, hop Neighbor rail → destination keeps `?mediaType=tv`
- [ ] **C5:** open Companion, start a reply, navigate `/genre/documentary` → another slug → panel stays open / stream not nuked
- [ ] **D7:** click topic spine → tags/filter change visible rail
- [ ] **B6a:** select decade → `#world-main` gains `zoomed-decade`; era-thesis appears (LLM or fallback)
- [ ] **N7:** Marathon on a TV world with watched seasons skips them (unless empty)
- [ ] **No eject:** no “Explore with the Companion” yank to `/chat`
- [ ] Compare `/compare/...` still reachable and sensible
- [ ] Reduced-motion OS setting: no hostile motion / sound still gated

**Verify:** Daniel says ship / lists nits. Nits → Wave 2b surgical fixes + re-run Wave 1 affected tests. No “looks fine, merge anyway” if C5/K3/sound fail.

---

### Wave 3 — Residue cleanup (only if Wave 1–2 green; keep tiny)

**Goal:** Remove known lint-level fiction / accent leak. Skip if Daniel wants PR *now*.

#### Task 3.1: Drop dead `guided` from types — **SUPERSEDED (2026-08-05 evening)**

**Reason:** G1 expanded — guided is product scope again. Types stay. Implement real branching per `2026-08-05-worlds-guided-mode-plan.md` (vertical slice started same session).

- [x] **Explicit supersession** — do not delete `guided` union members.

#### Task 3.2: ExportWorld accent residue — **DONE (2026-08-05)**

**Files:**
- Modify: `client/src/components/genre/ExportWorld.tsx` (saved-state class)

- [x] **Step:** Replaced `text-emerald-400/80` with `text-[var(--world-accent)]/80`.
- [ ] **Verify:** Daniel runs client tests / typecheck in Wave 1 (agents do not run npm).

#### Task 3.3: Continuity doc sync (no feature code) — **DONE (2026-08-05)**

**Files:**
- Modify: `docs/plans/2026-07-15-genre-experience-CONTEXT-TEMP.md` — banner → this finish plan
- Modify: `docs/plans/2026-07-15-worlds-v2-5axis-review.md` — header + §8 banner: historical; finish plan is truth

- [x] **Verify:** Docs only; no test impact.

---

### Wave 4 — Branch publish + PR

**Goal:** PR that Daniel can review on GitHub.

- [ ] **Step 4.1:** Ensure Wave 0 inventory committed (explicit paths only) — **only when Daniel asks to commit**.
- [ ] **Step 4.2:** Push branch with upstream (Daniel or agent-on-request):

```bash
git push -u origin HEAD
```

- [ ] **Step 4.3:** Open PR into `main` via `gh pr create` — title/body focused on Worlds immersive genre experience; link design + note live QA done; **no** “Generated with” trailer.
- [ ] **Step 4.4:** Blind-spot: PR should not include `.hermes/`, local caches, or `.env`.

**Verify:** PR URL exists; CI (if any) green; Daniel reviews diff size (~whole feature vs main — expect large).

---

### Wave 5 — Merge

- [ ] Daniel merges (squash or merge — his call; branch is long-lived feature).
- [ ] Delete worktree when done (optional hygiene).
- [ ] Archive CONTEXT-TEMP / mark Worlds ACTIVE closed in Aetherkeep working-memory **only if** Daniel wants vault update this session.

---

## 4. Explicit out-of-scope

| Item | Why out |
|------|---------|
| Re-fixing the original 7 blockers “from scratch” | Already in code; only reopen if Wave 1–2 fail |
| Wiring `libraryVersion` | Council DROP; design DEFERRED |
| ~~Building real `guided`~~ | **IN SCOPE** — see `2026-08-05-worlds-guided-mode-plan.md` |
| Full chat `contextBuilder` injection of guided session | **Done** (guided plan §9 / Task 6) — link conversation + RAG layer + watchlist mirror |
| Instrument Ink Wave 3 leftovers (needle-settle motion, seeded particle field) | Polish track; not merge-blocking; reopen only if Daniel prioritizes visual pass post-merge |
| Font *file* provisioning beyond current `fonts.css` | Separate workstream historically; Cabinet/Geist already wired |
| Broader Cuelume / Settings sound redesign | Separate ACTIVE note in Aetherkeep; Worlds only needs gated `playWorldCue` |
| Discover / Library / Chat / Settings redesign | Worlds-only track |
| Native per-metaphor engines (constellation/dread/frontier as unique engines ×6) | Deferred by design (a11y + font lock); 2 decorative backdrops only |
| OMDb scores without `OMDB_API_KEY` | Env limitation, not a Worlds defect |
| Auto-merge / deploy | Daniel only |
| **Film-noir empty (2026-08-05)** | **Fixed in worktree:** TMDB has no "Film Noir" genre — keyword discover + cache `v2:`. Empty/sparse (`<6`) shows one coherent **Cross the threshold** strip (SectionHead + posters + lexicon why + Add CTA) via neighbor `genreExperience` (crime/thriller) falling back to `api.search`. Verify sparse on `/genre/film-noir?mediaType=tv`. Movie mode fills ≥6 so empty strip hides. |

---

## 5. Success criteria (definition of done)

Ship-ready when **all** are true:

1. Wave 1 automated gate green (server test + **client** test + typecheck + build), including `guidedSession` + `GuidedTour` tests.
2. Wave 2 live QA checklist signed off by Daniel (especially K3, C5, sound, TV+N8, topic, no eject) **plus Guided tour path** (toggle → beats → shelf → watchlist → Companion prefill → reload restores).
3. Guided plan §7 success criteria met (mode branches ranking; no false-identical self/guided).
4. PR open against `main` without junk paths; no Generated-with trailer.
5. Daniel merges.

Optional but recommended before merge: CONTEXT-TEMP no longer claims broken JSX; facelift remains design-only until this merges.

---

## 6. Risks & open questions for Daniel

### Risks

1. **Stale “fixes pending” narrative** — agents may re-fix already-fixed defects and churn. Mitigate: this plan is truth; fail Wave 1 before rewriting.
2. **Root `npm test` false confidence** — does not run client Vitest. Always run workspace client tests.
3. **Zombie server on :4000** — live QA can validate old binaries. Kill port / confirm PID before trusting enrichment.
4. **Huge PR vs main** — review fatigue; consider walkthrough checklist (Wave 2) over line-by-line of every metaphor.
5. **Dirty `MarathonBuilder.tsx`** — unknown delta vs last commit; could be WIP polish. Classify in Wave 0.
6. **Branch tracking `origin/main`** — easy to mis-push; use `git push -u origin HEAD` on the feature branch name explicitly.
7. **C5 subtlety** — stable App key alone was insufficient historically; CompanionPanel must stay index 0 across loading branches. Remount test is the regression net — do not “simplify” that structure.

### Open questions

1. **Include Instrument Ink Wave 3 (needle/particles) in this PR or post-merge?** Recommendation: **post-merge** unless live QA feels visually unfinished.
2. **Commit the 5-axis review file** (historically untracked) or keep out of PR? Recommendation: keep out; ship this finish plan + optional CONTEXT-TEMP sync only.
3. **Squash vs merge commit** for ~96 commits? Daniel’s call — squash may be kinder to `main` history.
4. **Is dirty MarathonBuilder intentional WIP?** Need Daniel’s `git diff` read before Wave 3/4.
5. **Should `GenreMode` keep `"guided"` for API back-compat** with cached server keys, or is narrowing safe? Grep cache keys / persisted blobs before deleting the union member.

---

## 7. Self-review (plan quality)

| Spec ask | Covered? |
|----------|----------|
| Current state vs main | §1 |
| 7 blockers verified / updated | §2 (0 open code blockers) |
| Ordered waves to merge | §3 Waves 0–5 |
| Out-of-scope | §4 |
| Success / verify per wave | §3 + §5 |
| Risks & questions | §6 |

Placeholder scan: none intentional. No re-implementation code blocks for fixed defects (would encourage churn). Wave 3 has concrete file paths for residue only.

---

## Execution handoff

**Plan complete and saved to**  
`docs/plans/2026-08-05-worlds-finish-plan.md`  
(worktree: `.worktrees/immersive-curated-genre-specific-experie`).

**Two execution options (when Daniel says go):**

1. **Subagent-Driven (recommended)** — fresh subagent per wave/task; orchestrator re-runs gates; no git from subagents.
2. **Inline Execution** — same waves in one session with checkpoints after Wave 1 and Wave 2.

**Default next action:** Daniel follows `2026-08-05-worlds-daniel-ship-runbook.md` — Wave 0 + Wave 1 tonight; Wave 2 live QA = hard merge gate. Agents only if a gate fails.
