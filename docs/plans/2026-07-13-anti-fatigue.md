# Anti-Fatigue Anchor Diversity — Implementation Plan

> **For implementer:** Use TDD throughout. Write the failing test first. Watch it fail. Then implement. Watch it pass. Commit after each green task.
> **Pipeline:** superpowers Phase 2 (Writing Plans) → Phase 3 (Subagent-Driven Build). No code before this plan is approved.

**Goal:** Kill discovery fatigue (repetition of the same "like X" comparison anchor) by measuring anchor usage, silently auto-diversifying framing, and letting the user retire a title as an anchor — without discarding the taste signal of loved titles, and without any proactive notifications.

**Architecture:** A new `anchorService` logs every companion "like X" citation to an `anchor_usage` table (v6 migration) and derives a deterministic recency-weighted fatigue score. `computeTasteProfile`/`renderTasteProfile` annotate fatigued loved titles to pivot framing; `compare_titles` and insight neighbors prefer fresh anchors and log them; `library.anchor_retired` gives a manual override surfaced as a passive, threshold-gated hint on the library card. Genre-exclude (`filterCatalog`) is untouched and composes by stage.

**Tech Stack:** TypeScript, better-sqlite3 (ESM `.js`), vitest, React+Vite client. Existing `ignoredTmdbIds` pattern for hide-checks; new `anchor_usage` for measurement.

---

### Task 1: v6 migration — anchor_usage table + library.anchor_retired

**Files:**
- Modify: `server/src/db/schema.ts`
- Test: `server/test/schema.test.ts` (or `db.test.ts`)

**Step 1: Write the failing test**
```ts
import { openDb, migrate } from "../src/db/connection.js";
import { describe, it, expect, beforeEach } from "vitest";

describe("v6 schema", () => {
  it("creates anchor_usage with (tmdb_id, media_type, surface, created_at) and library.anchor_retired", () => {
    const db = openDb(":memory:");
    migrate(db);
    const cols = db.prepare("PRAGMA table_info(library)").all() as { name: string }[];
    expect(cols.some((c) => c.name === "anchor_retired")).toBe(true);
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='anchor_usage'").get();
    expect(row).toBeTruthy();
    db.close();
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/db.test.ts -t "v6 schema"`
Expected: FAIL — `anchor_retired` column or `anchor_usage` table missing.

