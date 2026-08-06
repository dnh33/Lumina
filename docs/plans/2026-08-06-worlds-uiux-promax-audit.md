# Worlds UI/UX Pro Max Audit — Value over packing-green

**Date:** 2026-08-06  
**Agent:** Worlds UI/UX Pro Max auditor  
**Worktree:** `.worktrees/immersive-curated-genre-specific-experie`  
**Surfaces:** Hub `/genre` · Horror Self · Horror Guided (dial → claim → widen → deepen)  
**Skill:** `ui-ux-pro-max` (priority stack + `search.py`)  
**Live (prior pass):** `http://localhost:5173` — connection refused.  
**Live (re-run):** `:5173` + `:4000` **UP** from worktree — agent-browser scored P0s. Screens: `_promax-live-hub.png`, `_promax-live-guided.png`, `_promax-live-widen.png`, `_promax-live-deepen.png`.  
**No code changes. No packing reopen.**

---

## Executive verdict

Packing made Worlds **shorter**. Pro Max asks whether it is **usable for jobs**.

| User job | Hub | Horror Self | Horror Guided |
|----------|-----|-------------|----------------|
| Pick a film tonight | Partial — Enter CTA works; map is kinship chrome | Strong if decade lands | **Strongest** — Tonight shelf + Watchlist/Pass |
| Browse by decade | N/A (enter only) | Strong — scrub + tray | Widen band-honest (`Guided · archive · Now band`) |
| Deepen with companion | N/A | OK — FAB talk | **Improved** — right deepen rail + shelf pad; shelf cards clear rail |

**Fold packing = GREEN (untouched this pass). Job packing = YELLOW→GREEN lean** after Wave 1: P0.1 + P0.3 + P0.4 largely cleared live; map touch still scale-fragile (P0.2 → remaining P1).

---

## LIVE re-score (2026-08-06 · :5173 up)

**Servers:** Vite `:5173` + API `:4000` both HTTP 200 — **not restarted** (already alive). Worktree only.  
**Skill:** `search.py` re-run from `C:\Users\Danie\.agents\src\ui-ux-pro-max\scripts\search.py` — design-system again suggested Primary `#2563EB` + Orbitron. **Rejected.** Instrument Ink live: Cabinet display + Geist sans + gold signal (computed on hub).  
**Browser:** agent-browser (cursor-ide-browser tab unavailable this session).

### P0 re-score

| ID | Prior | LIVE evidence | Verdict |
|----|-------|---------------|---------|
| **P0.1** Widen stage honesty | OPEN | Widen keeps `mode=guided`. Stage line `Guided · archive · Now band`. Whisper `Guided. Browsing the archive · Now band.` CTA **Back to shelf** (no “Claim desk”). Surprise/steer warehouse absent. Timeline filtered to Now band (2010s/2020s). | **FIXED** |
| **P0.2** Map touch enter | OPEN | Invisible hit circle `MARKER_HIT_R=30` + comment ≥44 CSS. Enter strip + warps = **44px**. Live CSS hit diameter **scales with SVG** (~34–45px on desktop map sizes). Compact map → sub-44. | **PARTIAL → P1** (primary Enter path OK; node tap still fragile) |
| **P0.3** Mist contrast | OPEN | Hub secondary copy is `mist-300` (live ratio ~**8.1:1** on ink). Class `mist-400/70` **absent** on hub. Residual: `ExperienceHero` `text-mist-400 opacity-70` (~**3.36:1**). | **MOSTLY FIXED** — residual → P1 |
| **P0.4** Deepen covers shelf | OPEN | Guided deepen = `companion-deepen-rail` (fixed right, ~320px). `body:has([data-companion-mode=guided-deepen]) [data-testid=guided-shelf]` pads **~336px**. Tonight cards clear rail (~65px gap). `aria-modal` still `"false"`. | **FIXED** for Claim job; a11y modal trap still open as P1 |

### Live surface notes

