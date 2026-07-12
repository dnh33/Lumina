# Lumina's Take — Implementation Plan

> **For Hermes:** Use superpowers + writing-plans to implement task-by-task. Design approved in `2026-07-13-luminas-take-enrichment-design.md`. Each task: write failing test → watch fail → implement → watch pass → commit.

**Goal:** Structured, retrieval-grounded "Lumina's take" with no layout breakage.

**Architecture:** Server returns `{ text, verdict, matchScore, comparisons[], hook, followups[], profileState, cached, model }`. `insightService` calls `retrieveLibrary()` for the user's real neighbors. Pure `assembleInsight()` (testable, tolerant parse). Client splits `InsightCard` (query state machine) from presentational `InsightBody` (tested, reserved-height, scrollable, chips, follow-ups).

**Tech:** TypeScript, React Query, react-router, Vitest (server `test/` + client `src/test/`).

---

### Task 1: Server types — extend `TitleInsight`
**Objective:** Add structured fields to the insight contract.
**Files:** Modify `server/src/llm/insightService.ts:12-16`
**Step 1:** Replace the interface with:
```ts
export type InsightVerdict = "love" | "maybe" | "skip" | "rewatch";
export type InsightRelation = "echoes" | "warns" | "diverges";
export type ProfileState = "empty" | "thin" | "rich";
export interface InsightComparison {
  tmdbId: number; mediaType: "movie" | "tv"; title: string;
  year: number | null; relation: InsightRelation; note: string;
}
export interface InsightFollowup { label: string; prefill: string; }
export interface TitleInsight {
  text: string; verdict: InsightVerdict; matchScore: number | null;
  comparisons: InsightComparison[]; hook: string | null;
  followups: InsightFollowup[]; profileState: ProfileState;
  cached: boolean; model: string;
}
```
**Step 2:** `npm run typecheck --workspace server` — expected: PASS (no consumers yet).
**Step 3:** Commit.

---

