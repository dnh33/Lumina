# Worlds Taste + WIG Roast — Anti-slop · Web Interface Guidelines

**Agent:** Parallel roast (taste + WIG) · no code  
**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Target live:** `http://localhost:5173` + API `:4000`  
**Pass:** **LIVE re-run** (prior pass was code-only; `:5173` down). Both ports **200** this session — no restart. Evidence via `agent-browser` (IDE browser MCP tab-create race; CLI used). Screenshots: `docs/plans/_taste-wig-live-*.png`.  
**Surfaces:** Hub atlas · Horror Self · Guided Claim · Guided Widen · Companion FAB · Shell  
**Skills:** web-design-guidelines (Vercel WIG `command.md` fetched 2026-08-06) · design-taste-frontend (Design Read + AI-tells / clunk for *product* UI)  
**Constraints:** No packing reopen. Mode-split B stands. No certificate watermark.

---

## Design Read

**Reading this as:** redesign-preserve of a cinephile vault *product* surface (booth HUD, not a marketing landing), for a density-tolerant builder-cinephile, with hush / projection-booth language, leaning toward Instrument Ink already locked in `theme.css` / `.impeccable.md`.

**Dials (preserve booth HUD):**

| Dial | Preserve target | LIVE reading |
|------|-----------------|--------------|
| `DESIGN_VARIANCE` | 5–6 booth geometry | Hub atlas asymmetric; in-world thin chrome + claim desk |
| `MOTION_INTENSITY` | 4–5 state, not theatre | Dust drift + dial/shelf; reduced-motion gated |
| `VISUAL_DENSITY` | 7–8 packed archive cockpit | Wave 1 thinned hero; Mode-split B packing holds |

Landing-only rules do **not** apply wholesale. AI-tells, gold discipline, motion-motivated, chip soup, and WIG a11y/focus/animation rules **do**.

---

## LIVE header craft confirm (Wave 1 sniff #5)

| Craft | LIVE | Evidence |
|-------|------|----------|
| Dust motes + film grain (+ constellation) | **YES** | Claim DOM: `motes: 10`, `.film-grain` present, `data-testid=hero-dust-mote`. Feel-not-see (2px gold, opacity-animated). Keep. |
| Mono title count | **YES** | Self `40 titles` / Claim `39 titles` — `font-mono text-2xs tabular-nums` on `[data-testid=hero-title-count]` |
| Certificate ghost watermark | **NO** | `.ghost-numeral` absent in DOM + screenshots. Correct — **do not restore**. |
| Guided title role | **YES** | Claim: sole H1 = `The door is chosen`; world name is `<p>` eyebrow (`data-hero-title=eyebrow`) |

**One line:** Particles + honest mono count are restored and live; the numbered certificate stays dead.

---

## Verdict (LIVE · post–Wave 1)

Wave 1 **landed** on the surfaces that mattered: thin in-world chrome, Tour-owned Claim H1, Featured parked on Claim, Widen as archive browse bar, header kinetics kept without watermark, FAB still lacquer.

What remains is **not packing**. Top clunk is still **hub gold competition**, then **Sparkles-as-AI**, territory **ALL-CAPS parade**, and a few **copy / card-rhythm** nicks on Self + Claim.

---

## LIVE surface notes

### Hub (`/genre`)

- Atlas composition holds: territory map owns fold; Door list / mood demoted. Enter Horror is the clear verb.
- **Gold stack still fights on one fold:** Shell Worlds active `rgb(242,210,136)` + Enter Horror gold border/text `rgb(232,184,75)` + selected node fill `rgba(232,184,75,0.92)`.
- Territory labels still `textTransform: uppercase` + `letterSpacing: 1.32px` (Reading Room / Threshold / …).
- Dense/Thin/No shelf legend uses mono counts — earned.

### Horror Self (`?mode=self`)

