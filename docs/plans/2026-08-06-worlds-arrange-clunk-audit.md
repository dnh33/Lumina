# Worlds ARRANGE — Spatial Clunk Audit (LIVE)

**Date:** 2026-08-06 (re-run; prior pass was source-only — `:5173` down)  
**Role:** Arrange / spatial composition auditor  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Viewport:** **1440×900** (agent-browser `set viewport`)  
**Live:** `http://localhost:5173` + API `:4000` (both 200)  
**Law:** Mode-split B packing **closed**. CRAFT / clunk open.  
**Shots:** `docs/plans/_arrange-live/` (`01-hub` … `04-widen`)  
**Metrics:** `docs/plans/_arrange-live/metrics/`  
**Skills:** arrange · frontend-design · design-taste-frontend  
**Brand:** `.impeccable.md` — composed · knowing · hush · projection booth.

---

## Design Read

**Reading this as:** redesign-preserve of a booth/archive **game-HUD product surface** (not a marketing landing), for a density-tolerant builder-cinephile, with hush / Instrument Ink language, leaning toward fixed stages + pane density inside Lumina carbon/grain.

**Dials (intent vs live post–Wave 1):**

| Dial | Booth / HUD intent | Live reading | Gap |
|------|--------------------|--------------|-----|
| `DESIGN_VARIANCE` | 5–6 booth geometry | ~5: Claim/Widen stages read as instruments; Hub still chrome+map lacquer stack | Hub title still display-weight |
| `MOTION_INTENSITY` | 4–5 state | Dust/grain present (Self/Claim `dust-mote`×10 + `.film-grain`) | Fine |
| `VISUAL_DENSITY` | 7–8 cockpit | Claim **1.0 vh**; Self **1.66 vh**; Widen **1.5 vh**; Hub **1.21 vh** | Length fine. Remaining clunk = rhythm / chrome competition, not fold count |

---

## Method

1. agent-browser @ **1440×900** — Hub, Horror Self (`?decade=2010s`), Guided Claim (`?mode=guided` + `data-guided-stage=claim`), Widen (click `[data-testid=guided-desk-widen]` → `browse`)  
2. Measured `getBoundingClientRect` → **y / h / vh** for hero, sticky, scrub, tray, stage, map  
3. Squint from live PNGs + numeric hierarchy  
4. Cross-check Wave 1 sniff (`2026-08-06-worlds-wave1-live-squint.md`) — **mist-400 live count is now 0** on all four surfaces (Wave 1 FAIL closed in pixels)

**No packing reopen.** No soft praise.

---

## Verdict

**Wave 1 Arrange P0s (A0.1–A0.4) HOLD live.** Prior source-only audit’s fold failures are fixed in pixels:

| Prior A0 | Live @ 1440×900 | Result |
|----------|-----------------|--------|
| **A0.1** Thin in-world hero; Tour owns display H1 | Self Horror H1 **20px** (`text-lg/xl`), identity band **~46–58px**; Claim Horror **14px** eyebrow; sole H1 = `"The door is chosen"` **20px** | **PASS** |
| **A0.2** One claim lacquer; no card-in-card | `[data-guided-stage=claim]`; nested bordered/rounded shells **0**; sticky = `border-y` hairline inside outer `rounded-2xl` | **PASS** |
| **A0.3** Self tray start in V1 | Scrub top **275**; first poster top **528**, visibleH **186**; **9** posters in fold + Featured rail | **PASS** |
| **A0.4** Widen = browse bar, not Claim+append | `data-guided-stage=browse`; dials **0**; Tonight shelf **gone**; steer/Surprise **absent**; bar + scrub | **PASS** |

**Remaining clunk is P1 craft**, not “fold still wrong.” Biggest live irritants: **Widen cue string duplicated**, Hub **Worlds 36px** still competing with map, Claim **Watchlist/Pass on every shelf cell**, Self **steer row still outranks tray** optically before posters land.

