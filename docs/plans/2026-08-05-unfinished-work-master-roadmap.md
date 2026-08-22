# Lumina Unfinished Work — Master Roadmap

> **For agentic workers:** This is the **sequencing spine**, not a task-level build plan. Sibling deep plans own implementation detail. Parent merges siblings into this spine when they land.
>
> **REQUIRED at execution time:** `superpowers:subagent-driven-development` (or `executing-plans`) per track — never one grab-bag agent across Worlds + facelift + sound.

**Goal:** Clear Lumina's unfinished parallel tracks into one ordered path with explicit Daniel gates, so execution does not collide across worktrees, design, and `main`.

**Architecture:** Three product tracks (Worlds finish → Facelift implement → Sound reconcile) plus a low-collision backlog (critics gaps, labs). Design/docs work may run **ahead of** merge; **UI chrome / tokens / sound ownership** must serialize around the Worlds merge.

**Tech Stack:** React 19 + Vite + Tailwind 4 (client), Express 5 + better-sqlite3 (server), local-first SQLite, OpenRouter companion — see repo `CONTEXT.md` / `IDEA.md`.

**Date:** 2026-08-05 · **Mode:** Plan only · **No code / no git in this pass**

---

## Sibling plans (parent merges when ready)

| Track | Deep plan file |
|-------|----------------|
| Worlds finish | [`.worktrees/…/docs/plans/2026-08-05-worlds-finish-plan.md`](../../.worktrees/immersive-curated-genre-specific-experie/docs/plans/2026-08-05-worlds-finish-plan.md) — **lives in Worlds worktree only** (not yet copied to main `docs/plans/`) |
| Worlds **guided mode** (G1 expanded) | [`.worktrees/…/docs/plans/2026-08-05-worlds-guided-mode-plan.md`](../../.worktrees/immersive-curated-genre-specific-experie/docs/plans/2026-08-05-worlds-guided-mode-plan.md) — architecture + vertical slice; **ship blocked on guided MVP+rich UX** |
| Worlds Daniel ship runbook | [`2026-08-05-worlds-daniel-ship-runbook.md`](./2026-08-05-worlds-daniel-ship-runbook.md) (+ copy in Worlds worktree `docs/plans/`) — Wave 0–4 commands/checklists |
| Anti-slop facelift resume | [`2026-08-05-anti-slop-facelift-resume-plan.md`](./2026-08-05-anti-slop-facelift-resume-plan.md) |
| Facelift Ω3 (motion/copy/waves) | [`2026-08-05-anti-slop-facelift-omega3.md`](./2026-08-05-anti-slop-facelift-omega3.md) |
| Facelift full design spec | [`2026-08-05-anti-slop-facelift-design-spec.md`](./2026-08-05-anti-slop-facelift-design-spec.md) |
| Sound / critics / lab backlog | [`2026-08-05-sound-critics-and-lab-backlog-plan.md`](./2026-08-05-sound-critics-and-lab-backlog-plan.md) |
| Plan review (Aug 5) | [`2026-08-05-plan-review-notes.md`](./2026-08-05-plan-review-notes.md) |

**Merge rule:** Sibling plans may refine task lists, file paths, and blocker status. They must **not** silently change tier or sequence without updating §2–§3 here.

**Reconciliation (2026-08-05 plan review):** Worlds finish plan re-verified code — original **7 review blockers are FIXED / DROPPED in the worktree**. Review doc `2026-07-15-worlds-v2-5axis-review.md` §8 “fixes pending” is **stale**. Phase 2 is ship-verify → live QA → PR → merge, **not** “re-fix the 7.”

---

## Global Constraints