- Thin chrome: metaphor + mono N + compact Horror name; tray + decade scrub primary in viewport.
- Featured inspect still mounts on Self (Mode-split B claim-only park). Helper copy **"Inspect pane — one pick for the current shelf"** reads instrument/dev, not booth voice.
- `TAG_VISIBLE = 5` (was 8) — quieter. Also-tagged still shows genre chips under tray when present.
- Heat posters absent on compact chrome (Wave 1 demote) — intentional; do not resurrect billboard.

### Guided Claim (`?mode=guided`)

- Desk + Tonight shelf own the fold. Featured **absent** live (`featured: false`).
- Dials: Breach / Now / Unmarked door + "TAP TO CHOOSE" uppercase micro-hints (rationed vs prior parade; still booth-chrome risk).
- Shelf card rhythm uneven: first card synopsis, siblings title-only → Watchlist/Pass baseline jumps.
- Footer cue strip uses **gold/yellow ring** while world verbs are **horror red** — accent drift on the claim fold.
- Em-dash in TMDB synopsis on shelf button a11y name (content source); UI chrome itself clean of watermark costume.

### Guided Widen

- Browse stage live: cue + **RETAKE** + **Back to shelf**; no Self steer warehouse. Wave 1.4 sniff passes.
- Decade count still echoes (band label + tabs + era thesis) — mild redundancy, not packing.

### Companion / Shell

- FAB lacquer live (dark face, mist border; world-accent when guided) — not gold brick.
- Shell Companion still **Sparkles** icon + `transition-all` on nav links.

---

## WIG findings (terse · LIVE-validated + file:line)

Paths relative to worktree `client/src/`.

### components/Shell.tsx

```text
Shell.tsx:9 - Companion nav uses Sparkles — AI-presence shorthand (taste tell)
Shell.tsx:71 - transition-all → list properties (LIVE: computed transitionProperty=all on nav)
Shell.tsx:41-45 - ✓ in-world active nav yields gold (mist) — keep; hub Worlds gold still competes with Enter
```

### components/genre/ExperienceHero.tsx + HeroAtmosphere.tsx

```text
ExperienceHero / HeroAtmosphere - ✓ LIVE particles (10 dust-motes + film-grain + constellation)
ExperienceHero - ✓ LIVE mono titleCount; ghost-numeral absent
ExperienceHero.tsx:147 - heat img loading=lazy + no width/height — moot on compact Self (heat hidden); keep hygiene if billboard returns
```

### components/genre/GuidedTour.tsx

```text
Guided Claim LIVE - ✓ sole Tour H1; Featured suppressed; Tonight shelf primary
GuidedTour - Retake + TAP TO CHOOSE uppercase — dial chrome OK if rare
Guided Widen LIVE - ✓ archive browse bar (Retake / Back to shelf)
```

### components/genre/GenreModules.tsx

```text
GenreModules.tsx:205 - "Inspect pane — one pick…" developer voice on Self Featured (LIVE)
GenreModules claim stage - ✓ Featured suppressed (LIVE claim)
```

### pages/GenrePicker.tsx + WorldsMap.tsx

```text
WorldsMap territory labels LIVE - uppercase + 1.32px tracking parade
WorldsMap selected node LIVE - fill rgba(232,184,75,0.92) — third gold job with Shell + Enter
GenrePicker Enter Horror LIVE - gold text+border — system enter OK if nodes quieter
```

### components/genre/CompanionPanel.tsx

```text
CompanionPanel - ✓ FAB lacquer LIVE (not gold brick)
CompanionPanel.tsx:301 - "in-world" pill still in source (panel open flaky this pass; treat as open taste debt)
```

### pages/GenreExperience.tsx

```text
GenreExperience.tsx:56 - TAG_VISIBLE=5 (improved from 8) — still chip risk when tags expand
GenreExperience - ✓ skip link LIVE; mode URL sync (mode=guided|self)
```

### theme.css

