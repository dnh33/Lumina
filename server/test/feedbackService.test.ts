import { describe, it, expect, beforeEach } from "vitest";
import { memoryDb } from "./helpers.js";
import { migrate } from "../src/db/schema.js";
import {
  recordSignal,
  getSignals,
  renderTasteSignals,
  type SignalKind,
} from "../src/services/feedbackService.js";

describe("Taste Feedback Loop", () => {
  let db = memoryDb();
  beforeEach(() => {
    db = memoryDb();
    migrate(db);
  });

  it("records and retrieves a signal", () => {
    const s = recordSignal(db, "avoid_genre" as SignalKind, "slow-burn noir", "too grim for a Tuesday");
    expect(s.id).toBeGreaterThan(0);
    expect(s.kind).toBe("avoid_genre");
    expect(s.target).toBe("slow-burn noir");
    const all = getSignals(db);
    expect(all).toHaveLength(1);
    expect(all[0].reason).toBe("too grim for a Tuesday");
  });

  it("trims over-long target/reason", () => {
    const longTarget = "x".repeat(500);
    const s = recordSignal(db, "preference", longTarget);
    expect(s.target.length).toBeLessThanOrEqual(200);
  });

  it("renders nothing when empty", () => {
    expect(renderTasteSignals(db)).toBe("");
  });

  it("renders signals as a context block", () => {
    recordSignal(db, "avoid_title", "No Country for Old Men");
    recordSignal(db, "correction", "the 1998 remake", "not the 2008 one");
    const block = renderTasteSignals(db);
    expect(block).toContain("## Stated taste signals");
    expect(block).toContain("avoid title: No Country for Old Men");
    expect(block).toContain("correction: the 1998 remake — not the 2008 one");
  });
});