---

## Live evidence table (1440×900)

| Surface | docH | docVh | Key y positions (px from viewport top) |
|---------|------|-------|----------------------------------------|
| **Hub** `/genre` | 1092 | **1.21** | H1 Worlds **69** (36px); HubChrome band **48**/h106; `#map` **174**/h**668** (0.74 vh); Enter **204**/h44; disclosures **862** (mostly below fold) |
| **Self** `/genre/horror?decade=2010s` | 1490 | **1.66** | Identity **55**/h46; Horror H1 **73** (20px); sticky **112**/h46; whisper **158**; steer **186**/h77; scrub **275**; poster0 **528**/h186 |
| **Claim** `?mode=guided` stage=claim | 900 | **1.00** | Outer lacquer **44**/h653; Horror eyebrow **73** (14px); sticky **103**/h46; claim stage **149**/h514; Tour H1 **187** (20px); dials **279**; Tonight shelf **352**; Watchlist/Pass row ~**531** |
| **Widen** stage=browse | 1352 | **1.50** | sticky **104**/h46; browse bar **150**/h41; scrub **203**/h749; poster0 **370**; Retake **162**; Back to shelf **158** |

**Mist:** `text-mist-400` element count = **0** on Hub / Self / Claim / Widen. Residual source: `ExperienceHero.tsx` origin-line (`mist-400 opacity-70`) on **non-compact** path — not painted on current thin-chrome Worlds stages. Wave 1 mist P0 = **closed in live pixels**.

**Warps (Hub):** Thriller / Film Noir hit height **44×84 / 44×96** — Wave 1 warp-height P1 = **closed**.

**Particles:** Self/Claim `.dust-mote` ×10 + `.film-grain` present.

---

## Surface audits

### 1. Hub `/genre`

**Squint**  
Primary: gold **Enter Horror** + Horror node glow. Secondary: map territory (THRESHOLD wash). Tertiary: “Worlds” 36px H1. Disclosures are a thin base below fold. Map owns the fold (**0.74 vh**) — better than the old three equal peer bands. Still not “one instrument”: chrome title + in-pane focus strip + SVG read as stacked lacquer, not focus HUD on the floor plan.

**Spacing / rhythm**  
- Parent gaps **20px** between HubChrome → map → disclosures (equal beat).  
- Focus/Enter lives **inside** `#map` pane (one rounded lacquer, h668) — structural win vs old peer card above `#map`. Visually Enter strip still sits as a **top band of the map card**, not an overlay on the SVG.  
- Em-dash live in subtitle: `Shelf heat from your vault — every room still curates a catalog.`

**Hierarchy**  
- Page H1 **36px** still fights the atlas for first-read weight. Atlas should be the hero object; “Worlds” should be chrome-scale.  
- Gold: Shell Worlds + Enter + focus node — three gold jobs remain (fuel, not taste-only).

**Density**  
- Map: high visual complexity, labels still small. Focus strip: low content, high chrome weight — bipolar HUD residual, milder than pre–Wave 1.

**File hints:** `GenrePicker.tsx` · `WorldsMap.tsx`

---

### 2. Horror Self (`/genre/horror?decade=2010s`)

**Squint**  
Primary blobs: **poster tray + Featured inspect** (mid/lower fold). Secondary: decade scrub. Tertiary: thin Horror chrome + Self sticky. Steer (Search / Sort / Surprise / tags) is a dense horizontal band **before** art — tray starts in V1 but is not the first silhouette. Browse-instrument sniff **passes** (scrub+posters in fold); optical primary is still “filters then posters,” not “posters with chrome.”

**Spacing / rhythm**  
- Cluster gaps inside stage ≈ **12px** (tighter than old `space-y-5`) — improvement.  
- Identity + sticky + whisper + steer consume **y0–275** before scrub; posters at **y528**. Air is reasoned enough to clear A0.3; not yet stage-token elegant.

