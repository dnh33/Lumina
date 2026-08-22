# 004 — Refine Reduced Motion (Keep Opacity/Color Transitions)

- **Status**: DONE (commit 54e7533)
- **Commit**: 51f754d
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (theme.css)

## Problem

**Reduced motion nukes ALL animations** — universal `*` selector sets `animation-duration: 0.01ms !important`. AUDIT.md: "Reduced motion means fewer and gentler animations, **not zero** — keep transitions that aid comprehension, remove position changes."

**Location & Current Code:**

```css
/* theme.css:121-132 — current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    /* Keep opacity + color transitions for comprehension cues */
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: 200ms !important;
    transition-timing-function: ease-out !important;
    scroll-behavior: auto !important;
  }
}
```

The comment says "Keep opacity + color transitions for comprehension cues" but the universal `*` selector with `animation-duration: 0.01ms !important` kills **all** CSS animations, including the skeleton shimmer (which is a comprehension cue — it tells the user content is loading). The `transition-property` override only affects CSS `transition`, not `animation`.

## Target

Refine to: drop position/transform animations, keep opacity/color transitions, allow comprehension-aiding animations (skeleton shimmer, pulse soft).

```css
/* theme.css — target */
@media (prefers-reduced-motion: reduce) {
  /* Drop position/transform animations only */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    /* Allow transform/position animations to be dropped via specific classes */
  }
  
  /* KEEP opacity/color transitions for comprehension */
  * {
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: 200ms !important;
    transition-timing-function: var(--ease-state) !important;
  }
  
  /* Exception: comprehension-aiding animations keep running */
  .skeleton::after,
  .animate-pulse-soft,
  .dust-mote,
  .constellation-web {
    animation-duration: var(--animation-duration, 2s) !important;
    animation-iteration-count: infinite !important;
  }
  
  /* Exception: elements that need transform for comprehension */
  .keep-transform-transition {
    transition-property: transform, opacity, color, background-color, border-color !important;
  }
  
  scroll-behavior: auto !important;
}
```

And add `.keep-transform-transition` to `WaveformSkeleton` bars and other comprehension-aiding transforms.

## Repo Conventions to Follow

- **Exemplar**: `SparkAvatar.tsx` uses `useReducedMotion()` and branches to static states correctly (lines 283-284, 119-134, etc.) — JS-side handling is correct
- **Exemplar**: `WaveformSkeleton.tsx` uses `useReducedMotion()` and branches animate values (lines 5-6, 23-27) — correct
- CSS-side should match: keep comprehension animations, drop decorative movement
- `--ease-state` token (`cubic-bezier(0.4, 0, 0.2, 1)`) for transition timing

## Steps

1. **theme.css:121-132** — Replace the universal `@media (prefers-reduced-motion: reduce)` block with the refined version above
2. **WaveformSkeleton.tsx:12-17** — Add `className="keep-transform-transition"` to the `motion.span` wrapper so its height animation (comprehension cue) survives reduced motion
3. **theme.css:211-226** — Add `.keep-transform-transition` to `.skeleton::after` (already has shimmer animation which is comprehension-aiding)
4. Verify `SuggestionCards.tsx` `PosterCard` hover spring (out of scope but note for future)

## Boundaries

- Do NOT change `SparkAvatar.tsx` `useReducedMotion()` branches — JS handling is correct
- Do NOT change `WaveformSkeleton.tsx` `useReducedMotion()` branches — JS handling is correct
- Only CSS `@media (prefers-reduced-motion: reduce)` block
- Do NOT remove reduced-motion support — refine it

## Verification

- **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- **Feel check**:
  - Enable `prefers-reduced-motion` in DevTools Rendering panel
  - Open chat — skeleton shimmer should STILL animate (comprehension cue)
  - `pulseSoft` on passive elements should still pulse gently
  - `SparkAvatar` idle breathing should reduce to static (JS handles this)
  - `WaveformSkeleton` bars should still animate height (with `.keep-transform-transition`)
  - `dust-drift` and `constellation-breathe` should reduce to static (decorative)
  - No layout shift or broken states
- **Done when**: Reduced motion keeps comprehension animations (skeleton, pulseSoft), drops decorative movement (dust, constellation), no layout breaks; tests pass