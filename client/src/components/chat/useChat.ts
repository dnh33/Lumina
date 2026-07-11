import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, streamChat } from "../../lib/api";

export const TOOL_LABELS: Record<string, string> = {
  search_library: "Reading your library",
  get_taste_profile: "Studying your taste",
  search_tmdb: "Searching the catalog",
  get_title_details: "Pulling title details",
  discover_titles: "Browsing for gems",
  add_to_library: "Saving to your library",
  get_episode_progress: "Checking your progress",
};

export interface StreamState {
  userText: string;
  assistantText: string;
  activeTool: string | null;
  toolsUsed: string[];
  contextNote: string | null;
}

export function useChat(
  conversationId: number | null,
  onConversationChange: (id: number) => void,
) {
  const qc = useQueryClient();
  const [stream, setStream] = useState<StreamState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const messages = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.messages(conversationId!),
    enabled: conversationId != null,
  });

  // never leave a stream dangling when the surface unmounts
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || stream) return;
      setError(null);

      let convId = conversationId;
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
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStream({
        userText: content,
        assistantText: "",
        activeTool: null,
        toolsUsed: [],
        contextNote: null,
      });

      try {
        await streamChat(
          convId,
          content,
          (e) => {
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
                case "tool_done":
                  return { ...s, activeTool: null };
                case "error":
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
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        abortRef.current = null;
        await qc.invalidateQueries({ queryKey: ["conversations"] });
        await qc.refetchQueries({ queryKey: ["messages", convId] });
        qc.invalidateQueries({ queryKey: ["library"] });
        setStream(null);
      }
    },
    [conversationId, onConversationChange, qc, stream],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return {
    messages: messages.data ?? [],
    messagesLoading: messages.isLoading && conversationId != null,
    stream,
    error,
    send,
    stop,
    isStreaming: stream !== null,
  };
}
