# Worlds UX Roast 2 — Interaction · Guided (POST packing)

**Agent:** Roast 3/4 · roast2  
**Date:** 2026-08-06  
**Target:** `http://localhost:5173` (Mode-split B packing GREEN)  
**Lens:** What still confuses after packing — Self↔Guided flip, dials, Widen, Companion DEEPEN, decade peeks, hub Enter/warps  
**Method:** Live reproduce + packing contracts (`guidedStage`, claim desk, `guidedWiden`, `data-companion-mode="guided-deepen"`). No code. No git.  
**Baseline:** Pre-pack roast `2026-08-06-worlds-ux-roast-interaction.md` (19/40). Scoreboard: Hub 1.23 · Horror Self 2.13 · Horror Guided Claim 1.43 · Doc Guided 1.48.

**Design read:** Mode-split B says one stage speaks. Packing made the *scroll* obey. Several *verbs* still argue with each other.

---

## Verdict

**Density packing worked. Interaction packing is half-done.**

Claim cockpit is a real stage now (Featured under shelf, timeline gone, ~1.35–1.43 folds). Widen correctly stays Guided with a **Claim desk** chip. Companion DEEPEN is shelf-bound when opened from Guided.

What still fights Mode-split B is not page length — it is **authority conflict**:

| Contract (Mode-split B) | Live after packing | Fight? |
|-------------------------|--------------------|--------|
| Claim = shelf owns fold | Yes — shelf + Featured + dials, no rail | — |
| Widen = Guided browse, dials parked | Yes — compact chip + tray; `mode=guided` held | Partial |
| Dial owns era in Dial/Claim | Whisper “Classic band”; Widen opens **All eras** | **Yes** |
| One recommender in Claim | Desk Deepen + FAB Deepen + Featured argument | **Yes** |
| Mode flip re-stages, no stack | Self↔Guided remounts cleanly | Partial (era jump) |
| Hub one primary enter | Map atlas + Enter strip; doors/mood collapsed | Partial (silent Guided resume) |

**Cognitive load checklist (8):** fail **4/8** → moderate (was 7/8 critical pre-pack).

Fails: single focus (Claim verbs), working memory (Classic dial vs All-eras tray), progressive disclosure (Widen dumps Self steer), one thing at a time (dual Deepen).  
Pass: chunking on Claim fold, grouping inside tour desk, visual hierarchy vs pre-pack warehouse, minimal choices *until* Widen / complete-frame copy.

---

## Reproduction paths (evidence, not guesses)

### Path A — Horror Guided Claim (packed)

1. `/genre/horror?mode=guided` with session complete (“The door is chosen”).
2. **Announce:** `Guided. Claiming tonight's picks.` / earlier variant `Guided mode. Claim cockpit on stage.`
3. **Folds:** **1.35–1.43** (docH ~1355 / vh 945). Timeline **absent**.
4. First stage: dials Creeping · Classic · Known dread · Tonight shelf (Cremator / Baby Jane / Kwaidan) · Featured thesis **under** shelf · Widen + Deepen CTAs · FAB “Deepen with the horror companion”.
5. Whisper (claim): `Guided claim · Classic band · … Tonight shelf owns the fold.`

**Win vs roast1:** No 32-title rail between shelf and Featured. No Self tag soup on Claim.

**Still loud:** Frame copy lists four peers — “Claim a shelf pick, **re-dial, deepen, or widen**.” Desk **Deepen** + FAB **Deepen** = two identical verbs.

### Path B — Widen (Mode-split B browse)

1. Click `guided-desk-widen` (“Widen / browse archive”).
2. **Stays Guided:** URL keeps `?mode=guided`. Announce → `Guided mode. Browse tray on stage.` Pressed: Guided · Movies.
3. Compact tour: `Tour · 3/3 · claim desk parked` + gold **Claim desk** chip + RETAKE.
4. Whisper: `Guided widen · Classic band · browse tray unlocked.`
5. **Tray default:** Timeline **All eras** selected (40 titles · pick an era) with decade peeks + “Open tray →”.
6. **Steer returns:** Search, Sort, 8+ tags, Surprise me, Less well-known — full Self warehouse beside tray.
7. **Folds:** ~**1.28–1.49** while still Guided (All eras summary). FAB still “Deepen…”.

