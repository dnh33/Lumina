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
 *
 * STREAMING FENCE SUPPRESSION (anti-slop facelift):
 *  - When `streaming` is true and the text contains an ODD number of ``` fence
 *    markers (i.e. a fence is open but not yet closed), we strip the content
 *    inside the open fence from the text passed to Streamdown. This prevents
 *    raw JSON payloads (```json { "items": [...] }) from flashing mid-stream
 *    before the model has finished emitting the closing ```.
 *  - Once the fence closes (even count of ```), all text renders normally.
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

/**
 * Match a fenced code block: ``` + optional language tag + newline.
 * Using this regex (instead of counting raw ```) prevents false pairing when
 * JSON content itself contains inner ``` sequences (e.g. a code example string
 * inside a JSON field value). Only real fence openers are counted.
 */
const FENCE_LINE_RE = /^```[a-zA-Z0-9_-]*\s*$/gm;

/**
 * Count real fenced code block openers in the text. If odd, a fence is open
 * and its raw content (typically JSON payloads) should be suppressed during
 * streaming. Using FENCE_LINE_RE instead of raw ``` counts prevents false
 * pairing when JSON content contains inner backtick sequences.
 */
export function countFences(text: string): number {
  const matches = text.match(FENCE_LINE_RE);
  return matches ? matches.length : 0;
}

/**
 * Strip the content of any currently-open fence from the text so raw JSON
 * payloads don't flash during streaming. Prose before the fence opener and
 * after a closed fence renders normally. If the fence is still open, everything
 * from its opener to end-of-text is removed.
 *
 * Uses `trimEnd()` to avoid leaving a trailing blank line where the fence was.
 * This is a pure function — safe to call on every token flush.
 */
export function stripOpenFence(text: string): string {
  const fenceCount = countFences(text);
  if (fenceCount % 2 === 0) return text; // all fences paired — nothing to strip

  // Odd count: find the last (unclosed) fence opener and cut everything after it.
  // We search for the last line matching ``` + optional lang tag.
  const lines = text.split("\n");
  let lastFenceIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (FENCE_LINE_RE.test(lines[i] ?? "")) {
      lastFenceIdx = i;
      break;
    }
    // Reset lastIndex since FENCE_LINE_RE is global
    FENCE_LINE_RE.lastIndex = 0;
  }
  if (lastFenceIdx === -1) return text;
  return lines.slice(0, lastFenceIdx).join("\n").trimEnd();
}

interface Props {
  /** Accumulated markdown text (may be mid-stream / unterminated). */
  content: string;
  /** Tailwind/utility className for the wrapper. */
  className?: string;
  /** When true and a fence is open, suppress raw content inside it. */
  streaming?: boolean;
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  className,
  streaming = false,
}: Props) {
  // T2 — decouple parse priority from render so urgent interaction stays smooth.
  const deferred = useDeferredValue(content, "");
  const processed = useMemo(() => {
    const prepared = streaming ? stripOpenFence(deferred) : deferred;
    return preprocessMarkdown(prepared);
  }, [deferred, streaming]);

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
