# Worlds — Promise vs Delivery

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Live:** `:5173` UP · `:4000` UP · viewport **1440×900**  
**Lens:** product promise (docs + on-screen copy) vs what the UI actually delivers. **Not** a packing re-gate.  
**Evidence:** live walk Hub tabs · Horror Self · Guided Claim · Widen · Companion Deepen · shots in `docs/plans/_promise-audit/`  
**Sources:** Aetherkeep WM/decisions (Mode-split B, G1 guided-in-ship) · game-HUD brief · mode-split packing · optimal-wave · amazing-or-nah gate · v2 design · guided-mode plan · hub/genre copy  
**Skills skim:** design-taste-frontend · arrange · ui-ux-pro-max  

**Design read:** redesign-preserve of a cinephile vault *game-HUD* (booth instrument), density-tolerant builder — hush / Instrument Ink. Dials ~5–6 / 4–5 / 7–8.

---

## Verdict (one breath)

**Packing succeeded. The product promise did not fully.**

Worlds now *stages* correctly (Self browse · Guided claim · Widen archive · Hub panes). That is necessary and hard — and done. What the app *claims* — immersive curated rooms, metaphor as place, guided tour that earns trust, vault heat that means something — is only honestly true for **one dense Horror path**. Everywhere else the UI sells a projection booth and hands you a thin catalog with poetry on the doors.

Amazing-or-nah packing gate: **READY FOR DANIEL QA**.  
Promise-vs-delivery: **NOT YET AMAZING.** Mean score **≈ 3.0 / 5**.

---

## Stated promise

### On-screen claims (what the UI tells the user)

- **Hub:** “Shelf heat from your vault — every room still curates a catalog.”
- **Doors:** “Curated rooms — tone first, enter from the card.”
- **Map:** “Territory view — focus a room, then Enter or warp.”
- **Mood:** “Eight high-signal feelings — each opens the world that owns it.”
- **Archive:** “Remaining TMDB genres — thinner metaphors, still enterable.”
- **Shell:** “Your private cinematic memory. Stored locally, always yours.”
- **In-world:** metaphor eyebrow (e.g. Threshold) · “Seeded by …” anchors · mono title count · Self “Browsing by decade” · Guided “Claiming tonight’s picks” / “The door is chosen” · Tonight shelf · Widen / browse archive · Deepen on companion · Featured “One title from this shelf” · “No shelf · catalog live.”

### Product / brief claims (what the work set out to offer)

| Source | Promise |
|--------|---------|
| **v2 design** | Composed, steerable, immersive, returnable *place* — not a recolored list. Metaphor as layout grammar. Ambient Companion. Provenance. Mood entry. Cross-world warp. Export. Sound. Serendipity. Library density as place. |
| **Guided plan** | Session-backed tour: dials → ranked Tonight shelf → library acts → Companion deepen. Mode must *branch* behavior. Booth curator, not SaaS wizard. |
| **Mode-split B + game-HUD** | Self V1 = browse instrument. Guided V1 = claim cockpit. Flip **re-stages**. Stages/panes like CP2077/GTA pause UI — structure, not neon cosplay. Long marketing scroll = failure. |
| **Optimal-wave / gate** | Booth HUD not packing theater. Gold ration. Art heroic. One job per fold. READY FOR DANIEL after Waves 1–3. |
| **Aetherkeep** | G1 = ship includes real Guided. Packing length GREEN. Do not reopen packing architecture. |

---

## Delivered (honest)

### What actually works

