# Worlds — Blind angles + features that unlock the promise

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Lens:** Product opportunity (not polish). Mode-split B packing = CLOSED.  
**Evidence:** Live sniff `:5173` (hub Doors tabs · Horror Self · Guided claim · Deepen rail) + code/docs (Mode-split B, CompanionPanel, GuidedTour, ExportWorld, marathon, packing/roast plans).  
**Design read:** Cinephile vault *booth instrument* - genre rooms, Self vs Guided, companion deepen. VARIANCE 5–6 · MOTION 4 · DENSITY 7–8.

**Promise (stated by the product, not marketing):** Enter a genre room → either walk the decade vault yourself (Self) or set three dials and claim one of tonight’s three (Guided) → Watchlist/Pass lands in the private library → optional companion defends the shelf → optional widen into the archive. Hub shows shelf heat so you know which rooms are worth entering.

---

## Blind angles (missed UX)

### 1. Claim has no exit ritual
Watchlist on the Tonight shelf writes library status and flashes a cue. There is no “tonight bag,” no “open in Library,” no “this is what you’re watching,” no handoff that closes the loop. The strongest Guided verb dumps into an invisible store. Jordan finishes the tour and still asks: *where did it go?*

### 2. Export is a dead end under the fold
`ExportWorld` saves Markdown to `lumina:notes` + Printable. It sits on the Self leave path beside “Open vault atlas,” not on Claim. Tonight’s three never become a note without leaving Guided. Saved notes have no in-app reader, no Library surface, no Companion recall. Promise of “curated world as artifact” stops at localStorage.

### 3. Two Companions, one mental model broken
Shell nav **Companion** (global chat) vs in-world FAB (**Talk** / **Deepen**). Guided Deepen is shelf-bound and good. Global Companion still reads as a separate app. First-timers open Shell Companion expecting the horror tour; power users ignore the FAB. Job “deepen with companion” is split across destinations.

### 4. Guided return can skip Claim
Live: flipping into Guided with a completed session can land **Widen / archive browse** (`Back to shelf`) instead of the Tonight shelf. Mode-split B says Claim owns the aha. Returning mid-session or with sticky widen feels like “Guided broke into Self.” Recovery exists; the first paint lies.

### 5. Self and Guided do not share a shelf memory
Self decade scrub and Guided era dial are different clocks. Flip Self→Guided / Guided→Self still risks era teleport (roast2 P1; inherit work exists but the *felt* continuity is weak). User treats modes as tools on one room; product sometimes treats them as two libraries.

### 6. Hub metaphor without a job
Doors restore tone cards (good). Map / Mood / Archive are tabs. Metaphor labels (Threshold, Reading Room, …) and warps are brand-rich, habit-poor. Roast product-map already asked: prove warp use or admit chrome. Hub still does not teach *why* Threshold vs Constellation changes what you do inside.

### 7. Pass is forgotten taste
Pass = “not tonight” in Guided. No durable “passed in Horror,” no Self filter “hide passes,” no Companion that knows you passed *Baby Jane*. The vault learns watchlist; it does not learn refusal. Blind angle for a taste product.

### 8. Self tray cannot claim like Guided
Self has Featured argument + note box. No Watchlist/Pass on tray posters at the same rhythm as Claim. To queue a film from Self you leave Worlds or use Companion tools. Dual pick UX: Guided is decisive; Self is browse+essay.

### 9. Deepen talks; it rarely commits
Deepen prefill + “Defend tonight’s three” is strong. Closing the loop (watchlist from chat, swap a shelf seat, mark watched) is easy to miss. Chat that cannot *act* on the shelf becomes lecture.

### 10. Empty / thin rooms still feel enterable as equals
Hub honesty improved (Dense / Thin / No shelf). Inside empty rooms the experience thins to catalog + empty modules. Niche gate exists; the *product* still under-specifies “seed this room” vs “browse catalog.” No shelf rooms compete for the same Enter affordance as Horror.

### 11. Marathon / geo / modules vs the core job
Self leave path can mount GeoMap, MarathonBuilder, NeighborRail, Export. Those are power toys. They compete with “pick tonight” for attention and engineering. Blind angle: unfinished side quests look like the product when the claim loop is incomplete.

### 12. Watchlist count without a Worlds surface
Guided shows “N watchlisted” in-session. Worlds hub and Library do not show “queued from Horror tour tonight.” Cross-surface continuity is the missing atlas.

---

## Features that would unlock the promise (prioritized)

### Must (unlock the core job)

1. **Tonight bag / Claim handoff**  
   After Watchlist (and optionally Pass), a single closing state: the claimed title(s), link into Library filtered to watchlist, optional “open title.” One primary CTA. Without this, Guided is a quiz that forgets why it asked.

2. **Guided always re-enters Claim when session is complete**  
   Widen is opt-in only. Sticky widen on mode flip / remount must collapse. `Back to shelf` is recovery, not home. Aligns Mode-split B stage law with live return paths.

3. **One companion verb in-world**  
   Keep Deepen FAB as the only chat entry on `/genre/:slug`. Shell Companion either routes into the active world dock when a world is open, or copy makes the split explicit (“Archive chat” vs “World deepen”). Kill the twin-destination confusion.

