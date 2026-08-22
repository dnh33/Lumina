# Task 2: Phase-Driven Skeleton in AssistantTurn

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx:99-149` (AssistantTurn component)
- Modify: `client/src/components/chat/MessageBubble.tsx` (imports)
- Create: `client/src/components/chat/ChatThread.test.tsx` (integration tests)

**Current code (line 133-135):**
```tsx
{thinking && !content ? (
  <p className="text-[0.8rem] italic text-mist-300">Thinking…</p>
) : (
  <MessageBubble ... />
)}
```

**New code:**
```tsx
{thinking && !content ? (
  <div className="flex items-center gap-2 text-[0.85rem] text-mist-300">
    <SparkAvatar state={companionState} hideWhisper />
    <span>{phaseLabel(stream?.phase ?? "thinking")}</span>
    <WaveformSkeleton phase={stream?.phase ?? "thinking"} />
  </div>
) : (
  <MessageBubble ... />
)}
```

**phaseLabel helper:**
```tsx
function phaseLabel(phase: TurnPhase): string {
  switch (phase) {
    case "starting": return "Lumina is waking…";
    case "thinking": return "Lumina is thinking…";
    case "tooling": return "Reaching into your library…";
    case "writing": return "Composing…";
    default: return "Lumina is thinking…";
  }
}
```

**Need to import:** `WaveformSkeleton` + `TurnPhase` type into ChatThread.tsx

- [ ] **Step 1: Write failing integration test** — skeleton visible during thinking, hidden when content arrives
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Add phaseLabel + WaveformSkeleton to AssistantTurn**
- [ ] **Step 4: Run tests** — `npx vitest run --root client src/components/chat/ChatThread.test.tsx`
- [ ] **Step 5: Commit** — `feat: phase-driven skeleton replaces Thinking… text`

---

## Controller resolutions (binding)

1. **`stream` is not in `AssistantTurn` today.** Live call site (`ChatThread.tsx` ~459–468) already has `stream`. Do **not** pass the whole stream object. Add `phase?: TurnPhase` to `TurnProps` and pass `phase={stream.phase}` from the live `AssistantTurn`. Inside AssistantTurn use `phase ?? "thinking"` (equivalent to the plan’s `stream?.phase ?? "thinking"`). Persisted turns omit `phase` and never set `thinking` — skeleton stays hidden there.

2. **Do not modify `MessageBubble.tsx`.** The plan’s “Modify MessageBubble.tsx (imports)” is leftover. Imports go in `ChatThread.tsx` only: `WaveformSkeleton` from `./WaveformSkeleton`, `TurnPhase` from `./useChat` (that file already imports `useChat` / `ToolStep` / `TOOL_LABELS` — extend that import).

3. **Duplicate SparkAvatar is plan-mandated.** The left-column avatar stays. The thinking row adds a second `SparkAvatar` with `hideWhisper`. Do not “dedupe” them.

4. **Do not commit.** Operator runs git. Skip Step 5.

5. **Do not start a dev server.** Tests only.

6. **TDD is required.** Write `ChatThread.test.tsx` first, run it (must fail), then implement, then re-run.

7. **Tests must be real integration tests of `ChatThread`**, not a unit test of an exported helper alone. `phaseLabel` stays a module-private function (do not export unless tests cannot otherwise assert the visible strings).

### Test strategy (required)

Mock `./useChat` and wrap `ChatThread` in `QueryClientProvider`. Seed health so the companion-wake / loading gates do not hide the thread:

- `QueryClient` with `defaultOptions: { queries: { retry: false } }`
- `qc.setQueryData(["health"], { aiConfigured: true })` **or** mock `../../lib/api` `health` to resolve `{ aiConfigured: true }` immediately
- `vi.mock("./useChat")` returning a controllable `stream` / `streamedText` / `companionState`

`ChatThread` props: `conversationId={null}`, `onConversationChange={() => {}}`.

**Minimum cases (Step 1):**
1. **Thinking, no content:** `stream.phase === "thinking"`, empty assistant text, `thinking` path. Assert:
   - `data-testid="waveform-skeleton"` is present
   - visible text includes `Lumina is thinking…`
   - the old `Thinking…` p-tag is gone (`queryByText` exact `Thinking…` is null)
2. **Content arrived (writing):** `stream.phase === "writing"` with non-empty assistant/streamed text. Assert:
   - `waveform-skeleton` is absent
   - message content is visible via `MessageBubble`
   - phase label is not shown

**Also cover (keep lean):**
3. `tooling` + empty content → label `Reaching into your library…` and 5 `[data-part='waveform-bar']`
4. `starting` + empty content → label `Lumina is waking…` and skeleton present

Match existing chat test hygiene: `afterEach(cleanup)`, jsdom, `@testing-library/react`. See `WaveformSkeleton.test.tsx` and `client/src/pages/GenrePicker.test.tsx` for QueryClient + mock patterns.

`useChat` mock must include enough fields that `ChatThread` does not throw: `messages: []`, `messagesLoading: false`, `messagesError: null`, `refetchMessages`, `stream`, `streamedText`, `toolNodes: []`, `stopped: false`, `companionState`, `error: null`, `failedText: null`, `send`, `stop`, `isStreaming: true` when stream is active.

### Live call-site wiring

Current live `AssistantTurn` (~459):

```tsx
<AssistantTurn
  content={streamedText || stream.assistantText}
  streaming={stream.phase === "writing"}
  thinking={stream.phase !== "writing"}
  steps={stream.steps}
  receipts={stream.receipts}
  contextNote={stream.contextNote}
  stopped={stopped}
  companionState={companionState}
/>
```

Add `phase={stream.phase}` there. Do not change persisted `AssistantTurn {...persistedTurnProps(m, chip)}`.

### WaveformSkeleton already exists (Task 1)

`client/src/components/chat/WaveformSkeleton.tsx` is already in the tree. Import and use it. Do not rewrite it.

### Out of scope (later tasks)

- Error recovery contract (Task 3)
- Welcome posters (Task 4)
- SparkAvatar breathing/caret/error pulse (Task 5)
- Do not touch `theme.css`

### Verify

```bash
npx vitest run --root client src/components/chat/ChatThread.test.tsx
```

If the shell is blocked, write files anyway, record the blocker in the report, and still follow TDD file order (test file created before production edits).
