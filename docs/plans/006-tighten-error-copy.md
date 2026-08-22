# 006 — Tighten Error Copy (No-Partial Fallback)

- **Status**: DONE (commit 54e7533)
- **Commit**: 51f754d
- **Severity**: LOW
- **Category**: Copy / UX
- **Estimated scope**: 1 file (ChatThread.tsx)

## Problem

**No-partial error fallback is generic** — `"Something went wrong on our end. Try again?"` doesn't match the companion voice or the specificity of the partial-error copy.

**Location & Current Code:**

```tsx
// ChatThread.tsx:518-525 — current
{stream?.assistantText
  ? "Lumina stopped mid-response. What's above is saved — nothing lost."
  : "Something went wrong on our end. Try again?"}
```

The partial case is excellent — specific, honest, tells user what's preserved. The no-partial case is generic corporate copy.

## Target

Match the companion voice: honest, specific, keeps Lumina as the subject.

```tsx
// ChatThread.tsx — target
{stream?.assistantText
  ? "Lumina stopped mid-response. What's above is saved — nothing lost."
  : "Lumina couldn't finish that response. Try again?"}
```

Rationale:
- Keeps "Lumina" as subject (consistent with phase labels: "Lumina is thinking…", "Lumina is composing…")
- "Couldn't finish" is honest about what happened
- "Try again?" matches the partial case's CTA
- No "on our end" — that's system-speak, not companion voice

## Repo Conventions to Follow

- **Exemplar**: Phase labels in `ChatThread.tsx:97-110` all use "Lumina is..." — consistent voice
- **Exemplar**: SparkAvatar whispers use operational language ("considering…", "reaching into your library…", "composing…") — not apologetic
- Companion voice: calm, specific, never over-promising

## Steps

1. **ChatThread.tsx:520** — Change `"Something went wrong on our end. Try again?"` to `"Lumina couldn't finish that response. Try again?"`

## Boundaries

- Do NOT change the partial-error copy (lines 519, 524) — already excellent
- Do NOT change button labels ("Retry" / "Start fresh") — clear and functional
- Only the no-partial fallback string

## Verification

- **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- **Feel check**:
  - Trigger an error with no partial content (e.g., immediate network failure on send)
  - Read the error block — should feel like the companion speaking, not the system
  - Compare tone to phase labels — consistent voice
- **Done when**: String updated; tests pass; voice consistency verified