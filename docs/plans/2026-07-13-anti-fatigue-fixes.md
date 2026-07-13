# Anti-Fatigue Fixes — Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement. Commit after each green test.

**Goal:** Repair the 7 real defects found by the 4-agent adversarial review + independent grill verification, so the `ignore-show-movie-feature` branch is safe to merge. All 7 were verified TRUE against the actual code (one via a CI test proving a whole-library fatigue storm).

**Architecture:** Small, local-first, no new network calls, no schema-breaking changes. Fixes are: (1) correct the `take` logging surface, (2) harden the v6 migration, (3–4) privacy disclosure + erasure path, (5–6) retire discoverability + concept clarity in UI, (7) perf index + prune.

**Tech Stack:** TypeScript, better-sqlite3, Vitest, React (TanStack Query), Tailwind v4 (theme tokens in `client/src/theme.css`).

**Verified-evidence basis (from grill + subagent roast):**
- Claim #1: `insightService.ts:232` loops `profile.lovedTitles` (`.slice(0,15)` at `tasteProfile.ts:143`) → 3 card-opens fatigue all 15 loved titles. CI-proven.
- Claim #2: `schema.ts:150` ALTER has no `IF NOT EXISTS`; `migrate()` gated only on `user_version`; `connection.ts:22` calls `migrate(db)` uncaught.
- Claim #3: `fatigueScores`→`computeTasteProfile`→`renderTasteProfile` (`tasteProfile.ts:255-261`) injects into system prompt → OpenRouter. No disclosure copy in client.
- Claim #4: `anchorService.ts` only INSERT/SELECT; no `DELETE FROM anchor_usage` anywhere; `exportAll` (`exportService.ts:5-16`) omits it.
- Claim #5: retire toggle only in `PosterCard.tsx` bubble; Settings has Ignored list (`Settings.tsx:165-199`) but zero retired UI.
- Claim #6: Retire/Ignore/Remove stacked in bubble, no sublabels; ADR-0006 admits "resolved in code, not UI."
- Claim #7: `fatigueScores` queries `WHERE created_at >= ?` (`anchorService.ts:25-29`); index `(tmdb_id,media_type,created_at)` (`schema.ts:148`) can't range-seek on `created_at` → full index walk; no prune → unbounded (~15 inserts/open).

**Execution order:** Tasks 1–2 first (correctness + crash blockers). Tasks 3–7 after.

---

### DESIGN FORK — Claim #1 (state cleanly, pick one)

The `take` surface was meant to measure "opening a title's own insight card." But production logs it for ALL 15 loved titles per open, causing the storm.

