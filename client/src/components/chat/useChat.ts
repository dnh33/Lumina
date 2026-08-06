import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, streamChat } from "../../lib/api";
import { invalidateLibraryData } from "../../lib/invalidate";
import { playCue } from "../../lib/sound";
import {
  reducer as companionReducer,
  useCompanionState,
  type CompanionState,
  type CompanionEvent,
} from "../../hooks/useCompanionState";
import { useTokenBuffer } from "../../hooks/useTokenBuffer";
import { buildToolNodes, deriveStopped } from "./buildToolNodes";

export { buildToolNodes, deriveStopped };

export const TOOL_LABELS: Record<string, string> = {
  search_library: "Reading your library",
  get_taste_profile: "Studying your taste",
  search_tmdb: "Searching the catalog",
  get_title_details: "Pulling title details",
  discover_titles: "Browsing for gems",
  add_to_library: "Saving to your library",
  update_library_entry: "Updating your library",
  set_episode_progress: "Saving your progress",
  get_episode_progress: "Checking your progress",
  compare_titles: "Weighing your options",
  get_episode_recap: "Writing your recap",
  check_continuing_series: "Checking your shows",
};

const WRITE_TOOLS = new Set([
  "add_to_library",
  "update_library_entry",
  "set_episode_progress",
]);

export type TurnPhase = "starting" | "thinking" | "tooling" | "writing";

export interface ToolStep {
  name: string;
  done: boolean;
  /** Human label for the step (server summary, else TOOL_LABELS). */
  summary?: string | null;
  /** Salient argument, from the server ("“korean thrillers”"). */
  detail?: string;
  /** Result digest, from the server ("8 results", "Counterpart (2018)"). */
  outcome?: string;
}

export interface StreamState {
  userText: string;
  assistantText: string;
  phase: TurnPhase;
  steps: ToolStep[];
  /** durable proof of library writes ("Saved Dune · 9/10 · watchlist") */
  receipts: string[];
  contextNote: string | null;
  stopping: boolean;
}

/**
 * Pure map from an SSE event type to the companion-state machine event.
 * Exported so the state transition wiring is unit-testable without React
 * (useChat.test.ts). Returns null for events that must not move the machine.
 */
export function companionEventForSse(
  type: string,
): CompanionEvent | null {
  switch (type) {
    case "context":
      return { type: "TOOL" }; // idle -> thinking
    case "tool":
      return { type: "TOOL_RUNNING" }; // -> tooling
    case "delta":
      return { type: "DELTA" }; // -> writing
    case "done":
      return { type: "DONE" }; // -> idle
    case "error":
      return { type: "ERROR" }; // -> error
    default:
      return null;
  }
}

