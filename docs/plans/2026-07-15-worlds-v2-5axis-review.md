# Worlds v2 — 5-Axis Spec Review (grill-with-docs, post-build)

> **Banner (2026-08-05):** §8 “fixes pending” below is **HISTORICAL / STALE**. Code truth = `docs/plans/2026-08-05-worlds-finish-plan.md` (**0 open code blockers**; B1–B7 FIXED/DROPPED). **G1 = A** → ship-ready → Daniel live QA → PR → merge. Daniel runbook: `docs/plans/2026-08-05-worlds-daniel-ship-runbook.md`. Do not re-implement the original 7 unless Wave 1–2 fail.
>
> **Status (original):** REVIEW COMPLETE. 7 STILL-BLOCKING defects found + code-confirmed. Fixes pending (TDD).
> **Author:** Rune (orchestrator), consolidating 3 parallel grill subagents (technical-fidelity, architecture/composition, UX/feel) + orchestrator's own code re-verification.
> **Spec under audit:** `docs/plans/2026-07-15-worlds-v2-design.md` (option B, full merge) + `.hermes/plans/2026-07-15-worlds-v2-plan.md`.
> **Method:** Every agent re-derived from the *code* (not the plan), because the orchestrator authored the plan and would defend its own drift. Orchestrator re-grepped the top 7 blockers independently. Build is GREEN (240 client / 111 server) — green does NOT prove design fidelity; this review is the catch-net.
> **Scope:** client + server genre feature, branch `immersive-curated-genre-specific-experience` (HEAD `f76b19d`, **82 ahead / 0 behind** origin/main — wave-2 agent noted `0 82`; earlier `81` was off-by-one, harmless).
> **Wave 2 (5-axis table agent, `deleg_620adcb0`) COMPLETED 2026-07-16** — full output folded in below. All 4 agents agree on the 3 key drifts (`guided` no-op, `libraryVersion` orphaned, C5 remount) + the verified extras.

---

## 1. Five-Axis Verdict Table

| # | Axis | Verdict | Summary |
|---|------|---------|---------|
| 1 | **Spec fidelity** | **MIXED** | Most of Layers A/B/C/D landed (B1 metaphor, B3 provenance, B4 persistence, B5 sound, B6 spine, B8 density, C1 warp, C2 mood, C3 origin, C4 compare, C5 whisper, C6 export, C7 marathon, C8 presets, C9 overlay, C10 bootstrap, D1 decade zoom, D2 argument, D3 backdrop, D4 geo, D5 critic, D6 maker, D7 topic, D8 watchorder). **Dropped/reshaped:** K1 `guided` fiction still shipped (design said DROP it); C2 `libraryVersion` orphaned (never wired); D7 topic filter unwired; B2 eject-to-/chat CTA still present; B5 sound default inverted. **B7 serendipity** explicitly DROPPED (design marked NICE-TO-HAVE, no task/test) — not a blocker. |
| 2 | **Measurability ("real")** | **MIXED** | §8 promises mostly derivable: rails-paint-before-AI ✓ (lazy load test), titles clickable ✓ (PosterCard link), filters ✓, a11y roles ✓. **Not derivable / broken:** "no `take` anchors written during curation" — K3 guard exists but is inert on the production path (anchor storm still fires). Persistence-survives-reload ✓ (useGenreState test). |
| 3 | **Constraint honors** | **MIXED** | Private/local-first ✓ (no social graph). Font lock ✓ (no per-metaphor font). Single state authority ✓ (useGenreState). Cache-key contract W5 ✓. **Violated:** no-anchor-write-during-curation (G3/W2) — K3 guard not engaged; sound-OFF default — B5 defaults ON + autoplay. |
| 4 | **Composition / no regression** | **MIXED** | Chokepoint reuse ✓ (PosterCard/ChatThread/flag()). C4 route ordering ✓. C3 a11y cap ✓ (2 decorative backdrops, not 6 engines). **Regressions:** C5 Companion remounts across slug (aborts stream); D7 topic spine doesn't compose with tag filter. Build + 240 tests still green. |
| 5 | **Success criteria** | **MIXED** | Of design's own §8 + complaint closures: ~8/10 met or test-proven; 1 broken (no-anchor-write), 1 inverted (sound-off). Per-metaphor empty states ✓ (7.2). TV deep-link ✓ real. |

---

## 2. STILL-BLOCKING Defects (code-confirmed by orchestrator)

### B1 — K3 anchor storm (anti-fatigue guard inert on production path) — 🔴 HIGH
- **Design:** K3/W2 — `skipAnchorLog` added to `titleInsight`, guarding BOTH write sites (`logAnchor("take")` + `logAnchor("insight_neighbors")`). Goal: stop the `logAnchor` storm during world build.
- **Mechanism nuance (wave 2):** P2.2 *removed* the `titleInsight` call from server `enrichGenreItems` (deferred to client per-title fetch) rather than "threading `skipAnchorLog=true`" — so at the *server-enrichment* layer W2 holds. **But** the client bulk prefetch at `GenreExperience.tsx:220` re-introduced the write path via the `/insight` route.
- **Code:** Guard exists — `server/src/llm/insightService.ts:196` (param), `:234` (`take` guard), `:273` (`insight_neighbors` guard). BUT the only production caller, `server/src/routes/misc.ts:36-41` (`GET /insight/:type/:tmdbId`), calls `titleInsight(db, tmdbId, mediaType, refresh)` — **does NOT pass `skipAnchorLog`** (defaults `false`). And `client/src/pages/GenreExperience.tsx:220` bulk-prefetches `api.insight()` for **every** rail title on mount → each call writes anchors. The storm K3 was built to stop **still fires**.
- **Fix:** Route accepts `?skipAnchorLog=1` (or dedicated read route) → passes `skipAnchorLog:true`; genre page prefetch passes it. Add server test asserting no `logAnchor` rows written on the bulk path.
- **Evidence:** `misc.ts:36-41`, `insightService.ts:234,273`, `GenreExperience.tsx:220`.

