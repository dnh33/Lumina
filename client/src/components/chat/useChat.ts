import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, streamChat } from "../../lib/api";
import { invalidateLibraryData } from "../../lib/invalidate";

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

export interface StreamState {
  userText: string;
  assistantText: string;
  activeTool: string | null;
  toolsUsed: string[];
  /** durable proof of library writes ("Saved Dune · 9/10 · watchlist") */
  receipts: string[];
  contextNote: string | null;
}

export function useChat(
  conversationId: number | null,
  onConversationChange: (id: number) => void,
) {
  const qc = useQueryClient();
  const [stream, setStream] = useState<StreamState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedText, setFailedText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false); // synchronous double-send guard

  const messages = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.messages(conversationId!),
    enabled: conversationId != null,
  });

  // never leave a stream dangling when the surface unmounts
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // a stale error from one conversation must not haunt another
  useEffect(() => {
    setError(null);
    setFailedText(null);
  }, [conversationId]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setFailedText(null);

      let convId = conversationId;
      let completed = false;
      let wroteToLibrary = false;
      let aborted = false;

      try {
        if (convId == null) {
          const created = await api.createConversation();
          convId = created.id;
          onConversationChange(convId);
        } else {
          // self-heal: a stored conversation may have been deleted elsewhere
          try {
            await api.messages(convId);
          } catch {
            const created = await api.createConversation();
            convId = created.id;
            onConversationChange(convId);
          }
        }
      } catch (e) {
        setError((e as Error).message);
        setFailedText(content);
        inFlightRef.current = false;
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStream({
        userText: content,
        assistantText: "",
        activeTool: null,
        toolsUsed: [],
        receipts: [],
        contextNote: null,
      });

      try {
        await streamChat(
          convId,
          content,
          (e) => {
            if (e.type === "done") completed = true;
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
                  return { ...s, assistantText: s.assistantText + e.text, activeTool: null };
                case "tool":
                  return {
                    ...s,
                    activeTool: e.name,
                    toolsUsed: [...s.toolsUsed, e.name],
                  };
                case "tool_done": {
                  if (WRITE_TOOLS.has(e.name)) wroteToLibrary = true;
                  return {
                    ...s,
                    activeTool: null,
                    receipts: e.summary ? [...s.receipts, e.summary] : s.receipts,
                  };
                }
                case "error":
                  setError(e.message);
                  setError(e.message);
                  return s;
                default:
                  return s;
              }
            });
          },
          controller.signal,
        );
      } catch (e) {
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
        setStream(null);
      }
    },
    [conversationId, onConversationChange, qc],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return {
    messages: messages.data ?? [],
    messagesLoading: messages.isLoading && conversationId != null,
    messagesError: messages.isError
      ? ((messages.error as Error)?.message ?? "Couldn't load this conversation")
      : null,
    refetchMessages: () => messages.refetch(),
    stream,
    error,
    failedText,
    send,
    stop,
    isStreaming: stream !== null,
  };
}
