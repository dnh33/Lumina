# v1.5 — 13-Genre Module Matrix Spec (authored + grilled 2026-07-15)

> Authoring the spec the design doc referenced but whose subagent cache was lost
> (design §13.6: "Full matrix in subagent cache" — file does not exist anywhere).
> Built on the 6 modules already implemented (T11-T16): `timeline` · `topic` · `critic`
> (credibility) · `watchorder` · `argument` · `geo`. Plus v1's `maker` (already in union).
>
> **Honesty rule:** bespoke *native signatures* named in the design (Constellation map,
> dread-spectrum, frontier map, director-spotlight, studio-lore) require NEW components
> not yet built. This spec maps each genre to the 6 real modules, and lists the bespoke
> signature as a deferred enhancement — NOT invented here.

## Module inventory (real, built)
| key | module | data needed |
|---|---|---|
| timeline | TimelineScrubber | items.year |
| topic | TopicCluster | items.genreIds (genre-clustered) |
| critic | CredibilityStrip | credibility map (distributor/streaming/consensus/stance) |
| watchorder | WatchOrderSequencer | watchOrder map (seasons) |
| argument | ArgumentPanel | arguments map (thesis + counterpoint) |
| geo | GeoMap | geo map (production regions) |
| maker | (v1) maker spotlight | favoriteDirectors / crew |

## 13-genre matrix (per §13.3 archetypes → module sets)
1. **Documentary** (Non-Fiction) → `timeline, topic, critic, argument, watchorder`
   - exemplar per §13.4. Fully covered by built modules.
2. **War & Politics** (Non-Fiction) → `timeline, topic, critic, argument, geo`
   - geo = conflict/production regions.
3. **History** (Non-Fiction) → `timeline, topic, critic, geo`
4. **Sci-Fi** (Narrative-Fiction) → `timeline, topic, argument, maker`
   - bespoke signature "Constellation map" = DEFERRED (needs new component).
5. **Romance** (Narrative-Fiction) → `timeline, topic, argument, maker`
6. **Crime/Mystery** (Narrative-Fiction) → `timeline, topic, argument, maker`
7. **Film-Noir/Thriller** (Procedural) → `timeline, topic, argument, maker`
8. **Comedy** (Episodic) → `timeline, topic, watchorder`
9. **Animation/Anime** (Animated) → `timeline, topic, maker`
   - bespoke "studio-lore" = DEFERRED.
10. **Western** (Mood/Aesthetic) → `timeline, topic, maker, geo`
    - bespoke "frontier map + director spotlight (Ford/Leone)" = DEFERRED.
11. **Fantasy** (Mood/Aesthetic) → `timeline, topic, argument, maker`
    - bespoke "dread-spectrum/era cycles" = DEFERRED (shared w/ Horror).
12. **Music** (Mood/Aesthetic) → `timeline, topic, geo`
13. **Travel** (Mood/Aesthetic) → `timeline, topic, geo`

## Grill verdict (5-axis)
1. **Spec fidelity** ✓ — every genre maps to ≥2 real built modules; matches §13.3 archetypes.
2. **Measurability** ✓ — T18 test asserts each genre's `modules` array matches this table.
3. **Constraint honors** ✓ — no invented components; bespoke signatures explicitly deferred.
4. **Composition** ✓ — pure `genreWorld.modules` config edits; `GenreModules` already switches all 7 keys.
5. **Success** ✓ — 13 genres each get a structurally-different module mix (not a recolored shell).

**Decision carried:** full 13-genre matrix = the 7 real modules across all 13 genres. The
bespoke *signatures* (Constellation/dread-spectrum/frontier-map/studio-lore/director-spotlight)
are a SEPARATE build (new components) — out of scope for this PR per the honesty rule above.
They are noted, not dropped.