### B2 — K1 `guided` no-op (design said DROP the fiction) — 🔴 HIGH
- **Design (§7.3, K1):** `guided` mode was FICTION (mode only entered cache key, never branched). Resolved to **DROP the claim**, not ship a no-op.
- **Code:** Toggle exists `GenreExperience.tsx:445-459`, flips `mode` into queryKey `:90` → refetch. But `server/src/services/genreExperienceService.ts:235-287` uses `mode` ONLY in `key` (`:236,:312`) + `mode` field (`:287`); `curatorIntro` ignores it. Output identical for `self`/`guided`. `openGuided` (`:102-111`) is a separate real `/chat` nav, not guided experience.
- **Fix:** Remove the `guided` mode toggle + `openGuided` eject entirely (design resolution). Keep `mode:"self"` literal. Update `ExperienceMode` if unused elsewhere.
- **Evidence:** `GenreExperience.tsx:445-459,90,102-111`; `genreExperienceService.ts:235-287`.

### B3 — C2 `libraryVersion` orphaned — 🟡 MED
- **Design (C2 blind spot):** Add `libraryVersion(db)` = MAX(updated_at)+row count; stamp persisted blob; reconcile on load so stale worlds refetch.
- **Code:** `server/src/services/libraryService.ts:504` implements it + `libraryService.version.test.ts`. BUT zero references in any route or client `useGenreState` — no endpoint exposes it; `useGenreState` never imports/compares it. Wiring the design specified does not exist.
- **Fix:** Either (a) wire it — add `GET /library/version` endpoint + `useGenreState` compares on load and invalidates if changed, OR (b) drop the claim from the design doc (document as deferred). Pick (a) if cheap, else (b) + ADR note.
- **Evidence:** `libraryService.ts:504`; grep shows no other references.

### B4 — C5 Companion remount across slug (aborts stream) — 🔴 HIGH
- **Design (C5):** Distinct `GENRE_DOCK_CONVERSATION_KEY` (✓ done) AND must NOT remount embedded ChatThread across `/genre/a→/genre/b` (else aborts in-flight stream).
- **Code:** `client/src/App.tsx:34` keys the route `<motion.div>` by **full `location.pathname`** (`... : location.pathname`). Because `/genre/a`≠`/genre/b`, `AnimatePresence mode="wait"` remounts `GenreExperience` → `CompanionPanel` → `ChatThread` on slug change → `useChat` cleanup aborts stream. `CompanionPanel.tsx:45-53` comment claims slug-independent constant key keeps conversation — **FALSE**; there is no genre-slug-remount guard.
- **Fix:** Use a slug-stable key for the genre route (e.g. `key="/genre"`), so the page (and embedded thread) does not remount across slug changes. Add a genre remount-race test (mirror `remountRace.test.tsx` for ChatPage).
- **Evidence:** `App.tsx:34`; `CompanionPanel.tsx:45-53,5,63`; `keys.ts:7` (GENRE_DOCK_CONVERSATION_KEY distinct ✓).

### B5 — D7 topic filter unwired (spine click does nothing) — 🟡 MED
- **Design (D7 / C2 topic-as-axis):** clicking a topic spine filters the World client-side (composes with tag filter).
- **Code:** `GenreModules.tsx:50` declares `onTopicSelect`; `TopicCluster.tsx:37` emits `onTopicSelect(t.id)` **only if prop supplied**. `GenreExperience.tsx:565-578` renders `<GenreModules>` with **no `onTopicSelect` prop** → handler never set → spine click inert. Does not compose with `activeTags`.
- **Fix:** Pass `onTopicSelect={(id)=>gs.setActiveTags(...)}` from GenreExperience into GenreModules; thread to TopicCluster. Add test: clicking topic adds tag.
- **Evidence:** `GenreExperience.tsx:565`; `GenreModules.tsx:50`; `TopicCluster.tsx:37`.

### B6 — B2 eject-to-/chat CTA still present — 🔴 HIGH
- **Design (B2):** ambient Companion **replaces** the eject-to-`/chat` CTA; diegetic, never interrupts.
- **Code:** `GenreExperience.tsx:608-614` renders "Explore with the Companion" button with `onClick={openGuided}` → `openGuided` (`:102-111`) calls `navigate("/chat")`. Mislabeled "Companion" while yanking user off-page — the exact interrupt B2 promised to kill.
- **Fix:** Remove the eject button (CompanionPanel already provides in-world chat). Keep `openGuided` only if a deliberate "open full chat" entry is wanted, and relabel honestly.
- **Evidence:** `GenreExperience.tsx:102-111,608-614`.

### B7 — B5 sound default ON + autoplay cue on mount — 🔴 HIGH
- **Design (B5/K5):** sound OFF by default; reduced-motion honored; cue fires on gesture/open, not autoplay-loud.
- **Code:** `client/src/lib/sound.ts:23` → `return raw === null ? true` — **defaults ON**, contradicting sound-OFF. AND `GenreExperience.tsx:37-39` fires `playWorldCue(world,"open")` in a mount `useEffect`, unconditional on user gesture → fresh visitor with motion enabled gets an **audible cue on page load they never opted into**. (`sound.ts:27` honors reduced-motion, but motion-ON users get sound.)
- **Fix:** `sound.ts:23` → `raw === null ? false` (default OFF). Gate the mount cue behind an explicit user gesture OR at minimum respect the (now OFF) default so it no-ops until enabled.
- **Evidence:** `sound.ts:23`; `GenreExperience.tsx:37-39`; `sound.ts:27,72`.

---

## 3. SAFE / Verified-Good (not defects — explicitly cleared)

