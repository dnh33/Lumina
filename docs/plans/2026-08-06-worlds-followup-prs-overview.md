# Worlds — Follow-up PRs overview (post PR #4)

**Date:** 2026-08-06  
**Status:** PR #4 merged to `main` · this doc is polish / thin slices only  
**Canvas:** `C:\Users\Danie\.cursor\projects\c-Users-Danie-Documents-Claude-Projects-Lumina\canvases\worlds-followup-prs.canvas.tsx`  
**Sources:** Emil QA gate · full inventory · adversarial interact QA · PR4 pre-merge live QA · claim-loop DoD · blind-angles · session handoff leftovers  
**Law:** Mode-split B packing **CLOSED**. No packing reopen. No facelift absorb until Daniel re-opens G2. Local stash / `.tmp-*` docs = machine hygiene, not product PRs.

---

## Executive status

Worlds v2 is on `main`: mode-split stages, claim loop (dials → Tonight shelf → bag → Library), hub Doors tabs, Instrument Ink craft, denser rails, and the pre-merge hardenings (peek-without-create, TV resume, era inherit, slug allowlist, act/link, dial→shelf sync). The product job works on dense rooms (Horror path). What remains is **taste polish, thin inventory corners, one hub perf debt, and one god-page extract** — ship as thin thematic PRs, not another mega-branch.

---

## Principles for follow-ups

1. **Thin PRs** — one theme, reviewable in one sitting, mergeable same day when S/M.
2. **Thematic tracks** — don’t mix motion CSS with Pass persistence or batch APIs.
3. **Bar for merge** — each PR needs verifiable success criteria (live sniff or tests), no “feels better” alone.
4. **Packing CLOSED** — no stage IA reshuffle, no Claim/Self fold redesign, no metaphor atmosphere growth.
5. **Horror-first proof** — dense-room path remains the live gate; vault-wide density is separate backlog.
6. **Hygiene ≠ product** — delete/ignore `.tmp-pre-pr4-sync-docs`, agent skill installs, local stash; don’t open PRs for them.

### Already shipped (do not re-open as follow-ups)

| Item | Where proved |
|------|----------------|
| Library `?status=watchlist` consume | Adversarial P0-C + PR4 live QA #5 |
| Peer poster activate-only (no navigate) | Adversarial P0-B |
| Self Pass no longer wipes Featured | Adversarial P0-A |
| Dial reweight → shelf sync (`syncShelfAfterDial`) | PR4 live QA P1 re-verify |
| Peek read-only (no empty-session pollution) | PR4 live QA #1 |
| TV Resume + `mediaType` | PR4 live QA #2 |
| Enter Self vs Resume Guided | PR4 live QA #3 |
| Era inherit Self↔Guided | PR4 live QA #4 · claim-loop #8 |
| Conversation link + curated slug allowlist | `guidedSessionService` + `worldSlug.ts` |
| Claim-loop DoD rows 1–9 | `2026-08-06-worlds-claim-loop-dod.md` |

---

## Proposed PR slices

### PR-A — Emil taste polish (press / needle / hub rise)

