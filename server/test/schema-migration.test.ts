import { createDb } from "../src/db/connection.js";
import { describe, it, expect } from "vitest";

describe("v6 schema migration", () => {
  it("creates anchor_usage table and adds library.anchor_retired column", () => {
    const db = createDb(":memory:");
    const cols = db.prepare("PRAGMA table_info(library)").all() as { name: string }[];
    expect(cols.some((c) => c.name === "anchor_retired")).toBe(true);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='anchor_usage'")
      .get();
    expect(row).toBeTruthy();
    db.close();
  });
});