| Item | Evidence |
|------|----------|
| **W4 accent token** — `register.accent` added all worlds + GENERIC; `--world-accent` consumed in ExperienceHero/TimelineScrubber/WorldsMap/CompanionPanel. Residue: `amber-400` only in shared chrome (PosterCard/GenrePicker), not world-tinted. | `genreWorld.ts:6,29+`; `GenreExperience.tsx:361`; `metaphor.ts:8` |
| **B4/W8 persistence** — single `useGenreState` authority; one effect serializes URL+localStorage. | `keys.ts:14`; `useGenreState.ts:121-160`; `GenreExperience.tsx:48,59-64` |
| **C1 single state authority** — no competing useState for steer/filter. | `useGenreState.ts`; `GenreExperience.tsx:48-64` |
| **W3 decade authority** — server opts (keyword/decade/sort) never applied; deferred. | `genreExperienceService.ts:71-77`; `api.ts:63` |
| **Chokepoint reuse / no double-log** — `logAnchor` NOT called during curation. | `insightService.ts:167` (only on real title-open) |
| **C4 compare route** — `/compare/:a/:b` + `/compare/:a` ordered after `/genre/:slug`, no collision. | `App.tsx:46,51,52,56` |
| **C3 ×6 a11y cap** — only 2 decorative backdrops (aria-hidden, -z-10), not 6 engines. | `ConstellationBackdrop.tsx`; `FrontierSpine.tsx`; `GenreModules.tsx` |
| **C5 whisper strip** — pure `useMemo` template, no LLM/Companion call (no double-narration). | `WhisperStrip.tsx` |
| **Load-state flash** — controls seeded from persisted localStorage, not async-flipped default. | `useGenreState.ts:110-114` |
| **Reversibility** — mediaType toggle symmetric (deletes `?mediaType` on movie). | `useGenreState.ts:72-77` |
| **a11y roles (7.3)** — Timeline tablist, skip-link→main, Retry aria-label. | `TimelineScrubber.tsx:96,116-118`; `GenreExperience.tsx:348-357,335` |
| **K5 cueBeatMap wire** — worldCue maps beat→playCue; mute no-op; reduced-motion honored. | `worldCue.ts:13-21`; `GenreExperience.tsx:37-39`; `sound.ts:72` |
| **W4 font lock** — zero per-metaphor `font-family` swaps. | grep `components/genre/` |

---

## 4. Checklist (survives compaction)

### 5-Axis review
- [x] Inventory changed files (57 genre files)
- [x] Dispatch multi-agent council (3 agents, wave 1, COMPLETED + returned)
- [x] Wave 2 (5-axis table agent) — result swallowed by compaction; **regenerated by orchestrator from wave-1 evidence + own code re-verification** (see §1)
- [x] Orchestrator independently re-verified all 7 blockers against code (grep)
- [x] Single findings file written (this file)

### Defect fixes (TDD — ALL RESOLVED)
- [x] **B1 K3** — `skipAnchorLog` on `/insight` route + client bulk prefetch; server test asserts no anchor writes — `6ca14a2`
- [x] **B2 K1** — removed `guided` toggle + `openGuided` eject; kept `mode:"self"` — `418ff03`
- [x] **B3 C2** — DROP (council verdict): `libraryVersion` + test removed; design doc marked DEFERRED — `acef6e3` / `bf02232`
- [x] **B4 C5** — slug-stable `App.tsx` key for `/genre` + CompanionPanel at index 0 in all branches; genre remount-race test — `6ca14a2`
- [x] **B5 D7** — `onTopicSelect` wired into GenreModules (genre id → activeTags); topic-filter test — `d05eeab`
- [x] **B6 B2** — removed eject-to-/chat "Explore with the Companion" CTA — `418ff03`
- [x] **B7 B5** — `sound.ts` default OFF (`raw===null ? false`); mount cue gated — `6ca14a2`
- [x] **N8** — NeighborRail preserves `?mediaType=tv` deep-link — `6ca14a2`
- [x] **W4** — hardcoded amber/emerald → `var(--world-accent)` in CredibilityStrip/GeoMap/WatchOrderSequencer — `acef6e3`
- [x] **N7** — MarathonBuilder skips watched seasons (unless result empty) + test — `acef6e3`
- [x] **N1** — dropped duplicate mediaType preset buttons; kept Movies/TV toggle — `d05eeab`
- [x] **B5b** — `discover` beat on filter change + `warn` on empty rail (sound-gated, mount-suppressed) + tests — `d05eeab`
- [x] **N4** — `?mediaType=` read into initial steer (no mount-effect flash) — `d05eeab`
- [x] **N6** — `WhisperStrip count` verified USED → no-op (correct) — `d05eeab`
- [x] **N5** — CompanionPanel false comment already removed in Wave A — `6ca14a2`
- [x] **N9** — CompareWorlds behavior-reviewed correct (keys by tmdbId/title); test added — `d05eeab`
- [x] **B6a** — real decade zoom (`zoomed-decade` layout class) + per-decade LLM era-thesis (lazy, cached, graceful fallback) + tests; design doc D1 marked IMPLEMENTED — `36714d1`
- [x] **guided.test.tsx** — removed (K1 dropped the guided mode) — `418ff03`
- [x] Full gate green: client 258/258 + tsc 0; server 111/111 + tsc 0

### Post-fix
- [x] 5-axis re-check → all axes SAFE (no STILL-BLOCKING); all 16 defects resolved across `6ca14a2`→`36714d1`
- [x] Design doc corrected inline: C2 DEFERRED (`bf02232`), K1 dropped (`418ff03`), D1 IMPLEMENTED (`36714d1`)
- [ ] Live browser re-verify (boot server+client): no anchor storm on load, TV deep-link, Companion survives slug change, topic click filters, sound silent on first load — **pending Daniel's `/npm run dev` pass**
- [x] CONTEXT-TEMP updated with review outcome (earlier sessions)
- [ ] **PR gated on Daniel's `/npm run dev` review (no merge without Daniel; no "Generated with" trailer)** — ready to open

> **Final status (2026-07-16):** All 16 review defects resolved and committed. Client 258/258 + server 111/111 green, both tsc 0. Branch 90 ahead of `origin/main`. Only remaining gate is Daniel's live `/npm run dev` review before merge.

---

## 5. Top-3 Most-Likely-To-Break (ranked)
1. **K3 anchor storm (B1)** — silent anti-fatigue regression; writes anchors for the whole library on every World load. Highest user-harm (fatigues own taste profile) + invisible.
2. **C5 Companion remount (B4)** — stream abort on slug change is intermittent (only mid-stream), so it passed tests but breaks real UX.
3. **B5 sound autoplay (B7)** — audible cue on first load with no opt-in; directly contradicts the stated privacy/local-first constraint.

