# Worlds Wave 2 — Live Squint

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Viewport:** **1440×900** (agent-browser)  
**URL:** `http://localhost:5173` (Vite 200; API `:4000` up — no restart)  
**Skills:** arrange · design-taste-frontend · ui-ux-pro-max · WIG (fetched)  
**Design read:** redesign-preserve booth HUD · dials 5–6 / 4–5 / 7–8 · reject Pro Max blue/Orbitron  

**Shots:** `docs/plans/_wave2-squint/` (`01-hub` … `05-deepen`, `04-widen-stage-cue`)  
**Metrics:** `_wave2-squint/metrics-*.json` + `measure*.js`

---

## Verdict

### WAVE2 CLOSED · LIVE PASS · soft-GO (Daniel QA)

W2.1–W2.8 all **PASS** live @ 1440×900.  
GuidedTour unit regression from W2.1 browse-cue **fixed** (7/7 green).  
**LENGTH GREEN** unchanged — packing not reopened.

Soft-GO for Daniel QA. Optional Wave 3 = parked leftovers only (not blockers).

---

## PASS / FAIL table

| Check | Result | Live evidence @ 1440×900 |
|-------|--------|--------------------------|
| **W2.1** Cue once on Widen | **PASS** | Browse-bar `data-guided-pack=browse-bar`; single cue node. Stage line `Guided · archive · Now band` ×1 (`guided-browse-stage`; bodyHits=1). Resume flash may own the slot instead — never stage+feedback together |
| **W2.2** Hub gold ration | **PASS** | Enter Horror = sole gold fuel (`bg-gold-400/15` + `text-gold-400`). Shell Worlds on hub = mist active (no `*-gold-*`). Map nodes world-accent / mist fill. H1 Worlds chrome-scale **24px** |
| **W2.3** Claim shelf active-only + world-accent | **PASS** | Watchlist/Pass visible **only** on active shelf cell (2 on lead; 0 on peers). Buttons `world-accent-fill` / outline; `--world-accent:#ef4444`; `goldRingsOnShelf=0` |
| **W2.4** Self steer compact | **PASS** | Search+Sort present; presets ≤2 (`Surprise`); Narrow closed (`Narrow14`); steer row ~24px; tray top ~470 — tray owns silhouette in V1. Shell nav mist (no gold) in-world |
| **W2.5** Map ≥44 CSS | **PASS** | 16/16 `node-hit-*` **44.5×44.5** (`nodesOk=true`) |
| **W2.6** MessageCircle not Sparkles | **PASS** | Shell Companion = `lucide-message-circle`; `lucide-sparkles` count **0** on hub / in-world |
| **W2.7** Territory sentence case | **PASS** | Labels: Reading room, Threshold, Warm interior, Frontier… — `allCapsParade=[]` (no ALL-CAPS + tracking parade) |
| **W2.8** Deepen aria-modal + Escape | **PASS** | `role=dialog` · `aria-modal=true`; open focus → Close; **Escape** → FAB (`Deepen with the horror companion`, `aria-expanded=false`); shelf overlap **0**; pad ~358px |

| Unit | Result |
|------|--------|
| `GuidedTour.test.tsx` | **7/7 PASS** — browse-bar test now gates resume whisper so stage cue asserts (W2.1) |

---

## Squint notes (Arrange / Taste / Pro Max / WIG)

**Arrange:** Hub still one atlas composition — Enter owns fuel hierarchy. Claim shelf rhythm: art heroic, actions on selection only. Widen reads as thin browse status bar, not Claim leftovers.

**Taste:** Gold ration holds (Enter / world-accent edges / FAB lacquer when open). Sparkles AI tell gone from Shell. Territory caps no longer shout.

**Pro Max:** Map CSS hit floor closed (44.5). Deepen modal trap + Escape return. Touch floor intact.

**WIG:** Icon-only Companion has speech-bubble affordance; deepen dialog uses `aria-modal`; focus returns on Escape. Em-dash in hub subtitle still present (parked, not Wave 2 scope).

---

## Soft-GO gate

| Gate | Status |
|------|--------|
| Wave 2 sniff all green | **YES** |
| Live squint CLOSED | **YES** |
| Length / packing | **GREEN** — do not reopen |
| Daniel QA ready | **YES** — soft-GO |

---

## Optional Wave 3 (real leftovers only)

Not blockers. Promote only if Daniel wants another craft pass:

1. Mood / door soup quarantine (parked)  
2. Stage-gap rhythm tokens (Hub equal 20px)  
3. Hero dead-path `mist-400` residual  
4. Self Featured “Inspect pane” copy  
5. Shell `transition-all` → listed props (WIG hygiene)  
6. S4/S5 a11y shortlist (optional)

**Explicitly closed / do not reopen:** Mode-split B packing · ghost-numeral · Wave 1 P0s · Wave 2 top-8.
