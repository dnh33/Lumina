# Worlds — Emil QA gate (taste / motion / interaction)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Live:** `:5173` UP · `:4000` UP (no restart)  
**Skills:** `emilkowalski/skills` installed → project `.agents/skills` + `~/.agents/skills`  
**Inventory SoT:** `docs/plans/2026-08-06-worlds-full-inventory.md` · canvas `worlds-full-inventory`  
**Law:** Mode-split B packing CLOSED. Redesign-preserve booth. No packing reopen.  
**Canvas:** `worlds-emil-qa-gate.canvas.tsx`

---

## Verdict

**SOFT PASS — ready for Daniel look.**

Instrument Ink / Mode-split hold. Horror claim loop (dials → Tonight shelf → bag → Widen → Deepen) is coherent and restrained. Motion is mostly purpose-driven (`EASE_OUT_EXPO`, reduce-motion, companion `scale(0.97)`). No feel-breaking P0 that blocks a human look. Ship Daniel eyes before chasing polish; fix P1 press/hover/needle after if anything feels dead or sticky.

| Gate | Result |
|------|--------|
| Taste / booth cohesion | **PASS** |
| Motion craft (Emil bar) | **SOFT** — no Block regressions; several High/Med polish items |
| Interaction feel (Apple Response / press) | **SOFT** — dials press; primary claim verbs + FAB lag |
| Packing / booth preserve | **PASS** — untouched |
| Ready for Daniel look? | **Yes** |

---

## Skills landed

| Skill | Project path | Agent path |
|-------|--------------|------------|
| emil-design-eng | `Lumina/.agents/skills/emil-design-eng` | `~/.agents/skills/emil-design-eng` |
| review-animations | `…/review-animations` | `~/.agents/skills/review-animations` |
| find-animation-opportunities | `…/find-animation-opportunities` | `~/.agents/skills/find-animation-opportunities` |
| improve-animations | `…/improve-animations` | `~/.agents/skills/improve-animations` |
| animate | `…/animate` | `~/.agents/skills/animate` |
| animation-vocabulary | `…/animation-vocabulary` | `~/.agents/skills/animation-vocabulary` |
| apple-design | `…/apple-design` | `~/.agents/skills/apple-design` |
| pick-ui-library | installed (skipped for QA) | same |
| prototype | installed (skipped for QA) | same |

