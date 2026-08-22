# Tasks 3–4 brief — ChatThread error recovery + welcome structure

Read this first. These are your requirements. Implement Task 3, then Task 4, in the same working tree. Do not commit.

**Repo:** `C:\Users\Danie\Documents\Claude\Projects\Lumina`
**Plan source:** `docs/plans/2026-08-18-skeleton-presence-execution.md` Tasks 3 and 4
**Do not re-read the whole plan.** This brief is the source of truth, including controller resolutions.

**Constraints:**
- TDD: write failing tests first, run them, then implement. Record RED then GREEN evidence.
- NO git commands. NO commits. NO `--no-verify`. NO new branches.
- NEVER start a dev server.
- Surgical: only ChatThread.tsx, ChatThread.test.tsx, and (if required for Task 3 contract to work in production) a minimal `useChat.ts` change described below.
- Do not touch SparkAvatar internals (Task 5 owns that file in parallel).
- Do not “improve” adjacent code.
- Tests: `npx vitest run --root client src/components/chat/ChatThread.test.tsx`
- Typecheck if you change public types: `npx tsc --noEmit --project client/tsconfig.json`
- Shell: Windows/bash. Use `npx` from repo root.

Existing ChatThread.test.tsx already covers Task 2 skeleton. EXTEND it. Do not delete those tests.

---

## Task 3: Error Recovery Contract

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx` (error block ~496–509, AssistantTurn SparkAvatar)
- Test: Extend `client/src/components/chat/ChatThread.test.tsx`
- Conditional: `client/src/components/chat/useChat.ts` — only the keep-stream-on-error change below

### UI contract (error banner)

Replace the current `{error && (...)}` block:

- If `stream?.assistantText` is non-empty:
  - Primary: `Lumina was interrupted — the response above is preserved. Try again?`
  - Secondary (text-2xs mist): `The partial response above is safe — no data lost.`
- Else:
  - Primary: `Something went wrong. Try again?`
  - No secondary line
- If `failedText && !isStreaming`, show two buttons:
  - **Retry** — `btn-ghost btn-sm`, `onClick={() => void send(failedText)}`
  - **Start fresh** — `btn-ghost btn-sm`

### Controller resolutions (binding)

1. **Do not use `setStream(null)` for Start fresh.** It is not exported from `useChat`, and the plan prose says “clear and new conversation”. Match the existing `messagesError` Start-fresh path in the same file: `api.createConversation()` then `onConversationChange(created.id)` (and `playCue("droplet")` is already used there — reuse that pattern). Mock `api.createConversation` in tests.

2. **SparkAvatar error state on the live AssistantTurn.** Pass `companionState={error ? "error" : (companionState ?? "idle")}` on the streaming `AssistantTurn` (the one that receives `stream`). Do not change persisted-history turns. The header SparkAvatar inside AssistantTurn should show `data-state="error"` when `error` is set.

3. **Production stream is currently dropped on error.** `useChat.send` always calls `finishTurn()` → `setStream(null)` in `finally`. That makes `stream?.assistantText` dead in production even if ChatThread implements the branch. Make the smallest useChat change so that when an error was recorded (`setError` ran), the optimistic stream is **kept** (skip `finishTurn()` / do not `setStream(null)`). Do not refactor send(). Conversation-id change already clears `error`/`failedText`; if you keep stream on error, also `setStream(null)` in that same conversation-id effect so Start-fresh (new id) actually clears the partial. That is in scope because the contract cannot be real without it.

4. Partial content stays visible because `{stream && (<AssistantTurn content={streamedText || stream.assistantText} .../>)}` already renders above the error banner. Tests should seed both `stream` (with assistantText) and `error`.

### Tests (Task 3) — required cases

Reuse the existing `mockUseChat` / QueryClient / MemoryRouter harness. Add a helper that can set `error`, `failedText`, `stream`, `isStreaming`, `send`.

1. With stream.assistantText non-empty + error + failedText + isStreaming false:
   - Shows interrupted/preserved copy
   - Shows “no data lost” line
   - Shows Retry and Start fresh
   - Partial assistant text is still on screen
   - Live AssistantTurn SparkAvatar has `data-state="error"`
2. With error but empty/missing assistantText:
   - Shows “Something went wrong. Try again?”
   - Does not show the “no data lost” line
3. Retry click calls `send` with `failedText`
4. Start fresh click calls `api.createConversation` (mock it)
5. Existing Task 2 skeleton tests still pass

---

## Task 4: Welcome value-proof structure + welcomePosters

**Files:** same ChatThread.tsx / ChatThread.test.tsx

### Current welcome (keep)

Already renders `SparkAvatar state="idle"`, `greeting()`, dormant italic line + `MemoryConstellation`, body copy, `SuggestionCards`. Do not remove those.

### Add

Optional prop on `ChatThread` `Props`:

```ts
welcomePosters?: string[];
```

- If `welcomePosters` is non-empty, render a poster strip (`data-testid="welcome-posters"`) of `<img>`s (src = each URL, alt empty or “Welcome poster”). Do not fetch. Do not invent titles.
- If omitted or empty, do not render the strip. Current welcome stays as-is (including SuggestionCards).
- Do not wire ChatDock / ChatPage / CompanionPanel unless a type error forces a default — the prop is optional.

### Tests (Task 4)

Need a seed where `messages: []`, `stream: null`, `error: null`, `isStreaming: false`, `messagesLoading: false` so `showWelcome` is true. Current `seedChat` always sets a stream — add a welcome seed helper.

1. Welcome renders SparkAvatar with `data-state="idle"`
2. `dormant` prop shows “I kept your slow-burn list warm.”
3. Without dormant, that line is absent
4. `welcomePosters={[url, url, url]}` renders `data-testid="welcome-posters"` with 3 imgs
5. No `welcomePosters` → no `welcome-posters` node

---

## After both tasks

Write the full report to:
`C:\Users\Danie\Documents\Claude\Projects\Lumina\.superpowers\sdd\task-3-4-report.md`

Then return ONLY:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- One-line test summary
- Concerns
- Report path
- NO commit SHAs (you did not commit)
