# Worlds Guided Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **G1 scope change (2026-08-05 evening):** Guided mode is **in-scope ship criteria**. Supersedes finish-plan §4 "Building real guided LLM branching = out" and Wave 3.1 "drop guided types." Do **not** ship Worlds as-is after Wave 0–2 alone.

**Goal:** Ship a real Guided Mode inside Worlds: a feature-rich in-world tour that reads/writes Lumina's SQLite (library, taste, settings), steers the genre rail, talks with the user (and Companion), and reacts when the user acts elsewhere in the app.

**Architecture:** Guided is a **persistent session** (`settings` key `guided-session:{slug}:{mediaType}`), not a cache-key fiction. Beats collect taste intent → server re-ranks `buildGenreExperience` when `mode=guided` → UI "Tour desk" shows beats + tonight shelf + library actions → Companion prefill/context carries session → library mutations invalidate/sync the shelf. Self mode remains the free-browse path.

**Tech Stack:** React 19 + Vite + TanStack Query (client); Express + better-sqlite3 + OpenRouter (server); Worlds Instrument Ink chrome (Cabinet/Geist, `--world-accent`); Vitest.

## Global Constraints

- Work primarily in worktree `.worktrees/immersive-curated-genre-specific-experie`.
- Daniel runs tests, git, `npm run dev` — agents do **not** start servers, do **not** auto-commit.
- No `git add -A`. No "Generated with …" trailers.
- Anti-slop: match Worlds chrome (Instrument Ink), not facelift Fraunces/Public Sans until Worlds merges. Facelift = design-only until Gate W.
- Prefer end-to-end vertical slice over sprawling stubs. YAGNI on native per-metaphor engines.
- `mode=guided` must change **behavior**, never identical-to-self (old K1/N3 defect).
- CompanionPanel stays DOM index 0 across loading branches (C5).
- Root `npm test` = server only; client = `npm run test --workspace client`.

---

## 0. CODE_REVIEW — current guided state (2026-08-05)

### Verdict

**Guided UI was removed as fiction; wire types remain.** There is no product path into guided. Server accepts `mode=guided` but never branches ranking or intro. Ship-as-is would reintroduce false feedback if a toggle were naively restored.

### What exists

| Layer | State |
|-------|--------|
| Types | `GenreMode` / `ExperienceMode` = `"self" \| "guided"` (`useGenreState.ts`, `types.ts`, `genreExperienceService.ts`) |
| API | `api.genreExperience` / `genreIntro` accept mode; routes parse `?mode=guided` |
| Cache | `genre-exp:{mediaType}:{mode}:{genres}:{modules}` — mode only partitions cache |
| Client page | `GenreExperience` **pins** `"self"` in queryKey + api calls; comments say legacy-only |
| Toggle / openGuided | **Removed** (K1 fix). `guided.test.tsx` deleted |
| useGenreState | Persists `steer.mode` in localStorage; **URL does not deep-link mode** (only `mediaType`) |
| Companion | In-world dock with genre conversation key; no session awareness |
| DB | `library`, `titles`, `settings`, `conversations`, `messages`, `anchor_usage`, `ignored` — no guided table |
| Tests | `useGenreState` / NeighborRail still exercise `mode=guided` as storage/URL residue |

### How Worlds works today (spine)

1. `/genre/:slug` → `useGenreState` (URL scrub + LS steer/dismissed) → RQ `genre-experience` + `genre-intro`.
2. Server `buildGenreExperience`: TMDB discover → `flag(db)` (ignore/library) → optional module enrichment → anchors + profileState. Intro LLM separate.
3. Client filters (decade/search/sort/tags/presets), modules, Marathon, Export, NeighborRail, WorldsMap.
4. Companion = ChatThread tools (`search_library`, `add_to_library`, taste profile, etc.) — already the DB-mutation spine for chat.

### Interaction gaps guided must close

