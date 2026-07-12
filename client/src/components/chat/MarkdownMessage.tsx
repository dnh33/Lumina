/**
 * MarkdownMessage — flicker-free streaming markdown renderer (Task 3, T1/T2/T3/T4).
 *
 * ENGINE CHOICE (spike documented per plan §Task 3):
 * We SPIKED `streamdown` (Vercel) first. It installed cleanly beside
 * react-markdown@10 + React 19 (peer `^18 || ^19`, resolved to 2.5.0) with NO
 * peer-dep conflict and ships `remend` "unterminated block parsing" built in —
 * exactly the flicker-killer T1 calls for. assistant-ui's `MarkdownTextPrimitive`
 * was the documented fallback; it was NOT needed. We therefore use Streamdown
 * (`mode="streaming"`, `remarkPlugins={[remarkGfm]}`) and port Lumina's existing
 * `.prose-lumina` `components` (SmartLink / spoiler veil) over so the visual
 * language is preserved.
 *
 * ANTI-FLICKER STRATEGY:
 *  - T1: Streamdown tolerates unterminated `**`/`##`/open fences, so the AST no
 *    longer flips shape every token → no raw-syntax flash.
 *  - T2: raw text is piped through `useDeferredValue(raw, "")` so parse work is
 *    deprioritized under load and never blocks typing/scroll.
 *  - T4: `preprocess()` normalizes stray LaTeX/`$` before parse so a stray `$`
 *    can't mis-parse into a broken math span mid-stream.
 */
import { memo, useDeferredValue, useMemo } from "react";
import { Streamdown, type Components } from "streamdown";
import remarkGfm from "remark-gfm";

import { SmartLink } from "./MessageBubble.ports";

const FLICKER_FREE_COMPONENTS: Components = {
  a: SmartLink as Components["a"],
};

/**
 * T4 — normalize model quirks on the full accumulated text before parse.
 * Prevents mid-stream mis-parses (e.g. a stray `$` flipping text into a broken
 * math span). Pure, side-effect free, runs on full text only.
 */
export function preprocessMarkdown(text: string): string {
  let out = text;
  // Normalize \( ... \) / \[ ... \] LaTeX delimiters to $...$ / $$...$$
  out = out.replace(/\\\(/g, "$").replace(/\\\)/g, "$");
  out = out.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");
  // Rewrite custom [math]...[/math] tags to $$...$$
  out = out.replace(/\[math\]/gi, "$$").replace(/\[\/math\]/gi, "$$");
  // Escape a lone currency "$5" only when it is NOT part of a math pair.
  out = out.replace(/(?<!\$)\$(\d+(?:\.\d{1,2})?)(?!\$)/g, "$$$$$1");
  return out;
}

interface Props {
  /** Accumulated markdown text (may be mid-stream / unterminated). */
  content: string;
  /** Tailwind/utility className for the wrapper. */
  className?: string;
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  className,
}: Props) {
  // T2 — decouple parse priority from render so urgent interaction stays smooth.
  const deferred = useDeferredValue(content, "");
  const processed = useMemo(() => preprocessMarkdown(deferred), [deferred]);

  return (
    <div className={className ?? "prose-lumina"}>
      <Streamdown
        mode="streaming"
        remarkPlugins={[remarkGfm]}
        components={FLICKER_FREE_COMPONENTS}
        parseIncompleteMarkdown
        className="contents"
      >
        {processed}
      </Streamdown>
    </div>
  );
});
