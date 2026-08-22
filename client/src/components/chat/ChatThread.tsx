import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  BookmarkCheck,
  Loader2,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { api } from "../../lib/api";
import { playCue } from "../../lib/sound";
import type { ChatMessageRow, MessageMeta, ToolTraceEntry } from "../../lib/types";
import { MessageBubble } from "./MessageBubble";
import { SuggestionCards, DEFAULT_SUGGESTIONS, type Suggestion } from "./SuggestionCards";
import { MemoryConstellation } from "./MemoryConstellation";
import { ToolRibbon } from "./ToolRibbon";
import { SparkAvatar } from "./SparkAvatar";
import { WaveformSkeleton } from "./WaveformSkeleton";
import { TOOL_LABELS, useChat, type ToolStep, type TurnPhase } from "./useChat";
import type { CompanionState } from "../../hooks/useCompanionState";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { messageEnter, stagger60, EASE_OUT_EXPO } from "../../lib/motion";

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

/* ── Lumina's face: the spark (Wave 2 SparkAvatar) ────────────── */

/* ── Tool activity ribbon ───────────────────────────────────────── */
/* ToolRibbon now lives in ./ToolRibbon (forwards into ToolTrace). */

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
  /** Wired presence state for the SparkAvatar (Wave 3). */
  companionState?: CompanionState;
  /** Live stream phase; omitted on persisted turns. */
  phase?: TurnPhase;
}

function phaseLabel(phase: TurnPhase): string {
  switch (phase) {
    case "starting":
      return "Lumina is waking…";
    case "thinking":
      return "Lumina is thinking…";
    case "tooling":
      return "Reaching into your library…";
    case "writing":
      return "Composing…";
    default:
      return "Lumina is thinking…";
  }
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
  companionState = "idle",
  phase,
}: TurnProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.07]">
        <SparkAvatar state={companionState} hideWhisper />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex items-baseline gap-2 text-2xs text-mist-300">
          <span className="font-display text-[0.8rem] font-semibold text-mist-300">
            Lumina
          </span>
          {time && <span className="tabular-nums">{time}</span>}
        </p>

        {contextNote && (
          <p className="flex items-center gap-1 text-2xs italic text-mist-300">
            <Sparkles className="h-2.5 w-2.5 shrink-0 text-gold-400/70" />
            <span className="truncate">{contextNote}</span>
          </p>
        )}

        <ToolRibbon steps={steps} />

        <AnimatePresence initial={false}>
          {thinking && !content ? (
            <motion.div
              key="skeleton"
              className="flex items-center gap-2 text-[0.85rem] text-mist-300"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            >
              <SparkAvatar state={companionState} hideWhisper />
              <span>{phaseLabel(phase ?? "thinking")}</span>
              <WaveformSkeleton phase={phase ?? "thinking"} />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT_EXPO }}
            >
              <MessageBubble
                role="assistant"
                content={content}
                streaming={streaming}
                onChip={onChip}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Receipts items={receipts} />
        {stopped && <p className="text-2xs italic text-mist-300">stopped by you</p>}
      </div>
    </div>
  );
}

