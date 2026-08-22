# Lumina Companion Chat — Comprehensive Re-Audit (2026-08-21)

**Audit Standards:** `improve-animations` (Emil Kowalski philosophy), `accessibility-compliance` (WCAG 2.2 AA), `review-animations`, `ui-ux-pro-max` (design intelligence), `copywriting`  
**Scope:** All companion chat surface files — `ChatThread.tsx`, `ChatDock.tsx`, `SparkAvatar.tsx`, `WaveformSkeleton.tsx`, `MessageBubble.tsx`, `SuggestionCards.tsx`, `theme.css`, `motion.ts`  
**Severity Scale:** HIGH (feel-breaking), MEDIUM (noticeably off), LOW (polish)

---

## Executive Summary

The companion chat is **shipped and verified** — raw JSON leak is dead, phase-driven skeleton is live, error recovery works, model quality improved from 40.5% to 6.7% problematic responses. However, the "final state" is **not impeccable**. Four HIGH-severity animation findings, three MEDIUM accessibility gaps, and copy tightness opportunities remain.

---

## Findings Table (Ordered by Leverage)

| # | Severity | Category | Location | Finding | Fix Summary |
|---|----------|----------|----------|---------|-------------|
| **1** | **HIGH** | **Easing & Duration** | `theme.css:80-88`, `464-480`, `SparkAvatar.tsx:313-319` | **`ease-in-out` / `easeInOut` on UI entrances** — `pulseSoft`, `dust-drift`, `constellation-breathe`, idle breathing, writing pulse, error pulse all use `ease-in-out` (slow start). On UI entrances this delays the moment the user watches most. | Replace with `EASE_OUT_EXPO` (`cubic-bezier(0.22, 1, 0.36, 1)`) for all entrances. Reserve `ease-in-out` only for on-screen movement/morphing. |
| **2** | **HIGH** | **Easing & Duration** | `WaveformSkeleton.tsx:31` | **Weak built-in easing** — uses `"easeOut"` (CSS built-in). Built-in easings are too weak for deliberate motion; plans should use strong custom curves. | Use `EASE_OUT_EXPO` from `lib/motion.ts` — already a token in the codebase. |
| **3** | **HIGH** | **Performance** | `SparkAvatar.tsx:340-348`, `317-319` | **CSS animation on layout-adjacent element** — `error-pulse` driven by `data-error-pulse` attribute + CSS `@keyframes` on wrapper `span`. Forces style recalc on parent wrapper every frame. Comment at line 345-347 acknowledges this but fix is incomplete — pulse still uses CSS animation via attribute, not Framer Motion. | Move pulse to Framer Motion on `StarCore` (GPU-only opacity). Remove CSS `animation` on wrapper. Use `EASE_OUT_EXPO` or `steps(10, end)` for long opacity-only pulse. |
| **4** | **HIGH** | **Accessibility** | `ChatDock.tsx:133-144` | **Ungated hover animation** — `whileHover={{ scale: 1.06 }}` on FAB is Framer Motion prop, fires on touch (tap = hover on iOS). Must gate behind `@media (hover: hover) and (pointer: fine)`. CSS `.fab-toggle:hover` at `theme.css:341-346` IS correctly gated, but the FAB uses `whileHover` instead. | Replace `whileHover` with `whileTap` for touch, or gate Framer Motion hover via `isHovered` check. Prefer `whileTap` + CSS hover for true hover devices. |
| **5** | **MEDIUM** | **Easing & Duration** | `SparkAvatar.tsx:313-319` | **Idle/writing/error core transitions use `easeInOut` (3.2s, 1.1s, 2.4s)** — same slow-start issue as finding #1. These are state-change animations, not entrances, but the AUDIT.md says `ease-in-out` is for *on-screen movement/morphing*, not state pulses. | Use `EASE_STATE` (`cubic-bezier(0.4, 0, 0.2, 1)`) for state transitions. Reserve `EASE_OUT_EXPO` for entrances. |
| **6** | **MEDIUM** | **Accessibility** | `theme.css:121-132` | **Reduced motion nukes ALL animations** — universal `*` selector sets `animation-duration: 0.01ms !important`. AUDIT.md: "Reduced motion means fewer and gentler animations, **not zero** — keep transitions that aid comprehension, remove position changes." | Refine: keep opacity/color transitions (150-200ms), drop only transform/position animations. Use selector scoping (`.animate-*`), not universal `*`. |
| **7** | **MEDIUM** | **Cohesion & Tokens** | `theme.css:49-51` vs `SparkAvatar.tsx:313-319` | **Duplicated easing tokens** — `--ease-loop-weak` = `ease-in-out` equivalent, but `SparkAvatar` hardcodes `"easeInOut"` / `"linear"` strings instead of using `EASE_OUT_EXPO` / `EASE_STATE` tokens. `--ease-state` exists but unused in core transitions. | Consolidate: use `EASE_OUT_EXPO` for entrances, `EASE_STATE` for state changes. Remove hardcoded easing strings. |
| **8** | **MEDIUM** | **Accessibility** | `SparkAvatar.tsx:336` | **`role="img"` + `aria-label` on presence indicator** — the avatar is decorative presence, not informative content. Screen readers will announce "Lumina is present" constantly during streaming. Should be `aria-hidden="true"` with live region in ChatThread for state changes. | Remove `role="img"` and `aria-label` from `SparkAvatar`. Use `sr-only` live region in `ChatThread` (already exists at line 348-354) for state announcements. |
| **9** | **LOW** | **Missed Opportunities** | `ChatThread.tsx:147-176` | **Skeleton→content crossfade incomplete** — `AnimatePresence` has `exit={{opacity: 0, transition: {duration: 0.15}}}` on skeleton, but message enters with `initial={{opacity: 0, y: -4}}`. No *shared* crossfade — they don't overlap. A brief 150ms opacity overlap would bridge the two states. | Add `mode="wait"` to `AnimatePresence` so exit and enter overlap, or increase exit duration to 0.3s and add `delay: 0.15` to enter for true crossfade. |
| **10** | **LOW** | **Missed Opportunities** | `SparkAvatar.tsx:176-185` | **Comet `caret-trail` uses `easeInOut` for cadence animation** — line 182: `ease: "easeInOut"`. AUDIT.md: "spring/physics-based curves over linear or cubic-bezier for natural feel on alive elements." | Switch comet cadence to spring: `{type: "spring", stiffness: 200, damping: 20}` for organic feel. |
| **11** | **LOW** | **Cohesion** | `SparkAvatar.tsx:297` | **Idle breathing opacity range too narrow** — `[0.88, 1, 0.88]` (12% swing). Barely perceptible. AUDIT.md suggests wider breath for "alive" feel. | Widen to `[0.8, 1, 0.8]` (20% swing) or add subtle `scale: [1, 1.02, 1]` alongside. |
| **12** | **LOW** | **Performance** | `SuggestionCards.tsx:105-109` | **Spring on hover for list items** — `whileHover` with `type: "spring", stiffness: 300, damping: 25` on up to 6 cards. If all hover simultaneously, 6 springs on main thread. Acceptable for "tens of times/day" but could be CSS transition. | Acceptable. Optional: reduce stiffness to 200 or use CSS `transition: transform 0.2s var(--ease-state)` for lower budget. |
| **13** | **LOW** | **Missed Opportunities** | `MessageBubble.tsx:169-179` | **Streaming composer caret removed** — old blinking caret replaced by `WaveformSkeleton`. Good. But `MarkdownMessage` has no token-by-token reveal animation (Streamdown handles parsing). No feel-check needed. | ✅ Resolved — waveform skeleton is the right pattern. |
| **14** | **LOW** | **Cohesion** | `ChatDock.tsx:61-64` | **Modal enter/exit `scale: 0.97`** — AUDIT.md says modals are EXEMPT from trigger-origin rule. `scale(0.97)` from center is correct for dialogs. Duration 0.22s within 200-500ms modal budget. | ✅ Correct — no change needed. |

