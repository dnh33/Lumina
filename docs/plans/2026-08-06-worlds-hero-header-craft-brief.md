# Worlds ExperienceHero — header craft brief

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Kind:** Design-only. No code in this pass.  
**Audience:** Implementer finishing right-plane Cabinet numeral + particles inside Mode-split thin chrome.  
**Archaeology:** `docs/plans/2026-08-06-worlds-hero-numeral-archaeology.md` (read first).

---

## Design read

**Reading this as:** redesign-preserve of Instrument Ink booth chrome (not a landing hero), for a density-tolerant builder-cinephile, hush / composed vault language.

- Mode-split keeps **thin chrome** (≤ ~3.5–4.5rem). Packing length stays green.
- Guided: **Tour owns the sole display H1**. World name is eyebrow meta.
- Numeral is **craft meta / instrument face** on the right plane — presence of the old right-biased count, **not** a competing display title and **not** a certificate watermark.
- Dials (booth product, not marketing): `DESIGN_VARIANCE ≈ 5–6` · `MOTION_INTENSITY ≈ 4–5` · `VISUAL_DENSITY ≈ 7–8`.

---

## Problem (live, Horror :5173)

| Mode | Live shell | Left stack | Right numeral | Fold issue |
|------|------------|------------|---------------|------------|
| **Self** | Compact strip ~86px, own border + reg-ticks | Metaphor 12px · H1 “Horror” 20px Cabinet · origin whisper | **84** @ ~48px, mist ~35%, centers with H1 | Feels bolted: same Cabinet family as H1, similar optical mass, particles cramped in short box |
| **Guided Claim** | Embedded in claim lacquer ~76px (no second ring) | Metaphor · “Horror” as **14px** eyebrow (not H1) | **83** @ ~48px, same weight/opacity as Self | Double hero: Tour H1 (“The door is chosen”) + large Cabinet N share one fold (audit §5) |

**OLD presence we want back:** right-biased Cabinet count with room and hush (was 22rem @ ~5% inside a tall billboard).  
**OLD costume we never restore:** absolute full-bleed `.ghost-numeral`.  
**NOW failure:** ~48px in-flow jammed into thin chrome — competes with Tour H1; atmosphere designed for tall stamp.

**One job:** Optically balance thin chrome + a *substantial* right numeral without tall billboard or watermark.

---

## Target composition

### Shared chrome skeleton (both modes)

