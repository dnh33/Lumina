# Worlds UX Roast 2 — Grill-with-Docs · Packing plans vs live post-restart

**Agent:** Grill / Roast (docs-adversarial)  
**Date:** 2026-08-06 (post-restart re-measure)  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Live:** `http://localhost:5173` · viewport **1440×945** (`folds = docHeight / vh`)  
**Docs grilled:** mode-split packing plan · game-HUD composition brief · packing scoreboard · packing craft notes · status board · ownership · a11y notes  
**Prior roast:** [`2026-08-06-worlds-ux-roast-grill-with-docs.md`](./2026-08-06-worlds-ux-roast-grill-with-docs.md) (pre-pack; Q1–Q7 open)  
**Method:** No code. No git. Plans vs live DOM. No credit for “we wrote COMPLETE.”

---

## Idea verdict

**CHALLENGE — length targets green ≠ packing law done. Status board overclaims.**

Mode-split B killed the warehouse scroll. That is real. The scoreboard’s GREEN numbers mostly hold post-restart. What does **not** hold:

1. Docs declare the packing wave **COMPLETE** while craft leftovers, a11y P1, and Wave 6 sit open — and one “fixed” craft item is **still live**.
2. Soft defaults Q2–Q7 were never locked by Daniel; the plan implemented them as if locked.
3. Game-HUD sniff tests (tray *start* in Self V1; one primary per stage; hush) still fail parts of the composition brief even when fold counts pass.
4. “COMPLETE” language is doing political work the metrics do not authorize.

| Surface | Roast1 (pre-pack) | Scoreboard claim | Live post-restart | Target | Length |
|---------|-------------------|------------------|-------------------|--------|--------|
| Hub `/genre` | ~3.3 | 1.23 | **1.228** (docH 1160) | one-fold / ≤1.5 | Pass |
| Horror Self | ~4.2 | 2.13 | **2.133** (Enter → `?decade=2010s`) | ≤3.5 | Pass |
| Horror Guided Claim | ~4.9–5.1 | 1.43 | **1.434** (rail absent) | ≤2.0 | Pass |
| Doc Guided Claim | — | 1.48 | Not re-locked this pass; Horror Claim reconfirmed | ≤2.0 | — |

**Bottom line:** You packed *length*. You have not finished packing *law*, *jargon*, *leave path honesty*, or *Daniel’s unanswered cuts*. Calling the wave COMPLETE is a participation trophy with a green spreadsheet.

---

## Live stack (post-restart)

### Hub — cold `/genre`

| Fact | Live |
|------|------|
| Folds | **1.228** |
| Territory map | Owns fold (map-as-atlas) |
| Door list / By mood | `<details>` **closed** |
| Archive H2 | top **~979** — just under fold (vh 945) |
| Status legend | Filled · Sparse · Empty in hero strip |

**Plan claim:** “one-fold entry.”  
**Live:** Primary composition fits; Archive still peeks as a second beat (~0.2 folds). Craft C9 called this; status board parked it as optional. It is still **not** one fold of *content job* — it is one fold of *map* plus a hanging Archive appendix.

### Horror Self — Enter Horror → `?decade=2010s`

| Fact | Live |
|------|------|
| Folds | **2.133** |
| Announce | `Self mode. Browse tray on stage.` |
| Tray | `#timeline-rail` present; decade-first |
| Steer | Tags + `+N more` still in V1 chrome |
| Game-HUD sniff | Browse instrument length OK; **tray poster start vs hero/whisper/steer stack** still contested (craft C10) |

### Horror Guided Claim — door chosen (3/3)

| Fact | Live |
|------|------|
| Folds | **1.434** |
| `#timeline-rail` | **Absent** — Claim parks warehouse |
| Announce | **`Guided mode. Claim cockpit on stage.`** |
| Featured | Under Tonight shelf (inline expansion spirit) |
| Widen | CTA present (`Widen and browse the archive tray`) |
| Maker | Still on Claim stage under Featured |
| Leave / `#map` | **No atlas leave link** observed on Claim fold |
| Neighbors / Export | Not on Claim (parked) — length win; leave-path job deferred |

---

## Hard contradictions (plans vs live vs sibling docs)

### 1. Craft C2 “fixed” vs live announce string

| Doc | Claim |
|-----|--------|
| Craft notes | C2 **fixed** — drop visible “Claim cockpit” / “Browse instrument”; keep `aria-live` |
| A11y notes P1-9 | Still lists visible Claim cockpit / Browse instrument as `sm:block` issue |
| **Live Claim** | Visible text: **“Guided mode. Claim cockpit on stage.”** |
| **Live Self** | “Self mode. Browse tray on stage.” (instrument gone; **tray** jargon remains) |

