import { describe, expect, it } from "vitest";
import {
  reducer,
  initialCompanionState,
  type CompanionState,
} from "./useCompanionState";

describe("useCompanionState reducer (Task 4 — pure state machine)", () => {
  it("starts idle", () => {
    expect(initialCompanionState).toBe("idle");
  });

  it("idle -> thinking on a TOOL/tool event", () => {
    expect(reducer("idle", { type: "TOOL" })).toBe("thinking");
  });

  it("thinking -> writing on the first DELTA", () => {
    expect(reducer("thinking", { type: "DELTA" })).toBe("writing");
  });

  it("writing -> idle on DONE", () => {
    expect(reducer("writing", { type: "DONE" })).toBe("idle");
  });

  it("ANY state -> error on ERROR", () => {
    const states: CompanionState[] = [
      "idle",
      "thinking",
      "tooling",
      "writing",
      "error",
    ];
    for (const s of states) {
      expect(reducer(s, { type: "ERROR" })).toBe("error");
    }
  });

  it("error -> idle on RESET (new turn)", () => {
    expect(reducer("error", { type: "RESET" })).toBe("idle");
  });

  it("error -> thinking when a new turn begins with a TOOL event", () => {
    expect(reducer("error", { type: "TOOL" })).toBe("thinking");
  });

  it("reaches the tooling state on a TOOL_RUNNING event (active tool)", () => {
    expect(reducer("thinking", { type: "TOOL_RUNNING" })).toBe("tooling");
    expect(reducer("idle", { type: "TOOL_RUNNING" })).toBe("tooling");
  });

  it("tooling -> writing on first DELTA, then -> idle on DONE", () => {
    const w = reducer("tooling", { type: "DELTA" });
    expect(w).toBe("writing");
    expect(reducer(w, { type: "DONE" })).toBe("idle");
  });

  it("RESET from any state returns to idle", () => {
    const states: CompanionState[] = [
      "idle",
      "thinking",
      "tooling",
      "writing",
      "error",
    ];
    for (const s of states) {
      expect(reducer(s, { type: "RESET" })).toBe("idle");
    }
  });

  it("is pure — does not mutate its input and is stable for unknown/no-op transitions", () => {
    // A DONE while idle is a no-op (stays idle), not a throw.
    expect(reducer("idle", { type: "DONE" })).toBe("idle");
    // DELTA while writing keeps writing (subsequent tokens).
    expect(reducer("writing", { type: "DELTA" })).toBe("writing");
  });
});