Install: `npx skills@latest add emilkowalski/skills --yes` → project `.agents/skills` + mirrored into `C:\Users\Danie\.agents\skills\`.

---

## Live sniff (Chrome CDP)

| Surface | URL / action | Observation |
|---------|--------------|-------------|
| Hub Doors | `/genre` | Dense 2 / Thin 6 / No 8; Resume on Horror/Documentary/Fantasy; Enter → Self |
| Horror Self | Enter Horror | Self pressed; Timeline 1970s; tray + Featured Alien; Archive chat nav; Talk FAB |
| Mode flip | Self → Guided | Remount to Guided claim; whisper “Claiming tonight's picks” |
| Guided Claim | `?mode=guided` | Dials Creeping/Classic/Known dread; shelf Exorcist/Thing/Rosemary; Tonight bag + Library link |
| Widen | Widen CTA | `Guided · archive · Classic band`; era tray; Back to shelf |
| Deepen | FAB on Widen | Dialog modal; dial chips + prefill; greeting still generic vault voice |
| Tonight bag | Claim | Rosemary's Baby + Open in Library + Stay on shelf |
| Widen → Back (scripted) | JS click Widen then Back | Stays `mode=guided`; stage browse→claim. CDP a11y click once misfocused Self — not a product flip |

---

## review-animations — findings table

| Before | After | Why |
| --- | --- | --- |
| Tour needle `animate={{ width: \`${needlePct}%\` }}` @ `GuidedTour.tsx:708` · `duration: 0.45` | `scaleX` from `transform-origin: left` · `duration: 0.28` · `ease: EASE_OUT_EXPO` (or `transform: scaleX()`) | Width is layout/paint; GPU-only = transform/opacity. 450ms > 300ms UI budget for a 1.5px bar |
| Hub doors `animate-rise` 500ms (`theme.css:56` + `GenrePicker.tsx:246`) | Cap rise to **240–280ms** `var(--ease-out-expo)` · keep 40ms stagger | UI under 300ms; 16-card entrance feels slow on every hub visit |
| Door `hover:-translate-y-0.5` ungated (`GenrePicker.tsx:246`) | Wrap lift in `@media (hover: hover) and (pointer: fine)` (or `motion-safe` + hover MQ) | Touch sticky-hover; Emil a11y non-negotiable |
| Poster `duration-500` + `group-hover:scale-105/1.04` (`GuidedTour.tsx:446`, `TimelineScrubber.tsx:350`) | `duration-200` · `scale-[1.03]` · hover MQ | Tens/day hover; 500ms zoom is decorative drag |
| Claim Watchlist / Pass / Open / Widen / Back / Retake — no `:active` scale | `active:scale-[0.97]` · `transition: transform 140ms var(--ease-out-expo)` | Apple Response: feedback on pointer-down; dials already have `active:scale-[0.98]` |
| `.companion-fab` hover only (`theme.css:278+`) — no `:active` | `:active { transform: scale(0.97) }` · 100–140ms ease-out | FAB is the deepen affordance; dead press = dead booth |
| Framer `y` / `scale` / `width` shorthands on shelf/dial/companion | Prefer CSS transitions for predetermined entrances; keep FM for AnimatePresence | Shorthands run on main thread under load (Emil / Vercel tab lesson) — P2 here |
| `.icon-btn` `transition` (Tailwind multi-prop) | `transition: background-color 160ms, color 160ms, transform 140ms` | Avoid broad transition sets; specify properties |

**Review verdict:** **Approve with soft findings** — no `scale(0)`, no `ease-in` UI, no keyboard-forced motion, reduce-motion honored on mode-stage + FM paths. Not a hard Block.

---

## Findings by surface

### Hub Doors — soft

- Entrance stagger + rise is tasteful but **long** (500ms).  
- Hover lift/glow works on pointer; ungated for touch.  
- Gold ration correct (Enter mist → gold on hover/focus). Metaphor labels remain chrome (inventory).

### Horror Self — pass / soft

- Mode-stage enter 240ms hush — correct booth.  
- Timeline decade tabs: no gratuitous motion (good — high frequency).  
- Tray poster hover zoom 500ms — reduce.  
- Featured Watchlist lacks press scale (same claim-verb gap as Guided).

### Guided Claim — pass / soft

- Dial radios: stagger + `active:scale-[0.98]` — best press feel in Worlds.  
- Shelf enter stagger 40ms · 300ms — on budget edge; ok for occasional claim.  
- Needle width animation — sole clear GPU foul.  
- Tonight bag appear: opacity bridge only — fine; don’t add bounce.

### Widen — pass

- Stage park reads clean (`Guided · archive · Classic band`).  
- Back / Retake present; no packing chrome.  
- Same tray hover zoom debt as Self.

### Deepen — soft (product > motion)

- Panel enter: `opacity + y:24 + scale:0.97` · 220ms · good physicality + origin-bottom-right.  
- Escape/close works; tour chips + prefill correct.  
- Greeting still generic (“Good afternoon…”) vs shelf-bound chips — **inventory gap**, not motion.  
- FAB needs press feedback.

### Mode flip — pass

- CSS `.mode-stage` 240ms · reduce-safe — don’t add FM here.  
- Flip remounts stage; hush is enough.

### Tonight bag — pass / soft

- Bag + Library link visible; Stay on shelf dismiss.  
- Library `?status=watchlist` still ignored (inventory) — out of motion scope.  
- Don’t celebrate bag with confetti/bounce.

---

## find-animation-opportunities

### Opportunities (gated)

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | Claim Watchlist / Pass / Widen / Back (`GuidedTour.tsx` action row + CTAs) | Color/fill only | Feedback | Occasional | `:active { transform: scale(0.97) }` · `transition: transform 140ms cubic-bezier(0.22,1,0.36,1)` |
| 2 | `.companion-fab` (`theme.css`) | Hover color only | Feedback | Tens/day (subtle) | Same press scale 100–140ms; no hover lift |
| 3 | Tonight bag mount | Instant/opacity | Preventing jarring change | Occasional | `@starting-style` or existing FM opacity 200ms from `opacity: 0.55` pattern already on shelf lists — keep tiny |
| 4 | Needle fill | Width tween | State indication | Occasional | `scaleX` 280ms `EASE_OUT_EXPO` |
| 5 | Hub door press (card) | Hover lift only | Feedback | Occasional | `active:scale-[0.985]` on card; drop or gate hover translate |

### Rejected (do NOT animate)

- **Self ↔ Guided / Movies ↔ TV toggles** — tens/day stage remount; mode-stage hush is enough. No spring flip.  
- **Decade timeline tabs / ◀ ▶** — high-frequency browse; never animate tab change (Raycast rule).  
- **Shell nav Discover/Library/Worlds** — core nav; color only.  
- **WhisperStrip copy swaps** — status text; color transition already; no slide.  
- **Dust / constellation / grain loops** — chrome atmosphere; leave as-is or kill under reduce (already gated). Don’t amplify.  
- **Map kinship warps / NeighborRail** — thin product; motion won’t create habit.  
- **Mood / Archive chip walls** — thin stages; don’t paint with stagger to fake depth.  
- **Export Save note / Printable** — leave path; no delight budget.  
- **Keyboard Map markers / dial arrow keys** — never animate keyboard-initiated focus.  
- **HeroAtmosphere / metaphor backdrops** — chrome; packing CLOSED.

**Opportunity verdict:** Interface needs **less new motion**, more **press feedback** on claim verbs. Highest leverage = #1 + #2.

---

## apple-design (booth HUD, not Apple cosplay)

Applied where they fit a dark instrument booth:

| Principle | Worlds fit |
|-----------|------------|
| Response on press | Dial radios good; Watchlist/FAB weak |
| Interruptibility | FM AnimatePresence ok for occasional panels; don’t spring mode flip |
| Spatial consistency | Companion origin-bottom-right + exit same path — good |
| Materials | Deepen rail blur/translucency reads as HUD layer — keep; don’t stack more glass |
| Restraint / Purpose | Booth hush > Dynamic Island bounce |
| Reduced motion | Global crush + FM branches + mode-stage — solid |

Skip: rubber-band drawers, bounce springs, translucent toolbar stacks, SF system font swap.

---

## Prioritized fix plans (improve-animations style)

### P0 — none for this gate

No feel-breaking Block (`ease-in`, `scale(0)`, keyboard motion, packing regression). **No code fix applied** (&lt;20 min budget reserved for true P0).

### P1 — do next (self-contained)

**1 — Claim verb press feedback**  
- Files: `GuidedTour.tsx` Watchlist/Pass/Open/Widen/Back/Retake; `GenreModules.tsx` Featured Watchlist/Pass  
- Target: `active:scale-[0.97]` · `transition: transform 140ms cubic-bezier(0.22, 1, 0.36, 1)`  
- Feel: pointer-down compress before click commits  
- Boundaries: no layout change; packing CLOSED

**2 — Companion FAB press**  
- File: `theme.css` `.companion-fab`  
- Target: `:active { transform: scale(0.97) }` · `transition: transform 120ms var(--ease-out-expo), …existing color…`  
- Feel: deepen affordance listens on down

**3 — Needle → scaleX**  
- File: `GuidedTour.tsx:705–714`  
- Target: `transform: scaleX(needlePct/100)` · `transformOrigin: "left center"` · duration `0.28` · `EASE_OUT_EXPO`  
- Feel: same state read, no layout thrash; slow-mo scrub in DevTools

**4 — Hub rise + hover gate**  
- Files: `theme.css` `--animate-rise` → ~260ms; `GenrePicker.tsx` gate `-translate-y` behind hover MQ  
- Feel: doors arrive crisp; no sticky lift on touch

**5 — Poster hover zoom trim**  
- Files: `GuidedTour.tsx`, `TimelineScrubber.tsx`  
- Target: `duration-200` · `scale-[1.03]` · `@media (hover:hover)`  
- Feel: subtle, not Ken Burns

### P2 — polish later

- Replace FM `y` entrances on shelf/dials with CSS `@starting-style` / transitions where Interruptibility isn’t needed  
- Narrow `.icon-btn` transition property list  
- Deepen greeting voice (product, not motion)  
- Library `?status=` consume (inventory gap)

---

## What NOT to animate (standing law)

1. Mode / media toggles beyond existing `.mode-stage` hush  
2. Decade scrub / tray keyboard focus  
3. Shell primary nav  
4. Packing / stage machine structure  
5. Metaphor atmosphere loops (don’t grow)  
6. Thin Hub Mood/Archive to “feel alive”  
7. Tonight bag celebration / bounce  
8. Anything keyboard-initiated  

---

## Code review notes (Emil lens)

<CODE_REVIEW>
Worlds motion stack is intentional: tokens `--ease-out-expo` / `--ease-state` in `theme.css`, mirrored in `client/src/lib/motion.ts` as `EASE_OUT_EXPO`. Mode-split seam uses CSS-only `.mode-stage` (240ms, reduce-safe) — correct frequency call. GuidedTour + CompanionPanel use Framer Motion with `useReducedMotion` branches and physical companion enter (`scale: 0.97`). Dial radios already ship press scale. Primary claim verbs and FAB do not — the loudest taste gap. Sole hard GPU foul is needle `width` animation. Hub door rise at 500ms overshoots Emil’s UI budget. Hover lifts/zooms lack pointer:fine gating. Personality = crisp booth HUD; bounce/delight would fight Instrument Ink.
</CODE_REVIEW>

<PLANNING>
1. Leave packing / stage IA alone.  
2. Execute P1.1–P1.2 (press feedback) first — highest feel ÷ effort.  
3. P1.3 needle scaleX second.  
4. P1.4–P1.5 hub/tray hover polish.  
5. Re-sniff Claim → Widen → Deepen → bag after P1; Daniel look in parallel.  
6. P2 only if Daniel marks sticky/dead spots.
</PLANNING>

<SECURITY_REVIEW>
QA gate is read-only + local CDP. No new endpoints, no secret handling, no auth changes. Skills install is local agent docs only.
</SECURITY_REVIEW>

---

## Evidence

- CDP: Hub Doors · Horror Self · Guided Claim · Widen · Deepen · mode flip · Tonight bag  
- Code: `GuidedTour.tsx`, `CompanionPanel.tsx`, `GenrePicker.tsx`, `TimelineScrubber.tsx`, `theme.css`, `motion.ts`  
- Inventory: `2026-08-06-worlds-full-inventory.md`
