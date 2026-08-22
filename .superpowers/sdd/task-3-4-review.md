# Tasks 3–4 review — error recovery + welcome posters

**Scope:** `ChatThread.tsx`, `ChatThread.test.tsx`, `useChat.ts` keep-stream-on-error. Read-only. Report not trusted; checked against source.
**Date:** 2026-08-19

---

### Spec Compliance

- ✅ Error banner interrupted copy verbatim when `stream?.assistantText` is non-empty — `ChatThread.tsx:519-521` (`"Lumina was interrupted — the response above is preserved. Try again?"`)
- ✅ Generic copy when assistantText empty/missing — `ChatThread.tsx:521` (`"Something went wrong. Try again?"`)
- ✅ Secondary “no data lost” only when partial exists — `ChatThread.tsx:523-527`; `text-2xs text-mist-300` (brief: “text-2xs mist”; plan snippet `text-mist-400/70` is superseded by the brief)
- ✅ Retry + Start fresh when `failedText && !isStreaming`, both `btn-ghost btn-sm` — `ChatThread.tsx:529-549`
- ✅ Retry `onClick={() => void send(failedText)}` — `ChatThread.tsx:534`
- ✅ Start fresh = `api.createConversation` → `playCue("droplet")` → `onConversationChange(created.id)`, not `setStream(null)` from ChatThread — `ChatThread.tsx:541-544` (mirrors `messagesError` path `:341-344`)
- ✅ Live AssistantTurn only: `companionState={error ? "error" : (companionState ?? "idle")}` — `ChatThread.tsx:509`; persisted turns still `{...persistedTurnProps(m, chip)}` at `:483` (default idle)
- ✅ Partial stays visible via existing `{stream && <AssistantTurn content={streamedText || stream.assistantText} …/>}` — `ChatThread.tsx:491-512`
- ✅ `useChat.send` keeps optimistic stream on error (`hadError` → skip `finishTurn()` / no `setStream(null)`); flush only — `useChat.ts:173`, `:192-194`, `:228-232`, `:311-313`, `:323-330`
- ✅ Conversation-id effect also `setStream(null)` so Start fresh clears a kept partial — `useChat.ts:124-131`. Guard `!inFlightRef.current` is required (first-send id handoff); not a spec miss.
- ✅ `welcomePosters?: string[]` optional on Props — `ChatThread.tsx:215`, destructure `:227`
- ✅ Strip only when non-empty (`data-testid="welcome-posters"`, `<img src={url} alt="">`, no fetch, no titles) — `ChatThread.tsx:419-433`
- ✅ Existing welcome kept: idle SparkAvatar, greeting, dormant line + MemoryConstellation, body copy, SuggestionCards — `ChatThread.tsx:402-442`
- ✅ Parents not wired: `ChatDock.tsx:122-127`, `ChatPage.tsx:205-210` omit the prop (optional; no type force)
- ✅ SparkAvatar internals not edited by this task (header uses public `state` / `data-state`)
- ✅ Task 2 skeleton tests kept — `ChatThread.test.tsx:126-180` (4 cases)
- ✅ Task 3 tests: interrupted bundle, generic/no safety line, Retry → `send(failedText)`, Start fresh → `createConversation` — `ChatThread.test.tsx:188-260`
- ✅ Task 4 tests: idle spark, dormant on/off, 3 poster imgs, omit → no node — `ChatThread.test.tsx:268-307`
- ✅ Surgical file set only (ChatThread + test + minimal useChat)

- ⚠️ Cannot verify vitest / tsc. Shell hook blocked the implementer; this review did not re-run. Operator must run:
  `npx vitest run --root client src/components/chat/ChatThread.test.tsx`
  `npx tsc --noEmit --project client/tsconfig.json`
- ⚠️ Cannot verify keep-stream in production from ChatThread tests (`useChat` is mocked). Logic in `useChat.ts:315-330` reads correct; no `useChat.test.ts`.
- ⚠️ Cannot verify TDD RED-then-GREEN from the working tree (file order is not evidence).

---

### Strengths

- Copy and button contract match the brief, not the older plan prose (`Send again?` / `setStream(null)`).
- Start fresh reuses the existing messagesError sequence instead of inventing a ChatThread-side stream clearer.
- Error avatar is forced from the `error` flag on the live turn, so tests that seed `companionState: "writing"` still get `data-state="error"` (`SparkAvatar.tsx:326`).
- `hadError` is a local flag inside `send` — no send() refactor, three `setError` sites covered (createConversation catch, SSE `error`, network catch).
- Conversation-id `setStream(null)` is correctly gated on `!inFlightRef.current`; a literal always-clear would wipe the first-message optimistic stream.
- Welcome strip is additive and hidden on omit/empty; SuggestionCards stay.

---

### Issues

#### Critical

None.

#### Important

None that fail the brief. Coverage gap on keep-stream is noted under ⚠️, not as a production logic error.

#### Minor

1. **Keep-stream path has no unit test** (confidence 95 that it is untested; 70 that the implementation is correct)
   - `useChat.ts:323-330`; ChatThread tests mock the hook (`ChatThread.test.tsx:13-18`).
   - Brief required the production change and also required mocking `useChat` in ChatThread tests — so this is an accepted hole, not a missed ChatThread case.
   - Follow-up: one `useChat` test that errors mid-stream and asserts `stream` still non-null.

2. **Start fresh test does not assert `onConversationChange`** (confidence 90)
   - `ChatThread.test.tsx:248-259` only `expect(api.createConversation).toHaveBeenCalled()`.
   - Production does call `onConversationChange(created.id)` (`ChatThread.tsx:544`). Brief test list only required the API mock. Optional tighten: spy the prop.

3. **Empty `welcomePosters={[]}` is implemented, not asserted** (confidence 100)
   - `ChatThread.tsx:419`; brief production rule includes empty; test 5 only omits the prop (`ChatThread.test.tsx:303-306`).

4. **Secondary mist token is `text-mist-300`, not plan `text-mist-400/70`** (confidence 100 that they differ; 90 that brief wins)
   - `ChatThread.tsx:524`. Same mist token as the rest of this file. Do not “fix” to the plan snippet.

5. **Tests never executed** (confidence 100 that evidence is missing; not a code defect)
   - Same class as Task 2. Not a reason to rewrite.

---

### Assessment

**Task quality:** Approved

**Reasoning:** ChatThread implements the error-copy, button, live-error-avatar, and welcomePosters contracts against the brief with surgical scope; useChat keep-stream plus the idle conversation-id clear is the minimal production fix the banner needs. Vitest/tsc remain unverified — run the two commands above before treating GREEN as fact.
