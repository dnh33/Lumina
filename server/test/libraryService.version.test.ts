import { describe, it, expect } from "vitest";
import { memoryDb, seedEntry } from "./helpers.js";
import { libraryVersion } from "../src/services/libraryService.js";

describe("libraryVersion (Task 4.4 — world reconcile signature)", () => {
  it("returns { version, count } describing the library state", () => {
    const db = memoryDb();

    // Empty library → null version + zero count.
    expect(libraryVersion(db)).toEqual({ version: null, count: 0 });

    const older = seedEntry(db, { tmdbId: 1, mediaType: "movie", title: "Older" });
    const newer = seedEntry(db, { tmdbId: 2, mediaType: "tv", title: "Newer" });

    // Pin deterministic updated_at values so the signature is assertable
    // (seedEntry sets watched_at, not updated_at — updated_at is the mutation
    // clock the signature tracks). The library table keys on `id`, not tmdb_id.
    db.prepare("UPDATE library SET updated_at = '2025-01-01' WHERE id = ?").run(older);
    db.prepare("UPDATE library SET updated_at = '2026-03-15' WHERE id = ?").run(newer);

    const v = libraryVersion(db);
    expect(v.count).toBe(2);
    // version is the MAX(updated_at) — the most-recently touched row.
    expect(v.version).toBe("2026-03-15");
  });

  it("version advances as the library is mutated", () => {
    const db = memoryDb();
    const id = seedEntry(db, { tmdbId: 5, mediaType: "movie", title: "A" });
    db.prepare("UPDATE library SET updated_at = '2024-06-01' WHERE id = ?").run(id);

    const first = libraryVersion(db);
    expect(first).toEqual({ version: "2024-06-01", count: 1 });

    // Bumping updated_at moves the signature forward.
    db.prepare("UPDATE library SET updated_at = '2027-09-09' WHERE id = ?").run(id);
    const second = libraryVersion(db);
    expect(second).toEqual({ version: "2027-09-09", count: 1 });
  });
});