| Surface | Live truth |
|---------|------------|
| **Hub Doors** | 16 tone cards + Enter. Shelf legend Dense 1 / Thin 8 / No shelf 7. Copy honest about catalog-vs-shelf. Folds ~1.4. |
| **Hub Map** | Territory polygons + kinship warps + gold **Enter Horror**. Clearest game-HUD surface. Folds ~1.1. |
| **Hub Mood** | 8 feeling→world chips. One fold. Functionally a router, not a place. |
| **Hub Archive** | 14 leftover TMDB genre chips. Enterable. Empty air below. |
| **Horror Self** | Mode-split holds: steer + decade tray + dual-pane Featured/argument in first ~1.8 folds. Seeded-by line + world red accent. Posters carry the room. |
| **Horror Guided Claim** | Tour desk H1 “The door is chosen” · three dials (Breach / Now / Unmarked door) · Tonight shelf (3) · Watchlist/Pass · Widen CTA · whisper owns fold. Claim ≈1.0–1.5 folds. |
| **Widen** | Desk parks. `Guided · archive · Now band` · Back to shelf · decade-limited tray. Browse stage, not Self warehouse. |
| **Deepen** | FAB → `role=dialog` `aria-modal=true`. Tour chips + prefill that names dials + “Defend tonight’s three.” Shelf remains behind. |
| **Craft (Horror)** | Instrument Ink, grain/atmosphere, gold ration on hub Enter, world-accent on Guided, MessageCircle Companion (not Sparkles). Feels booth, not SaaS landing. |
| **Packing law** | Mode flip re-stages. Length green. Gate mid-sniffs closed. |

### What is *performed* more than *delivered*

- **“Every room curates a catalog”** — true as a route (TMDB discover paints), false as *immersion*. Seven doors say 0 on shelf; one door is Dense. The vault story on the hub header is mostly emptiness with better copy.
- **Metaphor as place** — Threshold / Reading Room / Constellation / etc. are **labels + accent**. Layout grammar did not ship as structural difference. Horror red edge ≠ six worlds that *behave* differently.
- **Guided curator** — loop works; voice is dense jargon. Tonight shelf live showed 2025–2026 titles (*The Mummy*, *Passenger*, *Sinners*) against seeds *The Thing / Exorcist / Rosemary’s Baby*. Dial labels (Breach · Unmarked door) do not teach themselves.
- **Mood as high-signal entry** — eight pills on a black field. No atmosphere, no preview, no density. Router dressed as product.
- **Discover “density”** — Self/Claim folds are packed; Mood/Archive are sparse voids; below-fold Self still dumps Also tagged / Filmmakers / Neighbors / Export (intentional warehouse, still anti-HUD aftertaste).
- **Sound / cueBeatMap / serendipity / juxtapose** — promised in v2; not part of what the live walk earns.
- **Ambient Companion** — Deepen dock works; greeting is still generic (“Good afternoon… What are we looking for?”) while the prefill is specific. Summoned guide half-present.

---

## Gaps (severity)

### P0 — promise breakers (user feels lied to, or core claim fails)

1. **Vault heat vs immersion mismatch** — Hub leads with Dense/Thin/No shelf (1/8/7). Copy says every room curates; the *experience* of most rooms will be cold/thin. Selling 16 Worlds when one is Dense is a product honesty problem, not a packing bug.
2. **Metaphor = coat of paint** — v2 + creative brief demanded structural difference; live Worlds differ by eyebrow string + accent CSS. Crossing Horror → Documentary does not change the instrument, only the chrome tint and lexicon chips. Immersive genre *worlds* undersold as immersive genre *skins*.
3. **Guided shelf trust** — Claim promises “tonight’s picks” in a Threshold seeded by classics; live shelf skews new/upcoming. Without visible ranking provenance on the shelf itself, the tour reads like a TMDB Now-band dump with poetry.

### P1 — value leaks (works, but under-delivers the offer)

4. **Doors default is catalog cards, not HUD** — Map is the game-HUD enter; Doors is a tasteful Letterboxd-adjacent grid. Default tab trains “browse rooms,” not “operate atlas.”
5. **Guided lexicon tax** — Breach / Now / Unmarked door / Threshold / TAP TO RE-TUNE / Retake — first-session cost is high. H1 “The door is chosen” after resume is poetic and opaque.
6. **Deepen voice mismatch** — Prefill is tour-aware; visible greeting is generic vault Companion. Dual Deepen was killed; dual *personality* remains.
7. **Below-fold Self warehouse** — Featured inspect is co-located (good); modules still append after tray. Game-HUD said detail docks to selection — not a second essay stack.
8. **Mood / Archive as empty stages** — Claims “high-signal” / “still enterable”; deliver chip strips + dead space. Pro Max density / Arrange rhythm both fail here.
9. **Sound & diegetic feedback dead** — Immersion promise without audio beats is a mute booth.

