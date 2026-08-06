# Worlds Packing — Live vh Scoreboard

**Date:** 2026-08-06 (home-stretch craft re-measure)  
**Base:** `http://localhost:5173`  
**Method:** Browser DOM measure (`scrollHeight` / `innerHeight`). Status: **LENGTH GREEN · WAVE1 SOFT-GO · WAVE2 CLOSED**.

**Roast baselines (pre-pack):** Hub ~3.3 · Horror Self ~4.2 · Horror Guided ~4.9–5.1  
**Ship targets:** Hub one-fold · Self ≤3.5 · Guided Claim ≤2.0 · Self tray ≤0.9 vh

---

## Scoreboard

| Surface | URL | Roast | Live folds | Δ | Target | Verdict |
|---------|-----|-------|------------|---|--------|---------|
| **Hub** | `/genre` (disclosures closed) | ~3.3 | **~1.23–1.56** | −1.7+ | one-fold atlas | **PASS** length · Archive = closed `#archive` |
| **Horror Self** | `/genre/horror?decade=2010s` | ~4.2 | **~2.13** | −2.07 | ≤3.5 | **PASS** length · Featured co-locate = craft open |
| **Horror Guided Claim** | `/genre/horror?mode=guided` (door chosen) | ~4.9 | **~1.17** (Maker parked) | −3.7 | ≤2.0 | **PASS** length · argue stack = sibling craft |
| **Documentary Guided** (optional) | `/genre/documentary?mode=guided` | — | **~1.48** | — | ≤2.0 spirit | **PASS** |

### Supporting DOM checks

| Check | Result |
|-------|--------|
| Horror Self `#timeline-rail` height | **402px ≈ 0.425 vh** (≤0.9 tray target) |
| Horror Guided Claim `#timeline-rail` | **Absent** — not stacked under claim desk |
| Horror Guided Claim Widen CTA | Present (`Widen and browse the archive tray`) |
| Documentary Guided `#timeline-rail` | **Absent** |
| Guided dial stage (pre-claim) | **~1.00 vh** (docH ≈945) — desk + Tonight shelf fit one fold |

---

## Mode-split sniff

- **Hub:** Map-as-atlas owns the fold; doors/mood remain disclosures. Not a peer catalog stack.
- **Self:** Browse instrument — chrome + steer + decade tray. Page length decoupled from poster count (tray internal scroll).
- **Guided Claim:** Claim cockpit only — dials / Tonight shelf / Featured / Widen. **No timeline warehouse below.** Mode-split B length sniff passes.

---

## NEED (siblings)

**None for Guided timeline stacking.** Rail is parked until Widen; no NEED filed.

---

## Notes

- Mid-flight Vite/HMR noise (`lazyArguments` / duplicate state) briefly blanked CDP tabs during measure; final numbers taken on a clean agent-browser session after pages rendered.
- Horror Guided Claim measured after completing Tempo → Era → Risk (heading **The door is chosen**), matching packing “Claim” stage — not the mid-dial intermediate.
- Self measured with `Self mode. Browse tray on stage.` and `decade=2010s` (mode defaults to self).