**Win vs roast1:** Not a silent flip to Self; dials collapse instead of dual cockpits stacked.

**Fight:** Copy promised “dials stay parked” — true for the needle — but **era authority** immediately forks (Classic band whisper + All eras scrub). Widen also re-arms every Self discovery control while the tour is still “live.” That is Mode-split B browse as coded; it still *feels* like leaving Guided without flipping the mode pill.

### Path C — Decade peek / zoom (post-Widen)

1. From All-eras summary, open **1960s** tray (`?decade=1960s&mode=guided`).
2. Tray titles include Classic shelf set (Cremator, Baby Jane, Kwaidan, …). Announce stays Guided browse.
3. Peeks (“Open tray →” / decade tabs) work; peeks are honest once a decade is chosen.

**Fight:** Default Widen lands All eras *after* Classic dial — user must re-assert era. Peeking 1960s *repairs* the lie; the first Widen paint creates it.

### Path D — Companion DEEPEN

1. From Claim (or Widen), FAB → panel `data-companion-mode="guided-deepen"`, aria `horror deepen companion`.
2. Prefill: dials + “Defend tonight's shelf three…”. Tour chips: CREEPING · CLASSIC · KNOWN DREAD. Header: “Deepen · tour · shelf-bound”.
3. Suggestions: “Defend tonight's three”, “shelf-bound”, “Which of these fits Creeping · Classic?”
4. Panel is shorter HUD (~46dvh) — Claim desk remains partially visible; **third shelf card can sit under the panel**.

**Win vs roast1:** Prefill no longer invents a fourth “on shelf” title in the opening prompt; bound to dials + shelf defense.

**Fight:** Dual Deepen entry (desk button + FAB). Opening Deepen during Widen browse pulls attention back to “tonight’s desk” while the tray is still the stage — two stages visible. Generic welcome line (“I know every title…”) still undercuts “shelf-bound” chips for a beat.

### Path E — Self ↔ Guided flip

1. Claim (Classic shelf, 1960s titles) → click **Self**.
2. Tour unmounts. Announce: `Self. Browsing by decade.` FAB → `Talk to the horror companion`. URL drops `mode`, lands **`?decade=2020s`** (decade-first). Folds ~1.43.
3. Click **Guided** → Claim returns intact (Creeping / Classic / Known dread, same shelf). Widen flag cleared (collapse chip gone; full desk back). FAB → Deepen again.

**Win:** True re-stage (key={mode}); no stacked cockpits.

**Fight:** Era amnesia on the flip — Classic Claim → Self **2020s** with no bridge. User’s dial era is not the Self scrub. Power users will think the mode pill “lost” their decade; first-timers will think Guided and Self are different libraries.

### Path F — Hub Enter / warps

1. `/genre` folds ~**1.15–1.23**. Map owns fold. Door list + By mood in collapsed `<details>`. Archive quieter.
2. Focus strip (Horror): **Enter Horror** + **Warps** Thriller / Film Noir. Map nodes also expose Enter / Warp links in the a11y tree.
3. Enter Horror with prior Guided session → lands **`/genre/horror?mode=guided`** (Claim), not Self browse.

**Win vs roast1:** Not a 3.3vh wall of equal doors.

**Fight:** Enter **silently resumes Guided**. Hub does not say “resume tour” vs “browse shelf.” Warp vs Enter naming is clear in aria; visually warps still depend on focus/hover strip discovery. Three enter textures remain (node, Enter CTA, door list) — packed, not eliminated.

---

## What’s working (keep)

1. **Claim cockpit packing** — Featured co-located; rail parked; folds under 2.0. Roast1 P0 scroll archaeology is largely dead.
2. **Widen stays Guided** — `Claim desk` chip + compact 3/3 needle is the right mental model when noticed.
3. **DEEPEN shelf-bound prefill** — tour chips + defend-shelf suggestions match Mode-split B deepen stage intent.
4. **Mode remount** — Self↔Guided does not stack; Retake / dial answers survive the round trip.
5. **Hub atlas fold** — doors/mood as disclosures; Enter co-located with warps on focus.