---

## 6. FRESH TEAM RE-REVIEW (2026-07-16, after compaction concern)

Daniel doubted the first review completed cleanly. A **new, independent council of 5 agents** (3 wave-1 + 2 wave-2) was dispatched with all prior findings fed in as HYPOTHESES to re-verify, not truth. Every agent re-derived from code via terminal grep.

### 6.1 Corroboration (wave 1 = 3 lenses, all landed)
- **All 7 STILL-BLOCKING defects CONFIRMED** by fresh technical/architecture/UX lenses (independent grep, same file:line). No false positives among them.
- **K2a (counterpoint tmdbId) is actually WIRED end-to-end** (`insightService.ts:115-131` builds comparisons w/ tmdbId+mediaType → `ArgumentPanel.tsx:106-112` Link). Prior review's "server shape change needed" is CLOSED — remove from defects.
- All prior SAFE items re-verified SAFE.

### 6.2 NEW defects the first review MISSED
| ID | Defect | Evidence | Severity |
|----|--------|----------|----------|
| N1 | **Duplicate controls** — `mode` + `mediaType` each in BOTH toggle AND steering presets → "why two Guided buttons?" mis-click hazard. | `GenreExperience.tsx:445-459,461-481,494-522,523-536` | 🟡 HIGH |
| N2 | **Two "Companion" entry points** — in-world dock (B2, correct) + eject-to-`/chat` button, both labelled "Companion" but diverge. | `:607-614` + `:642` | 🔴 (compounds B2) |
| N3 | **`guided` false feedback** — toggling Guided highlights control + refetches IDENTICAL data; user believes world changed. | `:445-459` + `genreExperienceService.ts:236` | 🔴 HIGH |
| N4 | **Deep-link mediaType flash** — `?mediaType=tv` mount effect flips AFTER first paint → briefly "Movies" highlighted then TV. | `:82-87` | 🟢 MINOR |
| N5 | **Misleading code comment** — `CompanionPanel.tsx:45-53` claims slug-independent key "stream not aborted on slug remount" — FALSE (App.tsx:34 remounts). | `CompanionPanel.tsx:45-53` | 🟡 MED |
| B1b | **K3 fix incomplete as scoped** — `api.insight` (`api.ts:158-159`) has NO `skipAnchorLog` param, so even a route fix can't be passed client-side. Fix must ALSO add param to `api.ts` + the `:220` prefetch call. | `api.ts:158-159` | 🔴 (fix-scope) |
| B5b | **K5 `discover`/`warn` beats inert** — only `open` cue fires (`GenreExperience.tsx:38`); filter/error/empty `discover`/`warn` beats never fire though worlds advertise `cueBeatMap:["open","discover"]`. | `GenreExperience.tsx:37-39`; `genreWorld.ts:35` | 🟡 MED |

### 6.3 Updated defect register (supersedes §2)
**STILL-BLOCKING (9, fixes scoped correctly):**
- 🔴 **K3 anchor storm** — fix must touch `misc.ts` (accept `?skipAnchorLog=1`), `api.ts:158` (add param), `GenreExperience.tsx:220` (pass it). Server test asserts no anchor writes on bulk path. (B1b narrows fix.)
- 🔴 **K1 guided no-op** — remove toggle + `openGuided` eject + `GenreExperience.guided.test.tsx`; keep `mode:"self"` literal. (N3 = false feedback.)
- 🔴 **C5 Companion remount** — `App.tsx:34` → slug-stable key (`"/genre"` splat, mirroring `/chat/*` at `:54`). Add genre remount-race test. (N2/N5 stem from this.)
- 🔴 **B2 eject CTA** — remove "Explore with the Companion" button (`:607-614`). CompanionPanel already provides in-world chat.
- 🔴 **B5 sound default ON + autoplay** — `sound.ts:23` → `raw===null ? false`; gate mount cue behind default (no-ops until enabled).
- 🟡 **C2 libraryVersion orphaned** — wire `GET /library/version` + `useGenreState` reconcile, OR drop claim + ADR note.
- 🟡 **D7 topic unwired** — pass `onTopicSelect` from GenreExperience into GenreModules; click adds tag; test.
- 🟡 **N1 duplicate controls** — consolidate presets OR toggles, not both (tie to K1 removal: drop guided preset; decide movies/tv single surface).
- 🟡 **B5b K5 discover/warn beats** — fire `discover` on filter change + `warn` on empty/error, or drop promise + document.

**RESOLVED (remove from defects):** K2a counterpoint tmdbId (wired end-to-end).

### 6.4 Wave 2 (5-axis table + premise-audit) — LANDED (2026-07-16)

**5-axis-table agent (fresh):** all 5 axes **MIXED**. All 7 blockers re-confirmed (path-corrected: guard in `server/src/llm/insightService.ts`). New reshaped commitment found:
- **D1 decade "zoom" silently downgraded** — design promised layout/spine *zooms* + per-decade *LLM* era-thesis. Shipped = `data-zoomed` visual emphasis + deterministic `useMemo` string (`GenreExperience.tsx:126-132`), LLM-free. Logged "landed" but reshaped. (Add to defect register as B6a — needs either real zoom/LLM or design-doc correction.)
- **Sound test is mock-only** — `GenreExperience.cue.test.tsx:9` mocks `playWorldCue`; no real-playback coverage.

**Premise-audit agent (fresh, adversarial):** the first review is a sound catch-net for 7 known defects but **structurally incomplete** — graded spec fidelity on **~7 of 33 shipped components**; 26 never opened. Branch confirmed `0 behind / 82 ahead` (blind-spot gate TRUE).

