# Review package — Tasks 3–5 (no git; uncommitted working tree)

Reviewers: do NOT run git. Read the files listed. Write-only report to the path given in your dispatch. Do not mutate the working tree.

## Task 3–4 files
- `client/src/components/chat/ChatThread.tsx` — welcomePosters prop + strip; error banner contract; live AssistantTurn `companionState={error ? "error" : ...}`
- `client/src/components/chat/ChatThread.test.tsx` — Task 2 kept; Task 3 error describe; Task 4 welcome describe
- `client/src/components/chat/useChat.ts` — `hadError` skip finishTurn; conversation-id effect `setStream(null)` when `!inFlightRef.current`

## Task 5 files
- `client/src/components/chat/SparkAvatar.tsx` — idle opacity breath; Comet caret-trail + animate(cadence); error-pulse on size wrapper
- `client/src/components/chat/SparkAvatar.test.tsx` — Task 5 describe block
- `client/src/theme.css` — `@keyframes error-pulse` after pulseSoft

## Known implementer concerns (verify, do not rubber-stamp)
- Vitest never ran (shell hook). Treat TDD RED/GREEN as unverified.
- ChatThread tests mock useChat — keep-stream path is production-only.
- Secondary error line uses `text-mist-300` (plan snippet said `text-mist-400/70`).
- caret-trail glow uses rgba instead of GOLD_SOFT in the bright stop.
- Idle breathing test asserts `data-animating`, not opacity keyframes.
