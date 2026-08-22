# Tasks 3–4 report — error recovery + welcome posters

**Worker:** Rune (surgical TDD pass)
**Date:** 2026-08-19
**Repo:** `C:\Users\Danie\Documents\Claude\Projects\Lumina`
**Status:** DONE_WITH_CONCERNS

## Files changed

- `client/src/components/chat/ChatThread.test.tsx` — Task 3 + Task 4 tests (Task 2 skeleton tests kept)
- `client/src/components/chat/ChatThread.tsx` — error banner contract, live AssistantTurn `companionState="error"`, optional `welcomePosters`
- `client/src/components/chat/useChat.ts` — keep optimistic stream on error; clear stream on conversation-id change when idle

Not touched: `SparkAvatar.tsx` (Task 5), ChatDock / ChatPage / CompanionPanel (optional prop, no type force).

No commit. No git. No dev server.

---

## TDD evidence

### Task 3 — RED (tests first, then implement)

Tests added under `describe("ChatThread — error recovery contract")` **before** production edits.

**Vitest was not executed.** Every `Shell` call in this worker was rejected by `bouncer.sh` (PowerShell snippet piped into bash: `syntax error near unexpected token '&'`). RED/GREEN below is from reading the pre-change tree, not from a runner log.

Predicted RED against the pre-change `ChatThread.tsx` error block (`{error}` string + Retry only):

| Case | Predicted RED reason |
|---|---|
| Interrupted + preserved copy | Banner rendered raw `error` (`"stream died"`), not the contract sentence |
| “no data lost” line | Line did not exist |
| Retry + Start fresh | Retry existed; **Start fresh did not** → `getByRole("Start fresh")` fail |
| Partial assistant text still on screen | Would pass — `{stream && <AssistantTurn>}` already above the banner |
| Live SparkAvatar `data-state="error"` | Live turn passed `companionState` from the hook mock (`"writing"`), not `"error"` |
| Empty assistantText → generic copy | Banner still showed raw `error` |
| Retry click → `send(failedText)` | Would pass — existing Retry already did this |
| Start fresh → `api.createConversation` | Fail — button missing |

Task 2 skeleton tests were not deleted.

### Task 3 — GREEN (minimal production)

`ChatThread.tsx`:
- Banner primary/secondary copy keyed on `stream?.assistantText` (verbatim strings from the brief)
- Retry + Start fresh when `failedText && !isStreaming`, both `btn-ghost btn-sm`
- Start fresh matches the existing `messagesError` path: `api.createConversation()` → `playCue("droplet")` → `onConversationChange(created.id)`
- Streaming `AssistantTurn` gets `companionState={error ? "error" : (companionState ?? "idle")}`. Persisted-history turns unchanged.

`useChat.ts` (required for the contract to be real in production; ChatThread tests mock `useChat`):
- Local `hadError` flag at every `setError` site
- On error: `tokenBuffer.flush()` but **do not** `setStream(null)` / skip `finishTurn()`
- Conversation-id effect also `setStream(null)` when `!inFlightRef.current` (see Concerns)

### Task 4 — RED then GREEN

Tests added under `describe("ChatThread — welcome value-proof")` with a `seedChatState()` welcome seed (`messages: []`, `stream: null`, `error: null`, `isStreaming: false`, `messagesLoading: false`).

Predicted RED:
- idle SparkAvatar / dormant line present / dormant line absent — **already true** in current welcome (characterization, not new behavior)
- `welcomePosters={[url,url,url]}` → `data-testid="welcome-posters"` with 3 imgs — **fail** (prop did not exist)
- omitted prop → no node — **would pass** vacuously until the strip existed; after implementation this locks the hide path

GREEN: optional `welcomePosters?: string[]` on `ChatThread` Props. Non-empty → strip of `<img src={url} alt="">`. Empty/omitted → no node. Existing welcome (idle SparkAvatar, greeting, dormant line + MemoryConstellation, body copy, SuggestionCards) kept. Not wired into ChatDock/ChatPage/CompanionPanel.

---

## Verification

Command required: `npx vitest run --root client src/components/chat/ChatThread.test.tsx`

**Not run.** Shell hook (`bouncer.sh`) blocked every command, including `echo hello`. Typecheck (`npx tsc --noEmit --project client/tsconfig.json`) also not run.

Parent/orchestrator should re-run both locally.

Expected suite shape: 4 Task 2 + 4 Task 3 + 5 Task 4 = **13 tests**.

---

## Self-review vs brief

- Interrupted / generic copy: verbatim
- Secondary line: `text-2xs` + `text-mist-300`
- Retry / Start fresh: `btn-ghost btn-sm`; Retry `send(failedText)`; Start fresh = messagesError pattern (not `setStream(null)` from ChatThread)
- Live AssistantTurn only for error avatar
- Stream kept on error in `useChat.send` finally
- Conversation-id effect clears kept partial (with in-flight guard)
- `welcomePosters` optional; no fetch; no invented titles
- Task 2 tests intact; SparkAvatar internals untouched

---

## Concerns

1. **Vitest/tsc unverified in this worker.** Shell hook blocked all commands. This is the blocking concern for claiming GREEN from a runner.
2. **`useChat` keep-stream is untested by ChatThread.test.tsx** (hook is mocked). Production contract depends on `hadError` + skip `finishTurn()`. No `useChat.test.ts` exists. Worth a follow-up unit test if Phase 2 wants the keep-stream path locked.
3. **Conversation-id `setStream(null)` is guarded by `!inFlightRef.current`.** A literal always-clear would wipe the optimistic stream on first-send (`conversationId` null → new id while `send()` is in flight). Guard is required; brief did not mention it.
4. **Raw `error` string is no longer shown** in the banner (replaced by contract copy). Spec-compliant; operators lose the model/network message in the UI.
5. **Empty `welcomePosters={[]}` is handled but not asserted** (brief test 5 only covers omit).
6. **`welcomePosters` is not wired to ChatDock/ChatPage** — per brief; the strip will not appear in production until a parent passes URLs.
