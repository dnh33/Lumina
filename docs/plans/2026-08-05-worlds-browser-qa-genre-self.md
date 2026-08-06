# Worlds Browser QA — Genre Experience · Self mode

**Date:** 2026-08-05  
**Target:** `http://localhost:5173` (already running — not started/stopped)  
**Scope:** Self-mode layouts, sections, timeline, featured thesis — Documentary, Horror, Sci-Fi / Science-fiction, Film-noir · Movies + TV where toggle exists  
**Bar:** Highest (Impeccable critique / arrange / distill · design-taste · verification-before-completion)  
**Mode:** Audit only (no product fixes this pass) → **Fix pass applied 2026-08-05** (see Fix pass status below)

**Evidence:** Chrome DevTools snapshots + screenshots + interaction scripts in isolated contexts (`worlds-self-qa-v2`, `worlds-self-final`). Parallel Guided/hub QA tabs were active — Self findings below were confirmed on isolated pages with `Self` `aria-pressed="true"` and no GuidedTour chrome.

---

## Executive verdict

IA redesign **landed on the big cuts**: no **For You** carousel, no **Comedy-as-Documentary** poster spines, timeline is poster-forward with real **All eras**, Featured is a single thesis block. Self mode is usable and often handsome.

It is **not** ship-clean at the quality bar. Featured copy quality (raw JSON, markdown leaks, tautological provenance) and section order (Also tagged before Featured) are the main Soft→Fail cluster. Timeline posters navigate away rather than selecting Featured.

| Area | Result |
|------|--------|
| IA regressions (For You / Comedy spines) | **Pass** |
| Hero / whisper / counts | **Soft** |
| Control rows | **Soft** |
| Timeline (All eras · decade · posters · → featured) | **Soft** |
| Featured thesis (no title×4) | **Fail** (Film-noir) / **Soft** elsewhere |
| Also tagged | **Soft** |
| Neighbors / map / export | **Pass** |
| Chaos / overlap / competing heroes | **Soft** |
| Console | **Soft** |

**Overall Self mode:** Soft — redesign goals largely met; Featured enrichment + a few interaction edges block “best it can be.”

---

## IA redesign verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| For You carousel removed | **Pass** | No `For You` heading/region on Documentary, Horror, Science-fiction, Sci-fi, Film-noir Self. (False positive earlier: “Nathan for You” seed string.) |
| Comedy-as-Documentary spines gone | **Pass** | No `Comedy` H2 spine. Comedy appears only as Tagged / Also tagged **facet chips** (Film-noir Also tagged `Comedy (1)` — correct role). |
| Timeline All eras matches `decade=null` | **Pass** | `All eras` selected ↔ full poster set; decade tab filters count + rail. |
| One featured thesis (not N TitleCards) | **Pass** (structure) | Single `[data-testid=featured-thesis]`. |
| End with neighbors + map/export | **Pass** | Present on filled Self shelves. |

---

## Per-world matrix (Self · Movies unless noted)

### Documentary — Reading Room

| Check | Result | Notes |
|-------|--------|-------|
| Hero / metaphor / ghost numeral | **Pass** | “Reading Room” · Documentary · tone; faint `20`. |
| Whisper / counts | **Soft** | “Your every era leans open — 2 anchors, 20 unwatched.” Poetic; OK when filled. |
| Closest in your library | **Soft** | Extra section vs IA target composition (Hero → Steer → Timeline → Featured…). Useful Evidence chips, but sits between whisper and controls and steals first-viewport attention. Seeds include Nathan for You / The Rehearsal (docu-comedy) — labeled Evidence, **not** a Comedy spine. |
| Controls | **Pass** | Search, Sort (Curated), Self\|Guided, Movies\|TV, Tagged row, Surprise / Less well-known. Self pressed. |
| Timeline | **Pass** | 20 titles / 7 eras; posters; All eras; 2010s → 10 posters; featured retargets (e.g. One Direction). Next from All eras → earliest decade. Mode stays Self. |
| Selection → featured | **Soft** | Posters are `<Link>` to `/title/...` — **no in-page select**. Featured = `pickFeatured(steered)` (thesis + rating). Decade filter retargets Featured; click does not. |
| Featured | **Soft** | Selena Gomez: title once in Featured (good). Provenance tautology: `Dir. Alek Keshishian` + `From the team behind Alek Keshishian`. Argument prose OK. |
| Also tagged | **Pass** | `Music (1)` chip + framing copy. |
| Section order | **Soft** | Timeline → **Also tagged** → Featured. IA target: Timeline → **Featured** → makers → neighbors. |
| Neighbors / map / export | **Pass** | History, War Politics; Worlds map details; Save note / Printable. |
| TV | **Soft** | Toggle works; shelf swaps. Stale `decade=` from Movies can empty TV rail until All eras / clear (see Fix list). |
| Console | **Pass** | Clean on Self movie in isolated context. |