4. **Self↔Guided era continuity**  
   Flip inherits dial band → decade (and reverse: Self decade informs dial when entering Guided). Announce once. Modes become lenses on one shelf, not teleports.

5. **Watchlist on Self tray (active title only)**  
   Same action rhythm as Claim (W2.3 pattern): one focused title → Watchlist / Pass. Self stops being “read the essay only.”

### Should (make the vault habit stick)

6. **Claim → Export of tonight’s three**  
   One “Save tonight’s shelf” on Claim complete: hook + three titles + dials + theses → notes *and* visible “Saved” that opens somewhere real (even a thin Notes strip). Stop burying Export under atlas link.

7. **Durable Pass / soft-block**  
   Persist Guided dismissals per world; optional Self “hide passed.” Companion deepen should know passes. Taste = yes *and* no.

8. **Hub “Resume tour” vs “Enter room”**  
   `genreSelfEnterPath` correctly cold-enters Self. When a Guided session is active/complete, show a second mist chip: Resume tour. Don’t silent-resume; don’t hide resume.

9. **Deepen acts on the shelf**  
   Suggestion chips that Watchlist / Pass / swap lead without leaving the rail. Prefill already has dials; finish with tools, not paragraphs.

10. **Warp habit or warp quiet**  
    Instrument warp clicks lightly *or* demote Map warps to NeighborRail-only. Stop arguing cartography as necessary for enter.

### Could (delight / power, after Must)

11. **Cross-world tonight bag** - one private “Tonight” list fed by any world’s Watchlist, visible from hub chrome.  
12. **Marathon from Guided three** - only when watchorder module applies; never on Claim fold.  
13. **Printable share card** - single poster strip of tonight’s three (local print), not social graph.  
14. **Metaphor-aware seed** - empty Threshold room gets a different seed CTA than empty Reading Room.  
15. **TV Guided parity** - dial copy + shelf ranking that doesn’t feel movie-ported.

---

## Competitive / adjacent patterns worth stealing (named)

| Pattern | Steal *what* | For Worlds |
|---------|----------------|------------|
| **MUBI Now Showing** | One decisive pick surface; scarcity of attention | Tonight shelf already; finish with exit ritual |
| **Criterion Channel Collections** | Editorial room with thesis, not genre dump | Keep Featured argument; don’t dilute with module soup |
| **Letterboxd Watchlist + Lists** | Queue is a first-class destination; lists are exportable artifacts | Library handoff + Claim export |
| **Letterboxd “Diary”** | Refusal and watch events are history | Durable Pass / watched feedback into the room |
| **Spotify DJ vs Your Library** | Two modes, same catalog, clear job labels | Self = browse vault; Guided = DJ; don’t mix steer into Claim |
| **Netflix “Play Something”** | Commit button after constraints | Watchlist as commit, not bookmark-and-forget |
| **Discogs Wantlist** | Want vs Have is explicit shelf heat | Hub Dense/Thin already; surface queued-from-world |
| **Arc Browser Spaces** | Context rooms without renaming the web | Metaphor rooms stay; don’t add more hub factories |
| **GTA pause-menu deepen** | Detail pane over paused action, not a second app | Keep deepen rail; don’t fork Shell chat as peer |
| **Apple TV Up Next** | Continuity strip across sessions | Tonight bag / resume chip on hub |
| **JustWatch** | “Where to watch” only after pick | Optional later; never before claim |

Do **not** steal: Letterboxd social feed, TikTok-style endless poster wall, Spotify Blend social, generic “AI recommendations” carousels.

---

## What NOT to build (anti-scope)

- **Another packing / fold-count wave** - Mode-split B length is GREEN. Interaction and job loops are the gap.  
- **More hub catalogs** - Mood soup expansion, peer Atlas + Map, door *and* map *and* mood as equal enters. Tabs already quarantine; don’t reopen multi-factory hub.  
- **Ghost-numeral / certificate chrome / solid gold FAB brick** - closed taste bans.  
- **Dual Deepen CTAs** (desk + FAB) as peers - one deepen entry.  
- **Featured-as-second-hero on Claim** - shelf owns fold.  
- **Silent Guided resume from hub Enter** - cold Enter stays Self; resume is explicit.  
- **Social / multiplayer / public lists** - vault is private memory; export is personal artifact.  
- **Geo / Marathon / module sprawl as P0** - park until Claim→Library loop is undeniable.  
- **Second recommender committee** on Claim (thesis + deepen + surprise + less-known + re-dial frame all peer).  
- **Pro Max blue / Orbitron / AI-purple companion** - Instrument Ink stands.  
- **Rebuilding map-as-required-product** without warp habit proof - keep as opt-in Map tab character.  
- **Chat that cannot touch library** as the “Companion product” - deepen without act is anti-promise.

---

## One-line verdict

Packing and Mode-split B made Worlds *look* like a booth. The promise unlocks when **Watchlist becomes a destination**, **Guided always returns to Claim**, and **Companion deepens the same shelf it talks about** - not when the hub gets another panel.
