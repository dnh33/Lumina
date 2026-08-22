# Plan Review Notes — Lumina Unfinished-Work Package

**Date:** 2026-08-05 · **Mode:** Plan review only · **Reviewer:** plan-reviewer (Rune orchestration)  
**Scope:** Master roadmap + facelift resume + sound/critics/lab backlog + Worlds finish (worktree)

---

## Verdict

**Package is sequencing-ready.** G1 + G2 answered 2026-08-05: **G1 = A** (ship-ready → merge), **G2 = absorb** (Run 3 P0++/P1+ into design).  
Architecture and collision rules are sound. The critical inconsistency (master assuming “7 open Worlds blockers” vs Worlds finish plan “0 open / ship-verify”) is **reconciled in the master roadmap** as of this review.

Worlds execution = verify/QA/PR path — **not** re-implementing B1–B7. Facelift *code* still waits for Worlds merge; design may resume now.

---

## Must-fix (done or remaining)

| # | Issue | Status |
|---|--------|--------|
| M1 | Master P0/Phase 2/G1 still said “fix 7 blockers” | **Fixed** in `2026-08-05-unfinished-work-master-roadmap.md` |
| M2 | Master linked Worlds plan as `./2026-08-05-worlds-finish-plan.md` on main — file exists **only in worktree** | **Fixed** — link points at worktree path |
| M3 | Master Sound / G3 still framed “B7 fix” as open work | **Fixed** — B7 FIXED in worktree; G3 = absorb+extend vs rewrite vs postpone |
| M4 | Aetherkeep WM still says “~96 ahead / 7 historical blockers” (ambiguous) | **Patch WM** to “0 open code blockers; ship-verify” |
| M5 | Facelift Gate W / master G1 naming dualism | **Documented** — same decision; use master **G1** as canonical ID |
| M6 | ADR-0004 collision (recs scoring vs ignore) | **Flagged** in backlog + master assumption §8.7 — do not land without renumber |

---

## Cross-plan contradictions (resolved or accepted)

### Worlds blockers

| Source | Claim |
|--------|--------|
| Review `2026-07-15-worlds-v2-5axis-review.md` §8 | Fixes pending (stale) |
| Master roadmap (pre-review) | 7 still-blocking |
| Worlds finish plan | **0 still-blocking**; B1–B7 FIXED/DROPPED; hard gate = Daniel live QA |
| Spot-check | `sound.ts` default OFF (`raw === null ? false`) |

**Truth:** Worlds finish plan. Agents must not re-fix B1–B7 unless Wave 1–2 fail.

### Sound on Worlds vs main

| Source | Claim |
|--------|--------|
| Facelift §5 / Sound backlog | Main = plan-only, gated |
| Worlds finish | In-branch `sound.ts`; B7 fixed; broader Cuelume out of scope |
| Master (post-fix) | Merge first → G3 reconcile |

**Accepted tension:** not a contradiction — **ownership serialize**. Do not run Sound Waves B–C on `main` while Worlds owns `sound.ts`.

### Facelift vs Worlds merge

Aligned: design parallel OK; **code after Worlds merge** (or park Worlds). Facelift Gate W ≡ master G1.

### Priority / ADR

Backlog correctly outranks nothing over Worlds/Facelift. Recs ADR must renumber **0010+**.

### Gate ID map

| Master | Facelift | Meaning |
|--------|----------|---------|
| G1 | W | Worlds merge / park / slice |
| G2 | A | Run 3 verify |
| G3 | S | Sound go / policy |
| G4 | — | Worktree cleanup |
| G5 | — | Critics now vs later |
| — | B–E | Facelift design/spec/execute (after G2) |

---

## Architecture review (top issues)

### Issue 1 — Worlds is build-complete, not defect-complete

**Problem:** Treating Phase 2 as “fix blockers” burns tokens and risks regressions on already-tested remount/anchor/sound paths.

**Options:**
- **A (recommended):** Ship-ready waves 0→5 per Worlds finish plan; code only on gate failure or optional Wave 3 residue.
- **B:** Re-audit all 7 blockers from scratch (high effort, high churn risk).
- **C:** Do nothing / leave stale narrative (agents will re-fix).

**Decided:** **G1 = A** (ship-ready+merge).

### Issue 2 — Dual aesthetic owners until merge