---

## Verified Correct Patterns ✅

| Pattern | Location | Why It's Correct |
|---------|----------|------------------|
| Modal enter/exit from center (`scale: 0.97`) | `ChatDock.tsx`, `AddModal`, `CompanionPanel` | Modals are exempt from trigger-origin rule (AUDIT.md) |
| `useSpring` + `useTransform` for scroll-reactive compression | `ChatDock.tsx:48-51` | Spring is interruptible, GPU-only (scale/opacity) |
| `stagger60` (60ms stagger) for poster dealing | `SuggestionCards.tsx`, `motion.ts` | 30-80ms stagger range per AUDIT.md |
| `EASE_OUT_EXPO` token used for entrances | `motion.ts`, `ChatDock`, `CompanionPanel` | Strong custom ease-out = correct |
| `prefers-reduced-motion` respected via `useReducedMotion()` | `SparkAvatar`, `WaveformSkeleton`, `SuggestionCards` | Branches to static/opaque states correctly |
| GPU-only properties (`transform`, `opacity`, `filter`) | `SparkAvatar`, `WaveformSkeleton` | No layout-triggering properties animated |
| `AnimatePresence` for mount/unmount | `ChatDock`, `ChatThread`, `CompanionPanel` | Proper enter/exit handling |
| `offsetPath` for comet orbit | `SparkAvatar.tsx:196` | Creative GPU-only path animation |
| Error whisper silent (`error: ""`) | `SparkAvatar.tsx:51` | System copy owns failure notice; companion voice reserved for operational presence |

