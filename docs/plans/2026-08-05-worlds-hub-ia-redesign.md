# Worlds Hub IA Redesign — 2026-08-05

**Surface:** `/genre` Worlds index/hub (`GenrePicker`) — worktree `immersive-curated-genre-specific-experie`  
**Not in scope:** `/genre/:slug` GenreExperience (sibling IA pass already landed)  
**Design read:** Product archive index for a builder-cinephile — projection-booth atlas, Criterion hush + Instrument Ink chrome. Redesign-preserve tokens; overhaul information architecture.  
**Dials:** VARIANCE 5 · MOTION 3 · DENSITY 6 (product hub, not landing)

---

## Critique (from live `/genre` screenshot + a11y snapshot)

### Design health (honest)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 1 | No filled / sparse / empty signal on any world |
| 2 | Match real world | 2 | "Mood" chips feel like tag soup, not cinema |
| 3 | User control | 3 | Links work; path into a world is buried |
| 4 | Consistency | 1 | Sci-Fi + Science-Fiction duplicate doors |
| 5 | Error prevention | 2 | Empty worlds look identical to filled ones |
| 6 | Recognition | 2 | Cards are text-only; metaphor not staged |
| 7 | Flexibility | 2 | Mood-first forces alphabet scan of 36 chips |
| 8 | Aesthetic / minimal | 0 | Pill cloud + identical card grid + constellation through type |
| 9 | Error recovery | 3 | Navigation recoverable |
| 10 | Help | 1 | Hero copy is generic; no atlas legend |
| **Total** | | **17/40** | **Needs redesign** |

### Anti-patterns verdict

**Fail — AI-adjacent product slop.** Identical rounded card grid (icon-less heading + two lines), pill clusters as primary IA, constellation lines crossing body text, weak "Worlds" eyebrow-as-hero. Not vault. Not projection booth.

### Priority issues

1. **[P0] Wrong first job** — "Browse by mood" (36 alphabetized pills) owns the first viewport. The job of the hub is *enter a world*, not *decode a mood thesaurus*.  
   **Fix:** Hero + Atlas first. Mood demoted to secondary entry.

2. **[P0] No world status** — Every card looks equally "ready." Sparse/empty worlds look broken once entered.  
   **Fix:** Library-derived status per world: filled (≥6), sparse (1–5), empty (0). Align niche threshold with GenreExperience (`NICHE_THRESHOLD = 6`).

3. **[P0] Duplicate / weak doors** — Sci-Fi alias listed beside Science-Fiction; cards are same-weight text slabs; accent unused.  
   **Fix:** One door per curated world (hide alias slugs). Metaphor as provenance, accent edge, status mark, clear enter path.

4. **[P1] "Featured" + "All genres" are leftovers** — Featured = all proof keys dumped; All genres = residual TMDB dump as more pills. No hierarchy between curated atlas and archive remainder.  
   **Fix:** Rename roles — **Atlas** (curated) vs **Archive** (remainder). SectionHead chrome.

5. **[P1] Atmosphere fights content** — Full-bleed constellation web crosses card titles. Decorative, not compositional.  
   **Fix:** Constellation stays in hero only (or opacity-contained); cards get material lacquer without line-through-type.

6. **[P2] No closing gesture** — Hub ends on leftover chips. WorldsMap lives only inside genre pages.  
   **Fix:** Mount WorldsMap as the hub's closing atlas.

### What's working

- Mood → slug mapping exists and is tested (keep; relocate).
- GENRE_WORLDS metaphors + tone prompts are real content — just mis-staged.
- ConstellationBackdrop + film-grain vocabulary already in the product language.

---

## Target composition (one job per section)

```
┌─────────────────────────────────────────────────────┐
│ HERO — name the atlas                               │  viewport 1
│   "Worlds" (brand-forward) + one whisper line       │
│   ghost numeral = curated world count               │
│   legend: filled · sparse · empty                   │
│ ATLAS — step into a world (primary doors)           │
│   curated worlds, status-aware, accent edge         │
├─────────────────────────────────────────────────────┤
│ BY MOOD — alternate entry (secondary, compact)      │
│ ARCHIVE — remaining TMDB genres (honest leftovers)  │
│ MAP — WorldsMap warp graph (leave with orientation) │
└─────────────────────────────────────────────────────┘
```

### Atlas card anatomy

| Layer | Content |
|-------|---------|
| Provenance | Metaphor (Reading Room / Threshold / …) |
| Title | Display name (not raw slug) |
| Status | filled / sparse / empty + count whisper |
| Tone | `register.tonePrompt` (one line) |
| Affordance | Whole card = link into `/genre/:slug` |

### Status model

| Status | Library titles matching world | Meaning |
|--------|-------------------------------|---------|
| empty | 0 | Unseeded — enter to bootstrap |
| sparse | 1–5 | Niche / thin rail |
| filled | ≥6 | Ready depth (matches GenreExperience niche gate) |

Counts from a single `api.library()` pass; match `LibraryEntry.genres` via slugify + known aliases (`sci-fi` → science-fiction, etc.).

### What cuts / changes role

| Before | After |
|--------|--------|
| Mood chips first | Mood chips after Atlas |
| "Featured" identical cards | Atlas doors with status + accent |
| Sci-Fi + Science-Fiction both listed | Science-Fiction only (alias stays routable) |
| "All genres" same pill language as mood | Archive — quieter, labeled remainder |
| Constellation through whole page | Atmosphere owned by hero |
| No map on hub | WorldsMap closes the page |

### What stays

- `MOOD_TO_SLUGS` / mood tests (region + chips + hrefs)
- `GENRE_WORLDS` data + `getGenreWorld`
- ConstellationBackdrop / film-grain tokens
- SectionHead / Instrument Ink voice
- WorldsMap component (mount only — no GenreExperience thrash)
- Route `/genre` → GenrePicker

---

## Success criteria

1. First viewport reads as one composition: Worlds hero + start of Atlas — not a mood pill cloud.
2. Every curated door shows filled / sparse / empty (or loading-neutral).
3. Sci-Fi alias is not a second card.
4. Mood section still present, labeled, every mood chip still links.
5. Click 2–3 atlas doors → GenreExperience still loads.
6. No edits to GenreExperience.tsx beyond zero (sibling owns that surface).

---

## Out of scope

- GenreExperience IA / GuidedTour / CompanionPanel
- Server genreExperienceService
- CompareWorlds
- New mood taxonomy / new world definitions