### Task 2: Pure `assembleInsight()` + tests (TDD core)
**Objective:** Tolerant parse of LLM JSON → `TitleInsight`, with graceful degrade and deterministic follow-ups.
**Files:** Modify `server/src/llm/insightService.ts`; Create `server/test/insightService.test.ts`
**Step 1 — failing test:**
```ts
import { describe, it, expect } from "vitest";
import { assembleInsight, type ProfileState } from "../src/llm/insightService.js";

const ctx = (profileState: ProfileState, owned: any = null) => ({ profileState, owned });

describe("assembleInsight", () => {
  it("parses structured JSON into TitleInsight", () => {
    const json = JSON.stringify({
      verdict: "maybe", matchScore: 62,
      comparisons: [{ tmdbId: 1, mediaType: "tv", title: "Severance", year: 2022, relation: "echoes", note: "same identity pull" }],
      hook: "Garland's existential inquiry may win you over.",
      text: "Your rapture for Severance…",
    });
    const r = assembleInsight(json, ctx("rich", null));
    expect(r.verdict).toBe("maybe");
    expect(r.matchScore).toBe(62);
    expect(r.comparisons).toHaveLength(1);
    expect(r.comparisons[0].tmdbId).toBe(1);
    expect(r.followups.length).toBeGreaterThan(0);
    expect(r.profileState).toBe("rich");
  });

  it("degrades gracefully when LLM returns prose only", () => {
    const r = assembleInsight("Just some plain prose about the film.", ctx("rich", null));
    expect(r.text).toContain("Just some plain prose");
    expect(r.verdict).toBe("maybe");
    expect(r.comparisons).toEqual([]);
    expect(Array.isArray(r.followups)).toBe(true);
  });

  it("degrades on malformed JSON", () => {
    const r = assembleInsight("{not json at all", ctx("thin", null));
    expect(typeof r.text).toBe("string");
    expect(r.matchScore).toBeNull();
    expect(r.comparisons).toEqual([]);
  });

  it("forces verdict=rewatch when owned+rated", () => {
    const r = assembleInsight(JSON.stringify({ verdict: "love", text: "x" }), ctx("rich", { status: "watched", rating: 9 }));
    expect(r.verdict).toBe("rewatch");
  });

  it("omits comparisons + score when profile empty/thin", () => {
    const r = assembleInsight(
      JSON.stringify({ verdict: "maybe", matchScore: 80, comparisons: [{ tmdbId: 9, mediaType: "movie", title: "X", year: 2000, relation: "warns", note: "n" }], text: "t" }),
      ctx("empty", null),
    );
    expect(r.matchScore).toBeNull();
    expect(r.comparisons).toEqual([]);
  });
});
```
**Step 2:** `npm run test --workspace server insightService` — expected: FAIL (`assembleInsight` not defined).
**Step 3 — implement** `assembleInsight` in `insightService.ts`:
```ts
function coerceVerdict(v: unknown, owned: { status?: string; rating?: number | null } | null): InsightVerdict {
  if (owned && (owned.status === "watched" || owned.status === "watching" || owned.status === "abandoned") && (owned.rating != null)) return "rewatch";
  if (v === "love" || v === "maybe" || v === "skip" || v === "rewatch") return v;
  return "maybe";
}
function buildFollowups(title: string, verdict: InsightVerdict): InsightFollowup[] {
  const t = title.replace(/"/g, "");
  const out: InsightFollowup[] = [{ label: `Compare to my favorites`, prefill: `How does "${t}" compare to the titles I've loved? No spoilers.` }];
  if (verdict === "skip" || verdict === "maybe")
    out.push({ label: `Why might I not finish it?`, prefill: `I'm wary of "${t}" — based on my history, what's the realistic risk I drop it? No spoilers.` });
  return out;
}
export function assembleInsight(raw: string, opts: { profileState: ProfileState; owned: { status?: string; rating?: number | null } | null; title?: string }): TitleInsight {
  let parsed: any = null;
  try { parsed = JSON.parse(raw); }
  catch {
    const s = raw.indexOf("{"); const e = raw.lastIndexOf("}");
    if (s !== -1 && e > s) { try { parsed = JSON.parse(raw.slice(s, e + 1)); } catch { parsed = null; } }
  }
  const text = (parsed?.text && typeof parsed.text === "string" && parsed.text.trim()) ? parsed.text.trim() : raw.trim();
  const verdict = coerceVerdict(parsed?.verdict, opts.owned);
  const thin = opts.profileState !== "rich";
  const matchScore = thin ? null : (typeof parsed?.matchScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.matchScore))) : null);
  const relations = new Set(["echoes", "warns", "diverges"]);
  const comparisons: InsightComparison[] = thin || !Array.isArray(parsed?.comparisons)
    ? []
    : parsed.comparisons.filter((c: any) => c && typeof c.tmdbId === "number" && relations.has(c.relation))
        .slice(0, 3)
        .map((c: any) => ({ tmdbId: c.tmdbId, mediaType: c.mediaType === "tv" ? "tv" : "movie", title: String(c.title ?? "Untitled"), year: typeof c.year === "number" ? c.year : null, relation: c.relation, note: String(c.note ?? "") }));
  const hook = typeof parsed?.hook === "string" && parsed.hook.trim() ? parsed.hook.trim() : null;
  return { text, verdict, matchScore, comparisons, hook, followups: buildFollowups(opts.title ?? "this", verdict), profileState: opts.profileState, cached: false, model: "" };
}
```
**Step 4:** `npm run test --workspace server insightService` — expected: PASS.
**Step 5:** Commit.

---

### Task 3: Profile-state helper
**Objective:** Classify `empty | thin | rich` from the taste profile.
**Files:** Modify `server/src/llm/insightService.ts`; add test to `server/test/insightService.test.ts`
**Step 1 — failing test:**
```ts
import { profileStateOf } from "../src/llm/insightService.js";
it("classifies profile state", () => {
  expect(profileStateOf({ librarySize: 0 } as any)).toBe("empty");
  expect(profileStateOf({ librarySize: 3, ratedCount: 2, lovedTitles: [], dislikedTitles: [] } as any)).toBe("thin");
  expect(profileStateOf({ librarySize: 20, ratedCount: 10, lovedTitles: [{ title: "x" }], dislikedTitles: [{ title: "y" }] } as any)).toBe("rich");
});
```
**Step 2:** `npm run test --workspace server insightService` — expected: FAIL.
**Step 3 — implement:**
```ts
export function profileStateOf(p: { librarySize: number; ratedCount: number; lovedTitles: unknown[]; dislikedTitles: unknown[] }): ProfileState {
  if (p.librarySize === 0) return "empty";
  const rich = (p.lovedTitles.length > 0 || p.dislikedTitles.length > 0) && p.ratedCount >= 8;
  return rich ? "rich" : "thin";
}
```
**Step 4:** `npm run test --workspace server insightService` — expected: PASS.
**Step 5:** Commit.

---

### Task 4: Rewrite `insightPrompt()` for JSON output
**Objective:** Instruct the model to return structured JSON + retrieval-grounded prose.
**Files:** Modify `server/src/llm/prompts.ts:57-59`
**Step 1:** Replace `insightPrompt()` body with:
```ts
export function insightPrompt(profileState: ProfileState = "rich"): string {
  const thin = profileState !== "rich";
  return `You are Lumina, the user's personal cinema companion. Using the taste profile, the title, and the list of titles from THEIR LIBRARY most similar to this one, write a personal insight.

Return ONLY a JSON object (no prose outside it) with this shape:
{
  "verdict": "love" | "maybe" | "skip" | "rewatch",
  "matchScore": ${thin ? "null" : "number 0-100 (your confidence this fits their taste)"},
  "comparisons": [ { "tmdbId": <from the neighbor list>, "mediaType": "movie"|"tv", "title": <string>, "year": <number|null>, "relation": "echoes"|"warns"|"diverges", "note": "<=18 words why this library title is the anchor>" } ],
  "hook": "<=1 spoiler-safe sentence: what might win them over, or for rewatch, one retrospective nudge>",
  "text": "110-170 word flowing prose in Lumina's warm, specific voice, referencing the named comparison titles by name, never generic. ${thin ? "Their profile is thin — be honest that the read sharpens as they log more, and do not over-claim." : ""}"
}

Rules: comparisons must cite tmdbIds that appear in the provided neighbor list (max 3). relation: echoes=their love predicts love; warns=their low rating/dnf signals risk; diverges=unlike their usual (stretch). Strictly no spoilers beyond the premise. Do not invent tmdbIds.`;
}
```
**Step 2:** `npm run typecheck --workspace server` — expected: PASS.
**Step 3:** Commit.

---

### Task 5: Wire `insightService` (retrieval + assemble)
**Objective:** Call `retrieveLibrary`, compute profile state, assemble structured insight, cache it.
**Files:** Modify `server/src/llm/insightService.ts` (import retrieval + profile helpers; rewrite `titleInsight`); Modify `server/src/routes/misc.ts` (unchanged — returns `res.json(insight)`, shape now richer, fine).
**Step 1 — failing test** (integration-lite, mock LLM):
```ts
// in server/test/insightService.test.ts
import { vi } from "vitest";
vi.mock("../src/llm/openrouter.js", () => ({ getLlm: () => ({ chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ verdict: "maybe", matchScore: 70, comparisons: [], hook: "h", text: "prose" }) }] }) }) } }), currentModel: () => "test", getSetting: () => null, setSetting: () => {} }), getSetting: () => null, setSetting: () => {}, currentModel: () => "test" }));
```
(Keep mock minimal; assert `titleInsight` returns an object with `verdict` and `comparisons` array when given a fake DB + tmdb fetch. If tmdb fetch is heavy, mock `../src/services/libraryService.js` too. Prefer testing `assembleInsight` thoroughly in Tasks 2; here just assert the service returns the new shape with a mocked LLM.)
**Step 2:** `npm run test --workspace server insightService` — expected: FAIL or error (wiring missing).
**Step 3 — implement** in `titleInsight`: after computing `profile` and `owned`, add:
```ts
import { retrieveLibrary } from "../rag/retrieval.js";
const neighbors = retrieveLibrary(db, `${details.title} ${details.genres.join(" ")} ${details.director ?? ""}`, 8);
const profileState = profileStateOf(profile);
const neighborBlock = neighbors.length
  ? "Titles from THEIR library most like this one (cite these tmdbIds):\n" +
    neighbors.map((n) => `- ${n.title} (tmdbId ${n.tmdbId}, ${n.mediaType}, rated ${n.rating ?? "—"}/10)`).join("\n")
  : "No similar titles in their library yet.";