export function useChat(
  conversationId: number | null,
  onConversationChange: (id: number) => void | Promise<void>,
) {
  const qc = useQueryClient();
  const [stream, setStream] = useState<StreamState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedText, setFailedText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false); // synchronous double-send guard

  // Wave 3: drive the SparkAvatar presence from streaming events.
  const companion = useCompanionState();

  // Wave 3: buffer raw token deltas so we re-render ~1×/24ms, never per-token.
  const tokenBuffer = useTokenBuffer();

  const messages = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.messages(conversationId!),
    enabled: conversationId != null,
  });

  // never leave a stream dangling when the surface unmounts
  useEffect(() => {
    return () => {
      // [DEBUG] smoke test for the first-send remount race: if this logs
      // during an active turn, the stream was killed by an unmount.
      if (abortRef.current && !abortRef.current.signal.aborted) {
        if (import.meta.env.DEV) {
          console.log("[DEBUG] useChat unmounted mid-flight → aborting active stream");
        }
      }
      abortRef.current?.abort();
    };
  }, []);

  // a stale error from one conversation must not haunt another
  useEffect(() => {
    setError(null);
    setFailedText(null);
  }, [conversationId]);

  // When the stream ends, flush any pending buffered tokens so the displayed
  // text always resolves to the full accumulated answer (no dangling partial).
  const finishTurn = useCallback(() => {
    tokenBuffer.flush();
    setStream(null);
  }, [tokenBuffer]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || inFlightRef.current) return;
      if (import.meta.env.DEV) {
        console.log("[DEBUG] useChat.send", { fromNull: conversationId == null, len: content.length });
      }
      playCue("tick"); // one acknowledgment covers every entry point
      inFlightRef.current = true;
      setError(null);
      setFailedText(null);

      // A new turn begins: reset presence to idle, clear buffered text.
      companion.dispatch({ type: "RESET" });
      tokenBuffer.reset();

      // Optimistic: the user bubble and thinking state paint IMMEDIATELY,
      // before any network round-trip. The companion never plays dead.
      setStream({
        userText: content,
        assistantText: "",
        phase: "starting",
        steps: [],
        receipts: [],
        contextNote: null,
        stopping: false,
      });

      let convId = conversationId;
      let completed = false;
      let wroteToLibrary = false;
      let aborted = false;
      let toolCueFired = false;

      try {
        if (convId == null) {
          const created = await api.createConversation();
          convId = created.id;
          playCue("droplet");
          await Promise.resolve(onConversationChange(convId));
        } else {
          // self-heal: a stored conversation may have been deleted elsewhere
          try {
            await api.messages(convId);
          } catch {
            const created = await api.createConversation();
            convId = created.id;
            await Promise.resolve(onConversationChange(convId));
          }
        }
      } catch (e) {
        setError((e as Error).message);
        setFailedText(content);
        finishTurn();
        inFlightRef.current = false;
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStream((s) => (s ? { ...s, phase: "thinking" } : s));

      try {
        await streamChat(
          convId,
          content,
          (e) => {
            // Move the presence machine in lock-step with the SSE stream.
            const ce = companionEventForSse(e.type);
            if (ce) companion.dispatch(ce);

            // Audible turn anatomy: bloom (waking) → tick (first tool) →
            // success (write receipt) → chime (clean finish). Errors/stop
            // stay silent — the visuals carry those.
            if (e.type === "context") playCue("bloom");
            if (e.type === "tool" && !toolCueFired) {
              toolCueFired = true;
              playCue("tick");
            }
            if (e.type === "tool_done" && WRITE_TOOLS.has(e.name)) {
              playCue("success");
            }

            if (e.type === "done") {
              completed = true;
              playCue("chime");
            }
            if (e.type === "error") {
              // model-side failure: always leave a retry path
              setError(e.message);
              setFailedText(content);
              return;
            }
            // Push deltas OUTSIDE setState — React Strict Mode double-invokes
            // updaters in DEV, which would duplicate every token in the buffer
            // (visible as "GoodGood evening evening" shards mid-stream).
            if (e.type === "delta") {
              tokenBuffer.push(e.text);
            }
            if (e.type === "tool_done" && WRITE_TOOLS.has(e.name)) {
              wroteToLibrary = true;
            }

            setStream((s) => {
              if (!s) return s;
              switch (e.type) {
                case "context": {
                  const note =
                    e.matches.length > 0
                      ? `Recalled ${e.matches.slice(0, 3).join(", ")}${e.matches.length > 3 ? "…" : ""}`
                      : null;
                  return { ...s, contextNote: note };
                }
                case "delta":
                  return {
                    ...s,
                    assistantText: s.assistantText + e.text,
                    phase: "writing",
                  };
                case "tool":
                  return {
                    ...s,
                    phase: "tooling",
                    steps: [
                      ...s.steps,
                      {
                        name: e.name,
                        done: false,
                        summary: TOOL_LABELS[e.name] ?? e.name,
                        detail: e.detail,
                      },
                    ],
                  };
                case "tool_done": {
                  const label = e.summary ?? TOOL_LABELS[e.name] ?? e.name;
                  return {
                    ...s,
                    steps: s.steps.map((st, i) =>
                      i === s.steps.length - 1 && st.name === e.name
                        ? {
                            ...st,
                            done: true,
                            summary: label,
                            detail: e.detail ?? st.detail,
                            outcome: e.outcome,
                          }
                        : st,
                    ),
                    receipts: e.summary ? [...s.receipts, e.summary] : s.receipts,
                  };
                }
                default:
                  return s;
              }
            });
          },
          controller.signal,
        );
        if (import.meta.env.DEV) {
          console.log("[DEBUG] useChat.send stream resolved", { convId });
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.log("[DEBUG] useChat.send error", (e as Error).name, (e as Error).message);
        }
        if ((e as Error).name === "AbortError") {
          aborted = true;
        } else if (!completed) {
          // connection died mid-turn AND nothing was persisted → real failure
          setError((e as Error).message);
          setFailedText(content);
        }
      } finally {
        abortRef.current = null;
        inFlightRef.current = false;
        // on user-stop, give the server a beat to persist the partial reply
        if (aborted) await new Promise((r) => setTimeout(r, 450));
        await qc.invalidateQueries({ queryKey: ["conversations"] });
        await qc.refetchQueries({ queryKey: ["messages", convId] });
        if (wroteToLibrary) invalidateLibraryData(qc);
        // Flush pending tokens, then drop the optimistic stream. The persisted
        // message (including any stopped partial) reloads from the server.
        finishTurn();
      }
    },
    [conversationId, onConversationChange, qc, companion, tokenBuffer, finishTurn],
  );

  const stop = useCallback(() => {
    setStream((s) => (s ? { ...s, stopping: true } : s));
    // Freeze whatever is on screen right now (graceful stop, T14/T15).
    tokenBuffer.flush();
    abortRef.current?.abort();
  }, [tokenBuffer]);

  // `streaming` means an active request is in flight; once we stop/abort it is
  // false even though `stream` may still briefly exist during cleanup.
  const isStreaming =
    stream !== null && !stream.stopping && inFlightRef.current;

  // ToolTrace nodes derived from the live steps (pure helper, tested).
  const toolNodes = stream ? buildToolNodes(stream.steps) : [];

  // "stopped" only reads true once the turn is fully over AND a stop happened.
  const stopped = deriveStopped(isStreaming, stream?.stopping ?? false);

  return {
    messages: messages.data ?? [],
    messagesLoading: messages.isLoading && conversationId != null,
    messagesError: messages.isError
      ? ((messages.error as Error)?.message ?? "Couldn't load this conversation")
      : null,
    refetchMessages: () => messages.refetch(),
    stream,
    streamedText: tokenBuffer.text,
    toolNodes,
    stopped,
    companionState: companion.state as CompanionState,
    error,
    failedText,
    send,
    stop,
    isStreaming,
  };
}
