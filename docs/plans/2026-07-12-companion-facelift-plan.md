# Lumina Companion Face-Lift — Implementation Plan (Wave 2)

*Companion to `2026-07-12-companion-facelift-design.md`. TDD tasks, 2–5 min each.
Design gate APPROVED (frontend-only, D1=a client-simulated reasoning interstitial, no backend changes).*

**Stack facts (verified):** `framer-motion@12` (MotionConfig, AnimatePresence mode, useReducedMotion,
useScroll/useSpring/useTransform, offsetDistance all supported). `react-markdown@10` + `remark-gfm@4`.
Client has **no test runner** → Task 1 adds vitest + RTL. Server `test` = vitest; client `typecheck` = tsc -p.

**Authoritative refs (read before building — absolute paths):**
- `C:\Users\Danie\Documents\Claude\Projects\Lumina\docs\plans\2026-07-12-companion-facelift-design.md`
- `C:\Users\Danie\lumina-ui-design-principles.md`
- `C:\Users\Danie\LUMINA_PRESENCE_PATTERNS.md`
- `C:\Users\Danie\streaming-llm-ui-best-practices.md`
- `C:\Users\Danie\lumina-motion-recipes.md`

**Hard rules for every task:**
- TDD: write the failing test first, watch it fail, implement, watch pass, commit. No code before a test
  (except pure visual components, where the "test" is a typecheck + a documented visual-QA checklist item).
- GPU-only motion: transform/opacity/filter only. No animating width/height/top/left/margin/padding.
- `prefers-reduced-motion` always handled (wrap with `MotionConfig reducedMotion="user"` + per-component `useReducedMotion`).
- Gold is rare: ≤3 gold accents per screen; glow only on active state. Fraunces = voice/titles/greeting only.
- No purple/blue, no robot avatar, no emoji decoration, no autoplay, no sound.
- Signature easing `cubic-bezier(0.22,1,0.36,1)` for all entrances; `cubic-bezier(0.4,0,0.2,1)` for state changes.
- Touch only the files named in each task. No unrelated refactors.

**Verify commands:**
- Client tests: `npm run test --workspace client` (added in Task 1)
- Client typecheck: `npm run typecheck --workspace client`
- Client build: `npm run build --workspace client`
- Full typecheck: `npm run typecheck`

---

## Wave 1 — Foundation (parallel, no file overlap)