---

## Copy Audit (Current Strings on Disk)

| String | Location | Assessment |
|--------|----------|------------|
| `"I know your library, and I never spoil. What are we looking for?"` | `ChatThread.tsx:415` | **W4 — Strong.** Honest companion voice, keeps spoiler promise, verifiable claim. |
| `"Lumina stopped mid-response. What's above is saved — nothing lost."` | `ChatThread.tsx:519` | **Good.** Specific about what's preserved. |
| `"The response above is yours. Retry sends the same request."` | `ChatThread.tsx:524` | **Excellent.** Tells user exactly what Retry does. |
| `"Something went wrong on our end. Try again?"` | `ChatThread.tsx:520` | **Weak.** Generic. Could say "Lumina couldn't finish that response. Try again?" |
| `"Up late, I see." / "Good morning." / etc.` | `ChatThread.tsx:27-35` | **Charming.** Time-aware greeting works. |
| `"I kept your slow-burn list warm."` | `ChatThread.tsx:409` | **Strong.** Specific to dormant users, implies memory. |
| `"Ask about anything you've watched — or should watch…"` | `ChatThread.tsx:587` | **Good.** Invites both archive + discovery queries. |
| `"Lumina is waking…" / "thinking…" / "Reaching into your library…" / "Composing…"` | `ChatThread.tsx:97-110` | **Strong.** Specific phase labels, not generic "thinking". |
| `idle: ""` / `thinking: "considering…"` / `tooling: "reaching into your library…"` / `writing: "composing…"` / `error: ""` | `SparkAvatar.tsx:46-52` | **Correct.** Silent idle/error, specific operational whispers. |

**Copy Recommendation:** Tighten the no-partial error fallback from `"Something went wrong on our end. Try again?"` → `"Lumina couldn't finish that response. Try again?"` (keeps companion as subject, honest about failure).

---

## Model Quality Note

The 30-query post-fix verification showed **6.7% snag rate** (2/30) — both edge cases:
1. 30s timeout on complex discovery → retry succeeded but original snag persisted in DB
2. Retry returned 25-char response → fell through to snag fallback

**Backend fix needed:** Retry path should surface retry result as persisted message, not fire snag fallback when retry partially succeeds. This is a server-side fix (`chatService.ts`), not UI.

---

## Immediate Action Items (Top 5 by Leverage)

| Priority | Finding | Files | Effort |
|----------|---------|-------|--------|
| **P1** | Fix `ease-in-out` → `EASE_OUT_EXPO` on all entrance keyframes | `theme.css` (4 keyframes), `SparkAvatar.tsx` (3 core transitions) | 1 file + 1 file |
| **P2** | Move `error-pulse` to Framer Motion on `StarCore` | `SparkAvatar.tsx` | 1 file |
| **P3** | Gate FAB hover animation (replace `whileHover` with `whileTap`) | `ChatDock.tsx` | 1 file |
| **P4** | Refine reduced-motion to keep opacity/color transitions | `theme.css` | 1 file |
| **P5** | Add true skeleton→content crossfade in `ChatThread` | `ChatThread.tsx` | 1 file |

