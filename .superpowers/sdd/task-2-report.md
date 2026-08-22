# Task 2 Report: Phase-Driven Skeleton in AssistantTurn

**Status:** DONE_WITH_CONCERNS  
**Date:** 2026-08-19  
**Implementer:** Rune (fresh start after prior Sonnet dispatch hit usage limit)

---

## What you implemented

Replaced the italic `Thinking…` p-tag in `AssistantTurn` with the plan-mandated thinking row: SparkAvatar (`hideWhisper`) + `phaseLabel(...)` + `WaveformSkeleton`.

- Private `phaseLabel(phase: TurnPhase)` helper (not exported).
- `phase?: TurnPhase` added to `TurnProps`. AssistantTurn uses `phase ?? "thinking"`.
- Live call site (`stream &&`) passes `phase={stream.phase}`.
- Persisted `AssistantTurn {...persistedTurnProps(m, chip)}` unchanged — no `phase`, never `thinking`, skeleton stays hidden.
- Imports in `ChatThread.tsx` only: `WaveformSkeleton` from `./WaveformSkeleton`, `TurnPhase` from `./useChat`.
- Duplicate SparkAvatar kept (left column + thinking row), as resolved.
- No `MessageBubble.tsx` edits. No `theme.css`. No Task 3/4/5 work. No commit. No dev server.

---

<CODE_REVIEW>

`AssistantTurn` previously branched on `thinking && !content` to a static italic "Thinking…" line. The live call site already had `stream.phase` but did not pass it in. `WaveformSkeleton` (Task 1) already maps phase → bar count and hides on `writing`. `useChat` already exports `TurnPhase`. Persisted turns go through `persistedTurnProps`, which never sets `thinking`.

The thinking-row SparkAvatar is a second instance beside the left-column avatar — plan-mandated, not a bug.

`WaveformSkeleton` still renders for `starting` (3 bars). Brief case 4 requires skeleton present in that phase; matches Task 1 behavior.

</CODE_REVIEW>

<PLANNING>

1. Write `ChatThread.test.tsx` (integration, mock `useChat`, QueryClient seed) → verify: file exists before production edits.
2. Run vitest → verify: RED because skeleton/labels missing, old "Thinking…" still present.
3. Wire phaseLabel + UI + `phase` prop + live call site → verify: GREEN on the same command.
4. Self-review surgical diff → verify: no MessageBubble/theme/Task 3–5.

</PLANNING>

<SECURITY_REVIEW>

No new user input, network, or auth. `phase` is an internal stream enum, not free text. Mocked `api.health` only in tests. No secrets.

</SECURITY_REVIEW>

---

## What you tested and test results

**Command:** `npx vitest run --root client src/components/chat/ChatThread.test.tsx`

**Result:** NOT RUN. Shell tool is blocked by a broken bouncer hook (see TDD Evidence). Tests were written; production was implemented against them; execution evidence is missing.

Cases in `ChatThread.test.tsx`:

1. `thinking` + empty content → `waveform-skeleton` present, `Lumina is thinking…` visible, exact `Thinking…` absent.
2. `writing` + non-empty streamed text → skeleton absent, MessageBubble content visible, phase labels absent.
3. `tooling` + empty content → `Reaching into your library…` + 5 `[data-part='waveform-bar']`.
4. `starting` + empty content → `Lumina is waking…` + skeleton present.

Hygiene: `afterEach(cleanup)`, jsdom, `@testing-library/react`, `vi.mock("./useChat")` via `vi.hoisted`, QueryClient `retry: false` + `setQueryData(["health"], { aiConfigured: true })`, `MemoryRouter` (MessageBubble uses `Link`), `conversationId={null}`.

---

## TDD Evidence

### RED

- **File order:** `ChatThread.test.tsx` was created **before** any `ChatThread.tsx` production edits.
- **Command attempted:** `npx vitest run --root client src/components/chat/ChatThread.test.tsx`
- **Relevant failing output:** none captured. Shell rejected three times (including a smart-mode retry) with:

```
Hook blocked with message: --: eval: line 1: syntax error near unexpected token `&'
$OutputEncoding = [System.Text.Encoding]::UTF8; Get-Content -LiteralPath 'C:\Users\Danie\AppData\Local\Temp\cursor-hooks-*\payload.json' -Raw | & { $input | bash C:\Users\Danie\.claude\plugins\cache\b-open-io\bopen-tools\1.0.85/hooks/bouncer.sh }
```

- **Why the failure was expected (inferred, not observed):** pre-change `AssistantTurn` still rendered `<p>Thinking…</p>` and did not mount `WaveformSkeleton` or phase labels. Tests 1/3/4 would fail on missing `waveform-skeleton` / missing labels / leftover `Thinking…`. Test 2 would likely pass on content visibility (MessageBubble already exists) but fail if it asserted skeleton absence while also requiring labels to be gone — content path already hid the thinking p-tag.

**This is not a valid TDD RED observation.** The brief allowed writing files on shell block and recording the blocker. Operator should run the command locally to confirm.

### GREEN

- **Command attempted:** same as RED, after production edits.
- **Relevant passing output:** none captured. Same hook block.
- **Linter:** `ReadLints` on `ChatThread.tsx` + `ChatThread.test.tsx` reported no issues.

---

## Files changed

| File | Action |
| --- | --- |
| `client/src/components/chat/ChatThread.test.tsx` | **Created** — 4 integration tests |
| `client/src/components/chat/ChatThread.tsx` | **Modified** — imports, `phase` on `TurnProps`, `phaseLabel`, thinking-row UI, live `phase={stream.phase}` |
| `.superpowers/sdd/task-2-report.md` | **Created** — this report |

Not touched: `MessageBubble.tsx`, `WaveformSkeleton.tsx`, `theme.css`, `useChat.ts`.

---

## Self-review findings

- Live wiring matches the brief: `phase={stream.phase}` only on the streaming `AssistantTurn`. Persisted spread unchanged.
- `phaseLabel` stays module-private.
- Duplicate SparkAvatar is explicit and intended.
- `writing` label `"Composing…"` is dead on the live path (`thinking={stream.phase !== "writing"}`), but the helper includes it as specified. WaveformSkeleton already returns null for `writing`.
- Pre-existing unused `Variants` import left alone (surgical).
- Test setup mocks `../../lib/api` health in addition to QueryClient seed so a background refetch cannot flip the companion-wake gate.

No functional disagreements with the controller resolutions.

---

## Issues or concerns

1. **Tests were not executed in this session.** Shell is unusable (bouncer.sh / PowerShell `&` piped into bash). Do not treat this task as verified until:

   ```bash
   npx vitest run --root client src/components/chat/ChatThread.test.tsx
   ```

   passes locally.

2. TDD RED/GREEN evidence is incomplete for the same reason. File order was correct (test first).

3. Possible test flake (unverified): `getByText` on the writing-path message depends on MarkdownMessage preserving the exact string including the em dash.

---

## Operator next step

Run the vitest command above. Do not commit from this agent.