/** map a persisted message's meta into the same turn anatomy */
function persistedTurnProps(m: ChatMessageRow, onChip?: (c: string) => void): TurnProps {
  const meta = parseMeta(m.meta);
  // Prefer the rich toolTrace (detail + outcome per call); older rows only
  // carry toolsUsed names — both render through the same ToolStep shape.
  const trace: ToolTraceEntry[] =
    meta.toolTrace ?? (meta.toolsUsed ?? []).map((name) => ({ name }));
  return {
    content: m.content,
    steps: trace.map(
      (t): ToolStep => ({
        name: t.name,
        done: true,
        summary: t.summary ?? TOOL_LABELS[t.name] ?? t.name,
        detail: t.detail,
        outcome: t.outcome,
      }),
    ),
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
  onConversationChange: (id: number) => void | Promise<void>;
  prefill?: string;
  compact?: boolean;
  /** Dormant-user rediscovery nudge (P13): show a "memory constellation" line. */
  dormant?: boolean;
  /** Optional context-aware welcome posters; falls back to a tasteful default. */
  welcomeSuggestions?: Suggestion[];
  /** Poster URLs for the welcome value-proof strip. Omitted/empty hides it. */
  welcomePosters?: string[];
  /** Ref to the scroll container, set by ChatDock for R15 compression. */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatThread({
  conversationId,
  onConversationChange,
  prefill,
  compact,
  dormant,
  welcomeSuggestions,
  welcomePosters,
  scrollRef: scrollRefProp,
}: Props) {
  const reduceMotion = useReducedMotion();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const {
    messages,
    messagesLoading,
    messagesError,
    refetchMessages,
    stream,
    streamedText,
    toolNodes,
    stopped,
    companionState,
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
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist-300">
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
              playCue("droplet");
              await Promise.resolve(onConversationChange(created.id));
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

  // While a turn streams, the server has already persisted the user message
  // (persistMessage runs at turn start), so a messages refetch mid-stream can
  // return it — racing the optimistic stream bubble and showing the user's
  // input twice in freshly-started sessions (e.g. clicking a welcome card).
  // The index of the last user message lets us suppress that one duplicate
  // without touching history.
  const lastUserIdx = messages.reduce(
    (acc, m, i) => (m.role === "user" ? i : acc),
    -1,
  );

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
          ref={scrollRefProp ?? scrollRef}
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
              <SparkAvatar state="idle" size={compact ? 36 : 48} />
              <h2 className={`mt-4 font-display font-semibold text-mist-200 ${compact ? "text-lg" : "text-2xl"}`}>
                {greeting()}
              </h2>

              {dormant && (
                <p className="mt-2 font-display text-[0.95rem] italic text-gold-300/90">
                  I kept your slow-burn list warm.
                </p>
              )}
              {dormant && <MemoryConstellation className="mt-3" />}

              <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-300">
                I know your library, and I never spoil. What are we looking for?
              </p>

              {welcomePosters && welcomePosters.length > 0 && (
                <div
                  data-testid="welcome-posters"
                  className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2"
                >
                  {welcomePosters.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt=""
                      className="h-24 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ))}
                </div>
              )}

              {/* Cinematic dealt-in poster suggestions (Task 6) */}
              <SuggestionCards
                className="mt-5 max-w-2xl justify-center"
                suggestions={(welcomeSuggestions ?? DEFAULT_SUGGESTIONS).map((s) => ({
                  ...s,
                  onClick: () => void send(s.title),
                }))}
              />
            </motion.div>
          )}

          {messages.length > 0 && (
            <motion.div
              key="turn-groups"
              variants={stagger60}
              initial="hidden"
              animate="show"
            >
              {messages.map((m, i) => {
                const day = m.created_at?.slice(0, 10) ?? "";
                const sep = day && day !== lastDay;
                if (sep) lastDay = day;
                // While a turn streams, hide the persisted copy of the
                // just-sent user message — it's already shown optimistically
                // via stream.userText. Without this, freshly-started sessions
                // (e.g. a welcome-card click) show the input twice.
                if (
                  stream &&
                  i === lastUserIdx &&
                  m.role === "user" &&
                  m.content.trim() === stream.userText.trim()
                ) {
                  return null;
                }
                return (
                  <motion.div
                    key={m.id}
                    variants={messageEnter}
                    className="space-y-6 [content-visibility:auto]"
                  >
                    {sep && (
                      <p className="text-center text-2xs font-semibold uppercase tracking-wider text-mist-300/80">
                        {dayLabel(m.created_at)}
                      </p>
                    )}
                    {m.role === "user" ? (
                      <MessageBubble role="user" content={m.content} />
                    ) : (
                      <AssistantTurn {...persistedTurnProps(m, chip)} />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {stream && (
            <>
              <motion.div
                key="user-stream"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <MessageBubble role="user" content={stream.userText} />
              </motion.div>
              <AssistantTurn
                content={streamedText || stream.assistantText}
                streaming={stream.phase === "writing"}
                thinking={stream.phase !== "writing"}
                steps={stream.steps}
                receipts={stream.receipts}
                contextNote={stream.contextNote}
                stopped={stopped}
                companionState={error ? "error" : (companionState ?? "idle")}
                phase={stream.phase}
              />
            </>
          )}

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25">
              <div className="min-w-0">
                <p className="text-sm text-red-300">
                  {stream?.assistantText
                    ? "Lumina stopped mid-response. What's above is saved — nothing lost."
                    : "Something went wrong on our end. Try again?"}
                </p>
                {stream?.assistantText ? (
                  <p className="text-2xs text-mist-300">
                    The response above is yours. Retry sends the same request.
                  </p>
                ) : null}
              </div>
              {failedText && !isStreaming && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => void send(failedText)}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={async () => {
                      const created = await api.createConversation();
                      playCue("droplet");
                      await Promise.resolve(onConversationChange(created.id));
                    }}
                  >
                    Start fresh
                  </button>
                </div>
              )}
            </div>
          )}

          {/* The tool trace inside AssistantTurn is now the single
              transparency surface (compact live timeline → collapsed
              "how I got there" summary) — the separate ReasoningInterstitial
              panel duplicated it and was removed. */}
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
            data-cuelume-press="press"
            data-cuelume-release="release"
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