**Scope gaps (files NEVER behavior-reviewed by first review):** ExportWorld.tsx (C6), MarathonBuilder.tsx (C7), CompareWorlds.tsx *content* (C4), ArgumentPanel.tsx (D2), TitleCard.tsx (B3), CredibilityStrip.tsx (D5), GeoMap.tsx (D4), NeighborRail.tsx, AnchorFrame.tsx, WatchOrderSequencer.tsx (D8), MakerIndex.tsx (D6), GenreEmptyState.tsx (C10), WhisperStrip.tsx, WorldsMap.tsx.

**FALSE-SAFE corrections:**
- **W4 accent — PARTIALLY FALSE-SAFE.** Literal `amber-400` grep clean, BUT world-tinted content leaks hardcoded hues bypassing `--world-accent`: `CredibilityStrip.tsx:67` (`text-amber-300/80`), `:77` (`text-emerald-300/90`), `GeoMap.tsx:53` (`text-amber-300/80` + `text-emerald-400/80`), `WatchOrderSequencer.tsx:36` (`text-emerald-400`). Two competing accent strategies = design-vs-design contradiction. W4 color discipline overstated.
- **C3 a11y cap — TRUE-SAFE** (both backdrops genuinely `aria-hidden` + `pointer-events-none` + `-z-10`).
- **B4 persistence — TRUE-SAFE** (seeds from localStorage in useState initializer, no mount race).
- **K5 cueBeatMap — TRUE-SAFE** (all worlds populate; worldCue resolves + fires).
- **C5 whisper no-double-narration — TRUE but masks contradiction** (see below).

**NEW behavior bugs (from un-reviewed files):**
| ID | Defect | Evidence | Severity |
|----|--------|----------|----------|
| N6 | **WhisperStrip dead `count` prop** — declared + in useMemo deps but template never uses it; phrase ignores count. | `WhisperStrip.tsx:6,19,27` | 🟢 MINOR |
| N7 | **MarathonBuilder includes already-watched seasons** — `watched` plumbed (`:7,43`) but `build()` appends ALL seasons regardless. | `MarathonBuilder.tsx:42-45,588` | 🟡 MED |
| N8 | **NeighborRail drops deep-link context** — `navigate(\`/genre/${slug}\`)` throws away `?mediaType=tv`/mode → flips TV world back to movies on genre hop. | `NeighborRail.tsx:33` | 🔴 HIGH |
| N9 | **CompareWorlds content unverified** — prior "C4 SAFE" was route-only; compare logic (`:52-63` anchor overlap + title sets) looks correct but never behavior-reviewed. | `CompareWorlds.tsx:52-63` | 🟡 (verify) |

**Design-vs-design contradictions inherited:**
- **Triple-narration** — WhisperStrip (deterministic) + CompanionPanel (LLM) + curator `introData.hook` (LLM) all narrate one screen. Prior "no double-narration" scope-limited to Whisper-vs-Companion; intro hook is a 3rd voice never opened.
- **Two accent owners** — `--world-accent` token vs hardcoded `amber-300`/`emerald` in content components; no single authority.

---

## 7. FINAL CONSOLIDATED DEFECT REGISTER (all 5 agents, both waves)

### 🔴 HIGH / STILL-BLOCKING
| ID | Defect | Fix scope | Evidence |
|----|--------|-----------|----------|
| K3 | Anchor storm — `/insight` route + client bulk prefetch write anchors during curation | `misc.ts` accept `?skipAnchorLog=1` + `api.ts:158` add param + `GenreExperience.tsx:220` pass it + server test | `misc.ts:36-41`, `insightService.ts:234,273`, `GenreExperience.tsx:220`, `api.ts:158` |
| K1 | `guided` no-op shipped (design said DROP) + false feedback N3 | remove toggle + `openGuided` + `guided.test.tsx`; keep `mode:"self"` | `GenreExperience.tsx:445-459`, `genreExperienceService.ts:236`, `:102-111` |
| C5 | Companion remount across slug (abort stream + panel closes) | `App.tsx:34` → slug-stable `/genre` key (mirror `/chat/*` `:54`) + genre remount-race test | `App.tsx:34`, `CompanionPanel.tsx:45-53` (false comment N5) |
| B2 | Eject-to-/chat "Explore with the Companion" CTA still present | remove button `:607-614` | `GenreExperience.tsx:607-614` |
| B5 | Sound default ON + autoplay cue on mount | `sound.ts:23` → `raw===null ? false`; gate mount cue behind default | `sound.ts:23`, `GenreExperience.tsx:37-39` |
| N8 | NeighborRail drops `?mediaType=tv` deep-link → flips TV back to movies | preserve search params in `navigate` | `NeighborRail.tsx:33` |
| B6a | D1 decade "zoom" reshaped to visual-only + LLM-free thesis (design promised layout zoom + LLM thesis) | either implement real zoom/LLM OR correct design-doc claim | `GenreExperience.tsx:126-132` |

### 🟡 MEDIUM
| ID | Defect | Fix scope | Evidence |
|----|--------|-----------|----------|
| C2 | `libraryVersion` orphaned (never wired) | wire `GET /library/version` + `useGenreState` reconcile, OR drop + ADR | `libraryService.ts:504` |
| D7 | Topic filter unwired (spine click inert) | pass `onTopicSelect` into GenreModules | `GenreExperience.tsx:565-578`, `TopicCluster.tsx:33` |
| N1 | Duplicate controls (mode + mediaType in toggle AND presets) | consolidate; drop guided preset with K1 | `GenreExperience.tsx:445-536` |
| B5b | K5 `discover`/`warn` beats inert (only `open` fires) | fire on filter/empty/error OR drop promise | `GenreExperience.tsx:37-39`, `genreWorld.ts:35` |
| N7 | MarathonBuilder includes watched seasons | filter on `watched` in `build()` | `MarathonBuilder.tsx:42-45,588` |
| W4 | Accent hardcodes leak in content comps (amber-300/emerald bypass `--world-accent`) | consume `--world-accent` everywhere OR document two-tier | `CredibilityStrip.tsx:67,77`, `GeoMap.tsx:53`, `WatchOrderSequencer.tsx:36` |
| N9 | CompareWorlds content unverified | behavior-review compare logic | `CompareWorlds.tsx:52-63` |

