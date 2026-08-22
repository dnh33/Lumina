# 009 — Voice I/O Spec: Push-to-Talk + TTS

- **Status**: DRAFT
- **Commit**: 3fa4797 (latest)
- **Severity**: HIGH
- **Category**: Feature Extension
- **Estimated scope**: 2 files + 1 lib install, ~2 hr

## Problem

The user asked for "super cool for movies/tvshows" capabilities. Among the tool-ui
patterns extracted, **voice input (push-to-talk) + voice output (TTS)** would make
Lumina feel like a true boutique-cinema companion — summon it by holding a mic
button, get spoken recommendations read back.

## Target

Two capabilities:

1. **Push-to-Talk (PTT)** — long-press the ChatDock FAB → record via `MediaRecorder`
   → speech-to-text via Web Speech API → transcribe → send as chat message
2. **Text-to-Speech (TTS)** — Lumina's responses can be read aloud via Web Speech API
   `speechSynthesis`, with pause/resume/skip controls

## Stack Analysis

| Requirement | Status |
|-------------|--------|
| `cuelume` (sound lib) | Installed (`client/package.json`) but UNUSED — not imported anywhere in `client/src/` |
| `playCue` / `initSound` | Do NOT exist in codebase (Hermes message claimed otherwise — unverified) |
| Web Speech API | No usage in codebase. Browser support: Chrome 25+, Safari 7+, Firefox 49+ (desktop) |
| `MediaRecorder` | No usage. Browser support: Chrome 52+, Firefox 57+, Safari 14.4+ |
| `speechSynthesis` | No usage. Browser support: Chrome 33+, Safari 7+, Firefox 49+ |

## Browser Support Matrix (Web Speech API)

| Browser | SpeechRecognition | speechSynthesis | MediaRecorder |
|---------|-------------------|-----------------|---------------|
| Chrome 100+ | ✅ | ✅ | ✅ |
| Edge 100+ | ✅ (webkit-) | ✅ | ✅ |
| Safari 16+ | ✅ (webkitSpeechRecognition) | ✅ | ✅ |
| Firefox 100+ | ✅ | ✅ | ✅ |
| Mobile Safari 16+ | ✅ | ✅ | ✅ |

**Note:** `SpeechRecognition` requires vendor prefix (`webkitSpeechRecognition` on Safari/Mobile).
`speechSynthesis` is broadly supported.

## Implementation Plan

### Step 1: PTT Hook (`usePushToTalk.ts`)

```typescript
// client/src/hooks/usePushToTalk.ts
export function usePushToTalk() {
  const onResult = (text: string) => void 0; // callback set by useChat
  const isRecording = ref(false);
  
  function start() {
    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition);
    const rec = new SR({ continuous: false, interimResults: true, lang: "en-US" });
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .flatMap(r => Array.from(r))
        .filter(r => r.transcript)
        .map(r => r.transcript)
        .join("");
      onResult(text);
    };
    rec.start();
  }
  
  function stop() { /* abort */ }
}
```

### Step 2: TTS Hook (`useSpeechSynthesis.ts`)

```typescript
export function useSpeechSynthesis(text: string) {
  const speaking = ref(false);
  function speak() {
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
  function pause() { speechSynthesis.pause(); }
  function resume() { speechSynthesis.resume(); }
  function stop() { speechSynthesis.cancel(); }
}
```

### Step 3: ChatDock FAB integration

- Long-press (150ms) → start PTT
- Release → stop PTT, send transcribed text
- On assistant turn → show TTS controls (play/pause/stop) beside message

## Files

1. `client/src/hooks/usePushToTalk.ts` — PTT via Web Speech API
2. `client/src/hooks/useSpeechSynthesis.ts` — TTS via Web Speech API
3. `client/src/components/chat/ChatDock.tsx` — FAB long-press + TTS button on messages

## Boundaries

- Do NOT use `cuelume` for voice (it's a sound-effect library, not speech)
- Use native Web Speech API only — no external dependencies
- Respect `prefers-reduced-motion` — auto-disable speech animations
- Honor existing `EASE_OUT_EXPO` motion tokens for UI transitions

## Verification

- PTT: long-press FAB → mic records → transcript appears in chat input
- TTS: assistant message → play button → speech reads the response
- Safari: vendor prefix works
- Reduced motion: speech UI disabled