- **Hub:** Instrument Ink only — no blue haze, no Orbitron. Enter Horror gold strip. Warps `min-h-11`. Hub scroll ~1.21 vh @ 1440×900.
- **Guided claim:** Tonight shelf owns fold; Widen / Deepen copy honest (“Deepen lives on the companion”).
- **Guided widen:** Browse bar + tray; mode pill stays Guided.
- **Guided deepen:** Right rail titled Deepen · shelf-bound; dial chips BREACH/NOW/UNMARKED DOOR; suggestions shelf-bound.

### Remaining gaps (post-LIVE)

| Pri | Gap | Notes |
|-----|-----|-------|
| **P1** | Map hit CSS diam ≠ guaranteed 44 | Pad is viewBox-r=30; needs CSS-px floor or desktop-only node enter |
| **P1** | Hero `mist-400 opacity-70` | Promote to mist-300 or drop opacity |
| **P1** | Deepen `aria-modal=false` / no focus trap | Job clear; keyboard/SR still soft |
| **P1** | Door/mood disclosures, Self tag soup, loading pulse | Unchanged from prior P1.1 / P1.3 / P1.6 — not Wave 1 P0s |
| **P1** | Mode/tag chips & icon-btn &lt; 44 on Self | Prior P1.4 |

**Do not reopen packing vh gates.**

---

## Skill workflow (executed)

### Design-system search

```text
python …/search.py "film archive genre explorer dark booth HUD curation" --design-system -p "Lumina Worlds"
```

**Raw Pro Max output (REJECT as shipped palette):** Immersive + Dark OLED · Primary `#2563EB` · CTA orange · Orbitron + JetBrains · cyberpunk HUD glow.

That is **generic dark SaaS / neon HUD**. It fights Instrument Ink and `.impeccable.md` anti-references (purple/blue haze, Inter stacks, AI presence shorthand). Use Pro Max for **priority rules + anti-patterns**, not for color/type substitution.

### UX domain searches (applied)

| Query | Domain | What stuck |
|-------|--------|------------|
| accessibility focus keyboard contrast | `ux` | focus rings, contrast 4.5:1, aria names, heading order, reduced-motion, skip links |
| touch interaction tap target hover | `ux` | 44×44 targets, no hover-only primary, 8px gaps, click≠hover |
| loading skeleton feedback states | `ux` | skeleton >300ms, disable pending, empty guidance |
| visual hierarchy information architecture | `ux` | sequential headings, consistent type scale, no color-only meaning |
| animation reduced-motion | `ux` | 150–300ms micro; respect `prefers-reduced-motion` |
| dark cinema archive editorial | `style` | OLED dark + editorial grid useful; **Cyberpunk neon = anti-pattern here** |
| rerender suspense lazy | `react` | Suspense/lazy for heavy map/tour; avoid blocking whole page |

### Priority scorecard (Pro Max order)

| # | Category | Hub | Horror Self | Horror Guided | Notes |
|---|----------|-----|-------------|---------------|-------|
| 1 | Accessibility | B | B | A− | Skip + gold focus; mist-400/70 cleared on hub; companion still `aria-modal=false` |
| 2 | Touch & Interaction | C+ | C+ | B | Enter/warps `min-h-11`; map hit pad r=30 but CSS diam scales with SVG (desktop ~34–45px) |
| 3 | Performance | B | B | B | Lazy posters; soft-hold same-world query; thin loading pulse (layout jump risk) |
| 4 | Layout & Responsive | A− | B+ | A | Hub one-fold; Guided claim + deepen rail; packing board GREEN — **not reopened** |
| 5 | Typography & Color | B+* | B+* | B+* | *Instrument Ink live (Cabinet/Geist/gold). Pro Max Orbitron/blue **rejected again** |
| 6 | Animation | B+ | B+ | B+ | `useReducedMotion` + theme reduce; 150–300ms transitions |

\*Typography scored against **Instrument Ink**, not the skill’s default cyberpunk pairing.

---

## Instrument Ink — design-system recommendations (fit existing, don’t invent)

