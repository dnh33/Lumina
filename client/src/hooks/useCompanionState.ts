/**
 * useCompanionState — the presence state machine for Lumina's SparkAvatar.
 *
 * A PURE reducer drives a small state union. It is deliberately decoupled from
 * React so it can be unit-tested as a plain function (Task 4). The hook is a
 * thin `useReducer` wrapper that the streaming layer (wave 3) will dispatch
 * events into as SSE `context → tool → delta → done/error` events arrive.
 *
 * State vocabulary (design cluster A, presence P2/P4/P14):
 *   idle     — breathing core, "alive but calm"
 *   thinking — thought ripples (reasoning / retrieval)
 *   tooling  — satellite orbit + per-step beads (a tool is actively running)
 *   writing  — comet trail riding the caret (tokens streaming)
 *   error    — desaturated + red-gold fault-line (honest failure, no shake)
 */

import { useReducer } from "react";

export type CompanionState =
  | "idle"
  | "thinking"
  | "tooling"
  | "writing"
  | "error";

/**
 * Events the streaming layer emits.
 * - TOOL          — a tool call was requested (idle → thinking).
 * - TOOL_RUNNING  — a tool is now executing (→ tooling; orbit + beads).
 * - DELTA         — a token arrived (first delta flips into writing).
 * - DONE          — the turn finished (→ idle).
 * - ERROR         — anything failed (any → error).
 * - RESET         — a new turn begins / error dismissed (→ idle).
 */
export type CompanionEvent =
  | { type: "TOOL" }
  | { type: "TOOL_RUNNING" }
  | { type: "DELTA" }
  | { type: "DONE" }
  | { type: "ERROR" }
  | { type: "RESET" };

export const initialCompanionState: CompanionState = "idle";

/**
 * Pure transition function. Unknown/no-op transitions return the current
 * state unchanged (never throws) so the machine is resilient to event
 * ordering quirks in the SSE stream.
 */
export function reducer(
  state: CompanionState,
  event: CompanionEvent,
): CompanionState {
  // ERROR and RESET are global transitions valid from ANY state.
  switch (event.type) {
    case "ERROR":
      return "error";
    case "RESET":
      return "idle";
    default:
      break;
  }

  switch (state) {
    case "idle":
      if (event.type === "TOOL") return "thinking";
      if (event.type === "TOOL_RUNNING") return "tooling";
      if (event.type === "DELTA") return "writing";
      return state;

    case "thinking":
      if (event.type === "TOOL_RUNNING") return "tooling";
      if (event.type === "DELTA") return "writing";
      return state;

    case "tooling":
      if (event.type === "DELTA") return "writing";
      return state;

    case "writing":
      if (event.type === "DONE") return "idle";
      // Subsequent DELTAs keep us writing.
      return state;

    case "error":
      // A new turn can begin directly (TOOL) or be reset.
      if (event.type === "TOOL") return "thinking";
      if (event.type === "TOOL_RUNNING") return "tooling";
      if (event.type === "DELTA") return "writing";
      return state;

    default:
      return state;
  }
}

export interface UseCompanionState {
  state: CompanionState;
  dispatch: (event: CompanionEvent) => void;
}

/** Thin React wrapper around the pure reducer. */
export function useCompanionState(
  initial: CompanionState = initialCompanionState,
): UseCompanionState {
  const [state, dispatch] = useReducer(reducer, initial);
  return { state, dispatch };
}
