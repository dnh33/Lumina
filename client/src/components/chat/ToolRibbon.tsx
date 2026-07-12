import type { ToolStep } from "./useChat";
import { ToolTrace, type ToolTraceNode } from "./ToolTrace";

/**
 * ToolRibbon — public API preserved: `{ steps: ToolStep[] }`.
 *
 * Thin wrapper that forwards the existing `ToolStep[]` shape into the new
 * ToolTrace rail. ToolStep carries `{ name, done }` today; `summary` is
 * populated by useChat in the wiring task (Wave 3). Until then, nodes fall
 * back to showing the tool `name` as the chip label — the API is unchanged.
 */
export function ToolRibbon({ steps }: { steps: ToolStep[] }) {
  const nodes: ToolTraceNode[] = steps.map((s) => ({
    name: s.name,
    done: s.done,
    summary: s.summary ?? undefined,
  }));
  return <ToolTrace steps={nodes} />;
}
