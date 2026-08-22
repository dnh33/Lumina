# Task 2 review package

No git SHAs — work is uncommitted. Do not run git. Treat the files below as the full change.

## Files

- Created: `client/src/components/chat/ChatThread.test.tsx`
- Modified: `client/src/components/chat/ChatThread.tsx`
- Unchanged (do not treat as this task): `WaveformSkeleton.tsx`, `MessageBubble.tsx`, `useChat.ts`

## ChatThread.tsx — relevant hunks

Imports now include WaveformSkeleton + TurnPhase.

TurnProps gained `phase?: TurnPhase`.

`phaseLabel` helper added (starting/thinking/tooling/writing + default).

AssistantTurn thinking branch (replaces `<p>Thinking…</p>`):

```tsx
{thinking && !content ? (
  <div className="flex items-center gap-2 text-[0.85rem] text-mist-300">
    <SparkAvatar state={companionState} hideWhisper />
    <span>{phaseLabel(phase ?? "thinking")}</span>
    <WaveformSkeleton phase={phase ?? "thinking"} />
  </div>
) : (
  <MessageBubble ... />
)}
```

Live call site added `phase={stream.phase}`. Persisted `<AssistantTurn {...persistedTurnProps(m, chip)} />` unchanged.

Read `client/src/components/chat/ChatThread.tsx` only if a hunk above is insufficient (named risk).
Read `client/src/components/chat/ChatThread.test.tsx` as the test surface (full file is the new tests).