### Horror — Threshold

| Check | Result | Notes |
|-------|--------|-------|
| Hero / whisper | **Pass** | Threshold · “Uneasy, then visceral.” · “no anchors, 13 unwatched.” Ghost `20`. |
| Controls | **Soft** | Same pattern. Self uses **world red**; Movies uses **gold** — two loud accents compete (Self should win hierarchy in Self mode). Tagged row is long (Action…War). |
| Timeline | **Pass** | 20 / 9 eras; poster grid strong; All eras correct. |
| Featured | **Soft** | Alien · tautology (`Ridley Scott`). Argument leaks markdown: `**Alien**`. Title ×2 in Featured block. |
| Also tagged | **Soft** | Chips OK; `sr-only` title list still in a11y/innerText (not a visual second rail if CSS holds — verify visually on zoom). |
| Catalog taste | **Soft** | MJ’s Thriller, Come and See, Obsession 2026 on Horror shelf — curation oddity, not layout chaos. |
| Console | **Soft** | Saw insight `500` noise in shared sessions; Horror Self movie often clean. |

### Science-fiction / Sci-fi — Constellation

| Check | Result | Notes |
|-------|--------|-------|
| `/genre/science-fiction` Self | **Pass** | Constellation; 20 / 6 eras; Self+Movies; posters. |
| `/genre/sci-fi` Self | **Pass** | Alias works (`h1` Sci-fi); same metaphor; Featured Project Hail Mary; Closest + Timeline + Also tagged + Featured. |
| Hub duplicate | **Fail** (hub, not Self page) | Both cards Featured on Worlds index — tracked in hub QA; alias route itself is fine. |
| Featured | **Soft** | Hail Mary argument clean; tautology `Phil Lord` when no counterpoint. |
| Also tagged | **Soft** | Many chips; title membership dump in DOM. |
| Neighbors / export | **Pass** | Fantasy, Thriller, Anime; Export present. |

### Film-noir — Threshold

| Check | Result | Notes |
|-------|--------|-------|
| Hero / whisper (Movies filled) | **Pass** | Threshold · cynical tone · “no anchors, 20 unwatched” · ghost `3` when decade-zoomed / sparse counts vary. |
| Timeline | **Pass** | All eras; 1930s–1960s axis; posters; Next → 1930s + era thesis line. |
| Featured | **Fail** | **High and Low**: title appears **3×** in Featured region; argument body is **raw insight JSON** (`{ "verdict": "maybe", "matchScore": null, "comparisons": [...] }`); markdown leak; tautology `Akira Kurosawa`. |
| Also tagged | **Pass** (role) | Drama/Mystery/Crime/…/Comedy chips — facets, not spines. |
| TV / empty | **Soft** | TV + leftover movie decade → GenreEmptyState “A threshold not yet crossed” / Cross the threshold suggestions (Shawshank, Godfather, Dark Knight as noir bootstrap — stretch). Whisper can disagree with empty framing. |
| Neighbors / map / export | **Pass** | On filled Movies shelf. |

---

## Checklist deep-dive

### 1. Hero / whisper / counts — Soft

- Metaphor lockups work (Reading Room / Threshold / Constellation).
- Ghost numerals read as vault density, not SaaS KPI cards.
- Whisper copy is composed but sometimes opaque (“leans open”) and can contradict empty/TV states.

### 2. Control rows — Soft

- Two-row steer mostly present: search/sort/mode/media then tags + presets.
- **Movies gold vs Self world-accent** fights for primary CTA weight.
- Tag rows explode on broad worlds (Horror, Sci-Fi) — density without progressive disclosure.

### 3. Timeline — Soft