| | |
|--|--|
| **Title** | Worlds: Emil P1 taste — press feedback, needle `scaleX`, hub rise |
| **Branch** | `worlds/emil-taste-p1` |
| **Why** | Soft-pass Emil gate: dials feel alive; Watchlist/FAB/claim verbs feel dead on press. Needle animates `width` (layout thrash). Hub door rise is 500ms (over UI budget). Highest feel ÷ effort leftover. |
| **Scope in** | `active:scale-[0.97]` on claim verbs + Featured Watchlist/Pass; `.companion-fab:active`; needle → `scaleX` + `transform-origin: left`; `--animate-rise` ~260ms; gate door hover lift behind `(hover: hover) and (pointer: fine)`; trim poster hover zoom (`duration-200`, `scale-[1.03]`, hover MQ). |
| **Scope out** | Packing / stage machine; new motion on mode flip / decade tabs; Framer→CSS migration (P2); deepen greeting copy; Library work. |
| **Key files** | `client/src/components/genre/GuidedTour.tsx` (needle ~741–748, claim CTAs); `client/src/components/genre/GenreModules.tsx` (Featured actions); `client/src/theme.css` (`--animate-rise`, `.companion-fab`); `client/src/pages/GenrePicker.tsx` (door card hover/rise); `client/src/components/genre/TimelineScrubber.tsx` (poster hover). |
| **Effort** | S |
| **Priority** | P1 |
| **Dependencies** | None |
| **Success criteria** | (1) Watchlist/Pass/Widen/Back/Retake + FAB compress on `:active` in DevTools. (2) Needle fill uses transform `scaleX`, not width tween; duration ≤280ms `EASE_OUT_EXPO`. (3) Hub door entrance ≤280ms; touch devices do not sticky-lift cards. (4) Packing / stage URLs unchanged on Horror Claim sniff. |

---

### PR-B — Hub batch peek (perf)

| | |
|--|--|
| **Title** | Worlds hub: batch guided-session peek |
| **Branch** | `worlds/hub-batch-peek` |
| **Why** | Every `/genre` visit fires **N** `GET …/guided-session?slug=…&peek=1` (`useQueries` × `ATLAS_SLUGS`, ~16). Correct after peek-hardening, still chatty. Risk: latency + server fan-out as atlas grows. |
| **Scope in** | Server batch peek endpoint (or single query accepting `slugs=`) returning `{ [slug]: session|null }` without create; client `GenrePicker` one query; keep movie-then-TV peek semantics; tests for null peeks + TV-only progress. |
| **Scope out** | Resume UX redesign; changing Enter/Resume hrefs; writing sessions; Mood/Archive product work. |
| **Key files** | `client/src/pages/GenrePicker.tsx` (~355–376); `client/src/lib/api.ts` (`guidedSessionPeek`); `server/src/routes/catalog.ts` (guided-session GET); `server/src/services/guidedSessionService.ts` (`peekGuidedSessionProgress`); `server/test/guidedSession.test.ts`. |
| **Effort** | M (S if thin batch over existing peek helpers) |
| **Priority** | P1 |
| **Dependencies** | None (orthogonal to taste) |
| **Success criteria** | (1) Hub load → **1** peek network call (or documented capped batch), not 16. (2) Untouched worlds still `session: null`; no new settings rows. (3) Resume chips still only on progress worlds; TV resume mediaType preserved. (4) Existing peek tests green + batch coverage. |

---

### PR-C — GenreExperience orchestration extract

| | |
|--|--|
| **Title** | Worlds: extract GenreExperience orchestration (no behavior change) |
| **Branch** | `worlds/genre-experience-extract` |
| **Why** | `GenreExperience.tsx` ≈ **1100+ lines** — mode flip, era inherit, deepenOpen, GuidedTour mount, Self modules, URL sync. Post-ship maintainability risk; every claim/taste PR fights the god page. |
| **Scope in** | Extract hooks/helpers (e.g. guided stage wiring, era preference, URL param sync, companion deepen bridge) into colocated modules under `client/src/pages/` or `client/src/components/genre/`; keep public route behavior identical; move tests with extracts. |
| **Scope out** | Visual redesign; new features; packing changes; “while we’re here” product fixes. |
| **Key files** | `client/src/pages/GenreExperience.tsx`; helpers likely near `guidedStage.ts`, `claimHomeWiden.ts`; tests `GenreExperience.lazy.test.tsx` / remount tests. |
| **Effort** | L |
| **Priority** | P2 (engineering) — schedule after 1–2 product/taste PRs so diffs stay reviewable |
| **Dependencies** | Prefer after PR-A (fewer concurrent touch conflicts on experience mount) |
| **Success criteria** | (1) Line count of page shell drops materially; orchestration units have focused tests. (2) Claim-loop sniff parity: Enter Self, Resume Claim, dial→bag→Library, Widen/Back, Deepen Escape. (3) Diff is move/extract-dominant (behavior golden / snapshot or existing e2e-ish tests unchanged). |