### P2 — craft / polish (does not kill the offer)

10. Large mono title count (83/84) still billboards meta — ghost watermark banned; giant N remains loud.
11. Archive (14) chip wall looks like settings residue, not vault lore.
12. Warps / neighbors exist but feel secondary; cross-world *journey* is thin.
13. A11y soft debt (roving radios, long tab paths) from prior 5-axis — still open.
14. Compare / juxtaposition / cueBeatMap / serendipity — design backlog, not live value.

---

## Scores (1–5) — ruthless

| Axis | Score | Why |
|------|------:|-----|
| **Browse value** | **3** | Horror Self is a real browse instrument (tray + Featured + era). Hub Doors works as entry. Vault-wide thinness + card-grid default keep it from a 4. |
| **Guided value** | **3** | Claim→Widen→Deepen loop is real and staged. Jargon + shelf trust + generic deepen greeting block a 4. Not a wizard; not yet a curator. |
| **Discover density** | **3** | Cockpit density on Self/Claim/Map is credible. Mood/Archive are sparse; post-stage module dump dilutes HUD density. |
| **Booth craft** | **4** | Strongest axis. Grain, accent lock, gold ration, poster worship, stage chrome on Horror — not AI-slop. Misses 5 because Doors/Mood feel generic and metaphor stays cosmetic. |
| **Trust / clarity** | **2** | Honest microcopy (“catalog live”, shelf≠catalog) cannot save opaque Guided lexicon, thin-vault header story, and Tonight shelf that doesn’t feel seeded by the named classics. |

**Mean ≈ 3.0.** Packing reviews scoring ~3.8 measured *structure*. This scores *offer*.

---

## Squint (Arrange / Taste / Pro Max)

- **Arrange:** Claim and Self V1 pass one-job squint. Mood/Archive fail rhythm (tiny content island in black). Hub Doors is monotonous equal cards — intentional catalog, weak composition.
- **Taste:** Horror booth holds. Gold not stacked on hub Enter. Sparkles gone. Jargon chrome risks “LARP UI” if shelf quality doesn’t back it.
- **Pro Max:** Touch/map floor previously gated; deepen modal present. Density bipolar (cockpit vs empty Mood) is the live UX smell.

---

## Bottom line for Daniel

| Question | Answer |
|----------|--------|
| Does packing live up to Mode-split B / game-HUD? | **Yes** — stages work; length green; gate can stay closed. |
| Does Worlds live up to what the *app sets out to offer*? | **Partially.** Horror path ≈ 70% of the booth fantasy. Vault-wide product ≈ thin catalog with excellent chrome. |
| Ship? | **Ship for Daniel QA of the Horror Self↔Guided loop** — yes. **Ship as “immersive curated Worlds” marketing-true** — not yet. |
| What would flip promise to delivery? | (1) Dense-shelf honesty / seed strategy so Tonight feels earned, (2) one real metaphor layout difference beyond accent, (3) Guided labels that teach in plain speech, (4) Mood/Archive either get density or get demoted in copy. |

**Do not reopen packing waves for these.** They are product-truth and craft-of-value gaps, not fold-count bugs.

---

## Evidence index

| Shot | Path |
|------|------|
| Hub Doors | `docs/plans/_promise-audit/01-hub-doors.png` |
| Hub Map | `docs/plans/_promise-audit/02-hub-map.png` |
| Hub Mood | `docs/plans/_promise-audit/03-hub-mood.png` |
| Hub Archive | `docs/plans/_promise-audit/04-hub-archive.png` |
| Horror Self | `docs/plans/_promise-audit/05-horror-self.png` |
| Guided Claim | `docs/plans/_promise-audit/06-horror-claim.png` |
| Widen | `docs/plans/_promise-audit/07-horror-widen.png` |
| Deepen | `docs/plans/_promise-audit/08-horror-deepen.png` |

Live folds sampled @ 1440×900: Hub Doors **1.412** · Map **1.107** · Mood **1.0** · Self 2010s **1.801** · Claim ~**1.0–1.5** · Widen **1.54**.