Craft and status board cannot both be honest. Either C2 was not fixed, or “fixed” means “we edited once and HMR lied.” Post-restart live is the judge: **C2 is open.**

Game-HUD + `.impeccable.md` hush: session chrome already has Self|Guided. Stage labels in user-visible prose are HUD cosplay, not booth.

### 2. Status board COMPLETE vs packing plan Wave 0 soft locks

Packing plan Wave 0:

| Item | Plan state |
|------|------------|
| Q1 Mode-split B | LOCKED |
| Game-HUD north star | LOCKED |
| Q2 hub-only atlas | Default A — **confirm or override before Wave 4** |
| Q3 Featured = shelf expansion | Default A |
| Q4 AnchorFrame out of filled V1 | Default A |
| Q5 mood cap/disclosure | Default A |
| Q6 Widen unlocks Browse | Default A |
| Q7 density budgets | Default A stretch |

Status / ownership: Wave 4 leave-path **DONE** (Q2-A), Wave packing **COMPLETE**.

**Contradiction:** Defaults were never recorded as Daniel answers. Implementation treated recommendations as law. That is fine *if* Daniel rubber-stamps now — it is fraud *if* COMPLETE implies the Don locked Q2–Q7.

### 3. Game-HUD brief sniff vs fold scoreboard

Brief success sniff:

- Self V1 = **browse instrument** (chrome + steer + **tray start**)  
- Guided Claim V1 = **claim cockpit** (desk + shelf), warehouse parked  
- Flip = re-stage  
- Hub = **one** enter composition  

Scoreboard only measures `docHeight/vh` and rail absence. Live Claim passes length and rail park. Live Self passes ≤3.5. **Sniff failures the scoreboard cannot see:**

| Sniff | Live debt |
|-------|-----------|
| Tray *start* in Self first viewport | Hero + whisper + tag row still eat fold before posters (C10) |
| Claim = desk + shelf (± Featured) | Maker module still rides Claim (secondary axis on primary stage) |
| Hush / no HUD jargon | “Claim cockpit on stage” live |
| Hub one enter composition | Archive always-on below fold; mood/doors OK as disclosures |
| Leave path Q2-A | Claim stage shows no “Open vault atlas”; Self leave not re-verified this pass as visible chrome |

Passing ≤2.0 / ≤3.5 is necessary. It is not the brief.

### 4. Mode-split law vs “modules on Claim”

Plan §2.2 CLAIM: Tonight shelf + Featured under lead; Timeline Widen; steer Tune; Companion closed by default. Secondary modules (topics / directors / **maker**) belong to Self browse / BROWSE stage (§2.3), not Claim V1.

Live Claim: **Maker region present** under Featured. Length still ≤2.0 because Maker is short — but the **stage law** is “one primary surface,” not “anything short may stay.” Scoreboard GREEN launders a stage leak.

### 5. Widen done vs Browse stage completeness

Status: Widen **DONE** (CTA → chip + tray; page `<details>` gone).  
Unverified hard in this roast pass (session flaked on mode flips / deep links): after Widen, does Self-equivalent steer+modules+Export remount as BROWSE without stacking dial desk full-size? Plan requires desk → compact chip. **Do not trust DONE without a post-restart Widen→tray→Retake/Claim loop recorded in the scoreboard file itself.** Scoreboard notes Claim pre-Widen only.

### 6. Deep-link / session instability (live QA debt)

Observed this session:

- `open /genre/horror?mode=self&decade=2010s` sometimes landed on **hub** `/genre`  
- Mode/session restored Guided Claim when expecting Self  
- Enter from map sometimes no-op’d under automation; cold hub remount restored 1.228  

Packing docs assume stable URL↔mode. Live post-restart behavior is flaky enough that **scoreboard rows can be stage-wrong**. Any COMPLETE claim needs a cold-load matrix (Self cold, Guided cold, flip, Widen) — not one happy Claim screenshot.

### 7. Sibling doc war on jargon

| Source | Stage language |
|--------|----------------|
| Game-HUD brief | “browse instrument” / “claim cockpit” as **internal** metaphors for PRs |
| Craft C2 | Kill visible HUD jargon |
| Live announce | Ships the metaphor to the user |
| A11y P1-9 | Still tracks visible jargon as debt |

**Glossary fight:** “cockpit / instrument” are authoring terms. They must not be product copy. Plans never drew that line; live blurred it.

---

## What packing actually closed (no trophies — facts)

1. Hub peer Atlas+Map catalog stack → map-as-atlas + disclosures. Folds **3.3 → 1.23**.  
2. Timeline page warehouse → internal tray; Self **~4.2 → ~2.1**; rail ≤0.9 vh spirit.  
3. Guided bolted warehouse → Claim parks `#timeline-rail`; **~5 → ~1.4**.  
4. Featured archaeology under Guided → thesis under shelf on Claim.  
5. In-genre full WorldsMap remount — intended Q2-A kill (craft); Claim fold shows no second atlas.