---

### PR-D — Durable Pass / Pass persistence

| | |
|--|--|
| **Title** | Worlds: durable Pass (refusal memory) |
| **Branch** | `worlds/durable-pass` |
| **Why** | Inventory + blind-angles: Self Pass is a **session-local `Set`** (`GenreModules`); Guided `dismiss` lives on session `acted` but does not teach Self/Companion long-term refusal. Taste product without “no” memory. |
| **Scope in** | Persist Pass/dismiss per world (+ mediaType) in a durable store (settings blob or library-adjacent flag — pick one, document); Self filters passed ids across remounts; Guided dismiss feeds same memory; optional Companion RAG hint “prefer not recommending dismissed”; thin “show passed” escape hatch if hidden forever is too sharp. |
| **Scope out** | Full Letterboxd diary; social; Ignore vs Pass taxonomy expansion beyond soft-block; Marathon/geo. |
| **Key files** | `client/src/components/genre/GenreModules.tsx` (`passedIds` ~155–321); `client/src/components/genre/GuidedTour.tsx` (dismiss act); `server/src/services/guidedSessionService.ts` (`acted` / `syncGuidedWatchlistFromChat` sibling patterns); possibly `server/src/rag/contextBuilder.ts` (already prefers not recommending dismissed in tour context). |
| **Effort** | M |
| **Priority** | P1 |
| **Dependencies** | None; avoid bundling with deepen-acts so review stays taste-memory focused |
| **Success criteria** | (1) Self Pass Horror title → remount / mode flip → title still hidden. (2) Guided dismiss → same title soft-blocked on Self tray (or documented single-store rule). (3) Reload survives. (4) Watchlist path unchanged; packing untouched. |

---

### PR-E — Mood / Archive metaphor habit

| | |
|--|--|
| **Title** | Worlds hub: Mood & Archive habit (or quiet) |
| **Branch** | `worlds/hub-mood-archive-habit` |
| **Why** | Doors/Map carry enter; Mood (8 chips) and Archive (14 Generic leftovers) are **thin** — high-signal copy, sparse stages. Either earn a habit (preview density, one-job enter) or demote so they stop looking like peer products. |
| **Scope in** | Pick **one** strategy and ship it fully: (A) Mood shows shelf-heat + owning-world preview before enter; Archive labels Generic + density honesty; **or** (B) demote Mood/Archive to secondary disclosure / Settings-adjacent, Doors+Map remain primary. |
| **Scope out** | Redesigning Doors packing; new hub tabs; metaphor layout grammar inside rooms (still chrome). |
| **Key files** | `client/src/pages/GenrePicker.tsx` (`MoodChips`, Archive section, tablist); `client/src/components/genre/WorldsMap.tsx` if Map cross-links; genre world registry for archive ownership. |
| **Effort** | M |
| **Priority** | P2 |
| **Dependencies** | None; Daniel call on A vs B before coding |
| **Success criteria** | (1) Written decision A or B in PR body. (2) Live hub: Mood/Archive either show density-aware enter **or** are clearly secondary. (3) Doors default + Resume/Enter unchanged. (4) No packing reopen. |

---

### PR-F — Export notes reader

| | |
|--|--|
| **Title** | Worlds: notes reader for `lumina:notes` |
| **Branch** | `worlds/export-notes-reader` |
| **Why** | `ExportWorld` writes Markdown to `localStorage` key `lumina:notes` and offers printable — **no in-app reader**. Remember axis scores low; artifact dies on leave path. |
| **Scope in** | Thin reader surface (Settings strip, Library subpanel, or Worlds leave-path “Saved notes”); list + open markdown; optional delete; keep pure client. Optional: “Save tonight’s three” on Claim later — **out of this PR** unless trivial hook. |
| **Scope out** | Server sync; sharing; Claim export redesign as primary scope; Companion recall of notes. |
| **Key files** | `client/src/components/genre/ExportWorld.tsx` (`NOTES_KEY`); mount site in `GenreModules` / leave path; new thin page or panel component + tests (`ExportWorld.test.tsx` pattern). |
| **Effort** | S–M |
| **Priority** | P2 |
| **Dependencies** | None |
| **Success criteria** | (1) Save note on Self leave path → open reader → same markdown visible. (2) Reload persists. (3) No server/schema change required. |