Source of truth: worktree `client/src/theme.css` + `.impeccable.md`. Pro Max “blue OLED” is **out of scope**.

| Layer | Keep / do | Don’t |
|-------|-----------|-------|
| **BG** | `ink-950→800` carbon + single warm gold emission | Cool blue-charcoal, purple mesh, second glow |
| **Signal** | Gold only for active/earned/focus (`--signal`) | Gold as default fill on every CTA / FAB brick |
| **World accent** | Edge needles, Watchlist, pressed dial — one primary per viewport | Gold FAB + red Watchlist + gold Enter competing in one fold |
| **Type** | DISPLAY Cabinet · SANS Geist · MONO provenance | Orbitron, Inter, Fraunces swap unless product re-decides |
| **Map** | Territory + shelf-heat markers + warps on focus | Neon cyberpunk HUD, constellation spaghetti, pill clouds as hero |
| **Motion** | State vocabulary 150–300ms; grain/dust freeze on reduced-motion | Scroll-jack, layout-shifting scale, decorative infinite glow |
| **Chrome** | Lacquer/glass/grain; companion FAB ink lacquer + accent ring | Solid `bg-gold-400` FAB (already fixed in theme) |

**Pro Max checklist that *does* apply unchanged:** no emoji icons · `cursor-pointer` on clickables · visible focus · `prefers-reduced-motion` · 375/768/1024/1440 · no hover-only critical actions.

---

## User-job gaps — P0 / P1

Jobs: **(A)** pick a film tonight · **(B)** browse by decade · **(C)** deepen with companion.

### P0 — blocks a job or lies about stage authority

> **LIVE 2026-08-06:** P0.1 FIXED · P0.3 mostly FIXED · P0.4 FIXED (job) · P0.2 demoted to P1. Table below kept as historical prior-pass findings; see **LIVE re-score** for current truth.

| ID | Gap | Job | Evidence | Fix direction (no code this doc) | LIVE |
|----|-----|-----|----------|----------------------------------|------|
| **P0.1** | Widen still feels like “left Guided” even when tray-only | A→B | Mode pill stays Guided; steer warehouse removed in code (`guided-browse-tray` comment). Whisper/band vs tray still two mental models. Compact chip + “Claim desk” is easy to miss. | One visible stage label: “Guided · archive in Classic band” with Claim desk as the only return. Kill leftover packing jargon in any leftover copy. | **FIXED** — `Guided · archive · Now band` + **Back to shelf** |
| **P0.2** | Map markers are not touch-viable enter targets | A | Node radius 9–11px; hit fill ~r+4. Enter strip is the real touch path (`min-h-11`). Phone/tablet users who tap the map miss. | Enlarge hit targets (invisible pad ≥44×44) or demote map-click enter to desktop-only; keep Enter strip as primary. | **PARTIAL→P1** — pad r=30 exists; CSS diam still SVG-scaled |
| **P0.3** | Body/meta contrast slips under 4.5:1 | A/B/C | `mist-400` on `ink-900` ≈ **5.9:1** (pass). `mist-400/70` ≈ **3.2:1** (fail). Used for shelf counts, door footers, secondary legend. Territory SVG labels ~55% mist. | Promote secondary copy to `mist-300` (≥4.5). Reserve /70 for truly decorative hairlines only. | **MOSTLY FIXED** — hub mist-300; hero opacity-70 residual |
| **P0.4** | Companion deepen overlays claim shelf without modal trap | C | `role="dialog"` + `aria-modal="false"`; panel `h-[min(380px,46dvh)]` docks over FAB corner; desk uses `pb-14` clearance — third card can still sit under panel (roast2). | Either true modal+focus trap for deepen, or dock as non-overlapping drawer that reflows shelf. | **FIXED** job via deepen rail + shelf pad; modal trap still P1 |

### P1 — value leaks, redundant catalogs, soft friction

