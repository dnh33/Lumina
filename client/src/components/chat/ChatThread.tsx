import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, Sparkles, Square } from "lucide-react";
import { api } from "../../lib/api";
import { MessageBubble } from "./MessageBubble";
import { TOOL_LABELS, useChat } from "./useChat";

const SUGGESTION_CHIPS = [
  "What should I watch tonight?",
  "Build me a slow-burn sci-fi journey",
  "Something cozy for a rainy Sunday",
  "What does my taste say about me?",
];

interface Props {
  conversationId: number | null;
  onConversationChange: (id: number) => void;
  prefill?: string;
  compact?: boolean;
}

export function ChatThread({
  conversationId,
  onConversationChange,
  prefill,
  compact,
}: Props) {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const { messages, messagesLoading, stream, error, send, stop, isStreaming } =
    useChat(conversationId, onConversationChange);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefillUsed = useRef(false);

  useEffect(() => {
    if (prefill && !prefillUsed.current) {
      prefillUsed.current = true;
      setDraft(prefill);
    }
  }, [prefill]);

  // pin to bottom while streaming / on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, stream?.assistantText, stream?.activeTool]);

  const submit = () => {
    const text = draft.trim();
    if (!text || isStreaming) return;
    setDraft("");
    void send(text);
  };

  if (health.data && !health.data.aiConfigured) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 ring-1 ring-gold-400/25">
          <Sparkles className="h-6 w-6 text-gold-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-mist-200">
          Wake your companion
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist-400">
          Add an OpenRouter API key as OPENROUTER_API_KEY in the .env file at
          the repo root, restart Lumina, and this becomes a conversation with
          someone who knows your entire viewing history.
        </p>
      </div>
    );
  }

  const showWelcome =
    !messagesLoading && messages.length === 0 && !stream && !error;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Thread */}
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 space-y-5 overflow-y-auto ${compact ? "p-4" : "p-5 sm:p-8"}`}
      >
        {messagesLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
          </div>
        )}

        {showWelcome && (
          <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-16"}`}>
            <svg viewBox="0 0 100 100" className={compact ? "h-9 w-9" : "h-12 w-12"} aria-hidden>
              <path
                d="M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z"
                fill="#e8b84b"
              />
            </svg>
            <h2 className={`mt-4 font-display font-semibold text-mist-200 ${compact ? "text-lg" : "text-2xl"}`}>
              Good evening.
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-mist-400">
              I know every title, rating and note in your archive — and I never
              spoil. What are we looking for?
            </p>
            <div className={`mt-5 flex flex-wrap justify-center gap-2 ${compact ? "max-w-xs" : "max-w-lg"}`}>
              {SUGGESTION_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => void send(c)}
                  className="cursor-pointer rounded-full bg-white/[0.05] px-3.5 py-2 text-[0.8rem] text-mist-300 ring-1 ring-white/10 transition hover:bg-gold-400/15 hover:text-gold-300 hover:ring-gold-400/30"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {stream && (
          <>
            <MessageBubble role="user" content={stream.userText} />
            {stream.contextNote && (
              <p className="flex items-center gap-1.5 text-2xs italic text-mist-400">
                <Sparkles className="h-3 w-3 text-gold-400/70" />
                {stream.contextNote}
              </p>
            )}
            {stream.activeTool && (
              <div className="flex items-center gap-2 text-[0.8rem] text-gold-300/90">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {TOOL_LABELS[stream.activeTool] ?? "Working"}…
              </div>
            )}
            {stream.assistantText ? (
              <MessageBubble role="assistant" content={stream.assistantText} streaming />
            ) : !stream.activeTool ? (
              <div className="flex items-center gap-2 text-[0.8rem] text-mist-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-400" />
                Thinking…
              </div>
            ) : null}
          </>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/25">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className={`border-t border-white/[0.06] ${compact ? "p-3" : "p-4 sm:px-8"}`}>
        <div className="flex items-end gap-2.5 rounded-2xl bg-ink-800/90 p-2 pl-4 ring-1 ring-white/10 transition focus-within:ring-gold-400/40">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={Math.min(4, Math.max(1, draft.split("\n").length))}
            placeholder="Ask about anything you've watched — or should watch…"
            className="max-h-36 min-h-[38px] w-full resize-none bg-transparent py-2 text-[0.95rem] leading-relaxed text-mist-200 placeholder-mist-400/60 outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              title="Stop"
              aria-label="Stop generating"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/[0.08] text-mist-300 ring-1 ring-white/15 transition hover:bg-white/[0.14]"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              title="Send"
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gold-400 text-ink-950 transition hover:bg-gold-300 disabled:opacity-35"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
