# Task 5 Review — SparkAvatar presence polish

**Reviewer:** code-reviewer subagent  
**Date:** 2026-08-19  
**Scope:** `SparkAvatar.tsx`, `SparkAvatar.test.tsx`, `theme.css` (read-only; no git, no vitest)  
**Sources:** `task-5-brief.md`, `task-5-report.md`, `review-package-tasks-3-5.md`, implementation files

---

### Spec Compliance

- ✅ **Surgical scope (3 files only)** — changes confined to `SparkAvatar.tsx`, `SparkAvatar.test.tsx`, `theme.css`; no ChatThread edits observed
- ✅ **5a idle opacity breathing** — `SparkAvatar.tsx:296-297` returns `opacity: [0.88, 1, 0.88]` with scale keyframes unchanged
- ✅ **5a transition unchanged** — `SparkAvatar.tsx:310-311` `{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }`
- ✅ **5a reduced-motion idle branch untouched** — `SparkAvatar.tsx:294` static `{ scale: 1, opacity: state === "idle" ? 0.9 : 1 }`
- ✅ **GOLD / GOLD_SOFT constants** — `SparkAvatar.tsx:63-64` `#e8b84b` / `#f2d288` verbatim
- ✅ **5b caret-trail markup + queryable** — `SparkAvatar.tsx:210-217` `data-part="caret-trail"` with brief-specified classes; rendered only when `state === "writing"` (`SparkAvatar.tsx:356`)
- ✅ **5b cadence driven (not dead)** — `SparkAvatar.tsx:176-185` `animate(cadence, 1, { repeat: Infinity, repeatType: "reverse", duration: 1.1 })`
- ✅ **5b useTransform glow** — `SparkAvatar.tsx:170-174` `trailGlow = useTransform(cadence, …)` bound to caret-trail `boxShadow`
- ✅ **5b cadence also drives comet opacity** — `SparkAvatar.tsx:169,195` `trailOpacity` from same `cadence`; no orphaned MotionValue
- ✅ **5b reduced-motion static trail** — `SparkAvatar.tsx:215` static `boxShadow: 0 0 8px ${GOLD}` when `reduce`; element still rendered
- ✅ **5c error-pulse on size wrapper** — `SparkAvatar.tsx:333-345` animation + filter on `span.relative.inline-block`
- ✅ **5c no shake** — `SparkAvatar.tsx:328` `data-shake="false"`; FaultLine unchanged
- ✅ **5c error-pulse keyframe** — `theme.css:87-95` matches brief `{ 0%,100%: 0.9; 50%: 1 }`
- ✅ **5c reduced motion disables pulse** — `SparkAvatar.tsx:341-344` `animation: undefined` when `reduce`; `data-error-pulse="false"`
- ✅ **5c keyframe-only theme.css change** — new `@keyframes error-pulse` after `pulseSoft`; no `@theme` token edits
- ✅ **Test 1 idle breathing** — `SparkAvatar.test.tsx:176-181` asserts `data-animating="true"`
- ✅ **Test 2 writing caret-trail present** — `SparkAvatar.test.tsx:183-187`
- ✅ **Test 3 idle/thinking absent** — `SparkAvatar.test.tsx:189-196`
- ✅ **Test 4 error pulse + no shake + fault-line** — `SparkAvatar.test.tsx:198-212`
- ✅ **Test 5 error reduced motion no pulse** — `SparkAvatar.test.tsx:214-221`
- ✅ **Task 4 describe block preserved** — `SparkAvatar.test.tsx:33-167` intact
- ✅ **setReducedMotion helper used** — `SparkAvatar.test.tsx:28-31,177,214` via `motion-dom` singleton
- ⚠️ **Vitest GREEN unverified** — report confirms shell hook blocked execution; tests not re-run in this review
- ⚠️ **Idle opacity keyframes not directly asserted** — brief marked optional; only `data-animating` checked

---

### Strengths

- Clean surgical diff: all three brief items (5a/5b/5c) implemented in the intended locations without scope creep.
- `cadence` is wired correctly — one MotionValue feeds both comet opacity and caret-trail glow; `useEffect` cleanup stops the loop on unmount.
- Pragmatic jsdom bridge: `data-error-pulse` mirrors the animation condition so error-pulse tests are deterministic without relying on `style.animation` alone.
- Error handling respects reduced motion at the component level (`animation: undefined`) rather than relying solely on global CSS crush.
- Task 5 tests use the established `setReducedMotion` pattern and a focused `sizeWrapper` helper aligned with the DOM structure.

---

### Issues

#### Critical

*(none — confidence ≥ 80)*

#### Important

*(none — confidence ≥ 80)*

#### Minor

- **Bright glow stop uses `rgba(232,184,75,0.6)` instead of `GOLD_SOFT`** (`SparkAvatar.tsx:173`) — functionally fine (same hue as GOLD); slightly diverges from the soft gold register called out in the review package. Confidence ~55; cosmetic only.
- **caret-trail sits under `StarCore` (`z-10`)** — the bar background may be occluded; only `boxShadow` bleed is likely visible. Brief emphasizes "glow sibling," so this may be intentional. Confidence ~70; visual QA recommended.
- **No test for reduced-motion + writing static trail** — brief required the behavior but did not list a test for it; implementation satisfies it (`SparkAvatar.tsx:215`). Confidence ~40 for test-gap concern.
- **Implementer test count off** — report claims 15 tests; file has 12 Task 4 + 5 Task 5 = 17. Documentation only.

---

### Assessment

**Task quality:** Approved  
**Reasoning:** Implementation matches the brief across all three sub-tasks and required assertions; scope and constraints are respected. Vitest pass status remains unverified in-session — Daniel should run the brief command locally before merge.

**Recommended verification:**

```bash
npx vitest run --root client src/components/chat/SparkAvatar.test.tsx
```
