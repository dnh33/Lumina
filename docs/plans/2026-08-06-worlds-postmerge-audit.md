# Worlds — Post-merge unfinished-work audit

**Date:** 2026-08-06  
**Auditor:** Rune (retry pass — prior agent unavailable)  
**Main HEAD:** `b8b7522` — `Merge pull request #4 from dnh33/immersive-curated-genre-specific-experience`  
**Main vs `origin/main`:** 0 ahead / 0 behind  
**Open PRs:** none  
**Law:** Mode-split B packing **CLOSED**. No servers started. No git commit/push.  
**Canvas:** [`worlds-postmerge-audit.canvas.tsx`](C:/Users/Danie/.cursor/projects/c-Users-Danie-Documents-Claude-Projects-Lumina/canvases/worlds-postmerge-audit.canvas.tsx)

Validation root = **main checkout** (`C:\Users\Danie\Documents\Claude\Projects\Lumina`), not the immersive worktree tip.

---

## Executive snapshot

PR #4 Worlds is on `main`. The immersive worktree tip (`999ea78`) is an **ancestor of main** (behind by the merge commit only) — **safe to delete** once QA PNG clutter is discarded. Five other registered worktrees are **stale ancestors** of main except **`/watch` exploration** (5 unique commits, no remote, never merged) — **merge or salvage**. One orphan folder under `.worktrees\` is **not** a git worktree.

Findings from Emil / inventory / adversarial / pre-merge / claim-loop / follow-up overview were re-checked on main code. **Claim loop + adversarial P0s + dial→shelf sync + Library `?status=` are SOLVED.** Soft leftovers (Emil P1 press/needle/rise, N× peek fan-out, durable Pass, Mood/Archive habit, export notes reader, deepen invalidate, GenreExperience extract) remain **OPEN**. Inventory’s “Library ignores `?status=`” is **OBSOLETE** (fixed pre-merge, still on main).

| Count | Status |
|------:|--------|
| **16** | OPEN |
| **12** | SOLVED |
| **4** | PARTIAL |
| **6** | OBSOLETE |

**Revised top 3 PRs (OPEN only):** (1) Emil taste P1 · (2) Hub batch peek · (3) Deepen acts / guided-session invalidate — same order as follow-up overview; all three still legitimate against main.

---

## Worktree table

