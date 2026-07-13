import type { ToolStep } from "./useChat";
import { ToolTrace } from "./ToolTrace";
import { buildToolNodes } from "./buildToolNodes";

/**
 * ToolRibbon — public API preserved: `{ steps: ToolStep[] }`.
 *
 * Thin wrapper that forwards the existing `ToolStep[]` shape into the
 * ToolTrace rail via the pure `buildToolNodes` mapper (name/done/summary
 * plus the server-streamed `detail` argument and `outcome` digest).
 */
export function ToolRibbon({ steps }: { steps: ToolStep[] }) {
  return <ToolTrace steps={buildToolNodes(steps)} />;
}