### 🟢 MINOR
| ID | Defect | Evidence |
|----|--------|----------|
| N4 | Deep-link mediaType flash (`?mediaType=tv` shows Movies first) | `GenreExperience.tsx:82-87` |
| N6 | WhisperStrip dead `count` prop | `WhisperStrip.tsx:6,19,27` |
| N5 | Misleading CompanionPanel comment | `CompanionPanel.tsx:45-53` |

### ✅ RESOLVED (removed from defects)
- **K2a counterpoint tmdbId** — wired end-to-end (`insightService.ts:115-131` → `ArgumentPanel.tsx:106-112`).
- **B7 serendipity** — DROPPED by design (NICE-TO-HAVE, no task). Correct, not a blocker.

### Design-vs-design contradictions to resolve
- **Triple-narration** (WhisperStrip + CompanionPanel + curator intro hook) — decide single narrative authority or deliberate 3-tier.
- **Two accent owners** (`--world-accent` token vs hardcoded amber/emerald) — single authority or documented two-tier.

---

## 8. Updated Checklist (survives compaction)

> **2026-08-05:** This section is **HISTORICAL**. Defect checklist below was the mid-fix register; implementations landed in tree. Authoritative status = `2026-08-05-worlds-finish-plan.md` §2 + Daniel runbook Wave 1–2. Do not treat “PENDING” rows as open work.

### Deep 5-axis review (DONE)
- [x] Inventory changed files (57 genre files; 33 non-test)
- [x] First council (4 agents) — found 7 blockers
- [x] **Fresh team re-review (5 agents, 2 waves)** — re-confirmed 7 + found 7 more + exposed scope gap (7/33 files reviewed)
- [x] Premise-audit: branch `0 behind / 82 ahead` confirmed; 26/33 components never opened by first pass
- [x] Single findings file written + consolidated (this file)

### Defect fixes (TDD — PENDING, not started)
- [ ] **K3** — route + api.ts + prefetch pass skipAnchorLog; server test no anchor writes
- [ ] **K1** — remove guided toggle + openGuided + guided.test.tsx
- [ ] **C5** — slug-stable App.tsx key; genre remount-race test
- [ ] **B2** — remove eject CTA
- [ ] **B5** — sound default OFF + gate mount cue
- [ ] **N8** — NeighborRail preserve mediaType deep-link
- [ ] **B6a** — D1 zoom: implement or correct design claim
- [ ] **C2** — wire libraryVersion OR drop + ADR
- [ ] **D7** — wire onTopicSelect
- [ ] **N1** — consolidate duplicate controls
- [ ] **B5b** — fire discover/warn beats OR drop promise
- [ ] **N7** — MarathonBuilder exclude watched
- [ ] **W4** — consume --world-accent in content comps OR document two-tier
- [ ] **N9** — behavior-review CompareWorlds
- [ ] Fix/remove now-broken tests (guided.test.tsx after K1 removal; cue test after B5)
- [ ] Re-run full gate: client+server test, both tsc, build

### Post-fix
- [ ] Re-run 5-axis table → all axes SAFE/PARTIALLY-SAFE
- [ ] Resolve design contradictions (triple-narration, two accent owners) in design doc
- [ ] Correct design doc inline where code legitimately diverged (D1 zoom, K1 dropped, C2 deferred)
- [ ] Live browser re-verify: no anchor storm, TV deep-link survives genre hop, Companion survives slug change, topic click filters, sound silent on first load, marathon excludes watched
- [ ] Update CONTEXT-TEMP
- [ ] PR gated on Daniel's `/npm run dev` review (no merge without Daniel; no "Generated with" trailer)

---

## 9. FIX PLAN (self-contained briefs for CC subagents)

**Execution model:** each fix dispatched to a **leaf subagent via `delegate_task`** (CC/`claude-code-infra` is currently quota-blocked → `delegate_task` is the live backend; same briefs, same no-git rule). Brief = self-contained (defect file:line + verified root cause + TDD shape + verification gate). Subagents WRITE CODE ONLY — **no git** (orchestrator commits explicit paths after independent re-verify). Orchestrator re-runs `npm run test` (client+server) + both `tsc --noEmit` + `npm run build` at the batch level BEFORE signing off.

**Dependency / ordering (each wave independently verifiable):**
- **Wave A (HIGH, server+client anti-fatigue + privacy):** K3, B5, C5, N8. (K3 touches `api.ts` shared client surface — do first so later waves build on it.)
- **Wave B (HIGH, dead-control + eject removal):** K1, B2. (K1 removal breaks `guided.test.tsx` → subagent updates/removes it.)
- **Wave C (MEDIUM):** D7, N1, B5b, N7, W4, C2, B6a, N9, N6, N4, N5. Group by shared-file ownership to avoid conflicts (e.g. D7+N1+B5b all touch `GenreExperience.tsx` → one subagent; W4 touches `CredibilityStrip`/`GeoMap`/`WatchOrderSequencer` → one subagent; C2 is server+client → one; B6a touches `GenreExperience.tsx` + design doc → one; N7 `MarathonBuilder` alone; N9 `CompareWorlds` verify-only; N6/N4/N5 trivial).

**Per-defect briefs (paste into CC):**

### K3 — anchor storm (anti-fatigue guard inert on prod path)
- Root cause: `server/src/routes/misc.ts:36-41` `GET /insight/:type/:tmdbId` calls `titleInsight(db, tmdbId, mediaType, refresh)` WITHOUT `skipAnchorLog` (defaults `false`). `client/src/lib/api.ts:158-159` `api.insight()` has no `skipAnchorLog` param. `client/src/pages/GenreExperience.tsx:220` bulk-prefetches `api.insight()` for every rail title on mount → each writes `logAnchor("take")` + `logAnchor("insight_neighbors")` (`server/src/llm/insightService.ts:234,273`).
- Fix: (1) `misc.ts` accept `?skipAnchorLog=1` → pass `skipAnchorLog: req.query.skipAnchorLog === "1"` to `titleInsight`. (2) `api.ts` add `skipAnchorLog?: boolean` param to `api.insight`. (3) `GenreExperience.tsx:220` pass `skipAnchorLog: true` (this is a curation-time read, not a user "take"). (4) Add/extend server test asserting `logAnchor` row count is 0 when `skipAnchorLog` passed on the bulk path.
- TDD: write failing test FIRST (bulk `/insight?skipAnchorLog=1` → 0 anchor rows), then implement.
- Gate: server test passes; client 240+ still green.

