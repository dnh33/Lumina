# Genre Experience IA Redesign — 2026-08-05

**Surface:** `/genre/:slug` Worlds experience (worktree `immersive-curated-genre-specific-experie`)  
**Design read:** Product UI for a builder-cinephile, archive-backed projection booth, Criterion hush + Instrument Ink chrome. Redesign-preserve tokens; overhaul information architecture.  
**Dials:** VARIANCE 5 · MOTION 4 · DENSITY 5 (product, not landing)

---

## Critique (from live Documentary screenshot)

### Design health (honest)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 2 | Decade filter vs timeline display disagree when "all eras" |
| 2 | Match real world | 1 | Comedy spine dominating Documentary world |
| 3 | User control | 3 | Filters work; crowded |
| 4 | Consistency | 1 | Same title restated 4 ways |
| 5 | Error prevention | 2 | Sparse worlds look broken, not sparse |
| 6 | Recognition | 2 | Timeline cards are text-only; posters appear later |
| 7 | Flexibility | 3 | Mode/media/tags all present |
| 8 | Aesthetic / minimal | 0 | Sections compete; accidental giant "For You" |
| 9 | Error recovery | 3 | Retry exists |
| 10 | Help | 2 | Whisper helps; hierarchy doesn't |
| **Total** | | **19/40** | **Needs redesign** |

### Priority issues

1. **[P0] Redundant title projection** — Nathan for You in timeline, topic rail, TitleCard+argument, and "For You" carousel. One title becomes the whole page four times.  
   **Fix:** One primary surface (timeline posters) + one deep dive (featured thesis). Cut the bottom carousel.

2. **[P0] Timeline interaction unfinished** — Controlled `decade=null` still highlights the first decade in the scrubber while the page shows all items. Text cards, no posters, weak affordance.  
   **Fix:** Real "All eras" state; poster-forward era rail; clear zoom/clear.

3. **[P0] Wrong-world framing** — Topic spines use `genreIds[0]`, so a docu-comedy surfaces as **Comedy** inside Documentary.  
   **Fix:** Topics become "Also tagged" facet chips (filter), not competing poster sections.

4. **[P1] Competing modules** — Critic + watch order + argument + TitleCard dump per title after the timeline already listed them.  
   **Fix:** Enrichment attaches to **one featured pick** for the current filter/era.

5. **[P1] Control bar density** — Search, sort, genre chips, Self/Guided, Movies/TV, presets in one soup.  
   **Fix:** Two rows: steer (search/sort/mode/media) then facets (tags + presets).

6. **[P2] Accidental bottom hero** — "SEEDING BY… / For You" + full-width poster reads like a forgotten second hero.  
   **Fix:** Remove; end with neighbors + map/export.

### What stays

- ExperienceHero (metaphor, ghost numeral, origin line)
- WhisperStrip
- GuidedTour mount (sibling owns polish — do not thrash core)
- CompanionPanel tree-position contract
- useGenreState URL authority
- NeighborRail, WorldsMap details, ExportWorld
- GenreEmptyState suggestion hooks (sibling owns empty polish)
- Module registry in `genreWorld.ts`

### What cuts / changes role

| Before | After |
|--------|--------|
| Timeline text cards | Poster-forward era rail (primary browse) |
| TopicCluster poster spines | "Also tagged" facet chips |
| Argument + TitleCard × N | Featured thesis × 1 |
| Watch order × N + Marathon dump | Watch order on featured series only; Marathon stays once |
| Critic strip × N | Critic on featured only |
| "For You" Carousel | **Removed** (redundant with timeline) |

---

## Target composition (one job per section)

```
┌─────────────────────────────────────────────┐
│ HERO — name the world                       │  viewport 1
│ WHISPER — what you're looking at            │
│ STEER — search / sort / Self·Guided / M·TV  │
│ FACETS — also-tagged chips + presets        │
├─────────────────────────────────────────────┤
│ TIMELINE — browse by era (posters)          │  primary
│   All eras | 1990s | 2000s | …  [clear]     │
├─────────────────────────────────────────────┤
│ FEATURED — why this title (argument + WO)   │  one pick
├─────────────────────────────────────────────┤
│ MAKERS / GEO (if module) — secondary axes   │
│ NEIGHBORS — warp to adjacent worlds         │
│ MAP + EXPORT — leave with something         │
└─────────────────────────────────────────────┘
```

Guided mode: GuidedTour sits under hero (unchanged mount). Sibling owns tour polish.

Empty / niche: GenreEmptyState keeps suggestion strip hooks — do not compete with this IA work.

---

## Timeline interaction model

| State | Scrubber | Page rails |
|-------|----------|------------|
| `decade = null` | **All eras** selected; posters from every decade (grouped or flat chronologically) | Full steered set |
| `decade = N` | Decade tab selected + zoom thesis | Filtered to N |
| Clear | "All eras" / Escape-equivalent control | Restores null |

Prev/next arrows step decades only when zoomed; disabled at ends. From All eras, next → earliest decade.

---

## Success criteria

1. A single title never appears as both timeline card *and* giant bottom carousel.
2. Documentary never leads with an unexplained "Comedy" poster section.
3. Timeline "All eras" matches page filter (`decade=null`).
4. First viewport: hero + steer + timeline start — not filter soup + four Nathans.
5. Browser check on Documentary, Horror (Threshold), Sci-Fi without starting/stopping the server.

---

## Out of scope (sibling agents)

- GuidedTour visual polish / session UX
- Empty-world suggestion copy beyond leaving hooks intact
- Server ranking / why Comedy titles land in Documentary catalog
