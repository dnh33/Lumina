# Worlds — Daniel Ship Runbook (G1 = A)

> **Decision:** G1 = **A** (ship-ready → live QA → PR → merge) — locked **2026-08-05**.  
> **Law:** `2026-08-05-worlds-finish-plan.md`. Do **not** re-implement B1–B7 unless a gate below fails.  
> **Agents:** no git, no npm test/typecheck/build, no `npm run dev` — you run those.

**Worktree:** `.worktrees/immersive-curated-genre-specific-experie`  
**Branch:** `immersive-curated-genre-specific-experience`  
**Tonight goal:** Wave 0 + Wave 1 green → Wave 2 live QA. PR only after live QA (Wave 4).

---

## Wave 0 — Working-tree honesty (~15–30 min)

From the **worktree** root:

```powershell
cd C:\Users\Danie\Documents\Claude\Projects\Lumina\.worktrees\immersive-curated-genre-specific-experie

git status
git branch -vv
git diff
git diff --stat
```

Optional (what would land vs `main`):

```powershell
git log --oneline origin/main..HEAD | Measure-Object -Line
git diff --stat origin/main...HEAD
```

### Classify every dirty / untracked path

| Bucket | Keep in PR? | Examples |
|--------|-------------|----------|
| **Must ship** | Yes | `client/**`, `server/**` feature + tests |
| **Docs optional** | Your call | `docs/plans/*` (finish plan + this runbook useful; historical 5-axis review often kept out) |
| **Never ship** | No | `.hermes/`, `client/vout.txt`, secrets, caches, `data/*.db*` |

**Watch:** dirty `MarathonBuilder.tsx` — if diff is noise → discard; if substantive → keep (covered by existing `MarathonBuilder.test.tsx`).

**Verify:** You know exactly what would enter a commit/PR. No `git add -A`.

---

## Wave 1 — Automated gate (you run)

> Root `npm test` = **server only**. Client Vitest is a separate workspace command.

```powershell
cd C:\Users\Danie\Documents\Claude\Projects\Lumina\.worktrees\immersive-curated-genre-specific-experie

# 1.1 Server
npm run test --workspace server

# 1.2 Client (REQUIRED — not covered by root npm test)
npm run test --workspace client

# 1.3 Typecheck + build (both workspaces)
npm run typecheck
npm run build
```

**Expected:** all exit 0.

**Spot-check regression files if anything flakes:**  
`genreRemount`, `GenreExperience.eject`, `.cue`, `.topic`, `.b6a`, `.b5b`, `NeighborRail`, `MarathonBuilder`.

### Spot-grep (5 min, no server)

| Check | Look for |
|-------|----------|
| K3 | `skipAnchorLog` in `server/src/routes/misc.ts`, `client/src/lib/api.ts`, GenreExperience prefetch |
| C5 | `App.tsx` route key `"genre"`; CompanionPanel first child in loading/error/success |
| B5 / B7 | `client/src/lib/sound.ts` — default OFF when pref null; mount cue gated |
| N8 | NeighborRail navigates with `location.search` preserved |
| D7 | `onTopicSelect=` wired GenreExperience → GenreModules → TopicCluster |

**Any red → stop.** New defect: 5–7 hypotheses → logs → fix. Do **not** open PR.

---

## Wave 2 — Live browser QA (hard merge gate)

Kill zombies on `:4000` / `:5173` first (old binary lesson).

```powershell
cd C:\Users\Danie\Documents\Claude\Projects\Lumina\.worktrees\immersive-curated-genre-specific-experie
npm run dev
```

Checklist:

- [ ] `/genre` picker loads; open `/genre/documentary`
- [ ] **Sound:** first load silent with default prefs (no surprise cue)
- [ ] **K3:** load world; taste/anchors not flooded
- [ ] **TV deep-link:** `/genre/documentary?mediaType=tv` shows TV; Movies/TV toggle no wrong flash
- [ ] **N8:** from TV world, Neighbor rail hop keeps `?mediaType=tv`
- [ ] **C5:** Companion open + reply in flight → navigate slug → panel stays / stream not nuked
- [ ] **D7:** topic spine click → tags/filter change visible
- [ ] **B6a:** select decade → `#world-main` gains `zoomed-decade`; era-thesis appears (LLM or fallback)
- [ ] **N7:** Marathon on TV world with watched seasons skips them (unless empty)
- [ ] **No eject:** no “Explore with the Companion” yank to `/chat`
- [ ] `/compare/...` reachable and sensible
- [ ] Reduced-motion OS: no hostile motion; sound still gated

**Ship only after you sign this off** (or list nits → surgical Wave 2b + re-run affected Wave 1 tests).

---

## Wave 3 — Residue (status 2026-08-05)

| Item | Status | Notes |
|------|--------|-------|
| ExportWorld emerald → `--world-accent` | **Done** (agent) | `ExportWorld.tsx` saved-state class |
| Drop dead `guided` from types | **Skip** | Not tiny: route query, cache keys (`genre-exp:…`), `api.ts`, service + route tests still wire `guided`. No product path; churn risk before Wave 1. Post-merge cleanup OK. |
| CONTEXT-TEMP / review §8 banners | **Done** (agent) | Docs point at finish plan as truth |
| Instrument Ink needle/particles | **Out of scope** | Post-merge polish unless live QA feels unfinished |

---

## Wave 4 — PR checklist (you push)

Only after Wave 0 inventory + Wave 1 green + Wave 2 signed.

1. **Commit** (when you ask / when you run it) — **explicit paths only**, never `git add -A`.
2. **Push with upstream** (branch may track `origin/main` today):

```powershell
git push -u origin HEAD
```

3. **Open PR → `main`:**

```powershell
gh pr create --title "feat: Immersive Worlds genre experience" --body "$( @'
## Summary
- Ships Immersive Worlds (`/genre`, `/genre/:slug`, `/compare/...`) from branch immersive-curated-genre-specific-experience
- B1–B7 review blockers FIXED/DROPPED in tree; live QA signed off (Wave 2)
- Optional: link docs/plans/2026-08-05-worlds-finish-plan.md

## Test plan
- [ ] npm run test --workspace server
- [ ] npm run test --workspace client
- [ ] npm run typecheck && npm run build
- [ ] Live QA checklist (Wave 2 runbook) signed
'@ )"
```

4. **Blind-spot:** PR must **not** include `.hermes/`, local caches, `.env`, DB files.  
5. **No** “Generated with …” trailer.

---

## Wave 5 — Merge

- You merge (squash vs merge — your call; ~96 commits → squash may be kinder).
- Optional: delete worktree after merge.
- Facelift *code* stays blocked until merge (G1 implies serialize).

---

## Blockers for merge (honest)

| Blocker | Owner |
|---------|--------|
| Wave 0 inventory not classified | You |
| Wave 1 not green | You (agents only if red) |
| Wave 2 live QA not signed | You — **hard gate** |
| Branch not pushed / no PR | You |
| Dirty junk paths accidentally staged | You — never `git add -A` |

**Not blockers:** dead `guided` type fiction; Instrument Ink Wave 3 polish; `libraryVersion` (DROPPED).

---

## Next action (tonight)

1. Run Wave 0 commands in the worktree.  
2. Run Wave 1 four commands. Paste first failure line if anything red.