| Behavior | Result |
|----------|--------|
| All eras selected when `decade=null` | **Pass** |
| Decade scrub filters posters | **Pass** |
| Poster grid (not text cards) | **Pass** |
| Era thesis on zoom | **Soft** — deterministic fallback OK; LLM upgrade sometimes injects **title argument / markdown** into era line (Documentary 2010s showed One Direction hook with `**…**`). |
| Selection → featured | **Soft** — auto on filter change; **no** click-to-feature; posters leave the world. |

### 4. Featured thesis — Fail / Soft

- Structural win: one thesis block, explicit “not a second browse rail.”
- **Fail on Film-noir:** raw JSON as “The argument.”
- **Soft everywhere:** provenance fallback `From the team behind ${director}` when counterpoint missing = tautology next to `Dir. X`.
- **Soft:** markdown `**Title**` in thesis/hook strings rendered as literal asterisks.
- Title×4 classic regression largely gone on Documentary; Film-noir still multiplies title inside Featured.

### 5. Also tagged — Soft

- Correct IA role (chips, not rival poster spines).
- Ordered **before** Featured — competes with thesis for “what’s next after browse.”
- Membership titles in `sr-only` list — fine if truly screen-reader-only; a11y tree looks noisy.

### 6. Neighbors / map / export — Pass

- Neighbor buttons warp.
- Worlds map `<details>` + Export at end on filled Self pages.
- Map still tiny / buried (hub QA); acceptable as end-of-world leave path.

### 7. Chaos / overlap / competing heroes — Soft

- No element overlap found in scripted hit-tests on Documentary.
- Competing heroes: Closest-in-library (Documentary/Sci-fi) + GuidedTour when mode flips — Self itself is calm when Guided is off.
- Large vertical gap Timeline → Also tagged (~1300px) is poster grid height, not broken whitespace.
- Empty Threshold suggestions can feel like a second hero on sparse TV shelves.

### 8. Console — Soft

- Isolated Self Movies: often **no** console errors.
- Shared sessions: repeated `Failed to load resource: 500` on `/api/insight/...` (especially sticky TV / noir). Form-field `id`/`name` a11y issue (note, count 2) on Documentary.
- Insight 500s degrade Featured/era thesis into empty or raw payloads — linked to Featured Fail.

---

## Design health (Self filled shelf)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 3 | All eras / decade sync good; whisper vs empty can lie |
| 2 | Match real world | 2 | Provenance tautology; noir JSON as “argument” |
| 3 | User control | 3 | Filters work; no poster→feature without leaving |
| 4 | Consistency | 2 | Featured quality varies wildly by insight payload |
| 5 | Error prevention | 2 | Stale decade across Movies→TV empties shelf |
| 6 | Recognition | 3 | Posters primary |
| 7 | Flexibility | 3 | Mode/media/tags/presets |
| 8 | Aesthetic / minimal | 2 | Tag soup; Also tagged before Featured; dual accents |
| 9 | Error recovery | 2 | Empty state helps; insight failures opaque |
| 10 | Help | 2 | Framing copy on Featured/Also tagged helps |
| **Total** | | **24/40** | **Needs polish** (was ~19 pre-IA) |

**Anti-slop:** Not generic purple SaaS. Ink vault + Fraunces/Public Sans direction holds. Residual tells: markdown in UI strings, JSON dump, gold Movies chip louder than Self.

---

## Prioritized fix list