### B5 — sound default ON + autoplay (privacy/local-first violation)
- Root cause: `client/src/lib/sound.ts:23` `return raw === null ? true` (default ON; design says OFF). `GenreExperience.tsx:37-39` fires `playWorldCue(world,"open")` in mount `useEffect` unconditionally.
- Fix: (1) `sound.ts:23` → `raw === null ? false`. (2) Gate the mount cue: only fire if `getSoundEnabled()` is true (it now defaults false → no-op until user enables). Keep `reduced-motion` honor at `sound.ts:27`.
- TDD: test `getSoundEnabled()` returns false when `SOUND_KEY` unset; test mount cue no-ops when disabled.
- Gate: `GenreExperience.cue.test.tsx` still passes (it mocks playWorldCue — update if signature changes).

### C5 — Companion remount across slug (aborts stream + closes panel)
- Root cause: `client/src/App.tsx:34` `key={... location.pathname}` → `/genre/a`≠`/genre/b` remounts the whole route incl. embedded ChatThread. Constant `GENRE_DOCK_CONVERSATION_KEY` doesn't help because the component remounts. `CompanionPanel.tsx:45-53` comment is FALSE.
- Fix: change the genre route key to be slug-stable. Mirror the `/chat/*` splat pattern at `App.tsx:54`: add a `/genre/*` splat route OR key the motion.div with a stable `"genre"` for genre pages (so the page + embedded thread persist across slug change). Add a genre remount-race test (mirror `remountRace.test.tsx`): navigating `/genre/a`→`/genre/b` does NOT remount ChatThread / abort stream. Delete the false comment in `CompanionPanel.tsx`.
- TDD: failing test — slug change keeps thread mounted (ref stable or no abort).
- Gate: existing `remountRace.test.tsx` + new genre test green; page still renders.

