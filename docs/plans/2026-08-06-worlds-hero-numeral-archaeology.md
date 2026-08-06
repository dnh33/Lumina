# Worlds ExperienceHero numeral — archaeology

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Scope:** Archaeology only. No redesign. Document BEFORE packing stripped the hero numeral craft vs NOW after right-side Cabinet restore.  
**Law:** NOT certificate full-bleed watermark (`ghost-numeral`). YES big right-plane Cabinet craft that fits Mode-split thin chrome.

---

## Sources

| Era | Where |
|-----|--------|
| **OLD billboard + ghost** | Git `HEAD` / `dd7be8e` still ships it: `ExperienceHero.tsx` + `theme.css` `.ghost-numeral`. Born `8b8b971` (Instrument Ink W1–2); dust/grain layered `c1c8397` (Wave 3). |
| **Packing strip (V-Ghost / W1.1)** | Docs: `2026-08-06-worlds-packing-status-board.md`, `2026-08-06-worlds-ux-optimal-wave.md` §5, `2026-08-06-worlds-amazing-or-nah-gate.md`. Ghost CSS/markup removed in **working tree** (uncommitted vs HEAD). |
| **NOW Cabinet restore** | WT `ExperienceHero.tsx` + tests; live reverify `2026-08-06-worlds-feedback-reverify.md` §2. New: `HeroAtmosphere.tsx`, `useNeedleCount.ts` (untracked). |

---

## 1. OLD composition (pre-packing Instrument Ink billboard)

**Shell:** Tall carbon panel — `rounded-3xl`, `p-6 sm:p-10`, `reg-ticks`, flat `bg-ink-850/60` (no gradient). World name = sole display H1 (`text-4xl` / `sm:text-6xl`). Metaphor + tone + “Seeded by…” sit in the left text stack. No Mode-split / Guided / compact props.

**Numeral — certificate watermark (banned now):**

- Class `.ghost-numeral` (`theme.css` ~332–346 @ HEAD): `position: absolute; inset: 0; z-index: 0`; Cabinet via `var(--font-display)`; weight 600; `line-height: 0.8`; `letter-spacing: -0.04em`; color `rgba(205,205,217,0.05)` (~5% mist).
- Instance: `fontSize: "22rem"`, flex `justifyContent: "flex-end"`, `paddingRight: "2rem"` — **right-biased full-bleed ghost**, not a sidebar readout. CSS comment said “hard-left”; JS overrode to right.
- Static `titleCount` — no needle settle. `aria-hidden`. Lived behind copy (`z-0` vs content `z-10`).

**Particles (Wave 3, `c1c8397`):** Inline in hero (not yet `HeroAtmosphere`):

- `.film-grain` — SVG fractal noise, ~5% opacity, `mix-blend-mode: overlay`, absolute inset z-0.
- **8** `.dust-mote` spans — warm gold `rgba(232,184,75,0.5)`, `dust-drift` 14s ease-in-out infinite; seeded left/top/size/delay. `prefers-reduced-motion` → freeze + opacity 0.25.

**Motion / feel:** Atmosphere drifted; numeral did not animate. Composition = one tall stamp: giant mist N as wallpaper + big world H1. Felt “finished” because the numeral had **room** (22rem inside a deep panel) and stayed atmospheric, not chrome chrome.

---

## 2. Packing strip (what left the hole)

Mode-split B / V-Ghost / W1.1 thin chrome (docs, 2026-08-06):

| Change | Effect |
|--------|--------|
| Delete `.ghost-numeral` markup + CSS | Certificate watermark gone (taste ban). |
| Hero → ≤ ~3.5–4.5rem strip | Billboard padding/H1 scale killed; fold length green. |
| Count → mono whisper `{n} titles` + `useNeedleCount` | Honest meta, not craft hero (`amazing-or-nah`: `39/40 titles`, `ghostWatermarkCount=0`). |
| Kinetics restore | Dust/grain (later `HeroAtmosphere`) kept; **ghost never returns**. |

Net: packing saved length; numeral craft went from wallpaper presence → data whisper. Daniel’s “unfinished header” starts here.

---

## 3. CURRENT composition (right Cabinet restore on thin chrome)

**Call site** — always compact in-world (`GenreExperience.tsx` ~933–943):

- `compact` · `titleAs={guided ? "eyebrow" : "display"}` · `embedded={claimUnified}` · `titleCount` · `heatItems` (heat unused when compact).

**Shell** (`ExperienceHero.tsx` ~58–70, 152–165):