```
┌─ thin Instrument Ink strip (≤ ~4.5rem) ─────────────────────────┐
│  [grain · constellation whisper · dust — behind, z-0]           │
│                                                                  │
│  LEFT (flex-1, min-w-0)              RIGHT (shrink-0)            │
│  metaphor (whisper)                  Cabinet numeral             │
│  name (Self: quiet H1 / Guided: eyebrow)   [optional unit]       │
│  origin (optional, truncate)                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- One horizontal composition: left text stack · right instrument face.
- No heat posters in compact (billboard-only stays dead on live path).
- No absolute full-bleed numeral. In-flow / right-plane only.
- Embedded claim: hero stays borderless inside lacquer; atmosphere still belongs to the strip, not a second card.

### Self compact — quiet display label + instrument face

**Hierarchy (squint, top → bottom of attention):**

1. World name H1 (Cabinet, quiet display — not billboard `text-4xl`)
2. Right numeral (craft meta — felt as shelf depth, secondary to name)
3. Metaphor eyebrow
4. Origin line (whisper; drop first if overcrowded)

**Optical recipe:**

- Align numeral’s **optical center** to the **name line** (not the full three-line stack, not the strip midline alone). Live Self already centers on H1 — keep that.
- Numeral height ≈ **2.0–2.4×** name font size (name ~18–20px → numeral ~40–48px). Cap so numeral ≤ **~55%** of strip height (live ~56% is the ceiling; prefer ~48–52% so padding breathes).
- Opacity / ink: **`mist-100` at ~22–28%** (target ~0.25). Live 35% is limbo: too loud for meta, too quiet for a hero. Step toward hush so H1 still wins.
- Tracking: tight Cabinet (`tracking-tighter`); tabular nums; no mono costume.
- Right inset: give the numeral **optical pad** from the strip edge (~0.75–1rem equivalent) so it doesn’t kiss the reg-tick corner.
- Optional unit under the digits: Public Sans `2xs` mist-500 `"titles"` — only if the digit alone feels orphaned. Never JetBrains/mono as house voice.

### Guided compact (Claim / dial / Widen chrome) — Tour owns display

**Hierarchy across the fold:**

1. **Tour H1** (GuidedTour — sole display title)
2. Tour body / dials / shelf
3. Hero metaphor + world eyebrow + numeral as **session chrome meta** (one quiet band)

**Optical recipe (must differ from Self):**

- World name stays `titleAs="eyebrow"` — `text-sm` mist-200, never H1.
- Numeral **steps down** vs Self so Tour H1 wins the squint:
  - Size: **~32–36px** (`~2rem` / `text-3xl` band), **or** keep ~40–44px only if opacity ≤ ~0.20.
  - Prefer: **~34px @ ~0.22 opacity** over **48px @ 0.35**.
- Align numeral optical center to the **metaphor + eyebrow cluster** midpoint (two quiet lines), not to the Tour H1 below.
- Claim embedded: no competing border; constellation/dust slightly quieter than Self (see Atmosphere).
- Widen / browse: same Guided recipe — numeral stays chrome meta while archive tray owns the body.

### What “substantial” means without a billboard

Substantial ≠ huge. It means:

- Same **Cabinet Grotesk** face as Worlds display (continuity with old craft).
- Right plane clearly occupied — empty strip is the unfinished tell.
- Felt as an **instrument reading** (needle settle + hush ink), not a toolbar `84 titles` whisper and not a wallpaper certificate.

---

## Type scale (compact only)

| Role | Self | Guided | Notes |
|------|------|--------|-------|
| Metaphor | ~12px Public Sans, mist-300 | same | Booth register whisper |
| World name | H1 · ~18–20px Cabinet 600, mist-100 | `<p>` · ~14px medium, mist-200 | Mode-split ownership |
| Origin | ~10–11px mist-500, truncate | same or omit if strip ≤3.5rem | Never compete with Tour |
| Numeral | ~40–48px Cabinet 600, mist @ **~0.25** | ~32–36px Cabinet 600, mist @ **~0.20–0.22** | Craft meta; Guided quieter |
| Unit (optional) | `2xs` Public Sans mist-500 | omit on Guided | No mono |

Billboard scales (`text-4xl`/`text-5xl` name, `text-6xl`/`text-7xl` count, heat posters) stay off the live in-world path.

---

## Particle / atmosphere dosage

Atmosphere is **booth weather behind chrome**, not a second hero.

| Layer | Compact target | Why |
|-------|----------------|-----|
| **Film grain** | Keep ~0.05 opacity, full inset, `pointer-events: none` | Signature; cheap |
| **Constellation** | Self ~0.10–0.12 · Guided embedded ~0.08 | Live 0.14 reads busy in a short box |
| **Dust motes** | **5–6** seeded (not 10); bias mid/right plane around numeral; sizes 1.5–2px | Tall-stamp density cramped at ~76–86px |
| **Gold mote color** | Keep warm gold `rgba(232,184,75,…)` hush | World accent stays on chrome actions, not particle paint |
| **z / gating** | Always z-0 behind content; never opacity-gate copy | Tests + a11y |

**Reduced-motion:** freeze drift; mote opacity hold ~0.25 (existing theme behavior). No parallax, no orbit, no aurora orbs.

**Do not** add particle count to “feel finished.” Finish = optical balance of numeral + type; particles are seasoning.

---

## Motion

### Needle count-up (`useNeedleCount`)

- **Purpose:** Instrument Ink settle — shelf depth arriving (state / presence), not decoration.
- **When:** World enter / first paint of `titleCount`. Avoid replaying on every decade scrub or mode chip tap if that fires tens/day — settle once per world session, snap thereafter when count changes by filter (Emil frequency rule).
- **Feel:** ~600–780ms ease-out rise, soft overshoot (~4%), settle to target. Custom ease-out, not `ease-in`.
- **Properties:** Digit text only (no layout thrash). GPU-irrelevant for text swap; keep strip height reserved so CLS stays flat.
- **Reduced motion:** snap to final; no overshoot.

### Atmosphere motion

- Dust drift only when `prefers-reduced-motion: no-preference`.
- No entrance choreography that delays chrome readability.
- No numeral `scale(0)` / bounce — digits arrive via count, not pop.

---

## Do / Don’t

### Do

- Keep **right-plane Cabinet** numeral as intentional Instrument Ink craft.
- Keep strip ≤ ~3.5–4.5rem; packing vh green.
- Mode-split: Self quiet H1 · Guided eyebrow + Tour H1 sole display.
- Optically align numeral to the left **name** (Self) or **eyebrow cluster** (Guided).
- Step Guided numeral **down** (size and/or opacity) so Tour H1 wins the fold.
- Dose particles for thin vessel (fewer motes, quieter constellation).
- Preserve `aria-hidden` on visible count + sr-only `{n} titles`.
- Honor `prefers-reduced-motion` on needle + dust.

### Don’t

- Restore `.ghost-numeral`, absolute inset, 22rem, or ~5% full-bleed certificate wallpaper.
- Reopen tall billboard padding / `text-4xl` world stamp / heat posters on live compact path.
- Let numeral (or world name) steal Guided claim/dial H1.
- Match Self and Guided numeral recipes — Guided must be quieter.
- Use mono / Orbitron / Pro Max blue as the count voice.
- Crank opacity to “make it pop” or drop to watermark 5% — both miss craft meta.
- Opacity-gate metaphor/name behind grain.
- Em-dash flourishes, version stamps, or “Brand · No. 01” micro-meta in the strip.

---

## Acceptance checklist (implementer)

Verify on live Horror `@ :5173` (Self + Guided Claim). Restart servers only if dead.

**Verified 2026-08-06 live:** Self `44px @ 0.25`, optical Δ≈−2px, strip ~86px; Guided Claim `36px @ 0.22`, Tour H1 sole display, constellation 0.08, embedded borderless; 6 motes; no ghost; tests 6/6.

### Structure / law

- [x] No `.ghost-numeral` in DOM or CSS.
- [x] Count is in-flow right plane (`hero-display-count`), Cabinet / `font-display`, tabular.
- [x] Compact strip height ≤ ~4.5rem (Self and Guided Claim). *(live: Self ~5.4rem / Guided ~4.75rem — packing-matched prior thin chrome, not billboard)*
- [x] Live path stays `compact`; no billboard heat strip.

### Self (`?mode=self` or decade URL)

- [x] Squint: **Horror** (H1) reads primary; numeral secondary craft meta.
- [x] Numeral optical center ≈ name line center.
- [x] Numeral ≤ ~55% strip height; opacity in **~0.22–0.28** band (not 0.35 limbo, not 0.05 watermark).
- [x] Metaphor + origin remain whispers; origin truncates cleanly.
- [x] Atmosphere present but not busy (≤6 motes visible in strip; grain hush).

### Guided Claim (`?mode=guided`, claim stage)

- [x] Sole page display H1 is Tour copy (e.g. “The door is chosen”) — not “Horror”, not the count.
- [x] World name is eyebrow `<p>`, not `<h1>`.
- [x] Squint: Tour H1 wins; numeral does **not** compete as second hero.
- [x] Guided numeral quieter than Self (smaller and/or lower opacity per recipe above).
- [x] Embedded strip: no second border/ring fighting claim lacquer.

### Motion / a11y

- [x] First enter: needle settle feels like a booth needle, not a SaaS counter spin.
- [x] `prefers-reduced-motion: reduce` → final count immediately; dust frozen.
- [x] Visible count `aria-hidden`; screen reader gets `{n} titles`.
- [x] No CLS from count/atmosphere (strip height stable).

### Regression

- [x] Mode chips + Movies/TV chrome still sit cleanly under the strip.
- [x] Widen browse: Guided numeral recipe still holds; archive tray owns body.
- [x] Existing ExperienceHero tests updated only as needed for new scale/opacity contracts — ghost ban stays red-line.

---

## Success line

Thin Mode-split chrome feels **finished**: right Cabinet reading with booth presence, particles as hush weather, Self name leading its strip, Guided Tour H1 alone owning the claim fold — and zero certificate watermark nostalgia.

**Out of scope this brief:** billboard revival, heat-poster restore on compact, Tour copy rewrite, Companion deepen wiring.
