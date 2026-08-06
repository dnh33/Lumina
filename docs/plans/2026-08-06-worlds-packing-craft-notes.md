# Worlds Packing — Craft Notes (Detail Guardian)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Role:** Craft QA + surgical polish only (no architecture rewrite)  
**Ownership:** `2026-08-06-worlds-packing-ownership.md`  
**Live base:** `http://localhost:5173` · vh ≈ 945px

---

## Design read

Reading this as: **projection-booth session HUD** for a knowing film library, Mode-split B + game-HUD density — not a marketing scroll, not neon cosplay.

---

## Live scoreboard (after sibling HMR + wait)

| Surface | Folds (approx) | Mode-split sniff | Verdict |
|---------|----------------|------------------|---------|
| **Hub** `/genre` | **~1.2–1.3** (was ~3.3) | Map-as-atlas owns fold; doors/mood as disclosures | Packing landed. Focus strip had empty void (polished). |
| **Self Horror** `?decade=2010s` | **~2.1** (was ~4.2) | Browse instrument: chrome + steer + tray start | Tray works. Tag density + modules below still length. |
| **Self Documentary** `?decade=2020s` | **~2.0** | Same browse stack; Reading Room tone intact | Niche gate not in play (catalog thick). |
| **Guided Horror** `?mode=guided` | **~1.35** claim (was ~4.9–5.1) | Claim desk + Tonight/Featured; tray only after Widen | Mode-split sealed. No timeline under claim. |

Sibling mid-flight briefly crashed genre (`WorldsMap is not defined` after import removed, usage left). Unblocked surgically — see §Fixes.

---

## Craft fails (honest)

### P0 — Immersion / mode-split clarity

| ID | Fail | Why it hurts | Owner |
|----|------|--------------|-------|
| **C1** | Guided still mounts **Timeline + modules + export** under claim desk | First viewport is claim; scroll still reveals warehouse. Mode-split B sniff test fails on length, not on desk quality. | Seam — **fixed** (Widen CTA → chip + browse tray; `<details>Widen eras` removed; claim parks Timeline until Widen) |
| **C2** | Visible HUD jargon **"Claim cockpit" / "Browse instrument"** in session chrome | Breaks hush; Self\|Guided already communicates stage | Seam — **fixed** (§Fixes) |
| **C3** | Hero **Horror** + tour title **"Stand at the door with me"** compete at same weight | Two primaries in one fold | Guided cockpit |

### P1 — Density / hierarchy / packing craft

| ID | Fail | Why it hurts | Owner |
|----|------|--------------|-------|
| **C4** | Hub ChartFocus: Enter alone on its own row → **large empty void** to the right | Sparse strip above dense map; not HUD packing | Hub — **fixed** (§Fixes) |
| **C5** | Self steer **tag row** still wide (mitigated by "+N more") | Chip soup vs tray primacy | Self / seam |
| **C6** | Template era line *"Era thesis for the 2010s: Threshold framed by 8 titles"* | Mechanical meta; reads like debug copy | Seam — **fixed** (§Fixes) |
| **C7** | Active decade tab + gold glow orb + gold tags + companion FAB | Gold inflation (>3 jobs / viewport) | Self tray + Companion gold — glow orb removed |
| **C8** | Guided shelf posters in **square crop** | Immersion break on art-heroic rule | Guided cockpit |

### P2 — Polish / typeset / quieter

| ID | Fail | Why it hurts | Owner |
|----|------|--------------|-------|
| **C9** | Archive still below hub fold (~0.2–0.3 folds) | One-fold almost; Archive could be disclosure too | Hub |
| **C10** | Whisper + sticky chrome + hero stack eat Self V1 before tray posters | Browse instrument sniff wants tray *start* in fold | Self / ExperienceHero compact |
| **C11** | "Featured / Inspect pane" under Guided shelf is good; under Self still a second scroll beat | Dual-pane metaphor half-applied | Orchestrator |
| **C12** | Mid-flight HMR left dead `WorldsMap` usage | Blank genre page | Seam — **fixed** via Q2-A leave link |

---

## What already works (keep)