**Problem:** Worlds (Cabinet/Geist, world-accent) vs Facelift (Fraunces/Public Sans/JetBrains, archive booth) both claim chrome/tokens.

**Options:**
- **A (recommended):** Serialize — Worlds merge → facelift tokens on post-Worlds `main`; facelift design may proceed now.
- **B:** Park Worlds; facelift code on current `main`.
- **C:** Parallel code on both branches (high merge pain).

**Decided:** G1 = A ⇒ Issue 2 Option A (serialize; design now, code post-merge).

### Issue 3 — Sound module already exists in Worlds

**Problem:** “Start Wave A on main” would fork `sound.ts`.

**Options:**
- **A (recommended):** After merge, absorb Worlds module; extend to Cuelume matrix; keep OFF default / reduced-motion silence.
- **B:** Rewrite from main plan after merge (discard Worlds cues).
- **C:** Postpone Sound indefinitely (Worlds cues only).

**Ask:** Prefer **G3 = A** when the time comes? (Can defer answering until post-merge.)

---

## Sequencing / collision review

| Parallel now (safe) | Must wait |
|---------------------|-----------|
| Facelift Gate A→D design (no code) | Facelift W0+ code |
| Worlds Wave 0 inventory (Daniel git) + Wave 1 (Daniel tests) | Facelift touching `theme.css` / Shell while Worlds mid-merge |
| Lab doc rescue + orphan dir delete (after G4) | Sound B–C on TitleDetail/useChat |
| Critics C1 **server** force flag only | Critics TitleDetail UI if Worlds/facelift touch same file |

**Anti-pattern already named correctly:** three agents on `App.tsx` / tokens / `sound.ts`.

---

## Test / verify gates (opinionated)

| Track | Gate | Owner |
|-------|------|-------|
| Worlds | `npm run test --workspace server` **and** `--workspace client` + `typecheck` + `build` | Daniel |
| Worlds | Live QA checklist (finish plan Wave 2) — **hard merge gate** | Daniel |
| Facelift | Design Gates A–D before any code; then per-wave client typecheck/build | Daniel + design agent |
| Sound | Per-wave typecheck/build + plan §7 QA; fail wave if error/destructive sounds | After G3 |
| Critics C1 | TTL vs force tests; no `tomatoes=true` | Implementer |

**Risk:** Root `npm test` ≠ client Vitest — Worlds finish plan already warns; keep that in every execution brief.

---

## Code quality / over-under engineering

- Worlds Wave 3 residue (`guided` type, emerald ExportWorld) = correctly optional — **engineered enough**.
- Facelift inventing Ω3 before Gate A = **over-eager**; resume checklist Step 1 is right.
- Sound backlog pointing at canonical plan (not rewriting Waves A–D) = **correct DRY**.
- Re-implementing fixed Worlds blockers = **under-informed churn** — banned by finish plan + updated master.

---

## Recommended first Daniel decisions

1. **G1** ✅ **= A** — Worlds ship-ready → merge (2026-08-05).
2. **G2** ✅ **= absorb** — Run 3 P0++/P1+ into design (2026-08-05).
3. Optional tonight: **G4** orphan viewing dir delete + loading-bloom doc rescue (parallel-safe).
4. Defer **G3** until after Worlds merge unless you want Wave A-only policy freeze now.
5. Defer **G5** Critics UI unless you want a small win; server force flag can wait for TitleDetail quiet.

---

## Ready to execute?

| After… | You may… |
|--------|----------|
| G1 = A ✅ | Daniel: Worlds Wave 0 + Wave 1; agents only if red or Wave 3 |
| G2 = absorb ✅ | Facelift design package drafted (`omega3` + `design-spec`) — skim B/C/D; **no code** |
| G1 merge done + G2–D clear | Facelift implementation plan + code |
| G3 | Sound Waves on post-Worlds trunk |
| G4 | Physical worktree cleanup |

**Bottom line:** G1+G2 cleared. Phase 1 unlocked. Do not start facelift or sound *product code* before Worlds merge / G3.

---

## Aetherkeep follow-ups

- Update Lumina ACTIVE WM: blockers = 0 open; Phase 2 = ship-verify; Worlds plan path = worktree. **+ G1=A / G2=absorb noted.**
- G1–G2 → `decisions-log.md` ✅ (G3 still open).
- Optional: ask Rune whether to persist this review as a durable pattern under `07-patterns/` (stale-review vs finish-plan truth).