- `main` is clean and synced with `origin/main` (standing Aug 5) — treat trunk as sacred; land via PR/merge after gates.
- Daniel runs all `npm run dev`; agents never start servers — ask for port.
- No auto-commit / no push unless Daniel explicitly asks.
- Quality bar: elevate-never-dull (`.impeccable.md`); no purple SaaS slop; gold earned not inflated.
- Sound + reduced-motion policy must stay single-owner (`client/src/lib/sound.ts` pattern) — do not fork policies across Worlds and main.
- Prefer worktree-local fixes → rebase/merge → delete worktree over long-lived dirty labs.

---

## 1. Inventory of unfinished tracks

### P0 — Critical path (product gravity / merge risk)

| ID | Track | State (known Aug 5) | Why P0 |
|----|--------|---------------------|--------|
| **W** | Immersive Worlds finish | **G1 = A expanded (2026-08-05 evening).** Worktree `.worktrees/immersive-curated-genre-specific-experie`, branch `immersive-curated-genre-specific-experience`, **~96 ahead / 0 behind** `main`; dirty `MarathonBuilder.tsx` + untracked plans; **0 open code blockers** (B1–B7 FIXED/DROPPED). Wave 0–2 still required, **but ship-as-is after Wave 0–2 is insufficient** — Worlds v2 must include **real guided mode** (feature-rich UX, DB ↔ app ↔ user interactions). Also investigating companion chat streaming garbage-before-message on `localhost:5173`. Remaining: guided mode + stream fix (siblings) → Daniel Wave 0–1 ([runbook](./2026-08-05-worlds-daniel-ship-runbook.md)) → live QA (incl. guided) → PR → merge. Wave 3: ExportWorld accent done; prior `guided` type-skip **superseded** (guided back in scope) | Largest unfinished feature; owns genre chrome, companion dock, guided mode, **and in-branch sound cues** — blocks clean trunk story |
| **F-gate** | Facelift Run 3 verify | **G2 = absorb (2026-08-05)** — Gate A cleared; Ω3 + full design spec drafted; Gates B/C/D need Daniel skim; **no implementation yet**; context in `.impeccable.md` + transcript `5e1fc460-…` | Design skim remaining; *code* still blocked on B–D + Gate W |

### P1 — Next wave (depends on gates / merge)

| ID | Track | State | Why P1 |
|----|--------|-------|--------|
| **F-impl** | Anti-slop facelift implementation | Scope B locked (archive-backed projection booth; Fraunces/Public Sans/JetBrains; elevate-never-dull); token-first then parallel surfaces | App-wide tokens/surfaces — **collides with Worlds UI** if coded before Worlds merge |
| **S** | Cuelume sound | Main: plan-only at `2026-07-12-cuelume-sound-plan.md`, Waves A→D, **Daniel-gated**. Worlds worktree: `sound.ts` present; **B7 FIXED** (default OFF + mount gated by `getSoundEnabled()`). Full app cue matrix still not claimed shipped | After Worlds merge: reconcile Worlds module vs main Waves A–D — **do not dual-implement** |
| **WT** | Worktree / lab cleanup | 6 registered worktrees + 1 orphan dir; stale/behind tips; untracked ADR/plans in labs | Cognitive load + merge footguns; cleanup after merge intent clear |

### P2 — Backlog (low collision; ship anytime after P0 path chosen)

| ID | Track | State | Why P2 |
|----|--------|-------|--------|
| **C** | Critics follow-ups | Shipped `ed66bfd` era; gaps: per-title force-refresh; unseen titles still lazy-only; OMDb gaps by design | Small, mostly TitleDetail/Settings — low merge collision |
| **R** | Recommendation scoring funnel | Worktree `recommendation-system-upgrade`: untracked ADR labeled **0004** (**Proposed**) — **number collision** with main ADR-0004 (ignore); renumber to **0010+** before promote | Needs ADR approve + renumber before build |
| **T** | Lumina's Take loading bloom | Worktree `improvement-of-luminas-take`: untracked design/plan | Visual polish; can wait for facelift tokens |
| **V** | In-app viewing exploration | Worktree +5/−31 + orphan name-collision dir | Speculative; do not block P0 |
| **AF** | Anti-fatigue leftovers | Plans/ADRs on main partially shipped historically — sibling backlog confirms remaining gaps | Verify before reopening |

