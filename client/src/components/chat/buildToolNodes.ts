/**
 * buildToolNodes — pure helper that turns the SSE tool-step stream into the
 * shape ToolTrace/ToolRibbon render (Task 7 / Wave 3).
 *
 * Kept as a PURE, exported function so it is unit-testable independent of the
 * React hook (the `useChat.test.ts` contract). It must stay side-effect free
 * and never throw on odd ordering.
 *
 * The companion `stopped` flag is also derived here as a pure helper so the
 * "abort freezes the partial text + sets stopped" behaviour can be asserted in
 * isolation (T14 / T15 graceful stop).
 */

import type { ToolStep } from "./useChat";

/** Minimal node shape accepted by ToolTrace (mirrors ToolTraceNode). */
export interface ToolNode {
  name: string;
  done: boolean;
  summary?: string;
}

/** Map a list of in-flight ToolStep (name/done) into ToolTrace nodes. */
export function buildToolNodes(steps: ToolStep[]): ToolNode[] {
  return steps.map((s) => ({ name: s.name, done: s.done }));
}

/**
 * Derive whether the partial turn is "stopped" for display.
 *
 * Rules (graceful stop, T14/T15):
 *  - The turn is only "stopped" once it is no longer streaming AND a stop was
 *    requested (stopping === true). A live turn is never "stopped", even mid
 *    abort, so the footer doesn't flash.
 *  - edit+resend clears `stopping` (a fresh `send()` resets StreamState), so
 *    `stopped` reverts to false and the frozen message is not duplicated.
 */
export function deriveStopped(
  streaming: boolean,
  stopping: boolean,
): boolean {
  return !streaming && stopping;
}
