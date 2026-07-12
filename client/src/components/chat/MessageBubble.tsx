import { memo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Lock } from "lucide-react";
import { SuggestionCards } from "./SuggestionCards";
import { MarkdownMessage } from "./MarkdownMessage";
import type { SuggestionItem } from "../../lib/types";

const SUGGESTION_RE = /```lumina-suggestions\s*([\s\S]*?)```/;
const FOLLOWUP_RE = /```lumina-followups\s*([\s\S]*?)```/;
// any still-streaming or never-terminated lumina fence: hide, never show raw
const PARTIAL_FENCE_RE = /```lumina-[a-z]*[\s\S]*$/;

export interface ParsedMessage {
  text: string;
  items: SuggestionItem[];
  chips: string[];
}

export function parseMessage(content: string): ParsedMessage {
  let text = content;
  let items: SuggestionItem[] = [];
  let chips: string[] = [];

  const sug = text.match(SUGGESTION_RE);
  if (sug) {
    try {
      const parsed = JSON.parse(sug[1]) as { items?: SuggestionItem[] };
      items = (parsed.items ?? [])
        .filter(
          (i) =>
            typeof i.tmdbId === "number" &&
            (i.mediaType === "movie" || i.mediaType === "tv"),
        );
    } catch {
      /* malformed block, hide it anyway */
    }
    text = text.replace(SUGGESTION_RE, "");
  }

  const fu = text.match(FOLLOWUP_RE);
  if (fu) {
    try {
      const parsed = JSON.parse(fu[1]) as { chips?: string[] };
      chips = (parsed.chips ?? [])
        .map((c) => String(c).trim())
        .filter((c) => c.length > 0 && c.length <= 40)
        .slice(0, 3);
    } catch {
      /* hide */
    }
    text = text.replace(FOLLOWUP_RE, "");
  }

  // unterminated trailing fence (stopped turns, streaming) — never show raw
  text = text.replace(PARTIAL_FENCE_RE, "").trim();
  return { text, items, chips };
}

/** ||spoiler|| → inline tap-to-reveal veil (via a link-syntax trampoline). */
function veilEncode(text: string): string {
  return text.replace(
    /\|\|([^|]+?)\|\|/g,
    (_m, s: string) => `[spoiler](#veil-${encodeURIComponent(s)})`,
  );
}

function SpoilerVeil({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return (
      <span className="rounded bg-gold-400/[0.08] px-1 text-mist-200">
        {text}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      title="Spoiler — tap to reveal"
      aria-label="Hidden spoiler, activate to reveal"
      className="mx-0.5 inline-flex cursor-pointer items-center gap-1 rounded bg-ink-700 px-1.5 align-baseline text-[0.85em] text-transparent ring-1 ring-gold-400/25 transition hover:ring-gold-400/50 [text-shadow:0_0_9px_rgba(205,205,217,0.9)] select-none"
    >
      <Lock className="h-3 w-3 text-gold-400/80 [text-shadow:none]" aria-hidden />
      {text}
    </button>
  );
}

/**
 * Some models write raw links to app pages despite instructions.
 * Render internal /title & /person links as tidy chips, veils inline,
 * external links safely in a new tab.
 */
function SmartLink({ href, children }: { href?: string; children?: ReactNode }) {
  if (!href) return <>{children}</>;
  if (href.startsWith("#veil-")) {
    return <SpoilerVeil text={decodeURIComponent(href.slice(6))} />;
  }
  let path: string | null = null;
  try {
    const url = new URL(href, window.location.origin);
    if (/^\/(title\/(movie|tv)\/\d+|person\/\d+)$/.test(url.pathname)) {
      path = url.pathname;
    }
  } catch {
    /* not a URL */
  }
  if (path) {
    return (
      <Link
        to={path}
        className="mx-0.5 inline-flex items-center gap-1 rounded-md bg-gold-400/[0.12] px-1.5 py-0.5 align-baseline text-[0.85em] font-medium text-gold-300 no-underline ring-1 ring-gold-400/25 transition hover:bg-gold-400/20"
      >
        <Clapperboard className="h-3 w-3" />
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

interface Props {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** tap handler for follow-up chips (settled assistant turns only) */
  onChip?: (chip: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  streaming,
  onChip,
}: Props) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gold-400/[0.13] px-4 py-2.5 text-[0.95rem] leading-relaxed text-mist-200 ring-1 ring-gold-400/25">
          {content}
        </div>
      </div>
    );
  }

  const { text, items, chips } = parseMessage(content);

  return (
    <div className="min-w-0 break-words">
      {streaming ? (
        <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-mist-200">
          {text}
          <span
            aria-hidden
            className="ml-0.5 inline-block h-4 w-[2px] animate-pulse-soft bg-gold-400 align-middle"
          />
        </p>
      ) : (
        // Wave 3: flicker-free streaming-safe renderer (Task 3). SmartLink +
        // spoiler veil are ported into MarkdownMessage via MessageBubble.ports.
        <MarkdownMessage content={text} className="prose-lumina" />
      )}

      {items.length > 0 && !streaming && <SuggestionCards items={items} />}

      {chips.length > 0 && !streaming && onChip && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChip(c)}
              className="cursor-pointer rounded-full bg-white/[0.05] px-3 py-1.5 text-2xs font-medium text-mist-300 ring-1 ring-white/10 transition hover:bg-gold-400/15 hover:text-gold-300 hover:ring-gold-400/30"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
