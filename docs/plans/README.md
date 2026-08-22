# Animation & UX Improvement Plans — Companion Chat Re-Audit

**Audit Commit**: `51f754d`  
**Audit Date**: 2026-08-21  
**Total Plans**: 6 (4 HIGH, 1 MEDIUM, 1 LOW)

---

## Plan Index

| # | Title | Severity | Category | Status | Files | Depends On |
|---|-------|----------|----------|--------|-------|------------|
| 001 | Fix Easing Curves on All Entrances | HIGH | Easing & Duration | ⬜ TODO | `theme.css`, `SparkAvatar.tsx` | — |
| 002 | Move Error Pulse to Framer Motion on StarCore | HIGH | Performance | ⬜ TODO | `SparkAvatar.tsx` | 001 (easing tokens) |
| 003 | Gate FAB Hover Animation | HIGH | Accessibility | ⬜ TODO | `ChatDock.tsx` | — |
| 004 | Refine Reduced Motion | MEDIUM | Accessibility | ⬜ TODO | `theme.css`, `WaveformSkeleton.tsx` | 001 (easing tokens) |
| 005 | Add Skeleton→Content Crossfade | LOW | Missed Opportunities | ⬜ TODO | `ChatThread.tsx` | — |
| 006 | Tighten Error Copy (No-Partial Fallback) | LOW | Copy / UX | ⬜ TODO | `ChatThread.tsx` | — |

---

## Execution Order (Recommended)

### Phase 1 — Independent HIGH (can run in parallel)
1. **001** Fix Easing Curves — establishes `EASE_OUT_EXPO` usage
2. **003** Gate FAB Hover — pure removal, no dependencies
3. **006** Tighten Error Copy — pure string change, no dependencies

### Phase 2 — Dependent on 001
4. **002** Move Error Pulse to Framer Motion — uses `EASE_OUT_EXPO` from 001
5. **004** Refine Reduced Motion — uses `--ease-state` / `--ease-out-expo` tokens from 001

### Phase 3 — Independent LOW
6. **005** Add Skeleton→Content Crossfade — independent, UX polish

---

## Status Tracker

| Plan | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 001 | ⬜ TODO | — | — | |
| 002 | ⬜ TODO | — | — | Wait for 001 |
| 003 | ⬜ TODO | — | — | |
| 004 | ⬜ TODO | — | — | Wait for 001 |
| 005 | ⬜ TODO | — | — | |
| 006 | ⬜ TODO | — | — | |

---

## Verification Checklist (Per Plan)

Each plan must pass:
- [ ] **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- [ ] **Feel check**: Documented in each plan (slow motion, frame-by-frame, real device for gestures)
- [ ] **No regressions**: Full client test suite (372/410) unchanged (38 pre-existing GenreExperience failures)

---

## Post-Plan Reconciliation

After all plans complete:
1. Run `improve-animations reconcile` to mark plans DONE and refresh file:line references
2. Update this README with actual completion timestamps
3. Run full `review-animations` against the final diff
4. Update Aetherkeep with final state

---

*Generated from audit: `docs/audits/companion-chat-re-audit-2026-08-21.md`*  
*Commit: `51f754d`*