- Hub **map-as-atlas** + Door list / By mood as disclosures — game-HUD fold, not peer catalogs.
- Timeline **internal-scroll tray** (`max-h-[min(70vh,36rem)]`) — page length decoupled from poster count.
- Sticky **session chrome** Self\|Guided · Movies\|TV always reachable.
- Guided **tour desk** voice (Threshold · dials · Tonight shelf) feels booth, not SaaS tour.
- World accent on pressed mode (Horror red) — gold reserved better than before.
- Tag overflow **"+N more"** on Self — good quieter move.

---

## Surgical fixes applied (Detail Guardian)

| Fix | File | Lines spirit | Before → After |
|-----|------|--------------|----------------|
| **Crash / Q2-A leave** | `GenreExperience.tsx` | Replace `<details><WorldsMap/></details>` with `Link` → `/genre#map` | Blank page / remounted atlas → quiet leave path |
| **Quieter session chrome** | `GenreExperience.tsx` | Drop visible "Claim cockpit" / "Browse instrument"; keep `aria-live` | HUD jargon → hush; stage still announced |
| **Hub focus density** | `WorldsMap.tsx` ChartFocus | Enter + status on **one** header row | Empty void row → packed strip |
| **Era thesis typeset** | `GenreExperience.tsx` | Soften deterministic string | `"Era thesis for the 2010s: …"` → `"2010s · 8 titles in the Threshold."` |
| **Gold quieter** | `TimelineScrubber.tsx` | Remove active-tab gold glow orb (ring + count remain) | Inflated signal → earned gold on anchors only |
| **Indent hygiene** | `TimelineScrubber.tsx` | Anchor span indent | Craft-only |
| **C1 re-stage seal** | `GenreExperience.tsx` + GuidedTour (sibling) | `guidedWiden` → Tour `compact` + browse tray; kill page `<details>Widen eras` | Timeline under claim → park until Widen CTA |

No architecture rewrites. No reintroduction of details warehouse under claim.

---

## Notes for parallel owners

### Hub
- Verify Enter stays in first viewport after ChartFocus densify (watch map `min-h` vs fold).
- Consider demoting Archive into a disclosure like Door list / Mood (C9).

### Self tray
- Keep tray chrome; push tag cap further if "+N more" still feels pill-soup next to era tabs (C5).
- Decade-first bootstrap NEED still on orchestrator (`pickPreferredDecade`).

### Guided cockpit
- C1 sealed — do **not** reintroduce `<details>Widen eras` under claim.
- Soften tour H1 vs world H1 hierarchy (C3); poster aspect on shelf (C8).

### Companion / a11y / perf gold
- Companion FAB still gold in Guided V1 — confirm ≤3 gold jobs with Enter + dial accent.
- Session chrome sticky + `aria-live` mode announce: good; re-check focus order after chrome stickiness.

### Orchestrator
- Keep single Widen UX (Tour CTA → chip + tray). Mode flip resets `guidedWiden`.
- Leave path now link-only; don’t reintroduce embedded `WorldsMap` without import.

---

## Heuristic snapshot (honest)

| Heuristic | Score /4 | Note |
|-----------|----------|------|
| Visibility of status | 3 | Mode + dials clear; era thesis was muddy (fixed) |
| Match real world | 3 | Booth metaphors hold; HUD jargon slipped (fixed) |
| User control | 3 | Sticky chrome good; Widen CTA on claim complete |
| Consistency | 3 | Claim parks browse; Self keeps tray (mode-split holds) |
| Aesthetic minimalist | 3 | Hub fold good; Self still module stack |
| **Total feel** | **~26/40** | Packing wave landed; C1 mode-split seal closed |

---

## Iterate once (post-fix sniff)

1. Hub: Enter Horror co-located with status — void gone. Fold still ~1.2 if Archive quiet.
2. Self: no "Browse instrument" label; era line quieter; timeline tray present (~1.9 folds).
3. Guided claim: **no** Timeline / Also-tagged / Export / `Widen eras` details — dials + Tonight/Featured + Widen CTA only (~1.35 folds). Widen unlocks browse tray.

---

*Detail Guardian — Rune. No git. Sibling owns deep structure; this pass is eye + scalpel.*
