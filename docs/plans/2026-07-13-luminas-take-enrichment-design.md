# Lumina's Take — Enrichment & Layout Fix (Design)

> **For Hermes:** Use superpowers + writing-plans to implement. Brainstorm complete (scope approved: **Full enriched take**). This doc is the approved design; the sibling `-plan.md` is the task-by-task build plan.

## Goal

Turn the flat one-paragraph "Lumina's take" into a **structured, retrieval-grounded companion read** that doesn't break the page layout — keeping Lumina's prose voice, adding scannable signals (verdict, taste-match, comparison anchors to *your* titles, a hook, and deep-links into chat), and fixing the three root causes of the layout breakage.

## Problem (verified in code)

Current: `client/src/pages/TitleDetail.tsx` `InsightCard` → `GET /api/insight/:type/:tmdbId` → `server/src/llm/insightService.ts` → `insightPrompt()`. Returns `{ text, cached, model }` — pure prose.

**Blind spots found during grill:**
1. **No RAG retrieval.** The take feeds only the *aggregated* taste profile. `server/src/rag/retrieval.ts` `retrieveLibrary()` (BM25 + rating-scored, used every chat turn) is never called here — so the take never compares you to your *closest neighbors* of this specific title.
2. **No cold-start / thin-profile state.** Prose assumes a rich profile; a new user gets generic text.
3. **No watched-status branch.** Even if you've rated it 4/10, the take still asks "should you watch it?" instead of reading the retrospective.
4. **Dead end.** No next move. Chat uses `lumina-followups` chips; the take has none.
5. **Layout breaks** for 3 concrete reasons:
   - `InsightCard` returns `null` until `health` resolves + user clicks "Why would I love this?" → the rail has no height → reflow jump.
   - The prose `<p>` has no `max-height`/`overflow`; an enriched/long take overflows the 340px right rail and the `auto-fit` grid on the not-in-library branch.
   - `lg:sticky lg:top-6` on the rail + a tall panel = a rail taller than the viewport with no way to reach its own bottom.

## Architecture

**Server (structured output + retrieval):**
- Extend `TitleInsight` with machine-readable signals alongside `text`.
- `insightService.ts` calls `retrieveLibrary(db, <title+genres+director query>, 8)` and passes the top neighbors (with `tmdbId`, `mediaType`, their rating) into the prompt.
- The LLM returns **strict JSON** (verdict, comparisons, hook); `text` stays Lumina's prose but is now grounded in the named neighbors.
- **Follow-up chips are generated server-side** (deterministic, not from the LLM) → reliable deep-links into `/chat`.
- **Tolerant parse:** if the model returns non-JSON or an unsupported shape, degrade gracefully to `{ text: rawText, verdict: "maybe", comparisons: [], followups: default }` so any user-selected OpenRouter model can't break the UI.
- **Backward-compat:** old cached insights (prose only) still parse — UI defaults missing fields.
- **Profile gating:** `profileState` = `empty | thin | rich` (rich = ≥1 loved + ≥1 disliked OR ≥8 rated). When `empty`/`thin`: omit comparisons + `matchScore`, soften prose via prompt instruction, offer a "log a few favorites" hook.

**Client (InsightCard rebuild + layout fix):**
- Card container **always rendered** with a reserved min-height → no rail reflow. Intro CTA / loading / error / content render *inside* it.
- Prose in a **capped, scrollable body** (`max-h` + `overflow-y-auto`) so tall takes stay inside the rail.
- Verdict chip (color-coded: love / maybe / skip / rewatch) + optional `matchScore` ring/number.
- Comparison anchors as `Link`s to `/title/{mediaType}/{tmdbId}`, tagged by relation (echoes / warns / diverges).
- Hook line ("what might win you over").
- Follow-up chips → `navigate('/chat', { state: { prefill } })` (pattern in `Discover.tsx:97`; `ChatThread` re-arms draft on prefill change).
- Rail stops being `sticky` when its content exceeds viewport height (cap panel, let page scroll).

## Data schema (new `TitleInsight`)

```ts
type InsightVerdict = "love" | "maybe" | "skip" | "rewatch";
type InsightRelation = "echoes" | "warns" | "diverges";

interface InsightComparison {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  relation: InsightRelation;
  note: string;            // ≤ 18 words, why it's an anchor
}

interface InsightFollowup {
  label: string;           // ≤ 28 chars, in user's voice
  prefill: string;         // chat prompt (no spoilers)
}

interface TitleInsight {
  text: string;            // Lumina prose (retrieval-grounded)
  verdict: InsightVerdict;
  matchScore: number | null;       // 0-100, null when profile empty/thin
  comparisons: InsightComparison[]; // ≤ 3, empty when profile empty/thin
  hook: string | null;     // "what might win you over" (unwatched) / retrospective nudge (watched)
  followups: InsightFollowup[];     // 1-2, always
  profileState: "empty" | "thin" | "rich";
  cached: boolean;
  model: string;
}
```

## Prompt contract (server)

New `insightPrompt()` returns instructions + JSON schema. System persona reused from `prompts.ts`. User message: taste profile + this title + the retrieved neighbor list (tmdbId/mediaType/rating). LLM must:
- Return **JSON only** (`response_format: json_object` when supported; tolerant parse otherwise).
- `verdict`: `rewatch` if `owned.status` ∈ watched/watching/abandoned and rated; else love/maybe/skip.
- `comparisons`: pick ≤3 neighbors; relation `echoes` (their love → predicts love), `warns` (their low rating/dnf → risk), `diverges` (unlike their usual → stretch). `note` ≤ 18 words.
- `hook`: one sentence, spoiler-safe.
- `text`: 110–170 word prose, references the named comparison titles, no spoilers beyond premise.

## UI states (InsightCard)

| State | Render |
|---|---|
| pre-request | reserved-height card + short explanation + "Why would I love this?" CTA (no rail collapse) |
| loading | reserved-height card + spinner "Reading your taste profile…" |
| error | card + error text + Retry |
| empty/thin profile | verdict chip + prose + "log a few favorites to sharpen this" hook + followup |
| rich, unwatched | verdict + matchScore + prose + comparison anchors + hook + followups |
| rich, watched | verdict `rewatch` + matchScore + retrospective prose + comparison anchors + followups |
| cached | same as above, `cached: true` badge, regenerate button |

## Verification

- `npm run typecheck` (client + server) — must pass after every UI/type change.
- `npm run test --workspace server` — new `insightService` tests (structured output shape; empty-library → no comparisons; malformed LLM JSON → graceful degrade).
- Client vitest — `InsightCard` renders verdict + comparison `Link` + followup button; old prose-only cache shape still renders (defaults).
- Manual: open a title detail page, activate take, confirm rail no longer reflows, long take scrolls inside card, comparison chips navigate, follow-up opens chat with prefill.

## Out of scope (YAGNI)

- Streaming the take.
- Persisting follow-up conversations back into the take.
- Comparing against *external* (non-library) titles.
- A/B testing verdict copy.
