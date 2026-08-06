# Worlds — Full Inventory (as of now)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Live:** `:5173` UP · `:4000` UP · sniff viewport via Chrome CDP  
**Evidence:** live Hub tabs · Horror Self / Guided Claim / Widen / Deepen · Library `?status=watchlist` · Shell · code + claim-loop DoD · packing board · promise-vs-delivery · blind-angles · hub IA  
**Canvas:** `worlds-full-inventory.canvas.tsx`  
**Law:** Mode-split B packing CLOSED. This is product inventory, not a packing re-gate.

**Status legend**

| Tag | Meaning |
|-----|---------|
| **solid** | Real end-to-end job; user can complete it without faith |
| **partial** | Loop exists; trust, sync, or depth incomplete |
| **thin** | Mounted but under-delivers the job |
| **chrome** | Atmosphere / craft / metaphor paint — little product job |

---

## Verdict (one breath)

Packing and Mode-split B made Worlds *operate as stages*. The Horror Guided claim loop (dials → Tonight shelf → bag → Library link · Widen · Deepen) is the densest real product. Hub Doors + shelf heat are honest routers. Mood/Archive/metaphor-as-place/Export notes remain thin or chrome. Library handoff writes the queue but **does not consume** `?status=watchlist` (All pill stays pressed).

Live hub shelf heat right now: **Dense 2 · Thin 6 · No shelf 8** (Horror 8, Thriller 6). Resume tour on Horror, Documentary, Fantasy.

---

## Surfaces

### Hub — `/genre` (`GenrePicker`)

| Panel | Default | What it is | Status |
|-------|---------|------------|--------|
| **Doors** | Yes | 16 tone cards (metaphor + tone + shelf copy + Enter → Self). Resume mist chip when guided progress exists | **solid** entry; metaphor labels **chrome** |
| **Map** | `?tab=map` | Territory SVG + focus strip (gold Enter) + kinship warps + Resume | **partial** — best game-HUD enter; warp habit unproven |
| **Mood** | `?tab=mood` | 8 feeling chips → first owning world (Self) | **thin** — router pills on empty stage |
| **Archive** | `?tab=archive` | 14 leftover TMDB genres (Generic metaphor) | **thin** — enterable chip wall |

Chrome: Worlds H1, shelf legend, HeroAtmosphere dust/grain. Gold ration: Enter (Map strip) owns gold; Shell Worlds stays mist.

### Self — `/genre/:slug?mode=self` (`GenreExperience` + `GenreModules` stage=`full`)

Horror live (1980s): Threshold hero · seeded-by line · mono title count · Self/Guided + Movies/TV sticky chrome · WhisperStrip · compact steer (Search/Sort/Curated/Surprise/Less known + Narrow) · Timeline decade scrub · dual-pane tray \| Featured inspect (argument + Watchlist/Pass) · Also tagged · Filmmakers · NeighborRail · Open vault atlas · ExportWorld.

**Status:** **solid** browse instrument on dense shelves. Below-fold modules + Export = **partial/thin**. Metaphor backdrops (Constellation/Frontier) = **chrome**.

### Guided stages — `/genre/:slug?mode=guided` (`guidedStage` + `GuidedTour` + server `guidedSessionService`)

| Stage | Derive | Live job | Status |
|-------|--------|----------|--------|
| **seed** | Niche / empty affinity | Quiet desk until shelf has ground | **partial** (niche path) |
| **dial** | Answers incomplete | Three metaphor dials (tempo/era/risk) → rank shelf | **solid** mechanics; lexicon **partial** |
| **claim** | Complete + not widen | Tonight shelf (3) · Watchlist/Pass · Tonight bag · Widen CTA · Argue disclosure | **solid** on Horror Classic seeds |
| **deepen** | Companion FAB open (widen wins) | Right rail dialog · dial chips · Defend tonight's three | **partial** — talks well; acts rarely |
| **browse** (Widen) | `widenBrowse` | Browse-bar `Guided · archive · {band}` · Retake · Back to shelf · era-banded tray | **solid** stage park |

