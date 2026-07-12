/**
 * Shared markdown presentation helpers for chat messages.
 *
 * Extracted from MessageBubble so both the legacy react-markdown render and the
 * new flicker-free MarkdownMessage (Streamdown) can share the SAME link/veil
 * behavior — keeping Lumina's visual language identical across renderers.
 *
 * NOTE: created during the Wave-1 foundation task. MessageBubble.tsx still uses
 * its inline copies; a later task (Wave 3) will point MessageBubble at these so
 * there is a single source of truth. This file does not change MessageBubble.
 */
import { memo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Lock } from "lucide-react";

/** ||spoiler|| → inline tap-to-reveal veil (via a link-syntax trampoline). */
export function veilEncode(text: string): string {
  return text.replace(
    /\|\|([^|]+?)\|\|/g,
    (_m, s: string) => `[spoiler](#veil-${encodeURIComponent(s)})`,
  );
}

export function SpoilerVeil({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return (
      <span className="rounded bg-gold-400/[0.08] px-1 text-mist-200">{text}</span>
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
 * Renders internal /title & /person links as tidy gold chips, spoilers inline,
 * external links safely in a new tab. Keeps Lumina's link language consistent.
 */
export function SmartLink({ href, children }: { href?: string; children?: ReactNode }) {
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

/** Memoized so per-token re-renders skip unchanged nodes (T3). */
export const MemoSmartLink = memo(SmartLink);
