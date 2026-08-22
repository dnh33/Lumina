import { memo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Lock, Play } from "lucide-react";
import { SuggestionCards } from "./SuggestionCards";
import { MarkdownMessage } from "./MarkdownMessage";
import type { SuggestionItem } from "../../lib/types";

// Reject the *bare* ```json / ``` ``` fences that models sometimes emit when
// they forget the lumina- tag, but ONLY when they carry our suggestion/chip
// schema — those are rendered as cards, never as code. All other fences
// (real ```json config dumps, ```ts snippets the user pastes, etc.) pass through.
const FENCE_RE = /```([^\n]*)\n([\s\S]*?)```/g;

export interface ParsedMessage {
  text: string;
  items: SuggestionItem[];
  chips: string[];
}

/**
 * Extract poster-card suggestions + follow-up chips from a model reply.
 *
 * The system prompt asks for these as fenced JSON blocks tagged
 * `lumina-suggestions` / `lumina-followups`, but models frequently emit a
 * plain ```json fence instead (same `items`/`chips` schema). To be robust we
 * treat ANY fenced block whose parsed JSON contains `items` or `chips` as a
 * structured payload and render it as cards — never as a raw code block.
 */
export function parseMessage(content: string): ParsedMessage {
  let text = content;
  const items: SuggestionItem[] = [];
  const chips: string[] = [];

  // First pass: pull structured payloads out of any matching fence.
  text = text.replace(FENCE_RE, (_full, lang: string, body: string) => {
    let data: unknown;
    try {
      data = JSON.parse(body.trim());
    } catch {
      // Not JSON — leave the fence (markdown renders it as a code block).
      return _full;
    }
    if (typeof data !== "object" || data === null) return _full;
    const obj = data as Record<string, unknown>;

    let took = false;
    if (Array.isArray(obj.items)) {
      for (const raw of obj.items) {
        if (
          raw &&
          typeof raw === "object" &&
          typeof (raw as { tmdbId?: unknown }).tmdbId === "number" &&
          ((raw as { mediaType?: unknown }).mediaType === "movie" ||
            (raw as { mediaType?: unknown }).mediaType === "tv")
        ) {
          items.push(raw as SuggestionItem);
        }
      }
      took = true;
    }
    if (Array.isArray(obj.chips)) {
      for (const c of obj.chips) {
        const s = String(c).trim();
        if (s.length > 0 && s.length <= 40 && chips.length < 3) chips.push(s);
      }
      took = true;
    }
    // Absorbed into cards/chips — drop from the visible text entirely.
    return took ? "" : _full;
  });

  return { text: text.trim(), items, chips };
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
      {/* Always route through MarkdownMessage — Streamdown's parseIncompleteMarkdown
          handles unterminated fences. The streaming prop activates stripOpenFence()
          which suppresses raw JSON inside open fences (prevents the flash bug
          where { "items": [...] } leaks before the closing ``` arrives). */}
      <MarkdownMessage
        content={text}
        className="prose-lumina"
        streaming={streaming}
      />
      {!streaming && (
        <button
          type="button"
          title="Read aloud"
          aria-label="Read this reply aloud"
          onClick={() => {
            const evt = new CustomEvent("lum:speak", {
              detail: { text: content.replace(/```[a-z]*\n[\s\S]*?```/g, "").trim() },
            });
            window.dispatchEvent(evt);
          }}
          className="mt-2 flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-2xs font-medium text-mist-300 opacity-60 transition-opacity hover:opacity-100 hover:bg-gold-400/15 hover:text-gold-300"
        >
          <Play className="h-3 w-3" />
          Read aloud
        </button>
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