---

### PR-G — Deepen acts from chat / Companion invalidate

| | |
|--|--|
| **Title** | Worlds: deepen acts + guided-session invalidate after chat tools |
| **Branch** | `worlds/deepen-acts-invalidate` |
| **Why** | Deepen **talks well, acts rarely** (inventory). Server already mirrors watchlist via `syncGuidedWatchlistFromChat` when conversation is linked — client often **does not invalidate** `["guided-session", slug, mediaType]`, so Tonight bag / shelf `inLibrary` lag until reload. Suggestion chips narrate; commit tools should refresh the desk. |
| **Scope in** | After chat tool writes library / guided sync: invalidate guided-session (+ peek if needed); ensure link-on-deepen path is solid; optional explicit “Watchlist this” / “Pass this” chips that call existing `act` API; tighten deepen greeting toward shelf (product copy, small). |
| **Scope out** | Merging Shell Companion and FAB into one app; new LLM tools beyond existing watchlist mirror; packing. |
| **Key files** | `client/src/components/genre/CompanionPanel.tsx`; `client/src/components/chat/useChat.ts` (`wroteToLibrary` / invalidate); `server/src/llm/chatService.ts` (`mirrorGuidedWatchlist`); `server/src/services/guidedSessionService.ts` (`syncGuidedWatchlistFromChat`, `linkGuidedConversation`); `client/src/components/genre/GuidedTour.tsx` (bag / acted UI). |
| **Effort** | M |
| **Priority** | P1 |
| **Dependencies** | None; pairs well after PR-A if both touch CompanionPanel (sequence A → G) |
| **Success criteria** | (1) Linked deepen chat watchlists a shelf title → bag/shelf updates **without** full reload. (2) Escape deepen still returns claim. (3) Unlinked Self Talk does not invent guided sessions. (4) Test for invalidate or act-from-chip coverage. |

---

### PR-H — Guided lexicon / first-session tax (optional thin)

| | |
|--|--|
| **Title** | Worlds: Guided first-session lexicon clarity |
| **Branch** | `worlds/guided-lexicon-clarity` |
| **Why** | Inventory gap: Creeping / Breach / “The door is chosen” is powerful after fluency, opaque cold. Soft product, not motion. |
| **Scope in** | One plain-language sublabel or whisper under dials / claim H1 for first incomplete session; keep metaphor voice. |
| **Scope out** | Renaming all metaphors; packing. |
| **Key files** | `GuidedTour.tsx`; dial copy sources in genre world / curator. |
| **Effort** | S |
| **Priority** | P2 |
| **Dependencies** | None |
| **Success criteria** | Cold Guided Horror: user can state tempo/era/risk job in plain words from UI chrome without reading docs. |

---

## Ordered roadmap

### Wave 1 — ship this week (feel + hub health)

1. **PR-A** Emil taste P1  
2. **PR-B** Hub batch peek  
3. **PR-G** Deepen acts / invalidate *(or swap with PR-D if Daniel prioritizes refusal memory over chat loop)*

**Morning pick default:** start **PR-A** — smallest blast radius, Daniel-visible in one sniff, clears Emil Soft gate leftovers.

### Wave 2 — taste memory + thin surfaces

4. **PR-D** Durable Pass  
5. **PR-F** Export notes reader  
6. **PR-E** Mood/Archive habit *(after A/B decision)*  
7. **PR-H** Lexicon clarity *(optional, if first-session friction shows in Daniel look)*