| Pri | Issue | Fix | Hints |
|-----|-------|-----|-------|
| **P0** | Featured argument shows raw insight JSON (Film-noir High and Low) | Normalize insight → thesis string; never render object/JSON; fallback to deterministic hook | `GenreExperience` lazyArguments · `api.insight` · `ArgumentPanel` |
| **P0** | Markdown `**title**` leaks into argument / era thesis | Strip or render markdown; don’t use title-hook as era thesis without sanitizing | `eraThesis` effect uses `insight.hook`; ArgumentPanel |
| **P1** | Provenance tautology `From the team behind ${director}` | Only use when counterpoint exists; else omit or use studio/year/rating line | `GenreModules.tsx` TitleCard `provenance` |
| **P1** | Section order: Also tagged before Featured | Swap: Timeline → Featured → Also tagged → makers → neighbors | `GenreModules.tsx` |
| **P1** | Stale decade on Movies↔TV | Clear decade (or clamp to available) when mediaType changes if current decade empty | `useGenreState` / media toggle in `GenreExperience` |
| **P2** | Era thesis upgraded from first-title insight | Keep deterministic era line; or dedicated era endpoint — don’t reuse title hook | `GenreExperience.tsx` eraThesis effect |
| **P2** | Posters don’t select Featured | Optional: click (modifier / button) sets featured without navigation; keep Link as secondary | `TimelineScrubber` |
| **P2** | Movies accent louder than Self | Demote media toggle to quiet chrome; reserve world accent for Self active | steer button classes |
| **P2** | Tag row overload | Cap visible tags + “more”; or only show tags with count ≥2 | steer facets |
| **P3** | Closest-in-library vs IA first viewport | Move below Featured or collapse into whisper Evidence | page composition |
| **P3** | Sci-fi + Science-fiction hub cards | Hub-only (see hub QA) | `GenrePicker` |
| **P3** | Insight 500 spam | Harden insight route for TV ids; client backoff | server insight + client |

---

## Fix pass status — 2026-08-05 (frontend-ultimate)

**Verified:** Film-noir Self Movies · Featured for *High and Low* — human prose argument, no JSON, no `**`, no director tautology, Featured above Also tagged, console clean.

| Pri | Issue | Status | Notes |
|-----|-------|--------|-------|
| **P0** | Raw insight JSON in Featured argument | **Fixed** | `client/src/lib/insightThesis.ts` + Featured-only insight fetch with overview fallback |
| Soft | Provenance `From the team behind {director}` | **Fixed** | Year line when no counterpoint |
| Soft | Markdown `**Title**` leaks | **Fixed** | Strip in thesis normalize + ArgumentPanel |
| Soft | Also tagged before Featured | **Fixed** | Timeline → Featured → Also tagged |
| Soft | Movies gold louder than Self | **Fixed** | Media toggle demoted to quiet chrome; Self keeps world accent |
| Soft | Stale decade empties TV | **Fixed** | `setMediaTypeParam` clears decade on Movies↔TV |
| Soft | Posters navigate away (no click→feature) | **Deferred** | IA: Featured = `pickFeatured(steered)` auto-pick; posters stay title Links by design. Click-to-feature not in target composition. |
| Soft | Insight 500s sticky-TV | **Fixed** (client) | Fetch insight for Featured pick only (not all shelf titles). Server 500 hardening not in this pass. |
| Soft | Era thesis from title insight / markdown | **Fixed** | Era thesis stays deterministic (no LLM title-hook upgrade) |
| Soft | Tag row overload / Closest-in-library / hub dup | **Deferred** | Out of this priority list / hub QA |

**Test plan tick:**
- [x] Film-noir Self Movies: Featured argument is human prose, never `{ "verdict"`
- [x] Any Featured with director and no counterpoint: no “From the team behind {same}”
- [x] Module order: Featured appears above Also tagged
- [ ] Movies decade=1930s → TV: clears decade (code path; spot-check if needed)
- [x] Console clean on Film-noir Self Movies

---

## What not to thrash

- Timeline poster rail + All eras model — keep.
- Also tagged as chips (not spines) — keep role; only reorder/density.
- Self vs Guided toggle contract — keep; Guided QA is separate.
- Neighbors / map / export end composition — keep.

---

## Suggested follow-up commands

1. `/clarify` or harden insight → thesis pipeline (P0 JSON + markdown)
2. `/distill` Featured provenance + section order
3. `/harden` mediaType decade clamp + insight 500s
4. `/polish` accent hierarchy on Self steer row

---

## Test plan (for fix PR)

- [ ] Film-noir Self Movies: Featured argument is human prose, never `{ "verdict"`  
- [ ] Documentary decade zoom: era thesis has no `**` and is era-scoped  
- [ ] Any Featured with director and no counterpoint: no “From the team behind {same}”  
- [ ] Module order: Featured appears above Also tagged in DOM/y  
- [ ] Movies decade=1930s → TV: either clears decade or shows non-empty TV eras without false empty hero  
- [ ] No For You / no Comedy H2 spine on Documentary  
- [ ] Console clean on Self Movies for Doc / Horror / Sci-Fi / Noir in an isolated tab  

---

*Rune · browser QA Self · 2026-08-05*
