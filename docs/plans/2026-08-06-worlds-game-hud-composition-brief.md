# Worlds Game-HUD Composition Brief

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Status:** Design brief · packing principles only · no skin · no code  
**Locks:** Mode-split **B** (`2026-08-06-worlds-mode-split-packing-plan.md`) · brand `.impeccable.md` (composed · knowing · hush · projection booth)  
**Borrow:** Cyberpunk 2077 UI + GTA V / Rockstar in-game browser & pause-menu **composition and interaction density** — never neon cosplay.

---

## 1. What those UIs do well (steal the structure)

Neither CP2077 nor Rockstar’s pause / in-game browser behave like a marketing site. They behave like **instrument panels**.

| Pattern | What it does | Why it packs |
|---------|--------------|--------------|
| **Fixed stages** | Phone apps, pause tabs, shard readers — one job owns the frame | Page length ≠ content volume |
| **Panel grid** | Dual/triple panes with sticky chrome; body scrolls *inside* a pane | Info density without document sprawl |
| **Bounded catalogs** | Contact lists, map blips, media queues — scroll trays, not infinite page dumps | Catalog size decoupled from viewport budget |
| **Mode tabs** | Map / Inventory / Journal / Settings; browser tabs inside the phone | Flip = re-stage, not append another cockpit |
| **Map as navigable pane** | Full-bleed spatial surface with focus strip + actions in-context | Orientation is a tool, not an appendix essay |
| **Detail without leaving context** | Select → detail pane / overlay; list stays visible | No “scroll to the thesis three screens later” |

**Not borrowed:** cyan/magenta chrome, scanlines-as-identity, holographic overload, “hacker HUD” decoration, Rockstar yellow as brand cosplay. Structure and density only.

---

## 2. Map onto Mode-split B

| Game pattern | Worlds Self | Worlds Guided |
|--------------|-------------|-----------------|
| Browse app / media list | **Browse pane** — hero + session chrome + steer + **timeline tray start** | Parked (chip / Widen unlock) |
| Mission claim / interaction prompt | Parked | **Claim / cockpit pane** — desk + Tonight shelf (+ Featured under lead) |
| Tab flip | Self ↔ Guided | **Re-stage** the page; do not stack desk atop warehouse |
| Pause map | Hub: map-as-atlas (or one door surface) | In-genre: Neighbors / link out — not a second full atlas |

**Law (from packing plan):** one primary surface per stage. Mode flip = stage machine reset. Guided Dial/Claim owns V1; Self owns V1 as browse. Flip Self→Guided parks the warehouse; flip Guided→Self collapses the desk.

---

## 3. Concrete layout metaphors (use these names in packing PRs)

1. **Dual-pane (select → inspect)**  
   Left/primary: era tray or shelf. Right/secondary or inline under selection: Featured thesis / title detail. Selecting a poster updates the inspect surface — do not force a long scroll to a second “Featured” section that restates the lead.

2. **Sticky stage + scroll tray**  
   Session chrome (Self|Guided · Movies|TV · world chip) sticky. Catalog lives in a **max-height internal-scroll tray** (decade-first; All-eras = zoom-out summary or tray-only). Document height must not scale with poster count.

3. **Tabbed / staged modules**  
   Topics · directors · maker · export are **modules in a secondary stage or tabs**, not equal-weight peers in a landing stack. Guided stages (SEED → DIAL → CLAIM → DEEPEN? → BROWSE) are the pause-menu tabs of the world.

4. **Map as full-bleed panel, not appendix**  
   Hub: territory surface owns the fold (map-as-atlas) *or* doors own the fold with map demoted to toggle — never Atlas + Map as two full peer catalogs. In-genre: do not remount the vault map under the fold; warp via Neighbors / “Open atlas.”

---

## 4. Lumina aesthetics stay; game UI is scaffolding

From `.impeccable.md` and Worlds chrome:

- **Feel:** archive-backed projection booth — carbon ink, grain, hush. Composed · knowing · hush.
- **Art heroic; chrome material** — posters worship-grade; panels lacquer/grain, not nested SaaS cards.
- **Gold = earned signal** — tonight, live companion, active CTA — not every edge.
- **Type jobs:** display for titles/voice; sans for UI; mono for meta. Worlds Instrument Ink / booth geometry stays.
- **Elevate, never dull** — packing denser must feel *more vault*, not greyer SaaS or quieter void.

Game HUD teaches **where things live and how flip works**. It does not replace world accents, needle desk, territory craft, or booth grain with Night City chrome.

---

## 5. Anti-patterns (explicit kills)

| Anti-pattern | Why it fails the game-HUD test |
|--------------|--------------------------------|
| **Landing-page scroll stacking** | Hero → Guided → Whisper → Anchors → Steer → Timeline → Featured → … as equal peers = no stage machine |
| **Same title ×4** | Shelf lead + timeline cell + Featured hero + maker row without co-located inspect = Rockstar would collapse to list+detail |
| **40-poster page dump** | “All eras” growing the document ≈ Letterboxd export, not phone media app |
| **Guided bolted on** | Inserting desk atop Self warehouse = opening Inventory *and* leaving the world HUD full-screen underneath |
| **Map as footer essay** | Spatial tool buried after Mood+Archive = pause-map after you’ve already picked the mission |
| **Neon / cyber cosplay** | Skin without packing law — violates brand and solves nothing |

---

## 6. Success sniff test

Open Horror Self: first viewport reads as a **browse instrument** (chrome + steer + tray start), not a warehouse foyer.  
Open Horror Guided Claim: first viewport reads as a **claim cockpit** (desk + shelf), warehouse parked.  
Flip modes: the page **re-stages**; length does not become “both cockpits.”  
Hub fold: **one** enter composition; map is a pane with a job (kinship), not a second catalog.

**Sibling:** implement against `2026-08-06-worlds-mode-split-packing-plan.md` Waves 1–3. This brief is the interaction metaphor layer on top of that packing law.