### N8 — NeighborRail drops `?mediaType=tv` deep-link
- Root cause: `client/src/components/genre/NeighborRail.tsx:33` `navigate(\`/genre/${slug}\`)` discards current search params (mediaType/mode) → TV world flips to movies on genre hop.
- Fix: preserve search params: `navigate({ pathname: \`/genre/${slug}\`, search: location.search })` (or `navigate(\`/genre/${slug}${location.search}\`)).
- TDD: test clicking a neighbor from a `?mediaType=tv` world keeps `?mediaType=tv` in the destination URL.
- Gate: NeighborRail test green.

### K1 — `guided` no-op shipped (design said DROP) + N3 false feedback
- Root cause: `GenreExperience.tsx:445-459` toggles `gs.steer.mode`; queryKey includes `mode` (`:90`); `genreExperienceService.ts:236,287` uses `mode` only in cache key + return field, never branches → output identical. `openGuided` (`:102-111`) = `navigate("/chat")`.
- Fix: REMOVE the guided mode entirely. Delete the Experience-mode toggle UI (`:445-459`) + the `mode-guided` preset (`:523-536`) + `openGuided` (`:102-111`) + the `mode` field from the query (keep `mode:"self"` literal in the api call). Remove `GenreExperience.guided.test.tsx`. If `ExperienceMode` type is now unused elsewhere, narrow it / keep `"self"` only.
- TDD: delete guided test; add test asserting no `mode` param is sent / page renders without guided control.
- Gate: client green (no references to removed symbols).

### B2 — eject-to-/chat "Explore with the Companion" CTA
- Root cause: `GenreExperience.tsx:607-614` button `onClick={openGuided}` → `/chat`. Contradicts B2 (Companion replaces eject). CompanionPanel (`:642`) already provides in-world chat.
- Fix: remove the button block `:607-614`. Keep CompanionPanel mount. (Couples with K1 removal of `openGuided`.)
- TDD: test that no button navigates to `/chat` from the genre page.
- Gate: client green.

### D7 — topic filter unwired
- Root cause: `GenreExperience.tsx:565-578` renders `<GenreModules>` with NO `onTopicSelect`; `GenreModules.tsx:50` declares it; `TopicCluster.tsx:33` emits only if supplied → spine click inert.
- Fix: pass `onTopicSelect={(id) => gs.setActiveTags(...add id...)}` into `<GenreModules>`. Ensure `gs` exposes a tag toggle. Wire TopicCluster→GenreModules→handler.
- TDD: failing test — clicking a topic spine adds a tag / filters visible items.
- Gate: client green; topic click filters.

### N1 — duplicate controls (mode + mediaType in toggle AND presets)
- Fix: fold into K1 (drop guided preset) + decide a single surface for mediaType (toggle OR presets, not both). Coordinate with K1 in same subagent pass on `GenreExperience.tsx`.
- Gate: no duplicate state writers; client green.

### B5b — K5 `discover`/`warn` beats inert
- Root cause: `GenreExperience.tsx:37-39` only fires `playWorldCue(world,"open")`; filter/empty/error `discover`/`warn` beats (worlds advertise `cueBeatMap:["open","discover"]`) never fire.
- Fix: fire `discover` on filter/search change + `warn` on empty/error state (guard by sound-enabled). OR, if scope says drop, remove the promise + document. **Decision: implement minimal `discover` on filter change** (cheap, matches design intent).
- TDD: test `playWorldCue(world,"discover")` called on filter change (mock).
- Gate: client green.

### N7 — MarathonBuilder includes watched seasons
- Root cause: `MarathonBuilder.tsx:42-45` `build()` appends ALL seasons; `watched` plumbed (`:7,43`, from `GenreExperience.tsx:589`) but ignored.
- Fix: in `build()`, skip seasons where `season.watched` is true (unless empty result → include all so marathon isn't empty). Add a test.
- Gate: marathon test green.

### W4 — accent hardcodes leak (two accent owners)
- Root cause: `CredibilityStrip.tsx:67` (`text-amber-300/80`), `:77` (`text-emerald-300/90`), `GeoMap.tsx:53` (`text-amber-300/80` + `text-emerald-400/80`), `WatchOrderSequencer.tsx:36` (`text-emerald-400`) bypass `--world-accent`.
- Fix: replace hardcoded hues with `var(--world-accent)` (or a derived tint) in these content components. Keep the token system as single authority. (If a neutral semantic like "new to you" must stay emerald, document it as intentional two-tier — but prefer consuming the accent.)
- TDD: grep test asserting no `amber-300`/`emerald-*` literal in world-tinted content comps (or just manual + visual check).
- Gate: client green; visual re-check.

### C2 — `libraryVersion` orphaned
- **DECISION (2026-07-16, council verdict: DROP):** A 2-lens council (code-truth + UX) independently concluded DROP. The persisted blob (`useGenreState.ts:21-25` `PersistedBlob = {scrub, steer, dismissed}`) is **100% library-agnostic steer/filter state** — it caches NO library-derived content. Live items come from react-query on every mount (`GenreExperience.tsx:89-92`, keyed by slug+mode+mediaType; decade/search/sort/tags applied client-side on top). So library changes already surface; the blob cannot go stale. Wiring would add a route + client fetch + invalidation + a failure mode that could **nuke legitimate user filters on a spurious version bump** (net UX regression). `libraryVersion` is orphaned — only `libraryService.ts:504` impl + its unit test; zero route/client refs.
- **Minimal change (DROP path):** (1) delete `libraryVersion` + `LibraryVersion` interface — `server/src/services/libraryService.ts:489-511`; (2) delete `server/test/libraryService.version.test.ts`; (3) correct design doc `docs/plans/2026-07-15-worlds-v2-design.md:154-156` (+ C2 mentions at 125, 226-227) → mark world-level staleness-reconcile **DEFERRED** ("persisted blob is filter/steer-only and library-agnostic; live items come from react-query, so no reconcile needed; revisit only if the blob starts caching library-derived payload"); (4) rebuild green (no dependents).
- Gate: server tests green (orphan removed); no dangling `libraryVersion` refs in client/server.

### B6a — D1 decade "zoom" reshaped → IMPLEMENT REAL ZOOM (Daniel decision 2026-07-16)
- **DECISION: IMPLEMENT** (not doc-correct). Design promised decade *zooms the world* (layout/spine emphasis change) + per-decade *LLM* era-thesis. Shipped = `data-zoomed` CSS attr + deterministic LLM-free `useMemo` string (`GenreExperience.tsx:126-132`). Wave C must deliver the real thing.
- **Scope (two parts):**
  1. **Layout/spine zoom** — selecting a decade must change the world's layout/spine emphasis BEYOND a `data-zoomed` attribute. Concretely: the ConstellationBackdrop / FrontierSpine / TimelineScrubber should visibly re-emphasize the selected decade's cluster (e.g. expand that decade's spine segment, dim others, shift the constellation focus). Decide the minimal *layout* change that reads as "the world zoomed to this decade" — not just a color/opacity attr. Coordinate with the existing `TimelineScrubber` decade selection (which already filters modules) so the zoom is a layout reaction to the same selection state.
  2. **Per-decade LLM era-thesis** — replace the deterministic `useMemo` string with a real LLM-generated era-thesis for the selected decade (lazy, like the existing `argument`/`curatorIntro` enrichment — paint from a cached/deterministic fallback first, then stream the LLM thesis). Must respect the anti-fatigue + cost constraints: cache per `(slug, decade)`, guard with `skipAnchorLog` if it touches `titleInsight`, and degrade gracefully if the LLM is down (keep the deterministic string as fallback).
- **TDD:** (a) test that selecting a decade produces a layout/spine emphasis change beyond `data-zoomed` (assert a layout-affecting class/transform/state, not just the attr); (b) test that the era-thesis resolves to an LLM string when available and falls back to the deterministic string when the LLM fails.
- **Gate:** client green; visual re-check that decade selection visibly re-emphasizes the world; era-thesis shows LLM text (or graceful fallback).
- **Note:** this is the largest Wave C item — dispatch as its OWN subagent (dedicated, not bundled with D7/N1/B5b which also touch `GenreExperience.tsx`; sequence it LAST in Wave C so the page's other edits land first).

### N9 — CompareWorlds content unverified
- Fix: behavior-review `CompareWorlds.tsx:52-63` (anchor overlap + title sets). If correct, add a test asserting it compares the right fields. If wrong, fix. Verify-only + test.
- Gate: compare test green.

### N6 / N4 / N5 — trivial
- N6: remove dead `count` prop from `WhisperStrip.tsx` (or actually use it). 
- N4: fix deep-link mediaType flash — `GenreExperience.tsx:82-87` mount effect should read URL param synchronously into initial state (or derive control state from URL, not post-mount setState).
- N5: delete false `CompanionPanel.tsx:45-53` comment (done in C5 pass).
- Gate: client green.

**Orchestrator commit discipline:** after each wave, `git status` → commit ONLY the files the subagent touched (no `git add -A`) with a message like `fix(worlds): K3 anchor storm — skipAnchorLog on bulk /insight path`. Re-run full gate. Update §8 checklist as items close. Update CONTEXT-TEMP at wave boundaries.

**Open decisions — RESOLVED (2026-07-16):**
- **C2 `libraryVersion`** → DROP (2-lens council: code-truth + UX, both DROP). Orphaned; blob is library-agnostic steer; wiring would harm UX. Minimal change in §9 C2 brief.
- **B6a D1 decade "zoom"** → IMPLEMENT real zoom + per-decade LLM era-thesis (Daniel decision). Full scope in §9 B6a brief.
- Wave A (K3, B5, C5, N8) + Wave B (K1, B2) have NO open decisions — ready to dispatch.

---
*Generated by Rune. This file is the review artifact — intentionally untracked (kept out of the PR diff). All findings independently code-verified 2026-07-16.*