**Hierarchy**  
- Horror demoted to **20px** chrome H1 — dual-billboard tax **gone**.  
- Steer still outranks tray until eye drops ~half a viewport.

**Density**  
- Steer: Search + Sort + Surprise + Less well-known + `Tags 14 · peek 5` = high chrome density over art. C5 residual.  
- Tray + Featured dual-pane: correct Self job.

**File hints:** `GenreExperience.tsx` · `ExperienceHero.tsx` · steer · `TimelineScrubber.tsx` · `GenreModules.tsx`

---

### 3. Horror Guided Claim (`?mode=guided`, stage=`claim`)

**Squint**  
Primary: Tour H1 + red dial needle + Tonight shelf. Secondary: sticky Self|Guided chrome. World name is eyebrow (**14px**). **One instrument** — Claim sniff **passes**. Nested card soup **gone**.

**Spacing / rhythm**  
- Outer `reg-ticks rounded-2xl` wraps identity + sticky + desk (h653, top44) — one lacquer.  
- Sticky merges via `border-y` (no second rounded box).  
- Shelf cards still carry **Watchlist + Pass on every cell** → art loses heroic weight (A1.4 open). Retake optically far-right of title row (A2.2).

**Hierarchy**  
- Sole display H1 = `"The door is chosen"` (**20px**).  
- Widen CTA parked in desk footer — correct stage machine.  
- Whisper as equal sibling: **absent** on Claim (good).

**Density**  
- Fold **1.0 vh** — packed and honest. Clunk left is **per-card action chrome**, not length.

**File hints:** `GuidedTour.tsx` · `GenreExperience.tsx` (claim-stage) · `ExperienceHero.tsx` (`embedded` / compact)

---

### 4. Widen (Guided → browse)

**Squint**  
Reads as **Browse unlocked**: thin recall bar + timeline tray. Claim desk / dials / Tonight shelf **gone**. Stage honesty **passes**. Cue line is visibly **doubled** (`Guided · archive · Now band` ×2 in sticky/bar) — cheap clunk, high annoyance.

**Spacing / rhythm**  
- Browse bar h**41** at y**150**; scrub at y**203** — catalog owns remaining fold.  
- No Self steer dump (search/Surprise absent) — I-SteerDump holds.

**Hierarchy**  
- No H1 on widen (Horror stays 14px eyebrow). Retake + Back to shelf share bar — correct. Sticky status line repeats the same cue as the bar → **duplicate primary meta**.

**Density**  
- Chip bar tight; tray dense — shared contract OK. Cue duplication breaks the “thin recall” promise.

**File hints:** `GuidedTour.tsx` (`data-guided-stage=browse`, cue render) · `GenreExperience.tsx` widen branch

---

## Cross-cutting (post–Wave 1)

1. **Equal sibling gaps on Hub** — still **20px** chrome→map→disclosures. Claim/Self tighter.  
2. **Nested booth frames** — Claim fixed. Hub map pane + HubChrome still two lacquers.  
3. **Marketing column** — `max-w` document shell unchanged (not reopened as packing).  
4. **Identity tax** — **fixed** on Self/Claim/Widen thin chrome.  
5. **Bipolar density** — Self steer vs tray remains the main bipolar.

---

## Ranked remaining work (after Wave 1)

Do **not** reopen Mode-split B packing. A0.1–A0.4 stay closed unless a regression appears.

### P0 — none for Arrange fold

Wave 1 spatial P0s hold. Mist readable meta **live-clean**. No new fold-wrong P0 found.

*(Optional hygiene, not fold P0: dead-path `mist-400` on non-compact `ExperienceHero` origin-line — flip to `mist-300` if that path ever remounts.)*

### P1 — rhythm & proximity (ship-feeling craft)

