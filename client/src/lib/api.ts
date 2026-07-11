import type {
  Because,
  CatalogItem,
  ChatEvent,
  ChatMessageRow,
  ConversationSummary,
  EpisodeRow,
  ForYou,
  Health,
  LibraryEntry,
  LibraryStats,
  LibraryStatus,
  MediaType,
  TitleDetails,
  TitleInsight,
} from "./types";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

const get = <T>(url: string) => fetch(url).then((r) => j<T>(r));
const send = <T>(method: string, url: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => j<T>(r));

export const api = {
  health: () => get<Health>("/api/health"),

  /* catalog */
  search: (q: string) =>
    get<CatalogItem[]>(`/api/tmdb/search?q=${encodeURIComponent(q)}`),
  trending: () => get<CatalogItem[]>("/api/tmdb/trending"),
  popular: (type: MediaType) => get<CatalogItem[]>(`/api/tmdb/popular/${type}`),
  topRated: (type: MediaType) => get<CatalogItem[]>(`/api/tmdb/top-rated/${type}`),
  title: (type: MediaType, tmdbId: number) =>
    get<{ details: TitleDetails; library: LibraryEntry | null }>(
      `/api/tmdb/title/${type}/${tmdbId}`,
    ),
  forYou: () => get<ForYou>("/api/discover/for-you"),
  because: () => get<Because>("/api/discover/because"),

  /* library */
  library: (params: Record<string, string> = {}) =>
    get<LibraryEntry[]>(`/api/library?${new URLSearchParams(params)}`),
  libraryStats: () => get<LibraryStats>("/api/library/stats"),
  libraryGenres: () => get<string[]>("/api/library/genres"),
  addToLibrary: (body: {
    tmdbId: number;
    mediaType: MediaType;
    status?: LibraryStatus;
    rating?: number | null;
  }) => send<LibraryEntry>("POST", "/api/library", body),
  updateEntry: (
    id: number,
    patch: Partial<{
      status: LibraryStatus;
      rating: number | null;
      notes: string;
      favorite: boolean;
      watchedAt: string | null;
    }>,
  ) => send<LibraryEntry>("PATCH", `/api/library/${id}`, patch),
  removeEntry: (id: number) =>
    fetch(`/api/library/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Delete failed");
    }),

  /* episodes */
  episodes: (libraryId: number, sync = false) =>
    get<EpisodeRow[]>(`/api/library/${libraryId}/episodes${sync ? "?sync=1" : ""}`),
  setEpisode: (episodeId: number, watched: boolean) =>
    send<{ ok: true }>("PATCH", `/api/episodes/${episodeId}`, { watched }),
  setSeason: (libraryId: number, season: number, watched: boolean) =>
    send<{ ok: true }>("POST", `/api/library/${libraryId}/season/${season}`, {
      watched,
    }),

  /* insight & profile */
  insight: (type: MediaType, tmdbId: number, refresh = false) =>
    get<TitleInsight>(`/api/insight/${type}/${tmdbId}${refresh ? "?refresh=1" : ""}`),
  tasteProfile: () =>
    get<{ profile: unknown; rendered: string }>("/api/taste-profile"),
  setModel: (model: string) =>
    send<{ ok: true; model: string }>("PUT", "/api/settings/model", { model }),
  importCsv: (csv: string) =>
    send<{ input: string; matched: string | null; status: string; detail?: string }[]>(
      "POST",
      "/api/import/csv",
      { csv },
    ),

  /* chat */
  conversations: () => get<ConversationSummary[]>("/api/conversations"),
  createConversation: (title?: string) =>
    send<{ id: number }>("POST", "/api/conversations", { title }),
  messages: (conversationId: number) =>
    get<ChatMessageRow[]>(`/api/conversations/${conversationId}/messages`),
  renameConversation: (id: number, title: string) =>
    send<{ ok: true }>("PATCH", `/api/conversations/${id}`, { title }),
  deleteConversation: (id: number) =>
    fetch(`/api/conversations/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Delete failed");
    }),
};

/** Stream a chat turn; invokes onEvent for every SSE event. */
export async function streamChat(
  conversationId: number,
  content: string,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  });
  if (!res.ok || !res.body) {
    let message = "The AI companion is unavailable.";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as ChatEvent);
      } catch {
        /* skip malformed frame */
      }
    }
  }
}