**Not unfinished product (do not schedule as features):** vault docs refresh (this roadmap + WM update), transcript archaeology (already done Aug 5).

---

## 2. Recommended sequence (with WHY)

```
Phase 0  Daniel decision gates (≤30 min human)
    │
    ├─► Phase 1a  Facelift design resume (Ω3 → full spec)     [PARALLEL OK]
    ├─► Phase 1b  Worlds ship-ready (Wave 0–1 prep; optional Wave 3 residue) [PARALLEL OK w/ design]
    └─► Phase 1c  Worktree inventory decisions               [PARALLEL OK]
    │
Phase 2  Worlds: verify green → Daniel live QA → PR → MERGE   [SERIAL — CRITICAL PATH]
    │
Phase 3  Facelift implementation on post-Worlds main            [SERIAL after merge]
    │
Phase 4  Sound reconcile (main Waves A–D ↔ Worlds sound.ts)     [AFTER Worlds; may overlap late facelift if files disjoint]
    │
Phase 5  Critics gaps + lab ADR/plans (R, T, V, AF)             [PARALLEL OK with late 3–4]
```

### Why this order

1. **Worlds before facelift code**  
   Worlds is ~96 commits of genre experience, companion panel, motion, accent tokens, sound cues. Facelift is app-wide chrome/tokens/surfaces. Coding facelift on `main` while Worlds is still out-of-tree guarantees a painful merge (both rewrite the same aesthetic layer).  
   **Exception:** Facelift *design* (Run 3 → Ω3 → written spec) runs in Phase 1a with **zero code** — no collision.

2. **Sound after Worlds merge**  
   Worlds already ships a `sound.ts` with B7 policy fixed (default OFF). Main vault still says “plan only, gated” for full Cuelume matrix. Dual implementation creates two policies. Merge Worlds → one reconcile pass against `2026-07-12-cuelume-sound-plan.md` (absorb + extend vs rewrite — G3).

3. **Critics / labs last or parallel-late**  
   Critics gaps are TitleDetail/API-shaped; labs are ADR/plan approval. They do not unblock Worlds or facelift. Do them when Daniel wants small wins without touching the critical path.

4. **Worktree cleanup after merge intent**  
   Deleting/archiving labs before Worlds merge risks losing untracked plans. Inventory in Phase 1c; **physical cleanup** after Worlds lands (or after Daniel marks a lab abandoned). Doc rescue (loading-bloom, recs ADR renumber) is parallel-safe now.

### Explicit anti-patterns

- Do **not** start facelift implementation on `main` while Worlds worktree is still the source of truth for genre/companion chrome.
- Do **not** re-implement the original 7 Worlds blockers unless Wave 1–2 gates fail (finish plan is truth; review §8 is stale).
- Do **not** implement Cuelume Waves A–D on `main` until Worlds sound ownership is decided (absorb vs rewrite).
- Do **not** open three execution agents that all edit `App.tsx` / theme tokens / `sound.ts` in parallel.

---

## 3. Decision gates (Daniel required)