| ID | Fix | Why | Live evidence | File hints |
|----|-----|-----|---------------|------------|
| **A1.0** | **Deduplicate Widen cue** — single `Guided · archive · {band}` in browse bar OR sticky, not both | Visible double string; breaks thin-recall | `cueDupes` ≥2; bar text concatenates cue twice; sticky repeats | `GuidedTour.tsx` browse stage · sticky copy in `GenreExperience.tsx` |
| **A1.1** | **Stage gap tokens** — tight cluster inside chrome/desk; generous only between major stages | Hub still equal 20px; Self cluster 12px but steer→tray still feels like a march | Hub gaps 20; Self kids gaps 12 | `GenrePicker.tsx` · `GenreExperience.tsx` |
| **A1.2** | **Hub: Worlds H1 → chrome scale; ChartFocus as true in-map HUD** (overlay / bottom-of-SVG), not top band of map card | Map owns fold but title+focus still stack | H1 36px @ y69; focus+SVG share pane but Enter @ y204 above territory | `GenrePicker.tsx` · `WorldsMap.tsx` |
| **A1.3** | **Self steer density** — cap tags / bury under Filters; keep Search+Sort+≤2 presets | Steer band steals silhouette before posters | steer y186–263 before scrub 275 / posters 528 | steer in `GenreExperience.tsx` |
| **A1.4** | **Claim shelf art heroic** — Watchlist/Pass as selection/focus actions, not dual buttons on every cell | Per-card chrome densifies shelf | 6 Watchlist/Pass in V1 @ ~y531; uneven card heights | `GuidedTour.tsx` shelf |
| **A1.5** | **WIG em-dash kill** on Hub subtitle (+ Self whisper if present) | Visible `—` on Hub | subtitle `hasEmdash: true` | Hub chrome copy |
| **A1.6** | **Retake baseline** with Tour title cluster | Orphan far-right | Claim header geometry | `GuidedTour.tsx` |

### P2 — optical polish

| ID | Fix | Why |
|----|-----|-----|
| **A2.1** | Hub disclosures closed-default; open ≠ 3-col peer to map | Doors-open stress |
| **A2.2** | Decade scrubber tighter than tray art weight | Scrub vs art hierarchy |
| **A2.3** | Re-check Hub triple-gold after A1.2 | Fuel competition |
| **A2.4** | Dead-path `ExperienceHero` `mist-400` → `mist-300` | Hygiene only |

---

## Explicit non-goals

- Do **not** reopen Mode-split B / timeline-under-claim / packing length targets.  
- Do **not** reintroduce Featured on Claim.  
- Do **not** neon / CP2077 cosplay. Structure only.  
- Do **not** flatten lacquer to anti-card voids — elevate depth **inside one frame**.

---

## Success sniff (Arrange) — live status

| Sniff | Status |
|-------|--------|
| Squint Hub → one map silhouette + one Enter | **Partial** — map owns fold; Worlds H1 + focus band still compete |
| Squint Self → posters + scrub primary; world name chrome | **Pass** (chrome OK); steer still steals first silhouette |
| Squint Claim → desk + shelf only; no second billboard | **Pass** |
| Squint Widen → browse catalog; Claim = thin recall | **Pass** (cue dupe mars recall) |
| Spacing: tight in stage / generous between | **Partial** — Claim good; Hub equal 20px |

---

## Evidence log

| Source | Use |
|--------|-----|
| Live browser 1440×900 | **Primary** — agent-browser; shots in `_arrange-live/` |
| Measured vh / y | Tables above + `metrics/*.json` |
| Wave 1 live squint | Prior mist FAIL; this pass mist **0** live |
| Packing boards | Length green — not reopened |
| This doc prior revision | Source-only caveat — **superseded** |

**Next:** P1 pack starting at **A1.0 Widen cue dedupe** (smallest, highest irritation), then Hub H1 demote / Self steer / Claim shelf actions. Soft-GO for Arrange fold = **YES** on A0.*; craft Soft-GO waits on A1.0 + mist hygiene confirmation in Daniel QA.