That is the win column. Stop writing COMPLETE as if the win column is the whole plan.

---

## Packing debt remaining (honest board)

### Still open — treat as packing / composition debt, not “optional fluff”

| ID | Debt | Why it still bites | vs docs |
|----|------|--------------------|---------|
| **D1** | Visible **Claim cockpit** (and Self “Browse tray on stage”) | Breaks hush; contradicts craft “fixed” | C2 reopen |
| **D2** | Maker (and any secondary module) on **Claim** stage | Violates one-primary / CLAIM park table | Plan §2.2 |
| **D3** | Self V1: hero+whisper+tags before tray posters | Game-HUD sniff “tray start in fold” soft-fail | Brief §6 · C10 |
| **D4** | Hub Archive always mounted below fold | Not one-fold *job*; appendix leak | Plan §4 · C9 |
| **D5** | Leave-path chrome missing on Claim | Q2-A “Open atlas” not evidenced on Claim fold | Wave 4 / Q2 |
| **D6** | Q2–Q7 never Don-locked | COMPLETE without decision record | Wave 0 |
| **D7** | Widen→BROWSE post-restart loop not in scoreboard | DONE stamp without cold matrix | Status Widen |
| **D8** | Guided dual H1 weight (world + tour title) | Two primaries in one fold | C3 |
| **D9** | Guided shelf **square crop** | Art-heroic rule break | C8 |
| **D10** | Self tag chip row | Density / taste; still competes with tray | C5 · Q5 spirit |
| **D11** | A11y P1-1…P1-12 | Not length; is ship readiness | A11y notes |
| **D12** | Wave 6 typeset / gold / Constellation | Explicitly optional — fine only if Daniel says length was the only gate | Wave 6 |

### Status-board language to retire

Replace “Wave packing COMPLETE · scoreboard GREEN” with:

> **Length gates met (Hub / Self / Guided Claim). Composition + jargon + Don locks + Widen cold matrix still open.**

Anything stronger is lying to the next agent.

---

## Glossary fights (grill-with-docs)

| Fuzzy term | Competing live meanings | Proposed canonical (needs Daniel) |
|------------|-------------------------|-----------------------------------|
| **COMPLETE** | Length GREEN · Wave list checked · craft fixed | **Length-gated** vs **Composition-gated** — never one word |
| **Claim cockpit** | Plan metaphor · live announce · a11y debt | Authoring-only; product = Guided + desk/shelf |
| **Browse instrument / tray on stage** | Brief metaphor · Self announce | Authoring-only; product = Self + tray |
| **One-fold hub** | Map in vh · Map+Archive docHeight | **Enter fold** = territory+Enter; Archive = disclosure or route |
| **Parked** | Not in DOM · in DOM but below fold · disclosure | Parked = **not mounted** on that stage (Claim Maker fails this) |
| **Q2-A leave** | Link on Self footer · Claim · both | Every world page stage that can leave shows one quiet atlas link **or** Neighbors-only with hub return |

No `CONTEXT.md` updated — terms unresolved until Daniel answers below.

---

## Unanswered questions for Daniel

*Grill protocol: one at a time. Most critical first. Recommended answer in italics.*

### R2-Q1 — Is GREEN length enough to call packing done?

**Do you accept “packing wave COMPLETE” on fold metrics alone, or must game-HUD sniff + jargon hush + stage park pass too?**

- A) Length gates only — ship composition debt as polish.  
- B) Length + sniff (no HUD jargon; Claim parks Maker; Self tray start in fold; Archive disclosure). *(Recommended.)*  
- C) Freeze all Worlds UI; merge as-is.

*Without R2-Q1, status board and craft notes will keep fighting.*

### R2-Q2 — Lock the soft defaults (Q2–Q7) now?

**Retcon Wave 0: are Q2-A, Q3-A, Q4-A, Q5-A, Q6-A, Q7-A official Don locks?**

- A) Yes — lock all defaults; update plans to LOCKED. *(Recommended if Mode-split B stands.)*  
- B) Lock only Q2+Q6; reopen Q3–Q5/Q7.  
- C) Reopen all soft defaults; stop implementing on recommendation.

### R2-Q3 — Visible stage announce copy

**May the UI say “Claim cockpit” / “Browse tray on stage”?**

- A) Never visible — aria-only mode announce, plain Self|Guided. *(Recommended; matches craft C2 intent + hush.)*  
- B) Keep for power users.  
- C) Rename to booth voice (“Tour desk on stage” / “Archive tray on stage”) — still visible.

### R2-Q4 — Maker on Claim