- **Option A (RECOMMENDED):** log `take` only for the **opened** title. Preserves the original intent (the card you opened is a "like X" moment) without stamping the other 14. One row per open, not 15.
- **Option B:** exclude `take` from `fatigueScores` entirely (re-reading your own card isn't the AI "over-citing" you). Cleaner separation: only `compare_titles` + `insight_neighbors` feed fatigue.
- **Option C (rejected):** keep all-15 but dedupe + raise floor — still pollutes fatigue with self-browsing; defeats the feature's purpose.

Plan below assumes **Option A**. If you prefer B, say so and Task 1 changes to a one-line filter in `fatigueScores`.

---

### Task 1: Fix `take` logging to only the opened title (Claim #1)

**Files:**
- Modify: `server/src/llm/insightService.ts`
- Test: `server/test/titleInsight.integration.test.ts`

**Step 1: Write the failing test**
Add to `titleInsight.integration.test.ts` (mirrors the production loop, then asserts only the opened title is logged):
```ts
it("logs 'take' only for the opened title, not all loved titles", async () => {
  // seed 15 loved titles + open one; assert anchor_usage has 1 take row for the opened tmdbId
  const db = memoryDb();
  const opened = seedEntry(db, { tmdbId: 500, mediaType: "movie", title: "Opened" }, { rating: 10, favorite: true });
  for (let i = 0; i < 14; i++) {
    seedEntry(db, { tmdbId: 600 + i, mediaType: "movie", title: `Loved${i}` }, { rating: 10, favorite: true });
  }
  // (titleInsight is mocked LLM; we only assert the log side-effect)
  await titleInsight(db, 500, "movie");
  const rows = db.prepare(
    "SELECT tmdb_id, surface FROM anchor_usage WHERE surface='take'",
  ).all() as { tmdb_id: number; surface: string }[];
  expect(rows).toHaveLength(1);
  expect(rows[0].tmdb_id).toBe(500);
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/titleInsight.integration.test.ts -t "only for the opened title"`
Expected: FAIL (currently 15 rows logged).

**Step 3: Write minimal implementation**
In `insightService.ts`, replace the loop (lines 229-236):
```ts
  // Anti-fatigue: opening a title's insight card is a "like X" moment for
  // THAT title only — log it as the "take" surface, skipping retired titles.
  // (Do NOT log every loved title; that fatiguies the whole library.)
  if (!isRetired(db, tmdbId, mediaType)) {
    logAnchor(db, tmdbId, mediaType, "take");
  }
```

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/titleInsight.integration.test.ts -t "only for the opened title"`
Expected: PASS.

**Step 5: Regression — confirm the storm test would now pass**
Update `server/test/antiFatigue.integration.test.ts` "SAFETY: take alone does NOT fatigue" to open via the real `titleInsight` path (or keep the direct-insert variant — it already asserts <0.6, which holds). Add:
```ts
it("opening many different cards does NOT fatigue the whole library", () => {
  const db = memoryDb();
  for (let i = 0; i < 15; i++) seedEntry(db, { tmdbId: 700 + i, mediaType: "movie", title: `L${i}` }, { rating: 10, favorite: true });
  // open 3 distinct cards (Option A: 1 take each)
  for (const id of [700, 701, 702]) { if (!isRetired(db, id, "movie")) logAnchor(db, id, "movie", "take"); }
  const p = computeTasteProfile(db);
  expect(p.fatiguedLovedTitles.length).toBe(0); // no storm
});
```

**Step 6: Commit**
`git add server/src/llm/insightService.ts server/test/titleInsight.integration.test.ts server/test/antiFatigue.integration.test.ts && git commit -m "fix(anti-fatigue): log 'take' only for the opened title (kills whole-library fatigue storm)"`

---

### Task 2: Make v6 migration idempotent + guarded (Claim #2)

**Files:**
- Modify: `server/src/db/schema.ts`
- Modify: `server/src/db/connection.ts`
- Test: `server/test/schema-migration.test.ts`

**Step 1: Write the failing test**
Add to `schema-migration.test.ts`:
```ts
it("migrate() is idempotent — re-running on an already-migrated db does not throw", () => {
  const db = memoryDb();
  migrate(db);
  const v1 = db.pragma("user_version", { simple: true });
  // simulate a drifted state: column already exists but version says re-run
  expect(() => migrate(db)).not.toThrow();
  expect(db.pragma("user_version", { simple: true })).toBe(v1);
  // column exists exactly once
  const cols = db.prepare("SELECT COUNT(*) c FROM pragma_table_info('library') WHERE name='anchor_retired'").get() as { c: number };
  expect(cols.c).toBe(1);
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/schema-migration.test.ts -t "idempotent"`
Expected: FAIL (ALTER throws "duplicate column").

**Step 3: Write minimal implementation**
In `schema.ts`, replace the v6 migration block (lines 139-151) — wrap the ALTER in an existence check:
```ts
  // ── v6: anchor usage tracking + retirable anchors ────────────────
  CREATE TABLE IF NOT EXISTS anchor_usage (
    id INTEGER PRIMARY KEY,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL,
    surface TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_anchor_usage_key_time
    ON anchor_usage (tmdb_id, media_type, created_at);
  -- ALTER has no IF NOT EXISTS; guard with a column-existence check so a
  -- drifted user_version never triggers a "duplicate column" boot crash.
  const hasRetired = db.prepare(
    "SELECT COUNT(*) c FROM pragma_table_info('library') WHERE name='anchor_retired'",
  ).get() as { c: number };
  if (!hasRetired.c) {
    db.exec("ALTER TABLE library ADD COLUMN anchor_retired INTEGER NOT NULL DEFAULT 0");
  }
  `,
```
In `connection.ts`, wrap the migrate call (line 22) so a failure is fatal-but-actionable, not a silent boot loop:
```ts
  try {
    migrate(db);
  } catch (err) {
    throw new Error(
      `DB migration failed (user_version=${db.pragma("user_version", { simple: true })}): ${(err as Error).message}. ` +
      `If you restored from a backup, ensure user_version matches the schema.`,
    );
  }
```

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/schema-migration.test.ts -t "idempotent"`
Expected: PASS.

**Step 5: Commit**
`git add server/src/db/schema.ts server/src/db/connection.ts server/test/schema-migration.test.ts && git commit -m "fix(db): make v6 migration idempotent + fail with actionable error on drift"`

---

### Task 3: Privacy disclosure + opt-out for anchor logging (Claim #3)

**Files:**
- Modify: `client/src/components/PosterCard.tsx` (or a Settings privacy note)
- Modify: `server/src/services/anchorService.ts` (respect opt-out)
- Test: `server/test/anchorService.test.ts`

**Step 1: Write the failing test**
Add to `anchorService.test.ts`:
```ts
it("respects an opt-out flag: logAnchor is a no-op when disabled", () => {
  const db = memoryDb();
  // simulate opt-out stored as a flag row / env — pick ONE mechanism, see Step 3
  setAnchorLoggingEnabled(db, false);
  logAnchor(db, 1, "movie", "take");
  const rows = db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number };
  expect(rows.c).toBe(0);
  setAnchorLoggingEnabled(db, true);
  logAnchor(db, 1, "movie", "take");
  const rows2 = db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number };
  expect(rows2.c).toBe(1);
});
```
> NOTE: the opt-out *mechanism* (env var vs a `settings` table row) is a micro-decision — pick the simplest that fits existing patterns (env var `LUMINA_TRACK_ANCHORS=false` mirrors `LUMINA_DB` style; or a `settings` key). Default = enabled.

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/anchorService.test.ts -t "opt-out"`
Expected: FAIL (`setAnchorLoggingEnabled` undefined).

**Step 3: Write minimal implementation**
In `anchorService.ts`:
```ts
// Opt-out: local-first users may disable anchor logging entirely.
export function setAnchorLoggingEnabled(db: DB, enabled: boolean): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('anchorLogging', ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
  ).run(enabled ? "1" : "0");
}
function anchorLoggingEnabled(db: DB): boolean {
  const row = db.prepare("SELECT value FROM settings WHERE key='anchorLogging'").get() as
    | { value: string } | undefined;
  return row ? row.value !== "0" : true; // default on
}
// in logAnchor, first line:
if (!anchorLoggingEnabled(db)) return;
```
> Requires a `settings(key TEXT PRIMARY KEY, value TEXT)` table. If one doesn't exist, add it in a new v7 migration (additive, idempotent like v6). Verify with the migration-safety probe before merge.

**Step 4: Client disclosure copy**
Add a one-line note in Settings (near the Ignored/Retired sections) — plain text, no modal:
> "Lumina tallies which titles you revisit to vary its suggestions. This stays on your device; only a hint reaches the AI. Disable in settings."

**Step 5: Run test — confirm it passes**
Command: `cd server && npx vitest run test/anchorService.test.ts -t "opt-out"`
Expected: PASS.

**Step 6: Commit**
`git add server/src/services/anchorService.ts server/src/db/schema.ts client/src/pages/Settings.tsx server/test/anchorService.test.ts && git commit -m "feat(privacy): anchor-logging opt-out + disclosure copy"`

---

### Task 4: Erasure path for `anchor_usage` (Claim #4, GDPR Art. 17)

**Files:**
- Modify: `server/src/services/anchorService.ts`
- Modify: `server/src/services/exportService.ts` (include in export + clear control)
- Test: `server/test/anchorService.test.ts`

**Step 1: Write the failing test**
```ts
it("clearAnchorUsage wipes all behavior logs", () => {
  const db = memoryDb();
  logAnchor(db, 1, "movie", "take");
  logAnchor(db, 2, "tv", "compare_titles");
  clearAnchorUsage(db);
  const rows = db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number };
  expect(rows.c).toBe(0);
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/anchorService.test.ts -t "clearAnchorUsage"`
Expected: FAIL.

**Step 3: Write minimal implementation**
In `anchorService.ts`:
```ts
export function clearAnchorUsage(db: DB): void {
  db.prepare("DELETE FROM anchor_usage").run();
}
```
In `exportService.ts` `exportAll`, add `anchorUsage: grab("SELECT tmdb_id, media_type, surface, created_at FROM anchor_usage")` so users can SEE their own log (right of access). Also apply the `ignoredTmdbIds` filter to the `library` grab so an ignored-but-kept title doesn't reappear in export (legal's partial finding).

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/anchorService.test.ts -t "clearAnchorUsage"`
Expected: PASS.

**Step 5: Commit**
`git add server/src/services/anchorService.ts server/src/services/exportService.ts server/test/anchorService.test.ts && git commit -m "feat(privacy): anchor_usage erasure + include in export"`

---

### Task 5: Retired-anchors management surface (Claim #5)

**Files:**
- Modify: `client/src/pages/Settings.tsx`
- Modify: `client/src/lib/api.ts` (add `retiredAnchors` list + `unretireAnchor` already exists)
- Test: `server/test/library.test.ts` (or a new `retired.test.ts`)

**Step 1: Write the failing test**
Server side — list retired entries:
```ts
it("lists retired anchor titles for management", () => {
  const db = memoryDb();
  const libId = seedEntry(db, { tmdbId: 9, mediaType: "movie", title: "LOTR" }, { rating: 10, favorite: true });
  setRetired(db, libId, true);
  const retired = listRetiredAnchors(db);
  expect(retired.map((r) => r.title)).toContain("LOTR");
});
```
> If `listRetiredAnchors` doesn't exist server-side, add it to `libraryService.ts` (SELECT join library+titles WHERE anchor_retired=1).

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/library.test.ts -t "lists retired"`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Server: add `listRetiredAnchors(db)` in `libraryService.ts`; add `GET /api/library/retired-anchors` route in `library.ts` returning the list.
- Client `api.ts`: add `retiredAnchors: () => get(... "/api/library/retired-anchors")`.
- Client `Settings.tsx`: mirror the Ignored-titles block (lines 165-199) with a "Retired anchors" section — list each with an "Un-retire" button calling `api.unretireAnchor(libId)`.

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/library.test.ts -t "lists retired"`
Expected: PASS. Client: `cd client && npx tsc --noEmit -p tsconfig.json` clean.

**Step 5: Commit**
`git add server/src/services/libraryService.ts server/src/routes/library.ts client/src/pages/Settings.tsx client/src/lib/api.ts server/test/library.test.ts && git commit -m "feat(ui): retired-anchors management list in Settings"`

---

### Task 6: Concept clarity — sublabels + ribbon hint (Claim #6)

**Files:**
- Modify: `client/src/components/PosterCard.tsx`
- Modify: `client/src/pages/Settings.tsx` (if retire lives there too)

**Step 1: Write the failing test (visual — assert text present)**
Extend `PosterCard` render test (or add a DOM assertion) that the bubble items carry sublabels:
```ts
it("retire/ignore bubble items explain themselves", () => {
  render(<PosterCard item={...} libraryId={1} />);
  expect(screen.getByText(/Stop comparisons, keep in profile/i)).toBeInTheDocument();
  expect(screen.getByText(/Hide everywhere, drop from taste/i)).toBeInTheDocument();
});
```
> If no PosterCard render test exists, add one (React Testing Library) — or assert via the existing component tree. Keep minimal.

**Step 2: Run test — confirm it fails**
Command: `cd client && npx vitest run PosterCard` (or the relevant file)
Expected: FAIL.

**Step 3: Write minimal implementation**
In `PosterCard.tsx` bubble, under each action add a muted sublabel:
- Retire as anchor → "Stop comparisons, keep in profile"
- Ignore → "Hide everywhere, drop from taste"
On the "Over-used" ribbon, add an affordance: make it tappable (or add a title attr) "Over-used · Retire as anchor to stop comparisons."

**Step 4: Run test — confirm it passes**
Command: `cd client && npx vitest run PosterCard`
Expected: PASS. `npx tsc --noEmit` clean.

**Step 5: Commit**
`git add client/src/components/PosterCard.tsx client/src/pages/Settings.tsx <test file> && git commit -m "feat(ui): explain retire vs ignore; ribbon hint"`

---

### Task 7: Perf — index + prune for `anchor_usage` (Claim #7)

**Files:**
- Modify: `server/src/db/schema.ts` (add `(created_at)` index in v6/v7)
- Modify: `server/src/services/anchorService.ts` (prune job)
- Test: `server/test/anchorService.test.ts`

**Step 1: Write the failing test**
```ts
it("prunes anchor_usage older than the retention window", () => {
  const db = memoryDb();
  const old = Date.now() - 40 * 86_400_000;
  db.prepare("INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)").run(1, "movie", "take", old);
  db.prepare("INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)").run(2, "movie", "take", Date.now());
  pruneAnchorUsage(db); // retention = e.g. 30d
  const rows = db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number };
  expect(rows.c).toBe(1);
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/anchorService.test.ts -t "prunes"`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Schema: add `CREATE INDEX IF NOT EXISTS idx_anchor_usage_created ON anchor_usage (created_at);` in the v6 block (idempotent).
- `anchorService.ts`:
```ts
const ANCHOR_RETENTION_DAYS = 30; // older rows never contribute (14d window); prune to bound growth
export function pruneAnchorUsage(db: DB): void {
  const cutoff = Date.now() - ANCHOR_RETENTION_DAYS * 86_400_000;
  db.prepare("DELETE FROM anchor_usage WHERE created_at < ?").run(cutoff);
}
```
- Call `pruneAnchorUsage(getDb())` on app boot (in `createDb` after migrate, or in `index.ts` startup) — fire-and-forget, non-blocking.

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/anchorService.test.ts -t "prunes"`
Expected: PASS.

**Step 5: Commit**
`git add server/src/db/schema.ts server/src/services/anchorService.ts server/test/anchorService.test.ts && git commit -m "perf(anti-fatigue): created_at index + prune anchor_usage"`

---

## Post-fix verification (before merge)
1. `cd server && npx vitest run` — all pass.
2. `cd client && npx tsc --noEmit -p tsconfig.json` + `npm run build` — clean.
3. Migration-safety probe: copy live `../../data/lumina.db` into worktree `data/`, boot, confirm v6/v7 applies once, 134 titles preserved, no boot crash.
4. Re-run the 4-agent adversarial roast; require all four to return "safe to merge."
5. Push stale commits + fixes to PR #3; request human review (no auto-merge).