```
Change the user message to include `## Their closest library titles\n${neighborBlock}` and call `assembleInsight(completionText, { profileState, owned, title: details.title })`. Set `model` and `cached:false` on the result; cache `JSON.stringify(result)`. On cache hit, `parsed` already has the new shape → return as `TitleInsight` (cast). **Migration:** old cache entries lack new fields — default them (`verdict: parsed.verdict ?? "maybe"`, `comparisons: parsed.comparisons ?? []`, etc.) when reading cache.
**Step 4:** `npm run test --workspace server insightService` — expected: PASS.
**Step 5:** `npm run typecheck --workspace server` — PASS.
**Step 6:** Commit.

---

### Task 6: Client types — extend `TitleInsight`
**Objective:** Mirror server shape on the client.
**Files:** Modify `client/src/lib/types.ts:225-229`
**Step 1:** Replace `TitleInsight` with the client-side mirror (same fields as Task 1).
**Step 2:** `npm run typecheck --workspace client` — expected: PASS.
**Step 3:** Commit.

---

### Task 7: Presentational `InsightBody` + tests (TDD client)
**Objective:** Render verdict chip, match score, comparison `Link`s, hook, follow-ups — testable without query.
**Files:** Create `client/src/components/InsightBody.tsx`; Create `client/src/components/InsightBody.test.tsx`; (uses `MemoryRouter`, `render` from `@testing-library/react` — check existing test setup `client/src/test/setup.ts`).
**Step 1 — failing test:**
```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InsightBody } from "./InsightBody";

const insight = {
  text: "Your rapture for Severance…", verdict: "maybe", matchScore: 62,
  comparisons: [{ tmdbId: 1, mediaType: "tv", title: "Severance", year: 2022, relation: "echoes", note: "same identity pull" }],
  hook: "Garland's inquiry may win you over.", followups: [{ label: "Compare to my favorites", prefill: "how does it compare?" }],
  profileState: "rich", cached: false, model: "x",
};

test("renders verdict, comparison link, and followup", () => {
  render(<MemoryRouter><InsightBody insight={insight as any} onRegenerate={() => {}} /></MemoryRouter>);
  expect(screen.getByText("Maybe")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: /Severance/ });
  expect(link).toHaveAttribute("href", "/title/tv/1");
  expect(screen.getByText(/Garland's inquiry/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Compare to my favorites/ })).toBeInTheDocument();
});

test("old prose-only insight still renders (defaults)", () => {
  render(<MemoryRouter><InsightBody insight={{ text: "plain prose", cached: false, model: "x" } as any} onRegenerate={() => {}} /></MemoryRouter>);
  expect(screen.getByText("plain prose")).toBeInTheDocument();
});
```
**Step 2:** `cd client && npx vitest run InsightBody` — expected: FAIL (component missing).
**Step 3 — implement** `InsightBody.tsx`:
- Verdict chip: map `love/maybe/skip/rewatch` → label `Love/Maybe/Skip/Rewatch` + color (love=emerald, maybe=gold, skip=red, rewatch=violet) using existing `bg-*`/`text-*`/`ring-*` tokens.
- If `matchScore != null`: a small `text-gold-300 tabular-nums` "Match 62".
- Prose `<p>` inside a **capped, scrollable** body: `max-h-[260px] overflow-y-auto pr-1`.
- Comparisons: map to `<Link to={/title/${mediaType}/${tmdbId}} className="group flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.08] hover:ring-gold-400/40 transition">` — left: title + year + relation tag (echoes=emerald, warns=red, diverges=gold), right: note (text-2xs mist-400). Respect reduced-motion (no lift).
- Hook: `text-sm italic text-mist-300` with a `Sparkles` if present.
- Followups: buttons `btn-ghost text-2xs` calling `onFollowup(f.prefill)` (parent navigates with `state:{prefill}`).
- `onRegenerate` prop wired to existing refresh button (only render when `insight` present).
**Step 4:** `cd client && npx vitest run InsightBody` — expected: PASS.
**Step 5:** Commit.

