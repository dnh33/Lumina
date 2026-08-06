# Worlds Packing — Accessibility Notes

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Scope:** Keyboard + focus + ARIA for Mode-split HUD (Self/Guided flip, timeline tray, claim cockpit, map Enter).  
**Ownership:** Surgical aria/focus only — no GenrePicker / tray / Guided desk layout rewrites.

## P0 fixed (this pass)

| Surface | Gap | Fix |
|---------|-----|-----|
| Session chrome | Mode flip not announced | `role="status"` + `aria-live="polite"` (`data-testid="mode-announce"`) |
| Session chrome | Mode/media already had focus rings (orchestrator sticky chrome) | Left in place; announce added |
| Whisper | Filter / guided cue silent to AT | `role="status"` + `aria-live="polite"` on WhisperStrip |
| Timeline tabs | Prev/Next inside `tablist` (invalid) | Arrows moved outside; tablist = tabs only |
| Timeline tabs | No arrow-key pattern; all tabs in tab order | Roving `tabIndex` + Arrow/Home/End handler |
| Timeline tray | Scroll region not keyboard-focusable | `tabIndex={0}` + labelled `role="region"`; rail as `tabpanel` |
| All-eras summary | Horizontal scroller not focusable; cards weak names | Focusable list + per-era `aria-label` |
| Decade status | Selection change silent | Status line `aria-live="polite"` |
| Guided dials | Exclusive choices as toggle buttons | `radiogroup` / `radio` + `aria-checked` |
| Guided dials | Focus lost after answer remount | Restore focus to next dial / complete block |
| Map nodes | SVG `<a>` Enter/Space present; tabIndex explicit | `tabIndex={0}` on territory nodes |
| Map SVG (hub follow-up) | `role="img"` hid interactive markers from AT | Removed; atlas `role="group"` + focus halo — see `2026-08-06-hub-map-keyboard-a11y.md` |
| Seam crash | Dangling `AnchorFrame` (import already gone) | Removed JSX so page can load for a11y QA |

## P1 remaining

| ID | Surface | Issue | Owner hint |
|----|---------|-------|------------|
| P1-1 | Guided needle ticks | Unanswered “Up next” ticks are non-interactive text — fine as progress, but no skip-to-active-dial link from needle | Guided sibling |
| P1-2 | Guided dial radios | ~~Arrow-key roving inside `radiogroup`~~ → **DONE Wave 3** (Arrow/Home/End + roving tabIndex; APG select-on-move) | Guided |
| P1-3 | Guided complete | “Deepen with Companion” focuses FAB via DOM query — brittle if Companion markup changes | Guided + Companion |
| P1-4 | Timeline summary | ~~`role="list"` + `role="listitem"` on buttons~~ → labelled `role="group"` + plain peek buttons (2026-08-06 peek zoom) | Self tray |
| P1-5 | Timeline tray | ~~long tab path through posters~~ → **DONE Wave 3** (`Skip title tray` → `#after-timeline-tray`) | Self tray |
| P1-6 | Map SVG | Focus ring upgraded to dedicated halo (hub keyboard pass 2026-08-06); HC mode still worth a glance | Hub sibling |
| P1-7 | Map focus strip | Enter CTA + node Enter both navigate — announce focused world in a live region when focus moves across nodes | Hub sibling |
| P1-8 | In-genre Map `<details>` | Summary keyboard OK; opening does not move focus into first node | Wave 4 leave-path |
| P1-9 | Session chrome | Visible “Claim cockpit / Browse instrument” is `sm:block` only — mobile users get announce-only | Orchestrator craft |
| P1-10 | Tag / preset chips | ~~Steer facet focus rings~~ → Narrow summary + chips have `focus-visible` (Wave 3) | Orchestrator seam |
| P1-11 | Featured / modules | Stage re-stage may remount Featured without focus handoff when flipping Self↔Guided | Orchestrator |
| P1-12 | Tests | GuidedTour dial radio + mode-announce unit coverage thin; browser NVDA pass not run | QA |

## Verify checklist (manual)

1. Horror Self — Tab to session chrome → flip Guided → SR hears mode announce; desk mounts.
2. Timeline — Tab to selected decade tab → ArrowLeft/Right changes era; status line updates; tray region focusable; PageUp/Down or arrows scroll tray when focused.
3. Guided — Tab to tempo radios → Enter selects → focus lands on next dial choices.
4. Hub `/genre` — Tab to territory node → Enter navigates; focus strip Enter also works.

## Non-goals

- GenrePicker atlas/mood composition
- Tray max-height / All-eras summary packing geometry
- Guided dial visual polish / stage machine
- Git operations
