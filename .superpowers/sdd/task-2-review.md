# Task 2 Review: Phase-Driven Skeleton in AssistantTurn

**Scope:** `ChatThread.tsx` + `ChatThread.test.tsx` (uncommitted working tree). Not a merge review.
**Report treated as unverified.** Claims checked against source.

---

## Spec Compliance

Matches the brief and controller resolutions.

| Requirement | Verdict |
| --- | --- |
| Replace `<p>Thinking…</p>` with SparkAvatar + `phaseLabel` + `WaveformSkeleton` when `thinking && !content` | Met (`ChatThread.tsx:152-157`) |
| `phaseLabel` strings exact (waking / thinking / tooling / Composing… / default thinking) | Met (`ChatThread.tsx:102-115`); helper is module-private |
| Import `WaveformSkeleton` + `TurnPhase` in `ChatThread.tsx` only | Met (`:25-26`); `TurnPhase` from `./useChat` |
| `phase?: TurnPhase` on `TurnProps`; live `phase={stream.phase}`; `phase ?? "thinking"` inside AssistantTurn | Met (`:99`, `:155-156`, `:491`) |
| Persisted `AssistantTurn {...persistedTurnProps(...)}` unchanged (no `phase`, no `thinking`) | Met (`:464`) |
| Live stream phase drives skeleton; WaveformSkeleton hides on writing | Met: live `thinking={stream.phase !== "writing"}` plus WaveformSkeleton’s `writing → null` |
| Duplicate SparkAvatar (left column + thinking row, both `hideWhisper`) | Met — plan-mandated |
| Do not edit `MessageBubble.tsx` or `theme.css`; no new visual language | Met — thinking row uses existing `mist-300` / flex / gap utilities from the brief |
| Integration tests of `ChatThread` (not an exported helper): skeleton on thinking, hidden when content arrives; tooling 5 bars; starting label | Met (`ChatThread.test.tsx` cases 1–4) |
| Mock `./useChat`, QueryClient `retry: false` + health seed, required mock fields, `afterEach(cleanup)` | Met; also mocks `api.health` and wraps `MemoryRouter` |

**Missing:** none in the production change.

**Extra (justified):** `MemoryRouter` (MessageBubble uses `Link`); dual health seed (`setQueryData` + `api.health` mock); writing-path test asserts all four phase labels absent, not just “label not shown.”

**Misunderstood:** none.

⚠️ **Cannot verify from this change alone:** vitest was not run (shell hook blocked). Tests read as they should fail pre-change and pass post-change, but that is inference, not evidence. Operator must run:

```bash
npx vitest run --root client src/components/chat/ChatThread.test.tsx
```

If a single case is in doubt after that run, start with `"hides skeleton and phase label once writing content arrives"` — it is the only test that depends on MarkdownMessage preserving the exact em-dash string.

---

## Strengths

- Surgical: only the thinking branch, `TurnProps.phase`, live call-site wiring, and a private helper. Persisted path untouched.
- Live vs persisted split is correct. Skeleton cannot leak onto history rows because `persistedTurnProps` never sets `thinking`.
- Tests go through `ChatThread` + a controllable `useChat` mock, so they actually exercise `phase={stream.phase}` rather than a unit-tested helper.
- Reuses Task 1 `WaveformSkeleton` (testid + `data-part='waveform-bar'`) instead of rewriting it. Tooling case asserting 5 bars is a real integration with that component.
- `"Composing…"` is in the helper as specified; the live path never shows it (`thinking` is false on `writing`), which is what case 2 asserts.

---

## Issues

### Critical

None.

### Important

None. Nothing here makes the task untrustworthy as an implementation of the brief.

### Minor

1. **Plan-mandated — duplicate SparkAvatar** (confidence 100)
   - `client/src/components/chat/ChatThread.tsx:133` and `:154`
   - Left-column identity spark and the thinking-row spark both render `SparkAvatar` with `hideWhisper` during `thinking && !content`. Two cores sit in the same turn.
   - Do not “fix” in this task — the brief forbids deduping. Track for a later visual pass if the double spark looks wrong in the dock.

2. **Tests never executed** (confidence 100 that evidence is missing; not a code defect)
   - No RED/GREEN output. File order (test created first) cannot be confirmed from the working tree alone.
   - Not a reason to rewrite the tests; they match the required cases and hygiene.

3. **Writing-path assertion is brittle if markdown splits/normalizes the string** (confidence 55 — below the usual bar; recorded only because the implementer flagged it)
   - `ChatThread.test.tsx:116-118`
   - `getByText("Try Counterpart — slow-burn, dense, yours.")` depends on MarkdownMessage keeping that exact unicode dash in one text node. If this test fails in isolation, switch to a substring matcher or a simpler ASCII fixture — do not change production for it.

---

## Assessment

**PASS**

The implementation matches the task brief and controller resolutions. Production wiring is correct, tests are real ChatThread integration tests covering the four required cases, and out-of-scope files were left alone.

Ship-the-task gate: green on spec. Empirical gate: still open until the operator runs the vitest command above.

Do not send this back for the duplicate SparkAvatar. Do not treat the implementer’s DONE_WITH_CONCERNS as a code failure — the concern is the blocked shell, which this review also cannot close.
