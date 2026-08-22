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
import { enqueueMessage } from "../../hooks/useOfflineQueue";
import { STREAM_SNAPSHOT_KEY } from "../../lib/keys";
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

export type TurnPhase = "starting" | "thinking" | "tooling" | "writing" | "offline";

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
  // Restore an optimistic turn snapshot saved before a reload. Seeded once
  // (lazy initializer) so the live stream survives a page refresh — server
  // persistence catches up behind us. See STREAM_SNAPSHOT_KEY in keys.ts.
  const [stream, setStream] = useState<StreamState | null>(() => {
    if (conversationId == null) return null;
    try {
      const raw = localStorage.getItem(`${STREAM_SNAPSHOT_KEY}:${conversationId}`);
      if (!raw) return null;
      const snap = JSON.parse(raw) as StreamState;
      // Only restore if the turn was still in flight (not finished/stopped).
      if (snap.phase === "starting" || snap.phase === "thinking" || snap.phase === "tooling") {
        return snap;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [errorRetryAttempted, setErrorRetryAttempted] = useState(false);
  const [failedText, setFailedText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false); // synchronous double-send guard

  // Wave 3: drive the SparkAvatar presence from streaming events.
  const companion = useCompanionState();

  // Wave 3: buffer raw token deltas so we re-render ~1×/24ms, never per-token.
  // onFlush writes the checkpoint to localStorage so a browser refresh mid-stream
  // preserves the partial response (snapshot is cleared on turn completion).
  const tokenBuffer = useTokenBuffer(
    (text) => {
      if (conversationId != null) {
        localStorage.setItem(
          `${STREAM_SNAPSHOT_KEY}:${conversationId}`,
          text,
        );
      }
    },
  );

  const messages = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.messages(conversationId!),
    enabled: conversationId != null,
  });

  // Checkpoint the active optimistic turn to localStorage on each phase/text
  // change so a browser refresh mid-turn restores what was on screen.
  useEffect(() => {
    if (stream && conversationId != null) {
      localStorage.setItem(
        `${STREAM_SNAPSHOT_KEY}:${conversationId}`,
        JSON.stringify(stream),
      );
    }
  }, [stream?.phase, stream?.assistantText, stream?.steps, stream?.contextNote]);

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
    setErrorRetryAttempted(false);
    setFailedText(null);
    // Start-fresh (new id while idle) must drop a kept partial. Skip while a
    // send is in flight so the first-message conversation-id handoff keeps
    // the optimistic stream.
    if (!inFlightRef.current) setStream(null);
  }, [conversationId]);

  // Restore a mid-stream snapshot if the last turn didn't complete (e.g. the
  // browser refreshed while the assistant was still typing). The snapshot is
  // written on every tokenBuffer flush and cleared on finishTurn.
  useEffect(() => {
    if (conversationId == null || messages.data == null) return;
    const msgs = messages.data;
    if (msgs.length === 0) return;
    const last = msgs[msgs.length - 1];
    // Only restore if the last assistant message looks incomplete.
    if (last.role !== "assistant") return;
    if (last.content?.endsWith("\n") || last.content?.length > 100) return;
    const snapshot = localStorage.getItem(`${STREAM_SNAPSHOT_KEY}:${conversationId}`);
    if (snapshot) {
      tokenBuffer.reset();
      tokenBuffer.push(snapshot);
    }
  }, [conversationId, messages.data, tokenBuffer]);

  // When the stream ends, flush any pending buffered tokens so the displayed
  // text always resolves to the full accumulated answer (no dangling partial).
  const finishTurn = useCallback(() => {
    tokenBuffer.flush();
    // Clear the snapshot — turn completed successfully.
    if (conversationId != null) {
      localStorage.removeItem(`${STREAM_SNAPSHOT_KEY}:${conversationId}`);
    }
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
      setErrorRetryAttempted(false);
      setFailedText(null);

      // A new turn begins: reset presence to idle, clear buffered text and
      // any surviving snapshot from a previous incomplete turn.
      companion.dispatch({ type: "RESET" });
      tokenBuffer.reset();
      if (conversationId != null) {
        localStorage.removeItem(`${STREAM_SNAPSHOT_KEY}:${conversationId}`);
      }

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
      let hadError = false;

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
        hadError = true;
        inFlightRef.current = false;
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStream((s) => (s ? { ...s, phase: "thinking" } : s));

      try {
        // Offline queue: if the network is down, persist the message and
        // replay it when connectivity returns. The service worker's
        // background sync will trigger useOfflineQueue's replay on reconnect.
        if (!navigator.onLine) {
          await enqueueMessage(convId, content);
          setStream((s) =>
            s
              ? { ...s, phase: "offline", assistantText: "Queued — Luma will send when you're back online." }
              : s,
          );
          return;
        }

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
              setErrorRetryAttempted(!!e.retryAttempted);
              setFailedText(content);
              hadError = true;
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
          setErrorRetryAttempted(false);
          setFailedText(content);
          if (conversationId != null) {
            localStorage.removeItem(`${STREAM_SNAPSHOT_KEY}:${conversationId}`);
          }
          if (conversationId != null) localStorage.removeItem(`${STREAM_SNAPSHOT_KEY}:${conversationId}`);
          hadError = true;
        }
      } finally {
        abortRef.current = null;
        // on user-stop, give the server a beat to persist the partial reply.
        // Delay the cleanup flag until after this window so:
        //  - the conversationId effect can't wipe the kept stream mid-delay
        //  - send() can't double-fire if the user clicks fast (inFlight guard)
        if (aborted) await new Promise((r) => setTimeout(r, 450));
        inFlightRef.current = false;
        await qc.invalidateQueries({ queryKey: ["conversations"] });
        await qc.refetchQueries({ queryKey: ["messages", convId] });
        if (wroteToLibrary) invalidateLibraryData(qc);
        if (hadError) {
          // Keep the optimistic stream so ChatThread can show the partial.
          tokenBuffer.flush();
        } else {
          // Flush pending tokens, then drop the optimistic stream. The persisted
          // message (including any stopped partial) reloads from the server.
          finishTurn();
        }
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
    errorRetryAttempted,
    failedText,
    send,
    stop,
    isStreaming,
  };
}