`git worktree list` from main (7 registered) + 1 non-worktree orphan under `.worktrees\`.

| Path | Branch | Remote tracking | vs `origin/main` (behind / ahead) | Dirty? | Open PR? | Unfinished signal | Verdict |
|------|--------|-----------------|----------------------------------:|--------|----------|-------------------|---------|
| `C:\Users\Danie\Documents\Claude\Projects\Lumina` | `main` | `origin/main` | 0 / 0 | Yes — **untracked** plans, roast PNGs, `.agents/`, `.tmp-pre-pr4-sync-docs/`, `skills-lock.json` (no tracked diffs) | — | Active post-merge planning surface | **active** |
| `…\.worktrees\immersive-curated-genre-specific-experie` | `immersive-curated-genre-specific-experience` | `origin/immersive-curated-genre-specific-experience` @ `999ea78` | 1 / 0 | Yes — ~44 untracked QA PNG/dirs only | **#4 MERGED** 2026-08-06 | Tip = pre-merge harden commit; **ancestor of main**; no unique commits | **safe to delete** |
| `…\.worktrees\exploration-of-implementation-of-viewing` | `exploration-of-implementation-of-viewing-content-inside-the-app` | *(none)* | 130 / **5** | Yes — 2 untracked cc-watch docs | none | Unmerged `/watch` feature (~932 LOC: `Watch.tsx`, player, `server/routes/watch.ts`) | **merge or salvage** |
| `…\.worktrees\improvement-of-luminas-take` | `improvement-of-luminas-take` | *(none)* | 99 / 0 | Yes — bloom design/plan untracked | none | HEAD `9f8b4a1` **ancestor of main**; only local bloom docs | **safe to delete** (copy bloom plans first if wanted) |
| `…\.worktrees\luminas-take-improvement` | `luminas-take-improvement` | `origin/luminas-take-improvement` | 138 / 0 | Clean | **#2 MERGED** 2026-07-12 | Ancestor; PR fully in history | **safe to delete** |
| `…\.worktrees\recommendation-system-upgrade` | `recommendation-system-upgrade` | *(none)* | 130 / 0 | Yes — `docs/adr/0004-…` untracked | none | Ancestor; leftover ADR draft | **safe to delete** (salvage ADR if not on main) |
| `…\.worktrees\what-the-llm-knows-about-me` | `what-the-llm-knows-about-me` | *(none)* | 99 / 0 | Clean | none | Same tip as `improvement-of-luminas-take` (`9f8b4a1`); ancestor | **safe to delete** |
| `…\.worktrees\exploration-of-implementation-of-viewing-content-inside-the-app` | *(not a worktree)* | — | — | Empty dir + `.webclone-ref` only | — | Orphan folder; no `.git`; not in `git worktree list` | **safe to delete** |

### Special note — immersive / PR #4

- PR [#4](https://github.com/dnh33/Lumina/pull/4) merged to `main` at `b8b7522` (2026-08-06).
- Worktree HEAD `999ea78` (`fix(worlds): harden guided peek, resume, and session validation`) is **fully contained** in main (`merge-base --is-ancestor` → true). Ahead of main: **0**. Behind: **1** (the merge commit itself).
- Dirty state is QA evidence only (`docs/plans/_claim-loop-dod/`, `_wave*-squint/`, `qa-*.png`, etc.) — not product code.
- Remote branch may still exist for historical reference; product work does **not** need this worktree.
- **Verdict: safe to delete** after optional copy of any QA shots not already under main `docs/plans/`.

---

## Findings register

Status key: **OPEN** = still legit on main · **SOLVED** = fixed/shipped · **PARTIAL** = half-true · **OBSOLETE** = wrong/superseded / do not chase.

### A. Claim loop & pre-merge hardenings (baseline)

| ID | Description | Source | Status | Evidence on main | Recommended action |
|----|-------------|--------|--------|------------------|--------------------|
| F01 | Claim-loop DoD rows 1–9 complete | claim-loop DoD | **SOLVED** | DoD PASS; PR #4 on main; GuidedTour bag + Library path | Do not re-open as product debt |
| F02 | Library ignores `?status=watchlist` | inventory / claim-loop note / adversarial P0-C | **SOLVED** | `Library.tsx` init + `useEffect` on `searchParams`; `selectStatus` writes query | Drop from OPEN lists; inventory text is stale |
| F03 | Self Pass wiped Featured (no successor thesis) | adversarial P0-A | **SOLVED** | `GenreModules` `fallbackThesisFromItem` comment + Pass advance path | Keep regression tests; no follow-up |
| F04 | Guided peer poster navigated to `/title/…` | adversarial P0-B | **SOLVED** | GuidedTour poster activate-only; Open owns navigate | Keep regression tests |
| F05 | Hub peek created empty sessions | PR4 live QA #1 | **SOLVED** | `guidedSessionPeek` + server peek without create | Residual = fan-out count only (F12) |
| F06 | TV Resume + `mediaType` | PR4 #2 | **SOLVED** | GenrePicker resume map; peeks movie-then-TV | Done |
| F07 | Enter Self vs Resume Guided split | PR4 #3 | **SOLVED** | Enter `mode=self`; Resume `mode=guided` | Done |
| F08 | Era inherit Self↔Guided | PR4 #4 · DoD #8 | **SOLVED** | Experience / `guidedStage` era preference path | Done |
| F09 | Dial reweight → stale shelf / act 400 | PR4 P1 | **SOLVED** | `GuidedTour.syncShelfAfterDial` present (~266+) | Done |
| F10 | Conversation link + curated slug allowlist | follow-up “already shipped” | **SOLVED** | `guidedSessionService` + `worldSlug` on main | Done |
| F11 | Tonight bag / Claim handoff missing | blind-angles Must #1 | **SOLVED** | `tonightBag` + bag UI + `libraryWatchlistPath()` | Blind-angle doc pre-dates bag; treat as historical |
| F12 | Hub fires N× `guided-session?peek=1` | PR4 live QA note · follow-up PR-B | **OPEN** | `GenrePicker` `useQueries` over `ATLAS_SLUGS` (~359–365); still one GET per slug | **PR-B** batch peek |
| F13 | Self Featured Watchlist/Pass missing | blind-angles Must #5 / #8 | **SOLVED** | `GenreModules` `featured-claim-actions` Watchlist/Pass | Done |

### B. Soft leftovers (explicit ask)

| ID | Description | Source | Status | Evidence on main | Recommended action |
|----|-------------|--------|--------|------------------|--------------------|
| F20 | GenreExperience god-page (~1100+ LOC) | follow-up PR-C | **OPEN** | `GenreExperience.tsx` ≈ **1116** lines | **PR-C** after taste PRs; behavior-neutral extract |
| F21 | Hub batch peek | follow-up PR-B · F12 | **OPEN** | Same residual as F12 — listed once in counts | Wave 1 **PR-B** |
| F22 | Durable Pass / refusal memory | inventory · blind #7 · PR-D | **OPEN** | `GenreModules` `passedIds` = `useState` Set (~155–164); Guided dismiss on session `acted` only | **PR-D** Wave 2 |
| F23 | Mood / Archive thin habit | inventory · PR-E | **OPEN** | `MoodChips` + Archive tab still thin routers | Daniel A/B call then **PR-E** |
| F24 | Export notes — no in-app reader | inventory · blind #2 · PR-F | **OPEN** | `ExportWorld` `NOTES_KEY = "lumina:notes"`; write/print only | **PR-F** Wave 2 |
| F25 | Deepen acts / invalidate guided-session after chat tools | inventory · blind #9 · PR-G | **OPEN** | Server `syncGuidedWatchlistFromChat` exists; `useChat` on `wroteToLibrary` only `invalidateLibraryData` — **no** `guided-session` invalidate | **PR-G** Wave 1 |
| F26 | Emil P1 taste (press / needle / rise / hover) | Emil QA gate · PR-A | **OPEN** | See F26a–e | **PR-A** morning pick |

#### Emil P1 breakdown (all OPEN)

| ID | Item | Evidence on main |
|----|------|------------------|
| F26a | Claim verb + Featured press lack `active:scale` | GuidedTour Watchlist/Pass/Open classes (~538+); GenreModules Featured (~312+) — no `active:scale`; dials already `active:scale-[0.98]` |
| F26b | Companion FAB no `:active` | `theme.css` `.companion-fab` hover/expanded/focus only (~278–329) |
| F26c | Needle animates `width` | `GuidedTour` `animate={{ width: \`${needlePct}%\` }}` (~748) |
| F26d | Hub `--animate-rise` 500ms + ungated hover lift | `theme.css` `--animate-rise: rise 0.5s…`; GenrePicker door `hover:-translate-y-0.5` + `animate-rise` (~247) |
| F26e | Poster hover `duration-500` / `scale-105` | GuidedTour poster `duration-500 … group-hover:scale-105` (~486) |

### C. Emil / inventory / adversarial residuals

| ID | Description | Source | Status | Evidence | Action |
|----|-------------|--------|--------|----------|--------|
| F30 | Emil Soft PASS — ready for Daniel look | Emil gate | **PARTIAL** | Product loop on main; P1 polish unpaid | Ship PR-A; Daniel look in parallel |
| F31 | Library `?status=` listed as Emil P2 / inventory gap | Emil · inventory | **OBSOLETE** | Fixed (F02) | Strike from polish backlog |
| F32 | Deepen greeting generic vault voice | Emil · inventory | **OPEN** | Product copy; not motion | Fold into PR-G copy trim or tiny separate |
| F33 | Framer → CSS for predetermined entrances | Emil P2 | **OPEN** | Optional craft | Defer; not Wave 1 |
| F34 | Guided first-session lexicon tax | inventory · PR-H | **OPEN** | Metaphor dials still opaque cold | Optional **PR-H** |
| F35 | Vault density 2 Dense / 6 Thin / 8 empty | inventory | **OPEN** | Catalog/seed — not UI polish | Defer; not a thin Worlds PR |
| F36 | Two Companions mental model | blind #3 | **PARTIAL** | Shell → “Archive chat” in-world; FAB still separate | Surgical = PR-G; full merge = product decision (defer) |
| F37 | Metaphor-as-place layout grammar | inventory score 2/5 | **OBSOLETE** as thin PR | Chrome; packing CLOSED | Needs design brief — do not open PR |
| F38 | Packing / Mode-split B reopen | multiple | **OBSOLETE** | Standing law CLOSED | Do not reopen |
| F39 | Facelift Ω3 code absorb | unfinished roadmap G2 | **OBSOLETE** until Daniel re-opens | Facelift plans untracked on main only | Wait on G2 |
| F40 | Map warp habit / GeoMap / Marathon “finish” | inventory · blind | **OPEN** but deferred | Power toys | Explicitly NOT Wave 1–2 |
| F41 | TV Guided parity deep pass | inventory | **OPEN** | Toggle exists; sniff unproven | After Movies polish |
| F42 | Archive-only slug → Guided 400 | follow-up defer | **OBSOLETE** as bug | Intentional `assertKnownWorldSlug` | Soft copy only if a path invites Guided on Generic |
| F43 | Sticky widen skips Claim on Guided return | blind #4 | **PARTIAL** | Claim-as-home / sticky widen collapse shipped in PR4 era; not re-sniffed this audit | One live Resume sniff; else close |
| F44 | Confetti / bag bounce / mode-flip springs | Emil NOT-to-animate | **OBSOLETE** | Standing law | Do not animate |

### D. Non-Worlds unfinished (worktree-driven)

| ID | Description | Source | Status | Evidence | Action |
|----|-------------|--------|--------|----------|--------|
| F50 | In-app `/watch` viewer unmerged | exploration worktree | **OPEN** | 5 commits ahead of main; not on main (`Watch.tsx` absent) | Salvage branch or open dedicated PR; else archive |
| F51 | Lumina’s Take loading-bloom plans | improvement worktree untracked | **OPEN** | Local docs only; HEAD already in main | Copy to main `docs/plans/` or drop |
| F52 | ADR-0004 recommendation scoring draft | recommendation worktree | **PARTIAL** | Untracked in stale tree | Diff vs main ADRs; keep or delete |
| F53 | Machine hygiene (`.tmp-pre-pr4-sync-docs`, roast PNGs, `.agents/`) | follow-up law | **OPEN** | Untracked on main working tree | Local delete/gitignore — not product PRs |

---

## Revised next PRs (OPEN only)

Unchanged order vs `2026-08-06-worlds-followup-prs-overview.md` — re-validated against main.

### Wave 1

1. **PR-A — Emil taste P1** (`worlds/emil-taste-p1`) — F26a–e · Effort S · P1  
2. **PR-B — Hub batch peek** (`worlds/hub-batch-peek`) — F12/F21 · Effort M · P1  
3. **PR-G — Deepen acts / invalidate** (`worlds/deepen-acts-invalidate`) — F25 · Effort M · P1  

*Swap #3 → PR-D (F22) if refusal memory beats companion loop.*

### Wave 2

4. **PR-D** Durable Pass (F22)  
5. **PR-F** Export notes reader (F24)  
6. **PR-E** Mood/Archive habit (F23) — needs A/B call  
7. **PR-H** Lexicon clarity (F34) — optional  

### Wave 3

8. **PR-C** GenreExperience extract (F20)  

### Explicitly not next

Packing reopen · Facelift absorb · Metaphor layout grammar · Vault density as UI PR · Full Companion merge · Watch/Geo/Marathon finish · Emil NOT-to-animate items.

---

## Hygiene actions

| Priority | Action | Why |
|----------|--------|-----|
| 1 | **Remove immersive worktree** (`git worktree remove …`) + optionally delete local/remote branch after Daniel OK | PR #4 merged; tip ancestor; only QA clutter left |
| 2 | **Delete orphan folder** `.worktrees/exploration-of-implementation-of-viewing-content-inside-the-app` | Not a worktree; empty + `.webclone-ref` |
| 3 | **Remove stale ancestor worktrees:** `luminas-take-improvement`, `improvement-of-luminas-take`, `what-the-llm-knows-about-me`, `recommendation-system-upgrade` | 0 commits ahead of main |
| 4 | **Decide `/watch`:** salvage→PR from `exploration-of-implementation-of-viewing`, or archive branch + remove worktree | Only worktree with unique product commits |
| 5 | **Main working-tree hygiene:** delete or gitignore `.tmp-pre-pr4-sync-docs/`, roast/`_promax` PNGs if not needed; don’t mix with Worlds product PRs | Follow-up “hygiene ≠ product” |
| 6 | **Salvage before delete:** bloom plans (improvement), ADR-0004 (reco), any immersive QA shots not on main | Avoid silent loss |
| 7 | **Do not** open PRs for `.agents/` skill installs or packing | Machine / CLOSED law |

---

## Evidence index

| Artifact | Role |
|----------|------|
| `docs/plans/2026-08-06-worlds-followup-prs-overview.md` | Proposed slices — validated |
| `docs/plans/2026-08-06-worlds-emil-qa-gate.md` | P1 taste — still unpaid on main |
| `docs/plans/2026-08-06-worlds-full-inventory.md` | Thin corners; Library row stale |
| `docs/plans/2026-08-06-worlds-adversarial-interact-qa.md` | P0s fixed + proved |
| `docs/plans/2026-08-06-worlds-pr4-premerge-live-qa.md` | Peek N×16 residual; dial sync shipped |
| `docs/plans/2026-08-06-worlds-claim-loop-dod.md` | Claim loop COMPLETE baseline |
| `docs/plans/2026-08-06-worlds-blind-angles-features.md` | Several Musts now shipped; Pass/Export/Deepen remain |
| Code skim (main) | GenreExperience LOC · GenrePicker peeks · GenreModules Pass · ExportWorld · useChat invalidate · theme.css rise/FAB · GuidedTour needle width |

---

## Counts (register IDs)

| Status | Count | IDs |
|--------|------:|-----|
| OPEN | **16** | F12/F21 (one), F20, F22, F23, F24, F25, F26, F32, F33, F34, F35, F40, F41, F50, F51, F53 |
| SOLVED | **12** | F01–F11, F13 |
| PARTIAL | **4** | F30, F36, F43, F52 |
| OBSOLETE | **6** | F31, F37, F38, F39, F42, F44 |

F26a–e are evidence rows under F26 (not extra OPEN). F12 and F21 are the same residual.