---

## Priority roasts (post-pack)

### P0 — Widen reopens Self warehouse under a Guided pill

**What:** Guided browse unlocks Search / Sort / tag cloud / Surprise / Less well-known beside the tray while mode stays Guided and whisper still says Classic band.

**Why it matters:** Mode-split B’s *promise* is one cockpit. Users read the gold **Guided** pill, then get Self toys. Classic dial + All eras tray = the old three-clocks bug in a tuxedo.

**Fix (interaction, not restyle):** On Widen entry, **seed tray to dial era band** (Classic → 1960s peek or Classic-filtered summary), not All eras. Park Surprise / Less well-known / tag sprawl behind a single **Tune** disclosure until user opts in. Whisper must not say Classic band while All eras is selected.

### P0 — Dual Deepen + four-verb Claim frame

**What:** Complete desk copy: claim / re-dial / deepen / widen. Visible **Deepen** button + FAB “Deepen with…”. Featured also “argues” the lead.

**Why it matters:** Claim’s job is pick one of three. Four peer verbs + two Deepens + a thesis panel = recommender committee.

**Fix:** One primary cluster: **Watchlist / Pass** on shelf. Widen = secondary text button. Deepen = **FAB only** (or desk only — not both). Re-dial stays on dial ticks, not in the frame sentence. Frame copy → one line: “Claim a shelf pick — or widen the room.”

### P1 — Mode flip drops dial era on the floor

**What:** Guided Classic (1960s shelf) → Self boots **2020s**. Flip back restores dials but Self decade was a different century.

**Why it matters:** Flip should feel like changing tools on the same shelf, not teleporting eras.

**Fix:** Self entry after Guided Claim/Widen inherits **era band → preferred decade** (Classic → 1960s) unless user had an explicit Self decade touch. Announce one cue: “Self · 1960s from Classic dial” once.

### P1 — Hub Enter resumes Guided without saying so

**What:** Atlas Enter → Claim cockpit when last mode was Guided. No “Resume tour” vs “Browse.”

**Why it matters:** Hub reads as territory pick; landing is a mid-tour desk. First-timers think every world opens as a quiz.

**Fix:** Enter default = Self browse for that world; optional **Resume Guided** chip when session complete/active. Or label Enter “Resume tour” when `mode=guided` would apply.

### P1 — Deepen panel occludes Claim shelf

**What:** DEEPEN HUD covers the third Tonight card while asking to defend the three.

**Why it matters:** Shelf-bound deepen that hides the shelf.

**Fix:** Open Deepen only after Claim (desk CTA), dock panel so all three posters stay visible, or highlight the three titles inside the panel as tappable shelf twins.

### P2 — Dial affordance still “meter,” not control

**What:** Tempo/Era/Risk read as filled gauges; re-dial exists via “Change … dial” buttons but the chrome looks status-only.

**Why it matters:** Frame says “re-dial”; eyes say “readout.”

**Fix:** Keep Instrument Ink — add hit affordance (caret / “Change” visible label on the dial face), not a second control row.

### P2 — Warps still focus-gated

**What:** Warp links present when Horror is focused; easy to miss if you only click map fills.

**Why it matters:** Neighbor jump is a power move; discovery is uneven.

**Fix:** Always-visible warp row for focused world (already in strip — ensure strip shows on keyboard focus *and* pointer without hover-only).

---

## Heuristic scores (interaction, post-pack)

| # | Heuristic | Pre | Post | Key issue now |
|---|-----------|-----|------|---------------|
| 1 | Visibility of system status | 2 | **3** | Announce + Classic band; All eras still lies |
| 2 | Match system / real world | 3 | **3** | Curator metaphor holds |
| 3 | User control and freedom | 3 | **3** | Retake / Claim desk / flip strong |
| 4 | Consistency and standards | 1 | **2** | Deepen×2; Talk vs Deepen FAB |
| 5 | Error prevention | 1 | **2** | Era fork on Widen; flip era jump |
| 6 | Recognition rather than recall | 2 | **3** | Claim fold helps; Widen still asks memory |
| 7 | Flexibility and efficiency | 2 | **3** | Widen unlock is the power path |
| 8 | Aesthetic and minimalist design | 1 | **2** | Density fixed; verb soup remains |
| 9 | Error recovery | 2 | **3** | Claim desk chip / Retake |
| 10 | Help and documentation | 2 | **2** | Live cues good; stage map still invisible |
| **Total** | | **19** | **26/40** | **Needs interaction polish, not another packing wave** |