| Gate | Question | Blocks | Suggested answers |
|------|----------|--------|-------------------|
| **G1 — Worlds merge intent** ✅ **= A expanded (2026-08-05 evening)** | Run ship-ready path (verify + live QA + PR + merge full Worlds), park the branch, or ship a reduced slice? | Phase 2 scope; whether facelift waits | **Decided: ship-ready → merge full Worlds**, and ship-ready **includes real guided mode** (feature-rich UX, DB ↔ app ↔ user) — not Wave 0–2 alone. 0 open B1–B7 code blockers still stand; live QA + guided completeness are the hard gates. Also: investigate companion stream garbage-before-message (`:5173`). Runbook: [`2026-08-05-worlds-daniel-ship-runbook.md`](./2026-08-05-worlds-daniel-ship-runbook.md) |
| **G2 — Facelift Run 3 verify** ✅ **= absorb (2026-08-05)** | Absorb P0++ / P1+ deepeners from Run 3 cut, tweak, or veto? (= Facelift Gate A) | Facelift Gate A / inventory | **Decided: absorb** — Ω3 + design spec drafted; Daniel skim B/C/D; no code until Worlds merge |
| **G3 — Sound go** | After Worlds merge: absorb Worlds `sound.ts` + extend to main Waves A–D matrix, rewrite from main plan, or postpone? | Phase 4 | Default: **absorb Worlds module (B7 already fixed) + extend cues to plan matrix**; OFF default / reduced-motion / no error-destructive sound |
| **G4 — Worktree cleanup** | Keep / archive / delete: viewing exploration, recs upgrade, luminas-take×2, what-the-llm-knows, orphan dir? | Phase 1c→5 hygiene | Keep Worlds until merge; mark others **archive-or-delete** unless Daniel names one as next feature |
| **G5 — Critics now vs later** | Ship force-refresh + any UX gaps as a quick P2 PR, or fold into facelift TitleDetail pass? | Phase 5 timing only | Either fine; default **later** unless Daniel wants a small win |

**G1 + G2 cleared 2026-08-05** (G1 scope expanded evening — guided mode required). Next human gates: G3–G5 as needed. Phase 1 unlocked: facelift design ∥ Worlds Wave 0–1 + guided/stream siblings.

---

## 4. Suggested agent-team shape (EXECUTION later — not now)

Orchestrator stays parent. Split by **independent I/O / domain** ([multitask-orchestration](D:\Aetherkeep\07-patterns\multitask-orchestration.md)). One coherent worker per track unless a track itself parallelizes waves.

### Phase 2 — Worlds ship-ready

| Role | Subagent / skill | Owns |
|------|------------------|------|
| Gate runner / triage | shell + **verification-before-completion** | Wave 1 commands (Daniel runs); only open fix tasks if a gate fails |
| Residue / guided | Implementer(s) — siblings | Wave 3: ExportWorld accent **done**; doc banners **done**; **guided mode now in G1 scope** (supersedes earlier type-skip) — **not** re-fix B1–B7; companion stream garbage separate investigate |
| Spec fidelity | `plan-reviewer` if Wave 1–2 fail | Treat failures as **new** defects; log 5–7 hypotheses before rewrite |
| UI feel spot-check | `frontend-ultimate` + impeccable `/audit` or `/critique` | Optional post–live-QA polish; Instrument Ink Wave 3 = post-merge unless Daniel prioritizes |
| Skills | `karpathy-guidelines`, Worlds finish plan as law | No speculative refactors; no `git add -A` |

### Phase 1a / 3 — Facelift

| Role | Subagent / skill | Owns |
|------|------------------|------|
| Design resume | brainstorming + impeccable (`frontend-design`, `/typeset`, `/colorize`, `/animate`) | Ω3 → complete design spec (no code) |
| Token wave | `frontend-ultimate` | Theme tokens, type, surfaces |
| Surface waves | Parallel surface agents **after** tokens land | Discover / Library / TitleDetail / Chat — file-disjoint |
| Anti-slop gate | impeccable `/critique` + `/distill` | Elevate-never-dull check before merge |
| Skills | `.impeccable.md`, `design-taste-frontend`, `ui-animation` | Honor locked Scope B |

### Phase 4 — Sound

| Role | Subagent / skill | Owns |
|------|------------------|------|
| Single owner | One implementer | `client/src/lib/sound.ts` + Settings + cue matrix from plan |
| A11y check | `accessibility-compliance` or harden skill | reduced-motion / mute policy |
| Skills | Existing `2026-07-12-cuelume-sound-plan.md` as law | No new cue invention without Daniel |

### Phase 5 — Critics + labs