Claim-as-home: sticky widen collapses on Guided remount unless Widen fired this visit. Cold hub Enter = Self; Resume = Guided.

### Widen

Claim desk parks. Tray + leave path (neighbors/export). Era dial → decade tray honesty. **solid** Mode-split park.

### Deepen (`CompanionPanel` guided)

`role=dialog` `aria-modal=true` · Escape → claim stage · MessageCircle FAB · tour dial chips · prefill from session. Greeting still generic vault voice. Shell nav becomes **Archive chat** in-world. **partial**.

### Library — `/library` (`Library.tsx`)

Your archive · status pills · stats · search/filters · Add title. Worlds handoff: `Open in Library` → `/library?status=watchlist`. **Bug/gap:** page **ignores** URL `status` (state defaults `all`). Watchlist rows still appear in All with ribbons. **partial** destination.

### Shell (`Shell.tsx`)

Discover · Library · Worlds · Companion · Settings. Private-memory footer. Genre surfaces: mist active nav (gold yields to Enter/world verbs). In-world Companion label → Archive chat. **solid** chrome frame.

---

## Features table

| Feature | Where | Status | User value |
|---------|-------|--------|------------|
| Door cards + Enter → Self | Hub Doors | solid | Pick a room without silent Guided resume |
| Resume tour chip | Hub Doors/Map | solid | Explicit return to Claim |
| Shelf heat legend (Dense/Thin/No) | Hub | solid | Honesty about vault density before enter |
| Territory map + gold Enter | Hub Map | partial | Spatial enter; secondary to Doors |
| Kinship warps | Hub Map / NeighborRail | thin | Cross-world jump exists; habit weak |
| Mood chips (8) | Hub Mood | thin | Fast feeling→room; no preview/density |
| Archive TMDB leftovers | Hub Archive | thin | Completeness; Generic rooms |
| Self/Guided mode flip | In-world chrome | solid | Re-stages; clears widen |
| Movies/TV toggle | In-world chrome | solid | Catalog axis switch |
| Era continuity Self↔Guided | `guidedStage` + experience | solid | Decade ↔ Classic/Turn/Now both ways (DoD) |
| Decade timeline scrub | Self / Widen tray | solid | Browse by era |
| Compact steer rail | Self | solid | Search/sort/presets without stealing tray |
| Browse-inspect dual pane | Self Featured | solid | Tray + argument in one fold |
| Featured Watchlist/Pass | Self | solid | Claim rhythm on inspect title |
| Self Pass (local hide) | Self Featured | thin | Session-local only; not durable taste |
| WhisperStrip | Self/Guided | partial | State voice; Guided cues useful |
| Experience hero / seeds / mono N | In-world | chrome→partial | Provenance + craft; N still loud |
| Guided dials (3 beats) | Claim | solid | Constraints reshape Tonight shelf |
| Metaphor dial labels | Claim | partial | Voiceful; first-session tax |
| Tonight shelf (rankForGuided + seeds) | Claim | solid | Classic Horror showed Exorcist/Thing/Rosemary |
| Peer activate → actions | Claim shelf | solid | Inactive peer then Watchlist/Pass |
| Tonight bag + Open in Library | Claim | partial | Closes loop visually; Library URL sync broken |
| Retake | Claim/Widen | solid | Clear dials / reframe tour |
| Widen / browse archive | Claim→browse | solid | Archive without leaving Guided |
| Back to shelf | Widen | solid | Return to Claim home |
| Argue this pick | Claim/Deepen | thin | Thesis parked; not the primary verb |
| Deepen FAB + modal | Guided | partial | Defend shelf; generic greeting |
| Archive chat (Shell) | In-world nav | partial | Split companion mental model |
| Self Companion FAB (Talk) | Self | partial | World chat; not shelf-bound |
| ExportWorld Save note / Printable | Self leave / Widen leave | thin | localStorage notes; no in-app reader |
| NeighborRail | Leave path | thin | Adjacent worlds list |
| GeoMap / MarathonBuilder | Module leave path | thin | Power toys; not core pick job |
| Topic / Filmmakers / Maker | Self secondary | thin→partial | Context after pick |
| Niche empty / seed stage | Thin rooms | partial | Bootstrap to Library |
| cueBeatMap / sound | Register data | chrome | Declared; not earning live walk |
| Server guided session persist | API/settings | solid | Answers, picks, acted, conversation link |
| Library status archive | `/library` | solid as vault; **partial** as Worlds exit | Queue exists; Worlds deep-link incomplete |

