# Decade peek → tray zoom (Self tray GOLD)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Owners:** `TimelineScrubber.tsx` + minimal `GenreExperience` decade URL/state

## Finding

All eras is a horizontal decade summary with peeks. Clicking a peek must zoom into that decade’s internal-scroll tray; Featured / Whisper / era thesis must follow the same decade — not linger on All-eras inspect copy.

## Contract

1. Summary peek / card → `onDecade(decade)` (same path as era tabs).
2. Page `setDecadeUser` marks intentional scrub, clears Featured `lazyArguments`, writes URL `?decade=`.
3. Tray, Featured shelf, Whisper, and era thesis all read `activeDecade` (preferred decade on cold Self; explicit `null` when user chooses All eras).

## Verify

Horror Self → All eras → click a decade peek → tray for that decade; Featured title/thesis updates; Whisper drops “every era”.

## Notes

- Peek cards expose visible “Open tray →” affordance + `data-testid={era-summary-<decade>}`.
- No git in this pass.