- Compact: `rounded-xl`, `px-3 py-2` / `sm:px-4 sm:py-2.5`, optional embedded (no second border inside claim lacquer).
- Flex row: left stack (metaphor + name/eyebrow + optional origin) · right `hero-display-count`.
- Count: `font-display`, `tabular-nums`, `tracking-tighter`, `text-mist-100/35`, compact `text-[2.75rem] sm:text-5xl` (~44–48px). In-flow `shrink-0`, **not** absolute watermark. Live: Horror **83**, right bias (`left≈1314` @ 1440 — feedback-reverify).
- `useNeedleCount` (~780ms ease-out + soft overshoot); reduced-motion → snap. Visible count `aria-hidden`; sr-only `{n} titles`.
- Billboard-only heat strip (3 posters) — **never shown** on live path (`compact` always true).

**Atmosphere** (`HeroAtmosphere.tsx`): constellation web @ opacity 0.14 + `.film-grain` + **10** dust motes (`HERO_DUST_MOTES`, testids `hero-dust-mote`). Same CSS treatments (`theme.css` ~424–468). Ghost class **absent** in WT theme.

**Guided typography split:**

- Hero world name → `<p>` eyebrow (`text-sm mist-200`) when `titleAs="eyebrow"`.
- Tour owns display H1 — e.g. “The door is chosen” / dial lines @ `GuidedTour.tsx` ~623, ~657 (`font-display text-lg` / `sm:text-xl`).

Tests lock the ban: `.ghost-numeral` null; `hero-display-count` present (`ExperienceHero.test.tsx` ~62–65, ~95–142).

---

## 4. Craft gaps — why it still feels like an “unfinished header”

1. **Scale vs vessel** — Old N was 22rem inside a deep panel; now ~48px inside a ≤4.5rem strip. Same font family, wrong architectural role — reads bolted-on, not composed.
2. **Double hero on Guided claim** — Eyebrow “Horror” + Tour H1 + large Cabinet 83 share one fold (guided-tour UX audit §5; arrange squint). Tour H1 should win; numeral still competes.
3. **Opacity / weight** — `mist-100/35` is louder than old 5% watermark but quieter than a deliberate instrument face — limbo: neither atmosphere nor primary readout.
4. **Particles cramped** — Grain/motes/constellation designed for tall stamp; in thin chrome they scrape a short box (reverify still counts ~51 dust/grain hits — present, not spacious).
5. **Heat orphan** — Poster craft only on `!compact`; live always compact → right plane is bare digits, no shelf silhouette.
6. **Needle settle without stage** — Motion exists (`useNeedleCount`) but strip height doesn’t sell “Instrument Ink needle”; feels like a counter tick in a toolbar.
7. **Doc tension** — Optimal-wave §5 closed on “mono whisper + no ghost”; feedback-reverify PASS’d “big Cabinet RIGHT.” Restore landed mechanically; craft alignment with thin chrome + Guided H1 ownership still open.

---

## 5. Restore constraints (for any later craft pass)

| YES | NO |
|-----|-----|
| Big **right-plane** Cabinet numeral as intentional chrome craft | Full-bleed / absolute `ghost-numeral` certificate watermark |
| Fit **Mode-split thin chrome** (≤ ~3.5–4.5rem; packing length stays green) | Reopen packing vh / Mode-split B geometry |
| Keep atmosphere (grain + dust ± constellation) behind content, reduced-motion safe | Opacity-gate copy; colored-orb aurora |
| Guided: Tour H1 sole display hero; world name stays eyebrow | Numeral (or world name) stealing claim/dial H1 |
| In-flow / right-aligned display count (Cabinet Grotesk) | Mono “house voice” costume; Pro Max blue/Orbitron |

**One line:** Bring back the *presence* of the old right-biased count without bringing back the watermark costume — and make it belong inside the thin Mode-split header next to Guided’s H1 ownership.

---

## File:line index

| Piece | Path |
|-------|------|
| NOW hero | `client/src/components/genre/ExperienceHero.tsx` (compact shell ~58–70; numeral ~152–165; atmosphere ~72–73) |
| Atmosphere | `client/src/components/genre/HeroAtmosphere.tsx` (motes ~4–15; render ~29–58) |
| Needle | `client/src/hooks/useNeedleCount.ts` |
| Call site | `client/src/pages/GenreExperience.tsx` ~933–943 |
| Tour H1 | `client/src/components/genre/GuidedTour.tsx` ~623, ~657 |
| Grain/dust CSS | `client/src/theme.css` ~424–468 (WT); `.ghost-numeral` **deleted** in WT, still @ HEAD ~332 |
| OLD ghost instance | `git show HEAD:…/ExperienceHero.tsx` — `ghost-numeral` + `fontSize: 22rem` |
| Birth commits | `8b8b971` (ghost), `c1c8397` (grain+8 motes) |
| Live evidence | `docs/plans/2026-08-06-worlds-feedback-reverify.md` §2; `…-guided-tour-ux-audit.md` §5 |