---

## Userflows

### F1 — Hub Enter → Self browse → Watchlist

1. Open `/genre` (Doors).
2. Read shelf heat; pick a Dense/Thin door (e.g. Horror).
3. Tap card / Enter → `/genre/horror?mode=self`.
4. Scrub decade (optional); tap tray poster → Featured inspect.
5. Watchlist (or Pass) on Featured.
6. Optional: Open in Library / Shell Library.

### F2 — Resume Guided → Claim → Tonight bag → Library

1. Hub shows **Resume tour** when session has progress.
2. Resume → `/genre/horror?mode=guided` · `data-guided-stage=claim` (if complete).
3. Or cold Guided: answer Tempo → Era → Risk dials (radios).
4. Tonight shelf ranks (seeds boosted on Classic).
5. Activate peer if needed; Watchlist lead/peer.
6. Tonight bag appears → **Open in Library** (`/library?status=watchlist`).
7. Library shows archive; **Watchlist pill may still be All** — filter manually.

### F3 — Widen archive → Back to shelf

1. From Claim, **Widen / browse archive**.
2. Stage=`browse`; bar shows `Guided · archive · {band}`; tray era-limited.
3. **Back to shelf** → Claim. **Retake** clears/reframes.

### F4 — Deepen companion

1. On Claim, FAB Deepen/Talk.
2. Rail dialog: dial chips + suggestions (Defend tonight's three).
3. Chat; Escape/close → Claim. Shell **Archive chat** is separate global `/chat`.

### F5 — Mood / Map / Archive enters

1. Hub tab Mood → chip → Self cold enter of owning world.
2. Hub Map → focus node → gold Enter (Self) or warp neighbor.
3. Archive chip → Self Generic room.

### F6 — Mode flip with era inherit

1. Self at 1980s → Guided prefers Classic until session era set.
2. Guided Classic → Self restores densest decade in band / last Self decade.

---

## Interactions

| Pattern | Where | Notes |
|---------|-------|-------|
| Click / tap Enter | Hub doors, Map strip | Stretched link on cards; gold CTA on Map |
| Resume chip | Hub | Mist; separate from Enter |
| Tablist panels | Hub | Doors/Map/Mood/Archive; URL `?tab=` |
| Mode / media toggles | Sticky session chrome | `aria-pressed`; flip remounts stage |
| Decade scrub ◀ tabs ▶ | Timeline | URL `decade=`; tray filters |
| Steer Search/Sort/presets | Self | Narrow disclosure for tags |
| Tray poster select | Self/Widen | Feeds Featured |
| Featured Watchlist/Pass | Self | Accent fill Watchlist |
| Dial radios | Guided | Arrow/Home/End roving; click selects + answers |
| Needle re-tune | Guided complete | Tap answered dial → re-open radios |
| Shelf lead vs peer | Claim | Actions on active cell; first peer click activates |
| Tonight bag Stay on shelf | Claim | Dismiss until bag grows |
| Widen / Back / Retake | Guided | Stage machine |
| Companion FAB | In-world | Guided = deepen modal; Self = Talk panel |
| Escape | Deepen | Returns claim stage |
| Skip to world | In-world | Skip link → `#world-main` |
| Keyboard Map markers | Hub Map | Tab focus; Enter/Space open |
| Export Save note / Printable | Leave path | localStorage + print toggle |

---

## Value-adds (what actually helps)

**Pick**

- Three Guided dials + `rankForGuided` (unwatched, era, tempo/risk, seed boost) → scarce Tonight three.
- Classic seed injection makes Horror Claim feel curated (live: Exorcist / Thing / Rosemary).
- Self Featured argument + tray = decide from a shelf, not a dump.
- Hub Dense/Thin/No before enter = don't waste a cold room.

**Watch**

- Watchlist → private library status (server `addToLibrary`).
- Tonight bag names what you queued this tour.
- Open in Library is the intended exit ritual (URL sync still weak).

**Remember**

- Guided session persistence (answers, picks, acted, conversationId).
- Library as long-term vault (stats, filters, statuses).
- Seeded-by anchors + shelf heat from vault counts.
- Export note to `lumina:notes` (artifact exists; no reader surface).

**Orientation**

- Mode-split stages (one job per fold on Claim/Self V1).
- Whisper / outcome cues after dials and acts.
- Resume vs cold Enter split.

---

## Gaps / uneven corners

1. **Vault unevenness** — 2 Dense / 6 Thin / 8 empty doors; Horror path carries the product fantasy.
2. **Metaphor = coat of paint** — Threshold/Reading Room/etc. change copy + accent + dial lexicon, not layout grammar.
3. **Library deep-link** — `?status=watchlist` ignored; All stays pressed (claim-loop known non-blocker, still a value leak).
4. **Mood / Archive** — high-signal copy, sparse stages.
5. **Deepen voice split** — tour-aware chips/prefill vs generic “Good afternoon… What are we looking for?”
6. **Two companions** — in-world FAB vs Shell Archive chat / Companion.
7. **Pass is forgetful** — Guided dismiss drops shelf seat; Self Pass is local Set; no durable refusal memory.
8. **Export dead-end** — Save note under leave path; no Claim export; no notes UI.
9. **Warps / neighbors / geo / marathon** — present; not the pick job.
10. **Sound / cueBeatMap / serendipity / juxtapose** — design backlog, not live value.
11. **Guided lexicon tax** — Creeping / Breach / Unmarked door / “The door is chosen” — powerful after fluency, opaque first session.
12. **TV Guided** — media toggle exists; parity/feel vs Movies unproven in this sniff.
13. **Escape deepen** — stage returns to claim; dialog teardown can lag one frame (timing).
14. **Doors vs Map default** — Doors trains catalog cards; Map is the clearer HUD enter but opt-in.

---

## Score snapshot (inventory lens)

| Axis | Score /5 | Note |
|------|--------:|------|
| Browse (Self + Hub enter) | 3.5 | Horror Self solid; vault-wide thin |
| Guided claim loop | 4 | Mechanics + seeds + bag; Library sync − |
| Widen / Deepen | 3.5 / 3 | Widen solid; Deepen partial |
| Hub IA | 3 | Doors solid; Mood/Archive thin |
| Library handoff | 2.5 | Writes queue; URL filter broken |
| Craft / booth | 4 | Instrument Ink holds on Horror |
| Metaphor-as-place | 2 | Labels + accents |
| Remember / export | 2.5 | Library vault strong; Worlds artifacts weak |

**Mean ≈ 3.2** — better than raw promise audit on claim-loop completeness; still not vault-wide amazing.

---

## Evidence index

| Check | Live observation |
|-------|------------------|
| Hub Doors | 16 doors; Dense 2 / Thin 6 / No 8; Resume on horror/documentary/fantasy |
| Hub Map/Mood/Archive | Map Enter Horror gold; 8 moods; 14 archive chips |
| Horror Self 1980s | browse-inspect; Thriller Featured; Watchlist/Pass; Archive chat nav |
| Horror Guided Claim | stage=claim; Classic dials; shelf Exorcist/Thing/Rosemary; Tonight bag |
| Widen | browse-bar Classic band; tray 1970s; Back → claim |
| Deepen | dialog aria-modal; dial chips; Defend tonight's three; Escape → claim |
| Library | H1 Your archive; `?status=watchlist` but All pressed; watchlist ribbons present |

**Related plans:** packing-status-board · claim-loop-dod · promise-vs-delivery · blind-angles-features · hub-ia-tabs · amazing-or-nah-gate