**Is Maker allowed under Featured during Claim?**

- A) No — Claim = shelf + Featured (+ Widen/Deepen). Maker only after Widen/Self. *(Recommended.)*  
- B) Yes if short.  
- C) Maker folds into Featured footer always.

### R2-Q5 — Hub Archive

**Archive always-on under the map — keep, disclose, or route?**

- A) Disclosure like Door list / Mood. *(Recommended.)*  
- B) Keep always-on; one-fold means map only.  
- C) Kill Archive from hub; Discover/Library owns residue.

### R2-Q6 — Claim leave path

**Must Claim show “Open vault atlas” / hub `#map`, or is Neighbors-only after Widen enough?**

- A) Quiet leave link on every genre stage including Claim.  
- B) Only Self / Widen Browse — Claim is sealed. *(Recommended if Claim is a short ritual.)*  
- C) Neighbors always; never atlas link.

### R2-Q7 — What is the next ship gate?

**After this roast, what is the single next gate?**

- A) Fix D1–D4 (jargon + Claim park + Self tray start + Archive) then PR. *(Recommended.)*  
- B) A11y P1 pass then PR.  
- C) Merge on length GREEN; park everything else post-merge.

---

## Scenarios that break “COMPLETE”

1. **Cold Claim load:** User finishes dials, reads “Claim cockpit on stage,” feels debug HUD — craft said this was dead.  
2. **Claim + Maker:** User came to pick tonight; Maker axis appears as equal H3 — stage machine leaked.  
3. **Self “browse instrument” length pass, sniff fail:** Folds 2.1 but first viewport is chrome/tags; posters start mid-fold — brief fails, scoreboard passes.  
4. **Hub “I’m done entering”:** User enters from map; Archive pills still invite a second catalog job under the fold.  
5. **Agent/scoreboard lie:** Deep link lands hub or restores Guided; a GREEN row may have measured the wrong stage. COMPLETE without cold matrix is cargo cult.

---

## Best Available Consensus (until Daniel answers R2-Q1)

**Proposal:** Demote status language. Keep Mode-split B + length gates as **achieved**. Treat composition sniff + jargon + Don lock of Q2–Q7 as **blocking** for any honest “packing done.”

### Resolved (safe)

- Mode-split B was the right cut; live length proves it.  
- Tray + Claim park of timeline are real.  
- Map-as-atlas hub fold is real.  
- Pre-pack roast diagnosis (warehouse / bolted Guided / peer catalogs) is closed on length.

### Unresolved objections

1. **COMPLETE overclaim** — Risk: HIGH — Mitigation: Daniel answers R2-Q1 / R2-Q7.  
2. **C2 live regression** — Risk: HIGH — Mitigation: treat jargon as open packing debt.  
3. **Soft defaults without Don lock** — Risk: MEDIUM — Mitigation: R2-Q2.  
4. **Stage leaks (Maker on Claim, Archive on hub)** — Risk: MEDIUM — Mitigation: R2-Q4 / R2-Q5.  
5. **Widen/cold matrix gap** — Risk: MEDIUM — Mitigation: one recorded post-restart loop before PR.

### Don’s decision required

Accept length-only COMPLETE (A), require sniff+jargon gate (B — recommended), or freeze/merge as-is (C).

---

## Grilling Conclusions

| Field | Value |
|-------|--------|
| **Idea Verdict** | CHALLENGE |
| **Key finding** | Length GREEN; composition + jargon + Don locks not done; COMPLETE is false precision |
| **Rejected alternative** | Treating scoreboard GREEN as packing wave closed |
| **Rejected alternative** | Craft “fixed” table as source of truth over live DOM |
| **Rejected alternative** | Soft defaults as silent locks |
| **Termination** | Best Available Consensus — R2-Q1…R2-Q7 unanswered |
| **Next action** | Daniel answers R2-Q1; rewrite status board language; close D1 before any “done” stamp |

---

## Sources

- `docs/plans/2026-08-06-worlds-mode-split-packing-plan.md`  
- `docs/plans/2026-08-06-worlds-game-hud-composition-brief.md`  
- `docs/plans/2026-08-06-worlds-packing-scoreboard.md`  
- `docs/plans/2026-08-06-worlds-packing-craft-notes.md`  
- `docs/plans/2026-08-06-worlds-packing-status-board.md`  
- `docs/plans/2026-08-06-worlds-packing-ownership.md`  
- `docs/plans/2026-08-06-worlds-packing-a11y-notes.md`  
- `docs/plans/2026-08-06-worlds-ux-roast-grill-with-docs.md`  
- Live DOM 2026-08-06 post-restart · `localhost:5173` · 1440×945  

---

*Rune — grill-with-docs roast2. No code. No git. Live DOM over checklist theater.*
