# Skeleton presence SDD ledger

- Task 1: complete (uncommitted, review clean). Files: `client/src/components/chat/WaveformSkeleton.tsx` + `WaveformSkeleton.test.tsx`. Vitest not executed here (shell hook blocked).
- Task 2: spec-review complete (uncommitted, review PASS, no Critical/Important). Files: `ChatThread.tsx` + `ChatThread.test.tsx`. Empirical gate open — operator must run `npx vitest run --root client src/components/chat/ChatThread.test.tsx`. Minors: plan-mandated duplicate SparkAvatar (do not fix here); writing-path `getByText` may be brittle on em dash.
- Task 3: complete (uncommitted, tests written, vitest not run). Error banner contract + keep-stream-on-error in useChat. Report: `.superpowers/sdd/task-3-4-report.md`.
- Task 4: complete (uncommitted, tests written, vitest not run). `welcomePosters?: string[]` strip; parents unwired by design.
- Task 5: complete (uncommitted, tests written, vitest not run). Idle opacity breath, caret-trail, error-pulse keyframe. `data-error-pulse` now on root span (user Task 5c). Tests collapsed to 3 (breathing, caret-trail, error-pulse). Report: `.superpowers/sdd/task-5-report.md`.
- Empirical gate: still OPEN in Cursor (2026-08-19). [tester](44bd5bda-6081-4428-9d6c-b91be668ab07) confirmed Task 3 code/tests match the contract, then hit the same `bouncer.sh` `&` parse error. No tsc/vitest output. Do not re-implement. Operator or Claude Code must run the chat suite.
- Task 3–4 review: Approved (no Critical/Important). Minors: keep-stream untested (useChat mocked); Start fresh doesn't assert onConversationChange; empty welcomePosters[] unasserted. Review: `.superpowers/sdd/task-3-4-review.md`.
- Task 5 review: Approved (no Critical/Important). Minors: GOLD_SOFT vs rgba in trail glow; caret-trail z-index; no reduced-motion writing trail test. Review: `.superpowers/sdd/task-5-review.md`.