---

### Task 8: Rebuild `InsightCard` (layout fix + state machine)
**Objective:** Reserved-height card, no rail reflow, scrollable body, use `InsightBody`.
**Files:** Modify `client/src/pages/TitleDetail.tsx:104-177` (`InsightCard`); import `InsightBody`; add `useNavigate`.
**Step 1 — implement** `InsightCard`:
- Wrap in `<section className="panel p-5 ring-gold-400/15 min-h-[230px] ...">` — **always rendered** once `health.isSuccess && aiConfigured` (move the `return null` to only gate the whole section, and render a reserved-height placeholder before `requested`).
- Pre-request state: short copy + "Why would I love this?" CTA **inside** the reserved-height card (no collapse).
- Loading/error: inside the card (as today, but inside reserved height).
- On data: render `<InsightBody insight={insight.data} onRegenerate={() => refresh.mutate()} onFollowup={(p) => navigate("/chat", { state: { prefill: p } })} />`.
- Comparison/followup navigation handled in `TitleDetail` via `useNavigate`.
**Step 2:** `npm run typecheck --workspace client` — expected: PASS.
**Step 3:** Commit.

---

### Task 9: Rail sticky cap (no unreachable bottom)
**Objective:** Stop the rail sticking when it would overflow the viewport.
**Files:** Modify `client/src/pages/TitleDetail.tsx:939` (`<div className="space-y-5 self-start lg:sticky lg:top-6">`)
**Step 1:** Add `max-h-[calc(100dvh-3rem)] overflow-y-auto` to the rail wrapper so a tall take scrolls within the rail instead of making the page jump; or drop `sticky` when content is tall. Simplest robust fix: change to `className="space-y-5 self-start lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1"`.
**Step 2:** `npm run typecheck --workspace client` — PASS.
**Step 3:** Commit.

---

### Task 10: Full verification
**Objective:** Prove the whole thing.
**Files:** none (verification only).
**Step 1:** `npm run typecheck` — expect PASS (server + client).
**Step 2:** `npm run test --workspace server` — expect PASS (insightService + existing).
**Step 3:** `cd client && npx vitest run` — expect PASS (InsightBody + existing smoke/remount).
**Step 4:** `npm run build` — expect success.
**Step 5:** Manual (user): open a title detail, activate take, confirm no rail reflow, long take scrolls inside card, comparison chips navigate, follow-up opens chat with prefill.
**Step 6:** Commit any final tweaks; summarize for PR review (human review required).
