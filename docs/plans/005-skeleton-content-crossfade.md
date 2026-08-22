# 005 — Add Skeleton→Content Crossfade in ChatThread

- **Status**: DONE (commit 54e7533)
- **Commit**: 51f754d
- **Severity**: LOW
- **Category**: Missed Opportunities
- **Estimated scope**: 1 file (ChatThread.tsx)

## Problem

**Skeleton→content transition has no true crossfade** — when `thinking && !content` flips to `MessageBubble`, it snaps. `AnimatePresence` has `exit={{opacity: 0, transition: {duration: 0.15}}}` on skeleton, but message enters with `initial={{opacity: 0, y: -4}}`. No *overlap* — they don't coexist during transition. A brief 150ms opacity crossfade would bridge the two states.

**Location & Current Code:**

```tsx
// ChatThread.tsx:147-176 — current
<AnimatePresence initial={false}>
  {thinking && !content ? (
    <motion.div
      key="skeleton"
      className="flex items-center gap-2 text-[0.85rem] text-mist-300"
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
    >
      <SparkAvatar state={companionState} hideWhisper />
      <span>{phaseLabel(phase ?? "thinking")}</span>
      <WaveformSkeleton phase={phase ?? "thinking"} />
    </motion.div>
  ) : (
    <motion.div
      key="message"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
    >
      <MessageBubble
        role="assistant"
        content={content}
        streaming={streaming}
        onChip={onChip}
      />
    </motion.div>
  )}
</AnimatePresence>
```

The `AnimatePresence` uses default mode (`"popLayout"` / `"sync"`), so exit completes before enter begins. The skeleton fades out (0.15s), THEN the message fades in (0.15s) — 300ms total with a gap where neither is fully visible.

## Target

True crossfade: skeleton and message overlap for ~150ms. Both at 50% opacity at midpoint.

```tsx
// ChatThread.tsx — target
<AnimatePresence mode="wait">  // key: wait for exit before removing from DOM
  {thinking && !content ? (
    <motion.div
      key="skeleton"
      className="flex items-center gap-2 text-[0.85rem] text-mist-300"
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
    >
      <SparkAvatar state={companionState} hideWhisper />
      <span>{phaseLabel(phase ?? "thinking")}</span>
      <WaveformSkeleton phase={phase ?? "thinking"} />
    </motion.div>
  ) : (
    <motion.div
      key="message"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO, delay: 0.1 }}  // delay for overlap
    >
      <MessageBubble
        role="assistant"
        content={content}
        streaming={streaming}
        onChip={onChip}
      />
    </motion.div>
  )}
</AnimatePresence>
```

Key changes:
1. `mode="wait"` on `AnimatePresence` — keeps both in DOM during transition
2. Skeleton `exit` duration: `0.3s` (was 0.15s) — longer fade-out
3. Message `transition`: add `delay: 0.1` (was no delay) — starts fading in while skeleton fades out
4. Message `transition` duration: `0.25s` (was 0.15s) — slightly longer for smoother blend

Result: 150ms true crossfade where both coexist at partial opacity.

## Repo Conventions to Follow

- **Exemplar**: `ChatThread.tsx:430-436` already uses `AnimatePresence` with `messageEnter`/`messageExit` variants for message mounting — correct pattern
- **Exemplar**: `EASE_OUT_EXPO` token for easing (already used)
- Framer Motion `AnimatePresence` with `mode="wait"` for crossfade
- GPU-only properties (`opacity`, `transform`/`y`) — already used

## Steps

1. **ChatThread.tsx:147** — Add `mode="wait"` to `<AnimatePresence>`
2. **ChatThread.tsx:154** — Change skeleton `exit` transition to `{ duration: 0.3, ease: EASE_OUT_EXPO }`
3. **ChatThread.tsx:167** — Change message `transition` to `{ duration: 0.25, ease: EASE_OUT_EXPO, delay: 0.1 }`

## Boundaries

- Do NOT change `MessageBubble` or `WaveformSkeleton` — they're children
- Do NOT change `ChatDock` or `CompanionPanel` — they use `ChatThread` as-is
- Only the `AnimatePresence` block in `AssistantTurn` component
- No markup/structure changes — only motion props

## Verification

- **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- **Feel check**:
  - Start a query — watch the skeleton (phase label + waveform) transition to the first message content
  - Should see a smooth 150ms crossfade where both states are partially visible
  - No "flash" or gap where screen is empty
  - In DevTools Animations panel, set playback to 10% and confirm both keyframes overlap
  - Toggle `prefers-reduced-motion` — crossfade should still work (opacity only, no movement reduction needed)
- **Done when**: True 150ms opacity crossfade between skeleton and message; no visible gap; tests pass; feel check confirms smooth blend