### Task 1 — Client test harness
- Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` to `client/package.json` devDeps.
  Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- Add `client/vitest.config.ts` (environment jsdom, setup file) and `client/src/test/setup.ts` (import jest-dom).
- TEST: `client/src/test/smoke.test.tsx` renders `<div>ok</div>` via RTL `render` + `screen.getByText` → asserts "ok".
- Verify: `npm run test --workspace client` passes. Commit.

### Task 2 — Motion foundation (tokens + reduced-motion shell)
- In `client/src/theme.css`: add CSS custom props `--ease-out-expo: cubic-bezier(0.22,1,0.36,1)` and
  `--ease-state: cubic-bezier(0.4,0,0.2,1)`; add a `.glow-gold` utility (`box-shadow: 0 0 24px rgba(232,184,75,.25)`)
  gated so it only shows on active state.
- Create `client/src/lib/motion.ts` exporting shared `variants` (messageEnter R1, messageExit R2, stagger60 R4,
  posterDeal R11) and the easing constants, typed for framer-motion.
- Wrap the app in `client/src/App.tsx` with `<MotionConfig reducedMotion="user">`.
- TEST: `client/src/lib/motion.test.ts` asserts easing constants equal the two bezier strings and stagger60
  `staggerChildren === 0.06`. (Pure object test.)
- Verify: `npm run test --workspace client` + `npm run typecheck --workspace client`. Commit.

### Task 3 — Streaming markdown engine (kill flicker) + token buffer
- SPIKE first: confirm `streamdown` (Vercel) installs cleanly beside `react-markdown@10`/React 19 and Shiki works.
  If peer-dep conflict, fall back to `assistant-ui` `MarkdownTextPrimitive`. Decide and note in code comment.
- Create `client/src/components/chat/MarkdownMessage.tsx` using the chosen streaming-safe renderer with Lumina's
  existing `.prose-lumina` custom `components` ported over. Add a `preprocess` (T4) normalizing stray `$`/LaTeX
  before parse. Pipe raw text through `useDeferredValue(raw, '')` (T2).
- Create `client/src/hooks/useTokenBuffer.ts` — buffers incoming deltas, flushes on ~24ms cadence (T6). Export a
  pure `bufferFlush` helper for testing.
- TEST: `client/src/hooks/useTokenBuffer.test.ts` — given deltas at t=0,5,10,15ms, assert flush called once near
  ~24ms with concatenated text (fake timers). `client/src/components/chat/MarkdownMessage.test.tsx` — render
  `"**bold** and ## h"` mid-stream (unterminated) and assert no thrown error and the text is present without a
  raw broken-astrisk flash (assert the bold element eventually renders, no raw `**` in textContent).
- Verify: tests pass + typecheck. Commit. (MessageBubble swap happens in Wave 3 task.)

---

## Wave 2 — Presence, Tool-Viz, Welcome (parallel; depend on Wave 1)

### Task 4 — Presence system: SparkAvatar state machine (Animation/Interaction Director)
- Create `client/src/components/chat/SparkAvatar.tsx` (rewrite) + `client/src/hooks/useCompanionState.ts`.
  State union: `idle | thinking | tooling | writing | error`. Derive from streaming events in useChat (wired W3).
- Render the star-core with 5 distinct visual states (presence P1–P16, recipes R5–R8):
  - idle: breathing scale loop 3.2s (R5).
  - thinking: 2–3 concentric SVG ripple rings, staggered (P2).
  - tooling: satellite dot orbit + per-step beads (P4,P5) — beads driven by tool events.
  - writing: gold comet trail on caret via MotionValue (P3,R7); core opacity tracks token cadence.
  - error: desaturate + red-gold hairline fault-line, NO shake (P14).
  - Plus Fraunces "state whisper" micro-label ("considering…" etc.) (P15) and a `memory` state that pops a gold
    star (P13) on a "learned" event.
- Every loop wrapped in `useReducedMotion()` → static still core (P16,R16).
- TEST: `client/src/hooks/useCompanionState.test.ts` — reducer transitions: idle→thinking on tool, thinking→writing
  on first delta, writing→idle on done, any→error on error, error→idle on new turn. Pure function test.
  `SparkAvatar.test.tsx` — render each state, assert distinct aria-label + a state-specific class/data attr;
  with `prefers-reduced-motion` mocked, assert no infinite-loop animation props (animation none / reduced flag).
- Verify: tests + typecheck. Commit.

### Task 5 — Tool-use trace rail (Tool-Viz Director)
- Create `client/src/components/chat/ToolTrace.tsx` (new) + refactor `ToolRibbon.tsx` to render into it.
  Vertical connecting line (`::before`, GPU paint), one node per tool event, spinner→check via `AnimatePresence`,
  "spark travel" dot along the line while active (T12, reduce-aware), per-step beads (P5), summary chip from
  `tool_done.summary` with FIXED `min-height` so spinner→summary never shifts layout (T13).
- Receipt chips (library writes) pop in with spring (R14).
- TEST: `ToolTrace.test.tsx` — given tool events [search→add_to_library], assert 2 nodes in order, connecting line
  present, summary text shown (not raw JSON), and that node container has fixed min-height. Given reduce-motion,
  assert spark element not rendered.
- Verify: tests + typecheck. Commit.

### Task 6 — Cinematic welcome + reasoning interstitial (Welcome/UX Director)
- Rewrite `client/src/components/chat/SuggestionCards.tsx`: poster cards "dealt in" with `rotateX` + 60ms stagger
  (R11), hover lift (R10). Accept context-aware suggestions (greeting uses Fraunces, anti-slop #3).
- In `client/src/pages/ChatPage.tsx` welcome section: Fraunces greeting + dealt-in posters; if dormant, a
  "memory constellation" line (P13) before suggestions.
- Create `client/src/components/chat/ReasoningInterstitial.tsx` — client-simulated "Lumina is working" anchored
  panel (T10) shown during tool-heavy turns; collapsible "How I got there" reveals the ordered tool trace
  (D1=a). Default collapsed-but-peekable (T9). Pure client state, no backend.
- TEST: `SuggestionCards.test.tsx` — renders N posters with stagger variants; `ReasoningInterstitial.test.tsx` —
  starts collapsed, toggle reveals trace; with reduce-motion, posters still render (opacity-only, no rotateX).
- Verify: tests + typecheck. Commit.

---

## Wave 3 — Integration & choreography (depends on all; single owner)

### Task 7 — Wire states + streaming + choreography (Integration Director)
- `client/src/components/chat/useChat.ts`: drive `useCompanionState` from events (context→thinking, tool→tooling,
  first delta→writing, done→idle, error→error); feed `useTokenBuffer`; replace raw markdown render with
  `MarkdownMessage`; surface tool events to `ToolTrace`; expose `isStreaming` for send↔stop.
- `client/src/components/chat/MessageBubble.tsx`: swap to `MarkdownMessage`; add message enter (R1)/exit (R2)
  spring via `AnimatePresence`; `content-visibility:auto` on off-screen (T17).
- `client/src/components/chat/ChatThread.tsx`: 60ms stagger container (R4) for message groups; keep stop/abort.
- `client/src/components/chat/ChatDock.tsx`: scroll-reactive compression via `useScroll`/`useSpring`/`useTransform`
  (R15) — dock scales to 0.92 on scroll-down; send↔stop cross-rotate swap (R13) in input bar.
- Graceful stop (T14,T15): Stop freezes partial text, "· stopped" footer, restores send, allows edit+resend.
- TEST: `useChat.test.ts` (pure reducer/state parts) — given a scripted event sequence, assert companionState
  transitions, buffered text equals final, abort sets stopped flag, resume clears it.
  `MarkdownMessage` flicker regression already covered in Task 3.
- Verify: `npm run test --workspace client` + `npm run typecheck` + `npm run build --workspace client` all green.
  Commit.

### Task 8 — Visual QA gate + brand-fidelity review
- Run `npm run build --workspace client`. Boot `npm run dev` is user-run (per memory: never start dev servers).
- Checklist (manual/visual, documented in PR): (1) zero markdown flicker on a `**bold**/##/code/table` message;
  (2) 5 distinct SparkAvatar states, error = no shake; (3) ≥55fps during 60-msg streamed scroll (user verifies
  via devtools); (4) tool trace ordered + spark + summary (no raw JSON) + no layout shift; (5) Stop freezes +
  edit/resume; (6) reduced-motion: loops stop, markdown instant, UI usable; (7) welcome = Fraunces + dealt posters;
  (8) gold ≤3/screen, no purple/robot/emoji.
- If any fails, file a fix task; otherwise mark plan complete and report.

---

## Execution model
Dispatch per wave as parallel `delegate_task` leaf agents (Batch 1: Tasks 1–3; Batch 2: Tasks 4–6; Batch 3:
Task 7 then 8). Each agent gets this plan + the 5 ref files + the hard rules. Wave 2 waits for Wave 1 (Streamdown
+ motion tokens + buffer must exist). Wave 3 waits for Wave 2 (SparkAvatar/ToolTrace/Welcome components must exist).
Task 8 is a final integration/QA pass (this session, not a build agent).
