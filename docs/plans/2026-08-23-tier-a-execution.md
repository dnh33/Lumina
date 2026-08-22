# Tier A Feature Execution Plan (2026-08-23)

## Scope
Quick wins from the feature gap table + researcher-expanded ideas that are shippable
in one session. Prioritized: live defect first, then data safety, then visual polish.

## Completed This Turn

### #6 — Error Recovery Granularity (P0, ~45 min) — DONE ✅
**Problem:** Retry that returns a too-short stub (e.g. 25 chars) falls through to
the SNAG message, making the dead-end look like a model failure when it was a
recovered-and-shortened retry.

**Changes:**
- `server/src/llm/chatService.ts`:
  - `ChatEvent` error type: added `retryAttempted?: boolean`
  - `MIN_RETRY_LENGTH = 40` constant
  - Too-short retry path: emits `error` with `retryAttempted: true` before
    falling to SNAG persist (so the client can show "Lumina is trying again…")
- `client/src/lib/types.ts`: added `retryAttempted?: boolean` to `ChatEvent`
- `client/src/components/chat/useChat.ts`: `errorRetryAttempted` state, set on
  SSE error event, surfaced in return + resets on new turn / conversation change
- `client/src/components/chat/ChatThread.tsx`: error block now branches:
  `errorRetryAttempted → "Lumina is trying again…"` else
  `"Lumina couldn't finish that response. Try again?"`
- `server/test/chatService.snag.test.ts`: expanded from 1 → 3 tests

**Tests:** 3/3 server pass. 102/102 client pass.

### #1 — Multi-message Persistence (P1, ~30 min) — DONE ✅
**Problem:** Page reload mid-stream loses the optimistic response; user sees
where the server caught up, but the gap feels like nothing happened.

**Changes:**
- `client/src/lib/keys.ts`: `STREAM_SNAPSHOT_KEY = "lumina:stream-snapshot"`
- `client/src/components/chat/useChat.ts`:
  - Lazy `useState` initializer reads `${STREAM_SNAPSHOT_KEY}:${convId}` from
    localStorage; restores mid-flight phases (starting/thinking/tooling)
  - `useEffect` snapshots `stream` on every phase/text/steps/contextChange
  - `finishTurn` + error paths clear the snapshot key
- `client/src/lib/types.ts`: no changes needed (already typed)

**Tests:** 102/102 client pass.

### #4 — Tool Attribution in Waveform (P2, ~30 min) — DONE ✅
**Problem:** During tool calls, the waveform skeleton was generic — no visual
indication of *which* tool was running.

**Changes:**
- `client/src/components/chat/WaveformSkeleton.tsx`:
  - `activeTool?: string` prop
  - `TOOL_VARIANTS`: per-tool-category animation (search/library/write/default)
  - `toolCategory()` maps tool names → waveform character
  - `TOOL_DURATIONS`: per-category timing
- `client/src/components/chat/WaveformSkeleton.test.tsx`: 2 new tests for
  activeTool prop + bar count invariance
- `client/src/components/chat/ChatThread.tsx`: passes
  `steps.findLast(!done)?.name` as `activeTool` to `<WaveformSkeleton>`
  during `tooling` phase (replaced broken `stream.steps` reference → `steps`)

**Tests:** 102/102 client pass.

## Remaining Tier A

### Companion Personas (30 min) — NOT STARTED
- System prompt swap via config enum (Critic/Enthusiast/Minimalist/Curator)
- `@runeforge-brand` to own prompt diffs

### Offline Queue (1 hr) — NOT STARTED
- Service worker + IndexedDB for offline query queueing
- Replay on reconnect

## Verification Gate
- [x] Client chat tests: 102/102
- [x] Server tests: 143/144 (1 pre-existing)
- [x] Client typecheck: 0 chat/types errors (47 pre-existing GenreExperience)
- [x] Server typecheck: 0 errors