### Wave 3 — engineering debt

8. **PR-C** GenreExperience extract (behavior-neutral)

Parallelism note: A ∥ B is safe. G touches Companion/chat — avoid parallel with A if both edit `CompanionPanel`/`theme.css`. C should land alone after product PRs settle.

---

## Explicitly NOT doing / defer

| Item | Why defer |
|------|-----------|
| Packing / Mode-split B reopen | CLOSED law |
| Facelift Ω3 code absorb | G2 wait until Daniel re-opens post-Worlds |
| Metaphor-as-place layout grammar | Chrome; inventory score 2/5 — needs design brief, not a thin PR |
| Vault density (2 Dense / 6 Thin / 8 empty) | Catalog/seed problem, not UI polish |
| Map warp habit instrumentation | Blind-angle Could; prove or quiet later |
| GeoMap / Marathon / NeighborRail “finish” | Power toys; not pick job |
| Sound / cueBeatMap live earn | Labs backlog |
| TV Guided parity deep pass | Toggle exists; sniff unproven — schedule only after Movies path polish |
| Archive-only slug → Guided `400` | **Intentional** (`assertKnownWorldSlug`); Archive enters Self. Soft copy on reject only if a path invites Guided on Generic — not seen as P0 |
| Two Companions full merge | Blind-angle Must #3 — product decision larger than thin PR; deepen invalidate (PR-G) is the surgical slice |
| Confetti / bag bounce / mode-flip springs | Emil NOT-to-animate law |
| `.tmp-pre-pr4-sync-docs`, roast PNGs, skills-lock hygiene | Machine cleanup; local delete or ignore |
| Re-fix Library `?status=` | Already fixed pre-merge |

---

## Tracking table

| ID | Slice | Pri | Eff | Wave | Status |
|----|-------|-----|-----|------|--------|
| [ ] | PR-A Emil taste P1 | P1 | S | 1 | open |
| [ ] | PR-B Hub batch peek | P1 | M | 1 | open |
| [ ] | PR-G Deepen acts / invalidate | P1 | M | 1 | open |
| [ ] | PR-D Durable Pass | P1 | M | 2 | open |
| [ ] | PR-F Export notes reader | P2 | S–M | 2 | open |
| [ ] | PR-E Mood/Archive habit | P2 | M | 2 | open — needs A/B call |
| [ ] | PR-H Guided lexicon clarity | P2 | S | 2 | optional |
| [ ] | PR-C GenreExperience extract | P2 | L | 3 | open |

### Top 3 next (recommended order)

1. **PR-A** `worlds/emil-taste-p1` — feel debt from Emil Soft PASS; ship before chasing product depth.  
2. **PR-B** `worlds/hub-batch-peek` — every hub visit still N peeks; clean perf/API slice.  
3. **PR-G** `worlds/deepen-acts-invalidate` — closes “Deepen talks, rarely commits” without reopening packing.

*Swap #3 → PR-D if tomorrow’s priority is refusal memory over companion loop.*

---

## Evidence index

| Doc | Used for |
|-----|----------|
| `2026-08-06-worlds-emil-qa-gate.md` | P1 press / needle / rise / hover |
| `2026-08-06-worlds-full-inventory.md` | thin Mood/Archive/Export/Pass/Deepen |
| `2026-08-06-worlds-adversarial-interact-qa.md` | what is already fixed |
| `2026-08-06-worlds-pr4-premerge-live-qa.md` | peek N×16 residual; dial sync shipped |
| `2026-08-06-worlds-claim-loop-dod.md` | claim loop complete baseline |
| `2026-08-06-worlds-blind-angles-features.md` | Pass / deepen acts / export / companion split |
| Code skim | `GenrePicker` peeks · `GenreModules` local Pass · `ExportWorld` `lumina:notes` · `GenreExperience` ~1.1k LOC · `theme.css` rise/FAB · `GuidedTour` needle width · `syncGuidedWatchlistFromChat` |
