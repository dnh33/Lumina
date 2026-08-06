# /Worlds UI Refinement — Instrument Ink × anti-slop

**Governing standards:** `docs/attached-context/operating-manual.md` (The Operating Manual — work in contact with reality), `docs/attached-context/design-philosophy-instrument-ink.md` (Instrument Ink aesthetic), `@.hermes/desktop-attachments/slop.md` (anti-slop law).

**Method (Operating Manual Phases 0–7, superpowers):** every change verified against the running app (screenshots). Cut where checks can live. Re-derive, don't vibe. Attack the conclusion before shipping.

**Current state (VERIFIED 2026-07-16 via live screenshot + theme.css + grep):**
- Fonts slop-tier: `--font-display: Fraunces` (AI-sloppy per slop.md), `--font-sans: Inter` (#1 slop font). No Instrument Ink "sharp Victorian" serif, no mono-for-data register on genre page.
- Background: cool blue+purple radial glows (`rgba(90,90,180,.07)`) + gold tint — slop "cool blue-charcoal" + "radial glow". Instrument Ink wants warm carbon.
- All section heads share ONE tracked-caps label treatment ("READING ROOM", "SCRUB BY ERA", "FILTER BY GENRE", "MARATHON", "EXPORT", "MAKER") — slop "one label treatment everywhere".
- Filled-gold + outlined button pairs (Export Save/Print/Printer; Marathon). slop fill+outline duo.
- `glow-gold` class DEFINED BUT UNUSED. Only gold glow = sidebar logo (vision-confirmed) + live chat avatars (legit live state). Genre page body: no glow.
- `animate-rise` defined but NOT used on genre page → no content-hidden-at-opacity-0 trap. GOOD.
- `font-mono` used only on EpisodeTracker + Settings (real data) → slop-compliant.
- Instrument Ink SIGNATURE REGISTERS MISSING: no ghost-numerals-as-watermarks, no corner registration ticks, no mono provenance readouts, no needle-settle motion, no seeded particle field behind opening.

---

## Wave 1 — Foundation tokens (load-bearing, do first)
**Goal:** retune the global surface + fonts to Instrument Ink; remove blue glow.
1. `theme.css`: background → warm carbon (drop blue radial; keep faint gold emission at low opacity, single warm source, no purple). Tighten ink scale toward carbon.
2. `theme.css`: swap `--font-display` → sharp-Victorian serif (self-hosted; Instrument Ink "felt" register). Swap `--font-sans` → plainspoken grotesque (Instrument Ink "understood"). NOTE: actual woff2 provisioning is a SEPARATE workstream (memory: font migration is separate) — here we wire the token + a graceful fallback chain so the swap is reversible. Flag: if faces aren't provisioned yet, falls back to system serif/sans (acceptable, not broken).
3. Add new Instrument Ink tokens: `--font-mono` (already exists as util; promote to display token for the "trusted" register), `--signal` (the ONE rationed warm signal color = gold, already present), registration-tick + ghost-numeral helpers.
4. Verify: screenshot before/after; no purple; fonts render (or clean fallback); contrast holds.

## Wave 2 — De-slop the genre page (element by element)
**Goal:** remove the tells, differentiate the voice, add Instrument Ink detail.
5. `GenreExperience.tsx` + `ExperienceHero.tsx`: replace generic tracked-caps eyebrow stack with Instrument Ink register hierarchy — serif H1 (felt), grotesque subline (understood), and a MONO provenance/era readout (trusted). Add corner registration ticks to the hero panel.
6. Section heads (Timeline "SCRUB BY ERA", filters, Marathon, Export, Neighboring Worlds): give each a distinct treatment — do NOT all use the same tracked-caps. Use hairline etched rules + corner ticks; reserve tracked-caps mono for data/era labels only.
7. Buttons: unify to ONE action language. Kill the filled+outlined pair; primary action = inked solid or self-colored border (no glowing gradient pill). Secondary = quiet ghost, same radius language.
8. Timeline decade tabs: real Instrument Ink "instrument" treatment — active tab = etched bezel + gold registration tick (live state), not a glow.
9. Verify: screenshot each section; check no two sections share the identical label treatment; buttons consistent.

## Wave 3 — The signature (Instrument Ink registers)
**Goal:** the page reads as Instrument Ink, not a slop near-miss.
10. Ghost numeral watermark behind the hero (e.g. decade count or "00" readout), 300–400px, low-opacity bone, behind text (clear the cut — ensure no text collision).
11. Needle-settle motion on key state changes (decade select, filter apply): quick + one soft overshoot + still. Gate behind `prefers-reduced-motion` (already in theme.css).
12. Seeded, reproducible particle field behind the opening hero only (reasoning-chain metaphor) — dim, quiet, re-lit on ground-truth cross. Gate behind reduced-motion.
13. Corner registration marks / hairline etched rules as the recurring silhouette signature across panels.
14. Verify: full-page screenshot; attack pass (does it read as Instrument Ink? any slop tell remaining? any content hidden by animation?).

---

## Verification gate (per task, per Operating Manual)
- `cd client && npx vitest run` (no regression)
- `cd client && npx tsc --noEmit -p tsconfig.json`
- Live screenshot of `/genre/documentary` (and one other world) before/after each wave
- Run the slop.md checklist point-by-point at the end; document any unavoidable tension

## Out of scope (residue list — published)
- Other routes (Discover/Library/Chat/Settings) — only /Worlds per request. Will note cross-route consistency risk.
- Font *file* provisioning (separate workstream).
- Backend changes (none needed; pure client/visual).
