# Tier A: Companion Chat Feature Expansion — Implementation Plan

> **Status:** In Progress
> **Scope:** Phase 1 of feature expansion — critical fixes + quick wins
> **Related:** `docs/audits/companion-chat-re-audit-2026-08-21.md`

## Overview

Ship 5 items that fix the only live defect (#6), prevent data loss (#1), add visual honesty (#4), and provide a quick UX win (Offline Queue). Companion Personas is included but **brand-gated** — @runeforge-brand must sign off before the prompt diffs get written.

## Execution Order

```
#6 (P0) → #1 (P1) → #4 (P1) → Offline Queue (P1) → Personas (P1, brand-gated)
```

## Task 1: #6 Error Recovery Granularity (45 min)

**Owner:** @runeforge-coder  
**Why:** The 6.7% remaining snag rate includes a case where retry-on-empty succeeded but the original "I hit a snag" message persisted in the DB. The client needs to know a retry was attempted so it can show "Lumina is trying again…" instead of a dead-end.

**Files:**
- `server/src/llm/chatService.ts` — add `retryAttempted` to the error ChatEvent
- `server/src/routes/chat.ts` — surface `retryAttempted` in SSE error event
- `client/src/lib/types.ts` — extend `ChatErrorEvent` type
- `client/src/components/chat/ChatThread.tsx` — show "Trying again…" + progress indicator
- `client/src/components/chat/ChatThread.test.tsx` — add test for retry-attempted state

**ChatEvent type extension:**
```ts
export type ChatErrorEvent = {
  type: "error";
  message: string;
  retryAttempted?: boolean;  // NEW — tells client retry-on-empty was tried
  partial?: string;           // NEW — partial text if retry produced something
};
```

**chatService.ts change (line 293-327):**
```ts
// In the retry block, pass retryAttempted=true on error event:
send({ type: "error", message: formatChatLlmError(retryErr, model), retryAttempted: true });
```

**ChatThread.tsx UI:**
- If `error.retryAttempted === true` and `stream?.assistantText` has partial → show "Lumina is trying again…" with spinner + "Retry sends the same request"
- If `error.retryAttempted === false` → existing error block (partial + retry/start fresh)

## Task 2: #1 Multi-Message Persistence (30 min)

**Owner:** @runeforge-coder  
**Why:** If the user refreshes mid-stream, all partial response text is lost. Need checkpoint persistence.

**Files:**
- `client/src/hooks/useChat.ts` — add localStorage snapshot on tokenBuffer flush
- `client/src/lib/keys.ts` — add `STREAM_SNAPSHOT_KEY`

**Implementation:**
```ts
// In useChat.ts, wire tokenBuffer.flush to localStorage:
tokenBuffer.onFlush((text: string) => {
  if (conversationId) {
    localStorage.setItem(STREAM_SNAPSHOT_KEY(conversationId), text);
  }
});

// On ChatThread mount, if snapshot exists and last message is incomplete:
const snapshot = localStorage.getItem(STREAM_SNAPSHOT_KEY(conversationId));
if (snapshot && !lastMessageComplete) {
  setStreamedText(snapshot);
}
```

## Task 3: #4 Tool Attribution in Waveform (30 min)

**Owner:** @runeforge-coder + @runeforge-designer  
**Why:** WaveformSkeleton shows generic bars during tooling. Should reflect the active tool (search_tmdb = ripple, add_to_library = pulse, etc.).

**Files:**
- `client/src/components/chat/ChatThread.tsx` — lift `stream.steps` into component scope (already available)
- `client/src/components/chat/WaveformSkeleton.tsx` — accept `activeTool?: string` prop
- `client/src/components/chat/WaveformSkeleton.test.tsx` — test tool-specific bar behavior

**Changes:**
```tsx
// WaveformSkeleton.tsx
export function WaveformSkeleton({ 
  phase, 
  activeTool 
}: { 
  phase: ...;
  activeTool?: string;
}) {
  const barStyle = useMemo(() => {
    if (phase === "tooling" && activeTool) {
      switch (activeTool) {
        case "search_tmdb": return "ripple";
        case "add_to_library": return "pulse";
        case "get_title_details": return "wave";
        default: return "ripple";
      }
    }
    return "standard";
  }, [phase, activeTool]);
  
  // Pass barStyle to motion.span for variant selection
}
```

```tsx
// ChatThread.tsx — pass active tool from stream.steps
<WaveformSkeleton 
  phase={stream?.phase ?? "thinking"} 
  activeTool={stream?.steps?.[stream.steps.length - 1]?.name}
/>
```

## Task 4: Offline Queue (60 min)

**Owner:** @runeforge-coder  
**Why:** Users send messages offline; they should queue and replay on reconnect.

**Files:**
- `client/src/hooks/useOfflineQueue.ts` — NEW hook (service worker + IndexedDB)
- `client/src/components/chat/ChatDock.tsx` — integrate offline detection

## Task 5: Companion Personas (BRAND-GATED) — HOLD

**Owner:** @runeforge-brand + @runeforge-coder  
**Status:** AWAITING BRAND SIGN-OFF

Persona system prompt diffs:
1. **Critic** — harsh, discerning, focuses on craft over entertainment
2. **Enthusiast** — upbeat, finds joy in everything, "this rules!" energy
3. **Minimalist** — one rec only, no padding, get-in-get-out
4. **Curator** — contextual, "people who watched X also watched Y"

**Blocker:** @runeforge-brand must approve that these don't dilute Lumina's "single calm knowing presence" identity before any prompts are written.

## Verification

- [ ] `npx vitest run --root client src/components/chat/` — all pass
- [ ] `npx tsc --noEmit --project server/tsconfig.json` — clean
- [ ] `npx tsc --noEmit --project client/tsconfig.json` — clean
- [ ] Full client suite: 372/410 (38 pre-existing GenreExperience)
- [ ] Server: 141/142 (1 pre-existing cache-key)

## Notes

- #3 (Tool attribution) needs the `stream.steps` type lifted to `ChatThread`'s `AssistantTurn` — it's already available via `useChat` return, just needs to be threaded as a prop
- Offline Queue uses `navigator.onLine` + IndexedDB — no external deps
- Personas are a system prompt swap only — no UI changes needed until @brand approves
