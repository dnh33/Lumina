import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SuggestionCards } from "./SuggestionCards";
import type { SuggestionItem } from "../../lib/types";

const SUGGESTION_RE = /```lumina-suggestions\s*([\s\S]*?)```/;

export function parseSuggestions(content: string): {
  text: string;
  items: SuggestionItem[];
} {
  const match = content.match(SUGGESTION_RE);
  if (!match) return { text: content, items: [] };
  let items: SuggestionItem[] = [];
  try {
    const parsed = JSON.parse(match[1]) as { items?: SuggestionItem[] };
    items = (parsed.items ?? []).filter(
      (i) =>
        typeof i.tmdbId === "number" &&
        (i.mediaType === "movie" || i.mediaType === "tv"),
    );
  } catch {
    /* malformed block — hide it anyway */
  }
  return { text: content.replace(SUGGESTION_RE, "").trim(), items };
}

interface Props {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  streaming,
}: Props) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gold-400/[0.13] px-4 py-2.5 text-[0.925rem] leading-relaxed text-mist-200 ring-1 ring-gold-400/25">
          {content}
        </div>
      </div>
    );
  }

  const { text, items } = parseSuggestions(content);

  return (
    <div className="flex justify-start">
      <div className="max-w-[94%]">
        <div className="prose-lumina">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse-soft bg-gold-400 align-middle" />
          )}
        </div>
        {items.length > 0 && !streaming && <SuggestionCards items={items} />}
      </div>
    </div>
  );
});
