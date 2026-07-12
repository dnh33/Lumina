import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  BookOpen,
  BookmarkCheck,
  BookmarkPlus,
  Brain,
  Check,
  Compass,
  Info,
  LibraryBig,
  ListChecks,
  ListVideo,
  Loader2,
  PenLine,
  RefreshCw,
  Scale,
  Search,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { api } from "../../lib/api";
import type { ChatMessageRow, MessageMeta } from "../../lib/types";
import { MessageBubble } from "./MessageBubble";
import { TOOL_LABELS, useChat, type ToolStep } from "./useChat";

const SUGGESTION_CHIPS = [
  "What should I watch tonight?",
  "Build me a slow-burn sci-fi journey",
  "Anything new on my shows?",
  "What does my taste say about me?",
];

const TOOL_ICONS: Record<string, typeof Search> = {
  search_library: LibraryBig,
  get_taste_profile: Brain,
  search_tmdb: Search,
  get_title_details: Info,
  discover_titles: Compass,
  add_to_library: BookmarkPlus,
  update_library_entry: PenLine,
  set_episode_progress: ListChecks,
  get_episode_progress: ListVideo,
  compare_titles: Scale,
  get_episode_recap: BookOpen,
  check_continuing_series: RefreshCw,
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late, I see.";
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

function parseMeta(raw: string | null): MessageMeta {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as MessageMeta;
  } catch {
    return {};
  }
}

function dayLabel(iso: string): string {
  const d = iso.slice(0, 10);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d === today.toISOString().slice(0, 10)) return "Today";
  if (d === yest.toISOString().slice(0, 10)) return "Yesterday";
  return d;
}

/* ── Lumina's face: the spark ───────────────────────────────────── */

function Spark({ size = 20, breathing = false }: { size?: number; breathing?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 100 100"
      style={{ width: size, height: size }}
      aria-hidden
      animate={
        breathing && !reduceMotion
          ? { opacity: [0.55, 1, 0.55], scale: [1, 1.06, 1] }
          : { opacity: breathing ? 0.85 : 1, scale: 1 }
      }
      transition={
        breathing && !reduceMotion
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.12 }
      }
    >
      <path
        d="M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z"
        fill="#e8b84b"
      />
    </motion.svg>
  );
}

/* ── Tool activity ribbon ───────────────────────────────────────── */

