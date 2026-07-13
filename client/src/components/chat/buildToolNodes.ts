/**
 * buildToolNodes — pure helpers that turn the SSE tool-step stream into the
 * shape ToolTrace/ToolRibbon render (Task 7 / Wave 3).
 *
 * Kept as PURE, exported functions so they are unit-testable independent of
 * the React hook (the `useChat.test.ts` contract). They must stay side-effect
 * free and never throw on odd ordering.
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
  detail?: string;
  outcome?: string;
}

/** Map a list of in-flight ToolStep into ToolTrace nodes. */
export function buildToolNodes(steps: ToolStep[]): ToolNode[] {
  return steps.map((s) => ({
    name: s.name,
    done: s.done,
    summary: s.summary ?? undefined,
    detail: s.detail,
    outcome: s.outcome,
  }));
}

/** Past-tense verb per tool, for the collapsed one-line trace summary. */
export const PAST_LABELS: Record<string, string> = {
  search_library: "Read your library",
  get_taste_profile: "Studied your taste",
  search_tmdb: "Searched the catalog",
  get_title_details: "Pulled title details",
  discover_titles: "Browsed for gems",
  add_to_library: "Saved to your library",
  update_library_entry: "Updated your library",
  set_episode_progress: "Saved your progress",
  get_episode_progress: "Checked your progress",
  compare_titles: "Weighed your options",
  get_episode_recap: "Wrote your recap",
  check_continuing_series: "Checked your shows",
};

/** How many grouped segments the collapsed summary shows before "+n more". */
const MAX_SUMMARY_SEGMENTS = 3;

/**
 * Collapse a finished trace into one human line, grouping repeat calls:
 *   "Read your library · Searched the catalog ×5 · Pulled title details ×4"
 * Groups keep first-appearance order; beyond MAX_SUMMARY_SEGMENTS they fold
 * into "+n more". Returns "" for an empty trace.
 */
export function summarizeTrace(steps: Pick<ToolStep, "name">[]): string {
  const counts = new Map<string, number>();
  for (const s of steps) counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
  const parts = [...counts.entries()].map(
    ([name, n]) => `${PAST_LABELS[name] ?? name}${n > 1 ? ` ×${n}` : ""}`,
  );
  if (parts.length > MAX_SUMMARY_SEGMENTS) {
    const extra = parts.length - MAX_SUMMARY_SEGMENTS;
    return `${parts.slice(0, MAX_SUMMARY_SEGMENTS).join(" · ")} · +${extra} more`;
  }
  return parts.join(" · ");
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