Rating band: **OK → fair.** Packing moved the needle; remaining failures are authority and verb hierarchy.

---

## Persona red flags

**Jordan (tonight pick, first Guided)**  
Completes dials → clear shelf → copy offers deepen *and* widen *and* re-dial. Opens FAB Deepen; third poster hides. Survives Claim. Widens → tag cloud returns → thinks Guided broke. Risk: abandons at Widen, not at dials.

**Alex (cinephile power)**  
Loves Claim desk chip + decade peeks. Hates Classic band + All eras. Flips to Self for 2020s scrub, loses Classic context, invents Retake. Wants Widen = Guided tray **without** Surprise/Less well-known unless asked.

**Sam (returning)**  
Hub Enter dumps into Claim mid-tour. Expected browse. FAB still says Deepen from last world muscle memory. Warps work once Horror is focused; otherwise hunts door list.

---

## Mode-split B — what still fights the law

```
SEED → DIAL → CLAIM → DEEPEN → BROWSE(Widen)
```

| Stage | Law | Residual fight |
|-------|-----|----------------|
| CLAIM | Shelf owns fold | Four-verb frame; dual Deepen; Featured competes with Pass |
| DEEPEN | Companion defends shelf | Panel covers shelf; can open during BROWSE |
| BROWSE (Widen) | Tray + parked dials | Self steer at full weight; All eras vs Classic band |
| SELF flip | Re-stage browse | Decade bootstrap ignores dial era |
| HUB | Atlas enter | Silent Guided resume |

Packing closed: Claim scroll archaeology, timeline-under-dials, hub 3vh wall, Companion free-roam opening pitch (mostly).

---

## Clarify / onboard / delight (interaction-only)

**Clarify**
- Whisper: never “Classic band” while All eras selected — either “Classic dial parked · browsing all eras” or auto-focus Classic decades.
- FAB: Guided = “Deepen shelf”; Self = “Talk” is fine — drop desk Deepen duplicate.
- Hub Enter: “Resume Guided tour” vs “Enter world” when session exists.

**Onboard**
- First Widen: one-line coachmark on Claim desk chip (“Park tray · return to tonight”).
- First mode flip after Claim: show inherited decade once.

**Delight**
- Claim Watchlist: already has count — pulse the shelf card, do **not** auto-open Deepen.
- Widen unlock: Claim desk chip gold flash once — then hush. No confetti over tag chips.

---

## Suggested command order (later implement)

1. `/clarify` — Classic band ↔ All eras contract; dual Deepen labels; Hub resume copy  
2. `/onboard` — Widen coachmark; Enter vs Resume  
3. `/distill` — Claim frame verbs; park Surprise/tags behind Tune on Guided browse  
4. `/arrange` — Deepen panel vs shelf occlusion; Widen default decade from dial  
5. `/delight` — Claim desk chip / Watchlist pulse only  
6. `/polish`

---

## Success criteria (verifiable)

1. Widen with Classic dial selected does **not** land All eras without an explicit “All eras” choice.  
2. Guided Claim shows **≤1** control whose accessible name includes “Deepen”.  
3. Claim complete frame copy names **≤2** actions (claim + one escape).  
4. Self flip after Classic Claim opens a decade inside the Classic band (or announces the jump).  
5. Hub Enter after an active Guided session either resumes with labeled CTA or opens Self by default.  
6. DEEPEN open leaves all three Tonight posters identifiable without scrolling the panel away.  
7. Guided browse Surprise / tag cloud are not visible until Tune (or equivalent) is opened.

---

## Out of scope

Visual restyle, token swaps, a11y P1 sweep, density re-measure thrash, implementation patches, git. Sister roast2 slices may own visual / a11y; this doc owns **post-pack interaction authority** — who speaks, which era is true, how many deepeners, what Enter resumes.