1. **Mode must branch** ranking + intro tone (not cache-only).
2. **Session must persist** across reloads and be readable by Companion / other surfaces.
3. **User → guided:** answering beats, shelf actions, dismiss, watchlist.
4. **Guided → app:** set decade/tags/mediaType, navigate to `/title`, mutate library.
5. **App → guided:** library add/ignore elsewhere → shelf re-flags on sync/refetch.
6. **Companion ↔ guided:** shared context (prefill MVP; system-context injection follow-up).

### Collision notes

- Facelift tokens on `main` / `.impeccable.md` Fraunces stack ≠ Worlds Cabinet/Geist. Guided UI uses Worlds tokens only.
- Sound: reuse `playWorldCue` + `getSoundEnabled()`; no new default-ON audio.
- Do not re-fix B1–B7 unless Wave 1–2 fail.

---

## 1. Product design (locked for this plan)

### Design read

*In-world tour desk for a cinephile vault: hush Instrument Ink, metaphor-accent needle, Companion as summoned guide — not a SaaS wizard.*

**Tone:** Projection-booth curator. **Dials:** variance 5 / motion 4 / density 5. **Signature:** a horizontal **tour needle** (progress through beats) + a live **Tonight shelf** of three picks that reshuffle as answers land.

### Modes

| Mode | Job |
|------|-----|
| **Self** | Free browse (today's Worlds). |
| **Guided** | Session-backed tour: beats → ranked rail + shelf → library actions → optional Companion deepen. |

### Beats (MVP — deterministic, no LLM required)

| Beat id | Prompt | Choices (id) |
|---------|--------|----------------|
| `tempo` | How should this world move tonight? | `slow` · `mid` · `kinetic` |
| `era` | Which era do you want underfoot? | `classic` (&lt;1990) · `turn` (1990–2009) · `now` (2010+) |
| `risk` | Stay close, or stretch? | `comfort` (high vote) · `stretch` (lesser-known / mid vote) |

After all three answered → `status: "complete"`; shelf still live; user can **Retake** (reset answers, keep acted log).

### Tonight shelf

Exactly 3 titles from guided-ranked items, preferring `!inLibrary`, excluding session `dismissed` + world `dismissed`. Actions per pick: **Watchlist**, **Not tonight** (dismiss), **Open** (`/title/:type/:id`).

---

## 2. File map

| File | Responsibility |
|------|----------------|
| Create: `server/src/services/guidedSessionService.ts` | Session CRUD, beats catalog, ranking helpers, sync-from-library |
| Modify: `server/src/services/genreExperienceService.ts` | When `mode=======guided`, apply session ranking; guided intro prompt flavor |
| Modify: `server/src/llm/prompts.ts` | `genreGuidedCuratorPrompt` |
| Modify: `server/src/routes/catalog.ts` | GET/POST guided-session endpoints |
| Create: `server/test/guidedSession.test.ts` | Session + ranking unit tests |
| Modify: `client/src/lib/api.ts` | Guided session client methods |
| Modify: `client/src/lib/types.ts` | `GuidedSession`, beat types |
| Modify: `client/src/lib/useGenreState.ts` | Deep-link `?mode=guided` like mediaType |
| Create: `client/src/components/genre/GuidedTour.tsx` | Tour desk UI |
| Create: `client/src/components/genre/GuidedTour.test.tsx` | Render + answer wiring |
| Modify: `client/src/pages/GenreExperience.tsx` | Mode toggle; pass mode to queries; mount GuidedTour; Companion prefill hook |
| Modify: `client/src/components/genre/CompanionPanel.tsx` | Accept optional guided context prefill |
| Modify: `docs/plans/2026-08-05-worlds-finish-plan.md` | G1 + guided ship criteria |
| Modify: main `docs/plans/2026-08-05-unfinished-work-master-roadmap.md` | Point at this plan |
| Aetherkeep WM + decisions-log | G1 expanded |

**Out of MVP (follow-ups, listed in §6):** per-slug conversation split; LLM-authored dynamic beats; `libraryVersion` world reconcile (still DEFERRED). Chat `contextBuilder` injection = Task 6 (done).

---

## 3. Data model

### Settings blob (no migration — YAGNI)

Key: `guided-session:{slug}:{mediaType}`

```ts
export type GuidedBeatId = "tempo" | "era" | "risk";
export type GuidedChoiceId = string;

export interface GuidedAct {
  tmdbId: number;
  mediaType: "movie" | "tv";
  action: "watchlist" | "dismiss" | "open";
  at: string; // ISO
}

export interface GuidedPick {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  posterPath: string | null;
  voteAverage: number | null;
  inLibrary: boolean;
}

export interface GuidedSession {
  slug: string;
  mediaType: "movie" | "tv";
  status: "active" | "complete" | "abandoned";
  answers: Partial<Record<GuidedBeatId, GuidedChoiceId>>;
  picks: GuidedPick[];
  acted: GuidedAct[];
  conversationId: number | null;
  createdAt: string;
  updatedAt: string;
}
```

### Ranking contract

`rankForGuided(items, session): items` — pure function, tested:

1. Drop ids in `acted` where `action === "dismiss"`.
2. Score: `!inLibrary` +40; era match +25; risk comfort → +voteAverage; stretch → +(10 - voteAverage); tempo kinetic → +popularity proxy (voteAverage*popularity fallback); slow → inverse.
3. Stable sort by score desc, then title.

`buildGenreExperience(..., mode:"guided")` runs normal discover+flag+enrich, then `rankForGuided`, then rebuilds picks into session via `refreshPicks`.

---

## 4. API

| Method | Path | Body / query | Returns |
|--------|------|--------------|---------|
| GET | `/api/discover/guided-session` | `slug`, `mediaType` | `GuidedSession` (create-on-miss) |
| POST | `/api/discover/guided-session/answer` | `{ slug, mediaType, beatId, choiceId }` | `GuidedSession` |
| POST | `/api/discover/guided-session/act` | `{ slug, mediaType, tmdbId, titleMediaType, action, title?, year?, posterPath? }` | `GuidedSession` (watchlist → `add_to_library` status watchlist) |
| POST | `/api/discover/guided-session/reset` | `{ slug, mediaType }` | fresh `GuidedSession` (clears answers+picks; keeps acted optional — **MVP clears acted too**) |
| GET | existing genre-experience | `mode=guided` | items **re-ranked** |

---

## 5. Tasks

### Task 1: Guided session service + tests

**Files:**
- Create: `server/src/services/guidedSessionService.ts`
- Create: `server/test/guidedSession.test.ts`

**Interfaces:**
- Produces: `getOrCreateGuidedSession`, `answerGuidedBeat`, `actOnGuidedPick`, `resetGuidedSession`, `rankForGuided`, `GUIDED_BEATS`

- [x] **Step 1:** Tests written (`guidedSession.test.ts`).
- [x] **Step 2:** Service implemented (settings-backed).
- [ ] **Step 3:** Daniel runs `npm run test --workspace server -- guidedSession` → pass.

### Task 2: Wire mode branching in genre experience + routes

**Files:**
- Modify: `server/src/services/genreExperienceService.ts`
- Modify: `server/src/llm/prompts.ts`
- Modify: `server/src/routes/catalog.ts`
- Modify: `server/test/genreExperience.test.ts` (one guided ≠ self order assertion with seeded session)

- [x] **Step 1:** `genreGuidedCuratorPrompt` added.
- [x] **Step 2:** Guided path ranks + refreshes picks; cache hit re-ranks live session.
- [x] **Step 3:** Guided intro uses guided prompt.
- [x] **Step 4:** Guided-session GET/answer/act/reset routes mounted.
- [ ] **Step 5:** Daniel runs server genre + guidedSession tests.

### Task 3: Client API + types + mode deep-link

**Files:**
- Modify: `client/src/lib/types.ts`, `api.ts`, `useGenreState.ts` (+ test)

- [x] **Step 1:** Types for session/beats.
- [x] **Step 2:** `api.guidedSession`, `answerGuided`, `guidedAct`, `resetGuided`.
- [x] **Step 3:** `?mode=guided` initial steer (URL wins).

### Task 4: GuidedTour UI + GenreExperience integration

**Files:**
- Create: `client/src/components/genre/GuidedTour.tsx` (+ test)
- Modify: `GenreExperience.tsx`, `CompanionPanel.tsx`

**Design constraints:** Worlds chrome only; one tour needle; shelf is interaction container (cards OK); no purple glow; respect `prefers-reduced-motion`; Companion stays index 0.

- [x] **Step 1:** Mode toggle Self | Guided next to Movies/TV.
- [x] **Step 2:** queryKey includes mode; GuidedTour mounted when guided.
- [x] **Step 3:** Beat answer invalidates guided experience queries.
- [x] **Step 4:** CompanionPanel guided prefill from session.
- [x] **Step 6 (UX polish):** Metaphor-flavored beats (`beatsForSlug`); tour desk chrome + needle ticks; ranking/resume/act feedback; shelf posters + Pass/Watchlist clarity; WhisperStrip guided line.
- [ ] **Step 5:** Daniel runs client tests for GuidedTour + WhisperStrip + controls + useGenreState.

### Task 5: Docs + vault

- [x] Update Worlds finish plan: guided in ship criteria; removed from out-of-scope.
- [x] Master roadmap sibling row → this plan path.
- [x] Aetherkeep WM + decisions-log: G1 expanded; ship blocked on guided MVP+rich UX.

---

## 6. Bidirectional interaction matrix

| Direction | Mechanism |
|-----------|-----------|
| User answers beat | POST answer → session → RQ invalidate → rail reorders + curator feedback |
| User watchlists pick | POST act → `libraryService` add → session acted + picks refresh + flash |
| User dismisses pick | POST act dismiss → rank excludes → shelf refill + “Passed…” flash |
| User opens title | navigate + act open (telemetry-ish log) |
| User flips decade in tour suggestion | `setDecade` via callback (URL+LS) |
| User browses Library, adds title | Next guided GET re-flags via `flag(db)` + refreshPicks |
| Companion chat | Prefill includes beat summary; conversation linked → RAG injects session; `add_to_library` mirrors watchlist act on same session; shelf also re-flags on next guided GET |
| Neighbor hop | Preserve `?mode=guided&mediaType=` in search (NeighborRail already preserves search) |
| Reload / Self→Guided | Session settings blob restores; tour desk shows resume whisper |

---

## 7. Success criteria (guided MVP ship gate)

1. `mode=guided` rail order **differs** from self for same slug when session has answers (automated test).
2. Tour desk visible only in guided; Self has no false "guided" chrome.
3. Full beat path → status complete → 3-pick shelf → watchlist writes DB → pick shows inLibrary on refresh.
4. `?mode=guided` deep-link restores steer without flash.
5. Companion opens with tour-aware prefill when answers exist; linked conversation injects tour into chat system context.
6. C5 remount test still green; sound still default OFF.
7. Daniel live QA on **worktree** Vite (not main `:5173` if that checkout lacks guided).
8. Beat prompts differ by metaphor (documentary Reading Room ≠ horror Threshold).
9. Answering a beat shows ranking feedback; mid-tour resume whisper fires once per browser session (not every remount).
10. Re-answering a prior dial (needle tick) updates answers + rail/shelf without Retake.

---

## 8. QA — how Daniel runs the worktree

Main or another checkout on `:5173` may **not** include guided. For guided QA:

```bash
# Kill stale :4000 / :5173 first
cd "C:\Users\Danie\Documents\Claude\Projects\Lumina\.worktrees\immersive-curated-genre-specific-experie"
npm run test --workspace server -- guidedSession
npm run test --workspace client -- GuidedTour WhisperStrip
npm run dev
```

If port conflicts, note the port you chose — agents must not start the server.

**Smoke (feature-rich tour):**
1. `/genre/documentary?mode=guided` → Tour desk: Reading Room / “Walk the stacks…”
2. Answer Patient cut → feedback “Rail & shelf reshuffling…”; WhisperStrip “Guided rail”; rail order shifts
3. Finish era + risk → framed complete copy; shelf shows posters
4. Watchlist a pick → flash + Library; Pass another → shelf refills without it
5. First guided mount mid-tour this tab → resume whisper once; remount / Self→Guided again → no repeat (sessionStorage)
6. Complete tour → tap an answered dial → re-dial without Retake → ranking feedback + shelf/rail update
7. Hop `/genre/horror?mode=guided` → Threshold copy (“Stand at the door…”)
8. Open Companion → prefill / RAG mentions tour choices; optional watchlist via chat
8b. Hop `/genre/horror?mode=guided` → open Companion → **different** thread than documentary (per-world LS key + session `conversationId`)
9. Toggle Self → free browse; Guided resumes session

---

## 9. Follow-ups (post-MVP, still before merge if time)

1. [x] Inject guided session JSON into `buildChatContext` when conversation linked.
   - `linkGuidedConversation` + `POST /discover/guided-session/link`
   - CompanionPanel links on open when guided + conversationId
   - `findGuidedSessionByConversation` → `renderGuidedSessionContext` in RAG block
   - Companion `add_to_library` (watchlist) mirrors acted/shelf on same session blob
2. [x] Per-world Companion conversation key while guided.
   - `genreCompanionConversationKey(slug, mediaType, guided)` — Self keeps constant `GENRE_DOCK_CONVERSATION_KEY`; Guided → `…:guided:{slug}:{mediaType}`
   - CompanionPanel reads/writes that key; hydrates from `session.conversationId` when LS empty; still `linkGuided` on open/create
   - Tests: key partition + doc vs horror isolation + session hydrate
3. [x] Metaphor-flavored beat copy (deterministic `beatsForSlug` / 7 registers). LLM-authored dynamic beats still out.
4. [x] Instrument Ink Wave 3 polish on tour needle (ticks + accent + reg-ticks desk). Further motion fine-tune optional.
5. [x] Allow re-answering a prior dial without full Retake.
   - Answered needle ticks are buttons (`guided-dial-{id}`); open re-dial panel; `answerGuidedBeat` overwrites; RQ invalidates rail/shelf.
6. [x] Persist “resume dismissed” so whisper is once-per-browser-session, not every mount.
   - `sessionStorage` key `guided-resume-whisper:{slug}:{mediaType}` via `hasSeenResumeWhisper` / `markResumeWhisperSeen`.

### Task 6: Companion / chat context injection (this slice)

- [x] Session link API + service helpers
- [x] `buildChatContext` / `renderContextBlock` guided layer
- [x] CompanionPanel link + existing prefill
- [x] Per-world guided conversation key (`genreCompanionConversationKey`) + session hydrate
- [x] Bidirectional watchlist mirror via `syncGuidedWatchlistFromChat` (same settings key)
- [x] Tests: `guidedSession` link/find/render/sync + `rag.test` context injection + CompanionPanel key partition
- [ ] Daniel runs `npm run test --workspace server -- guidedSession rag`
- [ ] Daniel runs `npm run test --workspace client -- CompanionPanel`

---

## 10. Self-review

| Spec ask | Covered? |
|----------|----------|
| Guided session UX rich not thin wizard | §1 Tour desk + needle + shelf |
| Read/write Lumina DB | §3–4 settings + library act |
| Talk to user + user actions elsewhere | §6 matrix |
| Companion / LLM spine | Prefill MVP + tools; §9 injection |
| App interaction points | §6 + Task 4 |
| Plan path | this file |
| Vertical slice first | Tasks 1–4 ordered E2E |

Placeholder scan: none intentional. Types consistent across tasks (`GuidedSession`, beat ids).

---

## Execution handoff

**Plan complete and saved to**  
`docs/plans/2026-08-05-worlds-guided-mode-plan.md` (worktree).

**This agent continues inline** on Tasks 1–4 vertical slice (session → routes → UI wire). Daniel runs tests when ready.