| Role | Subagent / skill | Owns |
|------|------------------|------|
| Critics | Small TDD implementer | Force-refresh + contract tests; read Aetherkeep `critics-api-contract.md` |
| Labs triage | explore agent | ADR-0004 approve packet; loading-bloom plan promote-or-delete; orphan worktree removal **after Daniel G4** |
| Skills | `writing-plans` only if ADR approved | Do not build Proposed ADRs |

**Never for execution:** one agent “do all unfinished Lumina work.”

---

## 5. Dependency / collision matrix

| If changing… | Collides with… | Rule |
|--------------|----------------|------|
| Worlds genre chrome / CompanionPanel / App route keys | Facelift chat + shell | Facelift **code** waits for Worlds merge |
| Worlds `sound.ts` + world open cues (B7 fixed in-branch) | Main Cuelume plan (full matrix still gated) | One reconcile after merge (G3): absorb+extend vs rewrite |
| Facelift tokens / type / gold | Entire client | Land on post-Worlds `main` or rebase Worlds first |
| Critics TitleDetail pills | Facelift TitleDetail | Prefer critics after facelift TitleDetail wave, **or** tiny force-refresh only (API) anytime |
| Recs ADR / Take bloom | Facelift Discover | Park until facelift tokens exist |

---

## 6. Aetherkeep refresh task

- [x] Update `D:\Aetherkeep\04-claude\working-memory.md` Lumina section (this planning pass) — **done in same session as this roadmap**
- [ ] After sibling plans land: parent paste 3–5 line “deep plan pointers” under each track in WM (optional)
- [x] After G1–G2 answered: logged in `D:\Aetherkeep\04-claude\decisions-log.md` (G3 still open)
- [ ] After Worlds merge: archive Worlds session state under `D:\Aetherkeep\06-projects\lumina/` (new note; critics notes already there)

**Stale-since-2026-07-12 cleared** by WM update dated 2026-08-05 pointing at this file.

---

## 7. Success criteria for “planning complete”

1. This spine exists at `docs/plans/2026-08-05-unfinished-work-master-roadmap.md`
2. Three sibling deep plans linked (or explicitly marked missing until parent merge)
3. Daniel can answer G1–G4 without reading code
4. Execution team shape is copy-pasteable into a Multitask launch
5. Aetherkeep Lumina WM no longer claims “sound plan only” as the sole active Lumina item without Worlds/facelift context

---

## 8. Assumptions (explicit)

1. Worlds finish plan (2026-08-05, worktree) is authoritative for blocker status: **0 open code blockers**; 2026-07-15 review §8 is historical/stale. Reopen only if Wave 1–2 fail.
2. Facelift has **no** implementation branch; resume = design verify → spec → then code on `main` post-Worlds.
3. Sound on `main` is plan-only; Worlds branch already contains `sound.ts` with B7 fixed — spine assumes **reconcile after merge** (not “fix B7 on main”).
4. Critics remain “shipped + small gaps,” not a rewrite.
5. Daniel still prefers: no agent-started dev servers; no auto-commit; Multitask = parallel independent streams.
6. Parent will merge sibling plan details into §1–§2 without changing the phase order unless a sibling proves a hard dependency reverse (unlikely).
7. Recs scoring ADR in worktree labeled `0004` **collides** with main ADR-0004 (ignore) — must renumber to **0010+** before landing on main.

---

## Next action (human)

**G1 = A expanded / G2 = absorb** locked. Worlds v2 needs **real guided mode** before merge (not ship-as-is after Wave 0–2); companion stream garbage-before-message under investigation (siblings). Facelift design package drafted (Ω3 + full spec + consolidated Ω2) — **Daniel skim Gates B/C/D**. Worlds: guided + [`2026-08-05-worlds-daniel-ship-runbook.md`](./2026-08-05-worlds-daniel-ship-runbook.md) Wave 0 → Wave 1 → Wave 2. No facelift *code* until Worlds merge (Gate W) + B–D clear.