| ID | Gap | Job | Evidence | Fix direction |
|----|-----|-----|----------|---------------|
| **P1.1** | Door list + mood disclosures resurrect old hub | A | Closed fold good. Open doors → 16 tone cards (“Same curated rooms as the map”). Mood → ~36 equal chips. | Keep doors **only** if tone lines are used; else Settings. Mood: max 6–8 high-signal feelings or cut. |
| **P1.2** | Three enter textures remain | A | Map node · focus Enter · door cards. `genreSelfEnterPath` now forces `?mode=self` (silent Guided resume **fixed** vs roast2). | One visual primary (Enter). Nodes = select/focus; doors = progressive disclosure only. |
| **P1.3** | Self steer tag soup before art | B | `TAG_VISIBLE = 8` + Surprise/Less-known. Alphabet chips compete with decade tray for “browse by decade.” | Decade axis owns Self fold; tags behind “Narrow” disclosure or post-tray. |
| **P1.4** | Warps / mode / tag targets &lt; 44px | A/B | Warps `min-h-9` (36px). Mode pills `py-1.5 text-2xs`. Tags `py-1`. `icon-btn` `p-1.5`. | `min-h-11 min-w-11` on warps + mode; pad icon buttons. |
| **P1.5** | Hover-only “Enter →” on door cards | A | Opacity 0 until `group-hover` / focus-visible. | Always show enter affordance at mist-300; intensify on hover. |
| **P1.6** | Loading = one pulse block | A/B | `h-40 animate-pulse` only; Companion mounts early (good). Tray/hero heat can jump. | Reserve hero + scrub skeleton heights matching packed folds. |
| **P1.7** | Deepen discovery still FAB-only after dual-CTA fix | C | Desk “Deepen” removed; FAB `Deepen with the … companion`. Good for single verb — bad if FAB is unread. | Claim complete line: one text CTA “Deepen tonight’s three” that opens same panel as FAB. |
| **P1.8** | Status dots lean color-first | A | Gold/mist/ring dots; legend has text (good). Map markers encode status mostly by fill. | Keep text in focus strip; ensure marker aria already includes status (it does via `shelfStatusAria`). |

### Settled since roast2 (do not re-litigate as P0)

| Prior roast finding | Code now |
|---------------------|----------|
| Hub Enter silently resumes Guided | `genreSelfEnterPath` → `/genre/{slug}?mode=self` |
| Widen dumps Self steer warehouse | Guided widen renders tray modules only — no `steerPanel` |
| Widen lands All eras vs Classic dial | `openGuidedWiden` seeds `pickPreferredDecade` inside era band; timeline filtered by `filterItemsToEraBand` |
| Dual desk Deepen + FAB | Desk Deepen gone; FAB only |
| Solid gold FAB brick | `.companion-fab` lacquer + world-accent ring; gold when `aria-expanded` |
| Ghost numeral hero costume | `ExperienceHero` heat posters (`hero-heat`), not watermark count |
| `font-[var(--font-display)]` → Geist | Titles use `font-display` utility |
| Widen stage honesty (P0.1) | LIVE: `Guided · archive · Now band` + Back to shelf |
| Mist-400/70 hub secondary (P0.3) | LIVE: hub uses mist-300; hero opacity-70 residual only |
| Deepen covering shelf (P0.4) | LIVE: `companion-deepen-rail` + `guided-shelf` pad ~336px |

---

## Anti-patterns found

### Against Pro Max UX rules

1. **Hover-primary affordances** — door “Enter →”; map neighborhood lighting partly hover-driven (`onMouseEnter` sets focus). Touch users skip the strip unless they tap a tiny node.
2. **Sub-44px targets** — SVG markers, warps `min-h-9`, tag/mode chips, icon close.
3. **Contrast theater** — `text-mist-400/70`, `text-white/55` archive chips, low-opacity SVG land labels.
4. **Non-modal dialog** — companion as dialog without modal semantics while covering content.
5. **Color-as-status** — shelf dots; mitigated by adjacent copy on hub legend/focus strip, weaker on raw map.

### Against Instrument Ink / anti-slop

