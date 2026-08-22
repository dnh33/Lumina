# 003 — Gate FAB Hover Animation (Replace whileHover with whileTap)

- **Status**: DONE (commit 54e7533)
- **Commit**: 51f754d
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 file (ChatDock.tsx)

## Problem

**Ungated hover animation on FAB** — `whileHover={{ scale: 1.06 }}` on Framer Motion `motion.button` fires on touch (tap = hover on iOS). AUDIT.md: "Hover animations are gated behind `@media (hover: hover) and (pointer: fine)`."

**Location & Current Code:**

```tsx
// ChatDock.tsx:133-144 — current
<motion.button
  type="button"
  onClick={() => setOpen((o) => !o)}
  data-cuelume-hover="whisper"
  data-cuelume-toggle="toggle"
  whileTap={{ scale: 0.94 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
  whileHover={{ scale: 1.06 }}  // <-- FIRES ON TOUCH
  aria-label={open ? "Close Lumina chat" : "Talk to Lumina"}
  aria-expanded={open}
  title="Talk to Lumina"
  className="fab-toggle fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 shadow-[0_10px_36px_-6px_rgba(232,184,75,0.55)] md:bottom-8 md:right-8"
>
```

The `whileHover` prop in Framer Motion fires on `pointerenter` which maps to touch on iOS — a tap triggers the hover state. This is a false-positive hover.

Meanwhile, `theme.css:341-346` correctly gates the CSS hover:

```css
/* theme.css:341-346 — already correct */
@media (hover: hover) and (pointer: fine) {
  .fab-toggle:hover {
    scale: 1.06;
    transition: scale 0.2s var(--ease-state);
  }
}
```

But the FAB uses `motion.button` with `className="fab-toggle"` — the Framer Motion `whileHover` takes precedence over the CSS `:hover` (or both fire, causing double-animation).

## Target

Remove Framer Motion `whileHover` from FAB. Keep `whileTap` for press feedback. Rely on CSS `:hover` (correctly gated) for true hover devices.

```tsx
// ChatDock.tsx — target
<motion.button
  type="button"
  onClick={() => setOpen((o) => !o)}
  data-cuelume-hover="whisper"
  data-cuelume-toggle="toggle"
  whileTap={{ scale: 0.94 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
  // whileHover REMOVED
  aria-label={open ? "Close Lumina chat" : "Talk to Lumina"}
  aria-expanded={open}
  title="Talk to Lumina"
  className="fab-toggle fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 shadow-[0_10px_36px_-6px_rgba(232,184,75,0.55)] md:bottom-8 md:right-8"
>
```

The CSS at `theme.css:341-346` handles hover scale on true hover devices.

## Repo Conventions to Follow

- **Exemplar**: `theme.css:341-346` already correctly gates hover with `@media (hover: hover) and (pointer: fine)` — this is the pattern to follow
- **Exemplar**: `SuggestionCards.tsx:105-109` uses `whileHover` with `reduce` check — but that component should also be audited (out of scope for this plan)
- Framer Motion `whileTap` for press feedback is correct (line 138)
- Spring config `{ type: "spring", stiffness: 300, damping: 25 }` for tap is correct

## Steps

1. **ChatDock.tsx:138** — Remove `whileHover={{ scale: 1.06 }}` from `motion.button`
2. **Verify** CSS `.fab-toggle:hover` at `theme.css:341-346` handles hover scale on true hover devices

## Boundaries

- Do NOT change `theme.css:341-346` — already correct
- Do NOT change `whileTap` or `transition` — press feedback is correct
- Do NOT change `SuggestionCards.tsx` hover spring — separate audit item
- Only the FAB `whileHover` removal

## Verification

- **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- **Feel check**:
  - On touch device (or DevTools touch emulation): tap FAB — should scale to 0.94 (press), NO hover scale to 1.06
  - On desktop with mouse: hover FAB — should scale to 1.06 smoothly via CSS transition
  - On desktop: click FAB — should scale to 0.94 (press) then open dock
  - In DevTools Animations panel, verify no Framer Motion hover animation fires on touch emulation
- **Done when**: `whileHover` removed from FAB; CSS hover works on desktop; no hover animation on touch; tests pass