---

## Implementation Plans (Self-Contained)

### Plan 1: Fix Easing Curves on All Entrances (HIGH)
**Files:** `theme.css`, `SparkAvatar.tsx`  
**Target Values:** `EASE_OUT_EXPO` = `cubic-bezier(0.22, 1, 0.36, 1)`  
**Scope:** 
- `theme.css`: `@keyframes pulseSoft`, `dust-drift`, `constellation-breathe` — change `var(--ease-loop-weak)` → `var(--ease-out-expo)` (or `EASE_OUT_EXPO` inline)
- `SparkAvatar.tsx`: idle (line 313), writing (line 315), error (line 317) core transitions — change `ease: "easeInOut"` → `ease: EASE_OUT_EXPO`
- `WaveformSkeleton.tsx`: already uses `EASE_OUT_EXPO` ✅

### Plan 2: Move Error Pulse to Framer Motion (HIGH)
**File:** `SparkAvatar.tsx`  
**Scope:** 
- Remove `data-error-pulse` attribute from root span (line 334)
- Remove CSS dependency on `[data-error-pulse="true"]` (if any in theme.css)
- Add Framer Motion `animate={{ opacity: [0.7, 1, 0.7] }}` with `transition={{ duration: 2.4, repeat: Infinity, ease: EASE_OUT_EXPO }}` to `StarCore` when `state === "error"`
- Keep `filter: grayscale(0.85)` on wrapper (GPU filter, not layout)

### Plan 3: Gate FAB Hover Animation (HIGH)
**File:** `ChatDock.tsx`  
**Scope:**
- Remove `whileHover={{ scale: 1.06 }}` from FAB `motion.button` (line 138)
- Keep `whileTap={{ scale: 0.94 }}` (line 138) — press feedback is correct
- CSS `.fab-toggle:hover` at `theme.css:341-346` already correctly gated behind `@media (hover: hover) and (pointer: fine)` — this handles true hover devices

### Plan 4: Refine Reduced Motion (MEDIUM)
**File:** `theme.css`  
**Scope:**
- Replace universal `*` selector with scoped approach:
  ```css
  @media (prefers-reduced-motion: reduce) {
    /* Drop position/transform animations only */
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
    /* KEEP opacity/color transitions for comprehension */
    * {
      transition-property: opacity, color, background-color, border-color !important;
      transition-duration: 200ms !important;
      transition-timing-function: var(--ease-state) !important;
    }
    /* Exception: allow transform on specific elements that need it for comprehension */
    .keep-transform-transition {
      transition-property: transform, opacity, color, background-color, border-color !important;
    }
  }
  ```
- Add `.keep-transform-transition` to skeleton bars and other comprehension-aiding transforms

### Plan 5: Skeleton→Content Crossfade (LOW)
**File:** `ChatThread.tsx`  
**Scope:**
- Change `AnimatePresence` to `mode="wait"` (line 147) so exit and enter overlap
- Increase skeleton exit duration to `0.3s` (line 154)
- Add `delay: 0.15` to message enter transition (line 167)
- Result: 150ms true crossfade where both states coexist

---

## Recommended Execution Order

1. **Plan 1** (easing) → 2 (error pulse) → 3 (FAB hover) → 4 (reduced motion) → 5 (crossfade)
2. Plans 1-3 are independent and can run in parallel
3. Plan 4 depends on Plan 1 (uses same easing tokens)
4. Plan 5 independent

---

## Status

| Plan | Status |
|------|--------|
| 1. Easing curves | ⬜ Not started |
| 2. Error pulse Framer Motion | ⬜ Not started |
| 3. FAB hover gate | ⬜ Not started |
| 4. Reduced motion scope | ⬜ Not started |
| 5. Skeleton crossfade | ⬜ Not started |
| Copy tightening (error fallback) | ⬜ Not started |
| Model quality snag persistence fix | ⬜ Backend (separate) |

---

*Audit timestamp: 2026-08-21*  
*Commit: `51f754d` (latest verified ship)*