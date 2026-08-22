# Design — Lumina's take: loading bloom + honest arrival

**Date:** 2026-07-13
**Branch:** improvement-of-luminas-take
**Status:** DRAFT — awaiting execution sign-off (not yet committed)
**Supersedes nothing.** Companion to the existing `2026-07-13-luminas-take-enrichment-*` docs; this only touches the *waiting* and *arrival* moments of the already-shipped take surfaces.

## Problem

The "Lumina's take" surfaces — the rail `InsightCard` (`client/src/pages/TitleDetail.tsx:236`) and the expanded `TakeBand` (`:150`) — wait on a single opaque `GET /api/insight` call. While waiting they render `InsightSkeleton` (`:108`), a dead block of `animate-pulse` lines. The companion chat, by contrast, has a living presence: a `SparkAvatar` state machine (`thinking → tooling → writing`), a `sr-only role="status"` live region, and staggered entrance animations.

The bare skeleton reads as "lazy and boring" because it carries **no presence and no signal**. The chat feels alive precisely because it has *truthful* progress feeding the same visual vocabulary.

## Honesty constraint (the load-bearing decision)

The chat's phased richness (`thinking → reaching into your library → composing`) is **real SSE signal**. The take has **no progress stream** — it is one HTTP request. Faking a timed phase timeline on the take would be the gold-plating already rejected on this project: motion without meaning. Therefore this design lifts only the chat's **vocabulary and entrance grammar**, not its **live phases**. A real phased-progress stream is a separate server workstream (deferred, not in scope).

## Goal

Replace the dead skeleton with a living, honest "reading your taste" beat that reuses the companion's real components, and give the resolved take an honest arrival reveal. No server change, no new API, no data migration.

## Lifts (each justified)

### L1 — Loading beat (replaces `InsightSkeleton`)
**What:** A `TakeLoading` presentational component rendering:
- `SparkAvatar state="thinking"` — the chat's own star-core with ripple animation (`client/src/components/chat/SparkAvatar.tsx`).
- A calm, static whisper: *"reading your taste…"* (NOT a timeline — one honest line).
- Reserved height identical to the current skeleton (`min-h-[280px]`) so there is **zero reflow** when the band/card mounts — preserving the fix from the enrichment work that the reflow "broke layout".
- `sr-only` `role="status" aria-live="polite"` text = *"Lumina is reading your taste"* — mirrors `ChatThread.tsx:348`.

**Reuses (already built, tested):** `SparkAvatar`, `useReducedMotion`, the `sr-only` live-region idiom, `WHISPER` copy convention.

**Why it pulls its weight:** Directly fixes the reported complaint; turns the dead wait into Lumina's *presence*. ~15 lines, one new component, no behavior risk.

### L2 — Arrival reveal (replaces instant pop)
**What:** When `insight.data` resolves, the `InsightBody` fades + lifts in with the chat's `messageEnter` variant (`client/src/lib/motion.ts:13`), inside the existing `motion.section` (already framer-driven). Reduced-motion → no transform (`useReducedMotion()` already imported in both `TakeBand` and `InsightCard`).

**Why:** Content *arrived* → it animates. Honest; uses the exact grammar the chat uses for an assistant turn landing.

### L3 — Error / empty parity
**What:** Swap the bare red `<p>` in both loading-error branches (`:209`, `:299`) for the chat's error banner style — `rounded-xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25` with the existing Retry button. The `profileState === "empty"` nudge copy is kept as-is (already good).

**Why:** Trivial visual consistency; the chat establishes this as the house error language.

## Deliberately excluded (YAGNI)
- **Fake phased timeline** ("thinking → retrieving → composing" on timers). No signal — rejected as gold-plating.
- **Tool ribbon on the take.** That surfaces *library writes/reads* during a live chat turn; the take does one read server-side with no stream. Would be decorative.
- **`groundedIn` "considered Arrival, Her…" micro-line.** Genuinely nice and honest, but requires a new server field from `insightService.retrieveLibrary` results. Filed as a distinct server workstream, not here.

## Files touched
- **New:** `client/src/components/TakeLoading.tsx` — presentational loading + (shared) error-banner atom.
- **New:** `client/src/components/TakeLoading.test.tsx` — RTL tests for L1 (SparkAvatar present, status text, reserved height via `aria-busy`).
- **Edit:** `client/src/pages/TitleDetail.tsx` — replace `InsightSkeleton` usages (`:208`, `:298`) with `TakeLoading`; wire `messageEnter` arrival on `insight.data` in `TakeBand` + `InsightCard`; swap error `<p>` for banner.
- **No server files.** No migration.

## Accessibility
- `SparkAvatar` already carries `role="img"` + state aria-label and disables its infinite loops under reduced motion.
- Live region is `sr-only` + `aria-live="polite"` so SR users hear "Lumina is reading your taste" once, not a token flood (mirrors chat).
- Reserved-height invariant kept so the band/card never jumps — preserves the layout-breakage fix.

## Verification (evidence over claims)
- `cd client && npx vitest run TakeLoading` — L1 assertions.
- `cd client && npx vitest run` — full suite still green (no regression to `InsightBody.test.tsx`).
- `npm run typecheck` — `SparkAvatar` prop types satisfied.
- `npm run build` — production bundle compiles.
- Manual: `npm run dev`, open a title, click "Why would I love this?" → observe live SparkAvatar beat (no dead shimmer), then the take arriving with a lift; toggle OS reduced-motion → static core, no transform.
