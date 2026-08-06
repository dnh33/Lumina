# Worlds hub IA — tabs + door cards (2026-08-06)

**Worktree:** `immersive-curated-genre-specific-experie`  
**Surface:** `/genre` (`GenrePicker.tsx`)  
**Design read:** redesign-preserve Instrument Ink booth - hub = **control room**, not atlas-first.

## Daniel feedback honored

1. Map must not own the top of the page.
2. Restore **door list cards** (Wave 3 linear tone rows were a regression).
3. One central control to switch hub parts.

## IA

```
┌─ HubChrome (Worlds + shelf legend + particles) ─┐
├─ Tabs: Doors · Map · Mood · Archive ────────────┤
└─ One panel visible ─────────────────────────────┘
```

| Tab | Default? | Content |
|-----|----------|---------|
| **Doors** | Yes (`/genre`, no `tab`) | Restored `WorldDoor` card grid (`sm:2` / `lg:3`) - metaphor, tone, shelf copy (`No shelf · catalog live`), visible Enter |
| **Map** | `?tab=map` | Territory `WorldsMap` (hub variant) - opt-in, not first fold |
| **Mood** | `?tab=mood` | ≤8 high-signal mood chips (soup quarantine kept) |
| **Archive** | `?tab=archive` | TMDB leftovers as quiet pills |

## Archaeology

Pre-Wave-3 component was `WorldDoor` (card). Wave 3 soup leftovers replaced it with `DoorRow` (linear) and put map in the atlas cluster first. Cards restored from that `WorldDoor` markup; Enter affordance stays visible at mist (gold on hover) per Pro Max P1.5.

## Length

One panel at a time - no map + disclosures stack. Doors grid may scroll past 1.5 vh on short viewports; closed chrome + tabs stay compact.

## Out of scope

Genre-page hero / Mode-split packing - sibling lanes.