```text
theme.css dust-mote/film-grain/constellation - ✓ LIVE + prefers-reduced-motion gates
theme.css companion-fab - ✓ lacquer face LIVE
```

---

## Top remaining clunk after Wave 1

1. **Hub gold stack** — Shell Worlds + Enter + filled node on one fold. One fuel job; rest mist / world-accent.

2. **Sparkles = Companion** — Shell nav still reads generic AI product.

3. **Territory ALL-CAPS tracking** — map geography cosplay; sentence case / soft small-caps.

4. **Self Featured instrument copy** — "Inspect pane — one pick…" (`GenreModules.tsx:205`). Booth voice or drop the helper.

5. **Claim shelf card rhythm** — synopsis-only-on-lead card misaligns Watchlist/Pass row.

6. **Claim footer gold ring vs horror red verbs** — accent lock break on the widen cue strip.

7. **Decade triple-echo** on Self/Widen (Timeline / tabs / thesis) — cut one.

8. **Also-tagged + director index** below tray — quieter (`TAG_VISIBLE=5`) but still Letterboxd-adjacent when populated.

9. **Shell `transition-all`** — WIG hygiene.

10. **Uppercase dial micro-hints** — Retake / TAP TO CHOOSE; keep dial *ticks*, starve parade.

---

## What Wave 1 settled (LIVE)

- Thin in-world hero chrome (metaphor + mono N + eyebrow/name); atmosphere kept.
- Guided Claim: Tour H1 only; Featured parked; Tonight shelf owns fold.
- Guided Widen: browse stage bar, not hybrid desk.
- No ghost-numeral regression.
- Companion FAB lacquer (not gold brick).
- Mode-split B contracts intact — **no packing reopen**.

---

## What to KEEP (earned booth craft)

- Map-as-atlas hub composition.
- Guided claim desk + Tonight shelf + Watchlist/Pass in world-accent.
- Mode-split B (claim vs widen).
- ExperienceHero atmosphere + mono count (never watermark).
- Shell yields gold in-world so world verbs own the fold.
- WhisperStrip / outcome coupling; reduced-motion gates.

Do **not** praise: certificate ghost numerals, solid gold FAB, alphabet chip clouds as curation, Featured-as-second-hero on Claim, Sparkles-as-AI mark.

---

## Explicit: restore header number / particle kinetic craft?

### Answer: **YES — particles + honest number. NO — certificate watermark.**

| Craft | Restore? | LIVE status |
|-------|----------|-------------|
| Dust motes + film grain behind hero | **YES** | **Shipped + LIVE** |
| Title count as mono meta | **YES** | **Shipped + LIVE** |
| Giant mist watermark numeral | **NO** | Absent — keep banned |
| Heat posters on Self billboard | Optional | Hidden under compact chrome — OK |
| Optional count-up kinetic | Optional only | Needle present; reduce → static |

---

## Settled vs open (vs roast2 + Wave 1)

| Item | LIVE now | Status |
|------|----------|--------|
| Display font / thin chrome | Compact + eyebrow Guided | **Settled** |
| Ghost numeral | Absent | **Settled** (do not regress) |
| Particles + mono N | Present | **Settled / KEEP** |
| Solid gold FAB | Lacquer | **Settled** |
| Featured on Claim | Absent | **Settled** |
| Widen browse stage | Live | **Settled** |
| Hub gold competition | Enter + node + Shell | **Open** |
| Sparkles Companion | Still | **Open** |
| Territory ALL-CAPS | Still | **Open** |
| Self chip / Featured copy | Quieter tags; bad helper string | **Open / partial** |

---

## Out of scope

Packing fold metrics, Mode-split B reopen, interaction staging sibling roasts, git, implementation.

**Lens answer:** LIVE Worlds after Wave 1 reads as a vault HUD with header kinetics correctly restored (particles + mono, no certificate). Remaining clunk is gold rationing on the hub, Sparkles, territory type parade, and a few booth-voice / rhythm nicks — not fold length.
