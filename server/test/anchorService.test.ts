import { memoryDb, seedEntry } from "./helpers.js";
import { describe, it, expect } from "vitest";
import {
  logAnchor,
  fatigueScores,
  setRetired,
  isRetired,
  setAnchorLoggingEnabled,
  isAnchorLoggingEnabled,
} from "../src/services/anchorService.js";

const DAY = 86_400_000;

describe("anchorService", () => {
  it("logs anchors and scores recently over-used titles higher", () => {
    const db = memoryDb();
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      db.prepare(
        "INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)",
      ).run(1, "movie", "compare_titles", now - i * DAY);
    }
    db.prepare(
      "INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)",
    ).run(2, "movie", "compare_titles", now - 30 * DAY);

    const scores = fatigueScores(db);
    // movie:1 has 5 recent citations → over-used and above threshold.
    expect(scores.get("movie:1")!).toBeGreaterThan(0.5);
    // movie:2 has a single old citation → below the 3-citation floor,
    // so it is NOT flagged (a lone comparison is variety, not fatigue).
    expect(scores.get("movie:2")).toBeUndefined();
  });

  it("honors the retired flag independently of fatigue", () => {
    const db = memoryDb();
    const libId = seedEntry(db, { tmdbId: 7, mediaType: "movie", title: "LOTR" });
    expect(isRetired(db, 7, "movie")).toBe(false);
    setRetired(db, libId, true);
    expect(isRetired(db, 7, "movie")).toBe(true);
  });

  it("respects the anchor-logging opt-out (logAnchor is a no-op when disabled)", () => {
    const db = memoryDb();
    setAnchorLoggingEnabled(db, false);
    expect(isAnchorLoggingEnabled(db)).toBe(false);
    logAnchor(db, 1, "movie", "take");
    const rows = db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number };
    expect(rows.c).toBe(0);

    setAnchorLoggingEnabled(db, true);
    expect(isAnchorLoggingEnabled(db)).toBe(true);
    logAnchor(db, 1, "movie", "take");
    const rows2 = db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number };
    expect(rows2.c).toBe(1);
  });
});