1. **Packing-green as win condition** — vh targets passed; job clarity still yellow.
2. **Catalog resurrection via `<details>`** — progressive disclosure that reopens the old equal-card hub.
3. **Mood alphabet soup** — feeling→world as 36 equal pills (Pro Max + impeccable: no pill clusters as enter factory).
4. **Cyberpunk Pro Max defaults** — if anyone applies skill colors/fonts literally → purple/blue SaaS regression.
5. **Emoji disclosure chevron** — `▾` in hub summaries (skill: SVG not emoji/glyph as UI chrome). Minor but real.

### Against value-giving product sense

1. **Map geography optional for enter** — correct as brand; dishonest if sold as required for picking Horror tonight.
2. **Guided Claim is the only surface that fully answers “tonight”** — Self answers “browse era”; hub answers “which room.” Don’t pretend hub map *is* the tonight picker.
3. **Companion deepen** — best value when shelf-bound; weakest when opened during Widen (two stages visible).

---

## Surface notes (compressed)

### Hub `/genre`

- **Keep:** one composition — Worlds H1 + legend + map focus strip (gold Enter) + territory; doors/mood/archive demoted.
- **Value gap:** kinship warps earn keep only if used; else map is vault chrome with Enter glued on (product-map roast still holds).
- **a11y plus:** marker `aria-label` includes status + Enter; keyboard Enter/Space; custom gold focus ring on SVG.
- **a11y minus:** `outline-none` on markers (replaced by SVG halo — verify keyboard-only); many tab stops (16 nodes + Enter + warps).

### Horror Self

- **Keep:** decade-first scrub, internal-scroll tray (page length ≠ title count), sticky mode chrome, skip link.
- **Value gap:** steer panel still competes with decade for the “browse by decade” job.
- **Loading:** pulse stub under-serves tray.

### Horror Guided

- **Keep:** claim cockpit packing; Tonight shelf as hero; radiogroup dials; focus restore after answer; Widen stays Guided; deepen suggestions shelf-bound; era inherit announce toward Self.
- **Value gap:** Claim → Widen → Deepen is three stages with one mode pill; user must learn chip vocabulary (“Claim desk”) to return.

---

## Recommended next cuts (priority order)

1. **CSS-px floor on map hit pads** (ex-P0.2) — or declare nodes desktop-only; Enter strip stays primary.  
2. **Hero mist-400/70 → mist-300** (ex-P0.3 residual).  
3. **Deepen focus trap / `aria-modal`** (ex-P0.4 residual) — job already clear.  
4. **Kill or quarantine mood/door soup** (P1.1).  
5. **Self: decade-first fold, tags demoted** (P1.3).  
6. **Do not** apply Pro Max blue/Orbitron — stay Instrument Ink.  
7. **Do not** reopen packing vh scoreboard.

---

## Method appendix

| Step | Result |
|------|--------|
| Read `ui-ux-pro-max/SKILL.md` | Priority stack enforced |
| `--design-system` film/booth query | Pattern useful; palette/type **rejected** for Instrument Ink |
| UX domains a11y / touch / loading / hierarchy | Mapped to P0/P1 |
| Style “dark cinema archive” | OLED + editorial keep; cyberpunk avoid |
| Browser live (prior) | **Down** — no new servers started |
| Browser live (re-run) | **Up** — agent-browser hub → Horror Self → Guided claim → Widen → Deepen rail |
| Code read | `GenrePicker`, `WorldsMap`, `GenreExperience`, `GuidedTour`, `guidedStage`, `TimelineScrubber`, `CompanionPanel`, `ExperienceHero`, `theme.css` |
| Prior boards | Packing scoreboard GREEN — **not reopened**; roast2 used as delta baseline |

**Success for a follow-up fix wave:** Daniel can (1) enter Horror Self cold and pick a decade film in ≤3 deliberate actions on touch, (2) finish Guided claim and watchlist one title without scrolling archaeology, (3) open deepen without covering the shelf he is defending — without changing Instrument Ink into Pro Max neon.