**Step 3: Write minimal implementation**
In `server/src/db/schema.ts`, bump `DB_VERSION` to 6 and add to the migration switch:
```ts
case 6:
  db.exec(`
    CREATE TABLE IF NOT EXISTS anchor_usage (
      id INTEGER PRIMARY KEY,
      tmdb_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      surface TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_anchor_usage_key_time
      ON anchor_usage (tmdb_id, media_type, created_at);
    ALTER TABLE library ADD COLUMN anchor_retired INTEGER NOT NULL DEFAULT 0;
  `);
  break;
```

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/db.test.ts -t "v6 schema"`
Expected: PASS

**Step 5: Commit**
`git add server/src/db/schema.ts server/test/db.test.ts && git commit -m "feat(db): v6 anchor_usage table + library.anchor_retired"`

---

### Task 2: anchorService — log + fatigue score + retired flag

**Files:**
- Create: `server/src/services/anchorService.ts`
- Test: `server/test/anchorService.test.ts`

**Step 1: Write the failing test**
```ts
import { openDb, migrate } from "../src/db/connection.js";
import { memoryDb, seedEntry } from "./helpers.js";
import { describe, it, expect, beforeEach } from "vitest";
import {
  logAnchor,
  fatigueScores,
  setRetired,
  isRetired,
} from "../src/services/anchorService.js";

describe("anchorService", () => {
  let db: ReturnType<typeof openDb>;
  beforeEach(() => { db = memoryDb(); });

  it("logs an anchor and reports a higher fatigue score for recently over-used titles", () => {
    const now = Date.now();
    // Title A cited 5x in last 2 days; Title B cited once 30 days ago
    for (let i = 0; i < 5; i++) {
      db.prepare("INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)")
        .run(1, "movie", "compare_titles", now - i * 86_400_000);
    }
    db.prepare("INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)")
      .run(2, "movie", "compare_titles", now - 30 * 86_400_000);

    const scores = fatigueScores(db);
    expect(scores.get("movie:1")!).toBeGreaterThan(scores.get("movie:2")!);
    expect(scores.get("movie:1")!).toBeGreaterThan(0.5);
  });

  it("honors the retired flag independently of fatigue", () => {
    const e = seedEntry(db, { tmdbId: 7, mediaType: "movie", title: "LOTR" });
    expect(isRetired(db, 7, "movie")).toBe(false);
    setRetired(db, e.id, true);
    expect(isRetired(db, 7, "movie")).toBe(true);
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/anchorService.test.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation** (`server/src/services/anchorService.ts`)
```ts
import type { DB } from "../db/connection.js";

const WINDOW_MS = 14 * 86_400_000;
const HALF_LIFE_DAYS = 7;

export function logAnchor(db: DB, tmdbId: number, mediaType: string, surface: string): void {
  db.prepare(
    "INSERT INTO anchor_usage (tmdb_id, media_type, surface, created_at) VALUES (?,?,?,?)",
  ).run(tmdbId, mediaType, surface, Date.now());
}

export function fatigueScores(db: DB): Map<string, number> {
  const now = Date.now();
  const rows = db
    .prepare(
      `SELECT tmdb_id, media_type, created_at FROM anchor_usage
       WHERE created_at >= ?`,
    )
    .all(now - WINDOW_MS) as { tmdb_id: number; media_type: string; created_at: number }[];
  const totals = new Map<string, number>();
  const weighted = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.media_type}:${r.tmdb_id}`;
    const ageDays = (now - r.created_at) / 86_400_000;
    const w = Math.exp(-ageDays / HALF_LIFE_DAYS);
    weighted.set(key, (weighted.get(key) ?? 0) + w);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  const out = new Map<string, number>();
  for (const [key, w] of weighted) {
    const norm = w / Math.max(1, (totals.get(key) ?? 1));
    out.set(key, Math.round(norm * 100) / 100);
  }
  return out;
}

export function setRetired(db: DB, libraryId: number, retired: boolean): void {
  db.prepare("UPDATE library SET anchor_retired = ? WHERE id = ?").run(retired ? 1 : 0, libraryId);
}

export function isRetired(db: DB, tmdbId: number, mediaType: string): boolean {
  const row = db
    .prepare(
      `SELECT l.anchor_retired AS r FROM library l JOIN titles t ON t.id = l.title_id
       WHERE t.tmdb_id = ? AND t.media_type = ? LIMIT 1`,
    )
    .get(tmdbId, mediaType) as { r: number } | undefined;
  return !!row && row.r === 1;
}
```

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/anchorService.test.ts`
Expected: PASS

**Step 5: Commit**
`git add server/src/services/anchorService.ts server/test/anchorService.test.ts && git commit -m "feat(anchor): logAnchor + recency-weighted fatigueScores + retired flag"`

---

### Task 3: tasteProfile.annotateFatigued — keep loved, pivot framing

**Files:**
- Modify: `server/src/rag/tasteProfile.ts` (add field to `TasteProfile`, use in `renderTasteProfile`)
- Test: `server/test/rag.test.ts` (extend the "RAG layer 1 — taste profile" describe block — NOTE: there is NO `tasteProfile.test.ts`; the profile tests live in `rag.test.ts`)

**Step 1: Write the failing test** (add to the existing `describe("RAG layer 1 — taste profile", ...)` block in `server/test/rag.test.ts`)
```ts
// (rag.test.ts already imports computeTasteProfile, renderTasteProfile, memoryDb, seedEntry)

import { describe, it, expect } from "vitest";
import { logAnchor } from "../src/services/anchorService.js";

describe("tasteProfile fatigue annotation", () => {
  it("keeps a fatigued loved title in the profile but marks it pivot-only", () => {
    const db = memoryDb();
    const e = seedEntry(db, { tmdbId: 7, mediaType: "movie", title: "LOTR", rating: 10, favorite: true });
    const now = Date.now();
    for (let i = 0; i < 5; i++)
      db.prepare("INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)")
        .run(7, "movie", "compare_titles", now - i * 86_400_000);

    const p = computeTasteProfile(db);
    const text = renderTasteProfile(p);
    expect(text).toContain("LOTR");           // still in profile
    expect(text).toMatch(/pivot|avoid referencing|fresh/i); // diversifier directive present
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `cd server && npx vitest run test/rag.test.ts -t "keeps a fatigued loved"`
Expected: FAIL — no pivot directive in rendered profile.

**Step 3: Write minimal implementation**
In `tasteProfile.ts`, import `fatigueScores` from `../services/anchorService.js`. In `renderTasteProfile`, after building `lovedTitles` line, append a diversifier note when fatigued titles exist:
```ts
const fatigue = fatigueScores(db);
const fatiguedLoved = p.lovedTitles.filter((t) => (fatigue.get(`${t.mediaType}:${t.tmdbId}`) ?? 0) >= 0.6);
if (fatiguedLoved.length) {
  lines.push(
    `Diversify: the user has seen ${fatiguedLoved.map((t) => t.title).join(", ")} used as comparisons a lot — ` +
    `pivot framing to other shared genres or directors instead of re-citing these.`,
  );
}
```
(Keep the loved titles listed as normal — they remain in the profile.)

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/tasteProfile.test.ts`
Expected: PASS

**Step 5: Commit**
`git add server/src/rag/tasteProfile.ts server/test/rag.test.ts && git commit -m "feat(profile): annotate fatigued loved titles as pivot-only, keep in profile"`

---

### Task 4: compare_titles — prefer fresh anchors, log them

**Files:**
- Modify: `server/src/llm/tools.ts` (`compare_titles` ~line 571)
- Test: `server/test/tools.test.ts` (extend, mock `fetchDetailsFromTmdb`)

**Step 1: Write the failing test**
```ts
// mock TMDB detail fetch; seed two loved titles, fatigue one heavily
it("compare_titles avoids retired/fatigued anchors and logs chosen anchors", () => {
  // arrange: db with loved A (fatigued) + B (fresh); candidates include both
  // act: run toolHandler compare_titles
  // assert: returned candidate analysis references B more than A; anchor_usage has rows
});
```
(Concrete mock per existing `tools.test.ts` harness — follow its `fakeTmdb` pattern.)

**Step 2: Run test — confirm it fails**
Expected: FAIL — current code never logs or filters by fatigue/retired.

**Step 3: Write minimal implementation**
In `compare_titles` (tools.ts ~571): after building `profile`, compute
`const fatigue = fatigueScores(db);` and `const retired = (id, mt) => isRetired(db, id, mt);`.
When selecting which existing title to compare *against* (the "like X" hook), prefer
candidates where `!retired && fatigue.get(key) < 0.6`; if forced to use a fatigued one,
still include it but `logAnchor` only the *chosen* reference. Add `logAnchor(db, id, mt, "compare_titles")`
for the title actually used as the anchor in the response.

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/tools.test.ts -t "compare_titles"`
Expected: PASS

**Step 5: Commit**
`git add server/src/llm/tools.ts server/test/tools.test.ts && git commit -m "feat(tools): compare_titles prefers fresh anchors, logs chosen ones"`

---

### Task 5: insightService neighbors — exclude retired, down-rank fatigued, log

**Files:**
- Modify: `server/src/llm/insightService.ts` (~line 247 `retrieveLibrary` call)
- Test: `server/test/insightService.test.ts` (extend)

**Step 1: Write the failing test**
```ts
it("insight neighbors exclude retired titles and log chosen anchors", async () => {
  // seed library incl. a retired title that would otherwise be a top neighbor
  // generateInsight; assert retired title absent from neighborBlock and anchor_usage logged
});
```

**Step 2: Run test — confirm it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
After `const neighbors = retrieveLibrary(db, ...)` (insightService.ts ~247), filter:
```ts
const fatigue = fatigueScores(db);
const usable = neighbors.filter((n) => !isRetired(db, n.tmdbId, n.mediaType));
// down-rank fatigued for ordering, keep top by relevance but skip fatigued when fresh exist
const ordered = [...usable].sort((a, b) => {
  const fa = fatigue.get(`${a.mediaType}:${a.tmdbId}`) ?? 0;
  const fb = fatigue.get(`${b.mediaType}:${b.tmdbId}`) ?? 0;
  return fa - fb; // less fatigued first
});
for (const n of ordered.slice(0, 3)) logAnchor(db, n.tmdbId, n.mediaType, "insight_neighbors");
```
Use `ordered` in the `neighborBlock` map.

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/insightService.test.ts`
Expected: PASS

**Step 5: Commit**
`git add server/src/llm/insightService.ts server/test/insightService.test.ts && git commit -m "feat(insight): exclude retired neighbors, down-rank fatigued, log anchors"`

---

### Task 6: library routes + client API — retire endpoint

**Files:**
- Modify: `server/src/routes/library.ts` (add `POST /api/library/:id/retire-anchor`, `DELETE`)
- Modify: `client/src/lib/api.ts` (add `retireAnchor`, `unretireAnchor`)
- Modify: `client/src/lib/types.ts` (if needed for response)
- Test: `server/test/library.test.ts` (extend)

**Step 1: Write the failing test**
```ts
it("POST /api/library/:id/retire-anchor sets anchor_retired and DELETE clears it", async () => {
  // seed entry, POST retire, assert isRetired true via db; DELETE, assert false
});
```

**Step 2: Run test — confirm it fails**
Expected: FAIL — route not found.

**Step 3: Write minimal implementation**
In `library.ts` (mirror existing `PATCH`/`ignoreTitle` route style):
```ts
router.post("/:id/retire-anchor", (req, res) => {
  setRetired(db, Number(req.params.id), true);
  res.json({ retired: true });
});
router.delete("/:id/retire-anchor", (req, res) => {
  setRetired(db, Number(req.params.id), false);
  res.json({ retired: false });
});
```
Client `api.ts`: add `retireAnchor(id)` → `fetchJson(\`/api/library/${id}/retire-anchor\`, { method: "POST" })` and `unretireAnchor(id)` → DELETE.

**Step 4: Run test — confirm it passes**
Command: `cd server && npx vitest run test/library.test.ts -t "retire-anchor"`
Expected: PASS

**Step 5: Commit**
`git add server/src/routes/library.ts client/src/lib/api.ts client/src/lib/types.ts server/test/library.test.ts && git commit -m "feat(api): retire-as-anchor endpoint + client calls"`

---

### Task 7: client UI — Retire toggle + passive over-used hint

**Files:**
- Modify: `client/src/components/PosterCard.tsx`
- Modify: `client/src/pages/Settings.tsx` (ignored/anchor section)
- Test: reuse existing component tests if present; otherwise manual verify build

**Step 1: Write the failing test**
(If a `PosterCard` test exists) assert a "Retire as anchor" action appears on library-owned cards and calls `retireAnchor`. If none exists, skip automated test and rely on `npm run build` + manual note.

**Step 2: Run test — confirm it fails** (or note "no component test harness")

**Step 3: Write minimal implementation**
- `PosterCard.tsx`: when `inLibrary`, add a "Retire as anchor" / "Anchor active" toggle next to Ignore in the hover bubble (or library context menu). On click → `retireAnchor(id)` / `unretireAnchor(id)`; reflect state.
- Over-used hint: a passive, static ribbon shown only when a fatigue signal crosses threshold (client receives `fatigue` flag from a new `GET /api/library/:id/fatigue` or from the profile payload). **Static only — no popup, no notification.**
- `Settings.tsx`: list retired titles with an "un-retire" action, parallel to the ignored-titles list.

**Step 4: Run test — confirm it passes** (or `cd client && npm run build` succeeds)
Command: `cd client && npm run typecheck && npm run build`
Expected: PASS / build OK

**Step 5: Commit**
`git add client/src/components/PosterCard.tsx client/src/pages/Settings.tsx && git commit -m "feat(ui): retire-as-anchor toggle + passive over-used hint"`

---

### Task 8: Full verification + integration assertions

**Files:**
- Test: `server/test/antiFatigue.integration.test.ts` (NEW)

**Step 1: Write the failing test**
```ts
it("retired title never surfaces as an anchor in any surface", () => {
  // seed: loved A retired, loved B fresh, fatigue A high
  // assert: renderTasteProfile diversifier lists A as pivot-only;
  //         compare_titles never logs A; insight neighbors exclude A
});
it("fatigue threshold gates the over-used hint (rarely cited => no hint)", () => {
  // cite A twice -> fatigue < 0.6 -> hint flag false
});
```

**Step 2: Run test — confirm it fails**
Expected: FAIL (assertions not yet satisfied end-to-end)

**Step 3: Write minimal implementation**
Wire any missing glue (e.g. expose `fatigue` on the library/profile payload consumed by the client hint). Ensure all surfaces call `isRetired`/`fatigueScores`.

**Step 4: Run full suite**
Command: `cd server && npm test && npm run typecheck && cd ../client && npm run typecheck && npm run build`
Expected: ALL PASS

**Step 5: Commit**
`git add -A && git commit -m "test(anti-fatigue): integration assertions for retire + fatigue gating"`

---

## Anti-notification-fatigue constraints (apply to every task)
- No proactive chat messages or notifications from fatigue logic.
- Auto-diversify is silent (no "I switched anchors" announcement).
- Over-used hint is a static, threshold-gated card state — never a popup/banner/digest.
- Retire is one-tap, one-time; no reminders.

## Out of scope (YAGNI)
- For-you feed card framing variation.
- Genre-level fatigue (genre-exclude already covers genre boredom).
- Autonomous hiding of titles the system deems fatigued.
