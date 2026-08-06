# Worlds Guided Companion as DEEPEN HUD

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Scope:** `CompanionPanel` + light `GenreExperience` tourCue wiring  
**Locks:** Mode-split B · game-HUD brief · `.impeccable.md` booth aesthetics  
**No git** (note only)

---

## Roast (live: Horror Guided + Companion open)

| Fail | Evidence |
|------|----------|
| Second scrolling novel | Panel `h-[min(560px,68dvh)]` ≈ **59%** viewport; covered Tonight shelf posters |
| Chatbot lobby chrome | Sparkles + `{metaphor} Companion` + **IN-WORLD** pill — marketing dock, not instrument |
| Tour context invisible | Dial answers lived only in prefill string; HUD showed none |
| Claim cockpit obscured | Floating card sat on shelf / Blade cards while desk was the job |

**Design read:** Guided DEEPEN as GTA-browser-style detail pane for the claim cockpit. Dials: VARIANCE 4 · MOTION 3 · DENSITY 9. Booth lacquer stays; structure densifies.

---

## Pack (guided only)

When `guided=true`:

1. **Geometry** — `h-[min(380px,46dvh)]`, `w-[min(320px,…)]`, `rounded-2xl`, quieter shadow. Page length unchanged (already `position:fixed`); height no longer eats the claim desk.
2. **Chrome** — Header becomes **Deepen** + mono `tour` + `{metaphor} · shelf-bound`. No Sparkles. No IN-WORLD pill.
3. **Tour strip** — Answered dial chips from `guidedSession`; optional live `tourCue` from page Whisper outcome.
4. **Prefill / suggestions** — Shelf-bound copy (“defend tonight’s three”); deepen suggestion cards instead of Self lexicon roam.
5. **FAB** — Slightly smaller; aria “Deepen with…”.

Self Companion + main `/chat` dock: **unchanged** geometry/chrome (presence mark replaces Sparkles on Self header only — still `{metaphor} Companion` + in-world).

`GenreExperience` passes `tourCue={guidedOutcomeCue}` on all three Companion mounts (loading / error / success) so tree position stays C5-stable.

---

## Verify

- Guided open: `data-companion-mode="guided-deepen"`, dial chips when answers exist, desk still readable behind shorter pane.
- Self open: prior novel-sized dock + in-world badge.
- Conversation keys: Self shared / Guided per-world — preserved; `linkGuided` unchanged.
- Vitest: `CompanionPanel.test.tsx` (DEEPEN HUD + tour strip + existing key tests).

---

## Out of scope (this nugget)

- Stage machine forcing DEEPEN only after Claim (Wave 5 packing).
- ChatThread internal density / message typography.
- Parking Self warehouse under Guided (Mode-split B Waves 1–2).