function ToolRibbon({ steps }: { steps: ToolStep[] }) {
  const reduceMotion = useReducedMotion();
  if (!steps.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s, i) => {
        const Icon = TOOL_ICONS[s.name] ?? Search;
        return (
          <motion.span
            key={`${s.name}-${i}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -4, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-2xs font-medium ring-1 ${
              s.done
                ? "bg-white/[0.04] text-mist-400 ring-white/[0.08]"
                : "bg-gold-400/[0.08] text-gold-300 ring-gold-400/25"
            }`}
          >
            {s.done ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : reduceMotion ? (
              <Icon className="h-3 w-3" />
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {TOOL_LABELS[s.name] ?? s.name}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ── Receipts: durable proof of library writes ──────────────────── */

function Receipts({ items }: { items: string[] }) {
  const reduceMotion = useReducedMotion();
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((r, i) => (
        <motion.span
          key={i}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
          className="flex items-center gap-1.5 rounded-lg bg-gold-400/[0.1] px-2.5 py-1 text-2xs font-medium text-gold-300 ring-1 ring-gold-400/25"
        >
          <BookmarkCheck className="h-3 w-3" />
          {r}
        </motion.span>
      ))}
    </div>
  );
}

/* ── One turn anatomy — identical live and persisted ────────────── */

interface TurnProps {
  content: string;
  streaming?: boolean;
  thinking?: boolean;
  steps: ToolStep[];
  receipts: string[];
  contextNote: string | null;
  stopped?: boolean;
  time?: string;
  onChip?: (c: string) => void;
}

function AssistantTurn({
  content,
  streaming,
  thinking,
  steps,
  receipts,
  contextNote,
  stopped,
  time,
  onChip,
}: TurnProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.07]">
        <Spark size={16} breathing={!!thinking || !!streaming} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="flex items-baseline gap-2 text-2xs text-mist-400">
          <span className="font-display text-[0.8rem] font-semibold text-mist-300">
            Lumina
          </span>
          {time && <span className="tabular-nums">{time}</span>}
          {contextNote && (
            <span className="flex items-center gap-1 truncate italic">
              <Sparkles className="h-2.5 w-2.5 shrink-0 text-gold-400/70" />
              {contextNote}
            </span>
          )}
        </p>

        <ToolRibbon steps={steps} />

        {thinking && !content ? (
          <p className="text-[0.8rem] text-mist-400">Thinking…</p>
        ) : (
          <MessageBubble
            role="assistant"
            content={content}
            streaming={streaming}
            onChip={onChip}
          />
        )}

        <Receipts items={receipts} />
        {stopped && <p className="text-2xs italic text-mist-400">stopped by you</p>}
      </div>
    </div>
  );
}

/** map a persisted message's meta into the same turn anatomy */
function persistedTurnProps(m: ChatMessageRow, onChip?: (c: string) => void): TurnProps {
  const meta = parseMeta(m.meta);
  return {
    content: m.content,
    steps: (meta.toolsUsed ?? []).map((name) => ({ name, done: true })),
    receipts: meta.writeReceipts ?? [],
    contextNote:
      meta.retrieved?.libraryMatches?.length
        ? `Recalled ${meta.retrieved.libraryMatches.slice(0, 3).join(", ")}`
        : null,
    stopped: meta.stopped,
    time: m.created_at?.slice(11, 16),
    onChip,
  };
}

/* ── The thread ─────────────────────────────────────────────────── */

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
  const reduceMotion = useReducedMotion();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const {
    messages,
    messagesLoading,
    messagesError,
    refetchMessages,
    stream,
    error,
    failedText,
    send,
    stop,
    isStreaming,
  } = useChat(conversationId, onConversationChange);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nearBottomRef = useRef(true);
  const [detached, setDetached] = useState(false);
  const lastPrefill = useRef<string | undefined>(undefined);

  // a NEW prefill (different value) re-arms
  useEffect(() => {
    if (prefill && prefill !== lastPrefill.current) {
      lastPrefill.current = prefill;
      setDraft(prefill);
    }
  }, [prefill]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    nearBottomRef.current = near;
    setDetached(!near);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, stream?.assistantText, stream?.steps.length, stream?.phase]);

  const autosize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, []);
  useEffect(autosize, [draft, autosize]);

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    nearBottomRef.current = true;
    setDetached(false);
  };

  const submit = () => {
    if (isStreaming) {
      stop();
      return;
    }
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send(text);
  };

  const chip = (c: string) => void send(c);

  if (health.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
      </div>
    );
  }

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

  if (messagesError && !stream) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-mist-300">Couldn't load this conversation.</p>
        <div className="flex gap-2.5">
          <button type="button" className="btn-primary" onClick={() => refetchMessages()}>
            Try again
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              const created = await api.createConversation();
              onConversationChange(created.id);
            }}
          >
            Start fresh
          </button>
        </div>
      </div>
    );
  }

  const showWelcome =
    !messagesLoading && messages.length === 0 && !stream && !error;

  // day separators
  let lastDay = "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* screen readers get phases, not a token flood */}
      <div className="sr-only" role="status" aria-live="polite">
        {stream
          ? stream.phase === "writing"
            ? "Lumina is writing"
            : "Lumina is thinking"
          : ""}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          role="log"
          className={`h-full space-y-6 overflow-y-auto ${compact ? "p-4" : "p-5 sm:p-8"}`}
        >
          {messagesLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
            </div>
          )}

          {showWelcome && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-16"}`}
            >
              <Spark size={compact ? 36 : 48} />
              <h2 className={`mt-4 font-display font-semibold text-mist-200 ${compact ? "text-lg" : "text-2xl"}`}>
                {greeting()}
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-mist-400">
                I know every title, rating and note in your archive, and I never
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
            </motion.div>
          )}

          {messages.map((m) => {
            const day = m.created_at?.slice(0, 10) ?? "";
            const sep = day && day !== lastDay;
            if (sep) lastDay = day;
            return (
              <div key={m.id} className="space-y-6">
                {sep && (
                  <p className="text-center text-2xs font-semibold uppercase tracking-wider text-mist-400/80">
                    {dayLabel(m.created_at)}
                  </p>
                )}
                {m.role === "user" ? (
                  <MessageBubble role="user" content={m.content} />
                ) : (
                  <AssistantTurn {...persistedTurnProps(m, chip)} />
                )}
              </div>
            );
          })}

          {stream && (
            <>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <MessageBubble role="user" content={stream.userText} />
              </motion.div>
              <AssistantTurn
                content={stream.assistantText}
                streaming={stream.phase === "writing"}
                thinking={stream.phase !== "writing"}
                steps={stream.steps}
                receipts={stream.receipts}
                contextNote={stream.contextNote}
                stopped={false}
              />
            </>
          )}

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25">
              <p className="text-sm text-red-300">{error}</p>
              {failedText && !isStreaming && (
                <button
                  type="button"
                  className="btn-ghost shrink-0"
                  onClick={() => void send(failedText)}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {detached && (isStreaming || messages.length > 0) && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-ink-800/95 px-3.5 py-2 text-2xs font-semibold text-gold-300 ring-1 ring-gold-400/30 shadow-lg backdrop-blur transition hover:bg-ink-700"
          >
            <ArrowDown className="h-3.5 w-3.5" /> Latest
          </button>
        )}
      </div>

      {/* Composer */}
      <div
        className={`border-t border-white/[0.06] ${compact ? "p-3" : "p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8"}`}
      >
        <div className="flex items-end gap-2.5 rounded-2xl bg-ink-800/90 p-2 pl-4 ring-1 ring-white/10 transition focus-within:ring-gold-400/40">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (!isStreaming) submit();
              }
            }}
            rows={1}
            placeholder="Ask about anything you've watched — or should watch…"
            className="max-h-36 min-h-[38px] w-full resize-none bg-transparent py-2 text-[0.95rem] leading-relaxed text-mist-200 placeholder-mist-400/60 outline-none"
          />
          {/* one button, two jobs — focus survives the swap */}
          <motion.button
            type="button"
            onClick={submit}
            disabled={!isStreaming && !draft.trim()}
            title={isStreaming ? "Stop" : "Send"}
            aria-label={isStreaming ? "Stop generating" : "Send message"}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition disabled:opacity-35 ${
              isStreaming
                ? "bg-white/[0.08] text-mist-300 ring-1 ring-white/15 hover:bg-white/[0.14]"
                : "bg-gold-400 text-ink-950 hover:bg-gold-300"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isStreaming ? (
                <motion.span
                  key="stop"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.14 }}
                >
                  {stream?.stopping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </motion.span>
              ) : (
                <motion.span
                  key="send"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.14 }}
                >
                  <Send className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
