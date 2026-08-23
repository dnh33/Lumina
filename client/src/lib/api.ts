import type {
  Because,
  CatalogItem,
  ChatEvent,
  ChatMessageRow,
  ConversationSummary,
  EpisodeRecap,
  EpisodeRow,
  ForYou,
  GenreExperience,
  GenreExperienceIntro,
  GuidedSessionPayload,
  GuidedBeatId,
  Genre,
  Health,
  IgnoredTitle,
  LibraryEntry,
  LibraryStats,
  LibraryStatus,
  MediaType,
  PersonDetails,
  TagCount,
  TitleDetails,
  TitleInsight,
  RetiredAnchor,
  UpNextItem,
} from "./types";
export type SignalKind = "avoid_title" | "avoid_genre" | "avoid_director" | "avoid_actor" | "preference" | "correction";

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

const get = <T,>(url: string) => fetch(url).then((r) => j<T>(r));
const send = <T,>(method: string, url: string, body?: unknown) =>
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
  genreExperience: (genres: string[], mode: "self" | "guided" = "self", mediaType: "movie" | "tv" = "movie", modules: string[] = []) =>
    get<GenreExperience>(`/api/discover/genre-experience?genres=${encodeURIComponent(genres.join(","))}&mode=${mode}&mediaType=${mediaType}${modules.length ? `&modules=${encodeURIComponent(modules.join(","))}` : ""}`),
  // P1.1/2.3: the curator intro is split into its own endpoint so the rails
  // don't block on the LLM. GenreExperience reads the hook from this on mount.
  genreIntro: (genres: string[], mode: "self" | "guided" = "self", mediaType: "movie" | "tv" = "movie", modules: string[] = []) =>
    get<GenreExperienceIntro | null>(`/api/discover/genre-intro?genres=${encodeURIComponent(genres.join(","))}&mode=${mode}&mediaType=${mediaType}${modules.length ? `&modules=${encodeURIComponent(modules.join(","))}` : ""}`),

  /* guided tour (Worlds G1) */
  guidedSession: (slug: string, mediaType: MediaType = "movie") =>
    get<GuidedSessionPayload>(
      `/api/discover/guided-session?slug=${encodeURIComponent(slug)}&mediaType=${mediaType}`,
    ),
  /** Hub Resume peek — read-only; never creates an empty session. */
  guidedSessionPeek: (slug: string, mediaType?: MediaType) => {
    const q = new URLSearchParams({ slug, peek: "1" });
    if (mediaType) q.set("mediaType", mediaType);
    return get<{ session: GuidedSessionPayload["session"] | null; beats: GuidedSessionPayload["beats"] }>(
      `/api/discover/guided-session?${q}`,
    );
  },
  answerGuided: (body: {
    slug: string;
    mediaType?: MediaType;
    beatId: GuidedBeatId;
    choiceId: string;
  }) => send<GuidedSessionPayload>("POST", "/api/discover/guided-session/answer", body),
  guidedAct: (body: {
    slug: string;
    mediaType?: MediaType;
    tmdbId: number;
    titleMediaType: MediaType;
    action: "watchlist" | "dismiss" | "open";
    title?: string;
    year?: number | null;
    posterPath?: string | null;
  }) => send<GuidedSessionPayload>("POST", "/api/discover/guided-session/act", body),
  resetGuided: (body: { slug: string; mediaType?: MediaType }) =>
    send<GuidedSessionPayload>("POST", "/api/discover/guided-session/reset", body),
  linkGuided: (body: {
    slug: string;
    mediaType?: MediaType;
    conversationId: number;
  }) => send<GuidedSessionPayload>("POST", "/api/discover/guided-session/link", body),

  because: () => get<Because>("/api/discover/because"),
  upNext: () => get<UpNextItem[]>("/api/discover/up-next"),
  encore: () => get<LibraryEntry[]>("/api/discover/encore"),
  person: (id: number) => get<PersonDetails>(`/api/tmdb/person/${id}`),

  /* library */
  library: (params: Record<string, string> = {}) =>
    get<LibraryEntry[]>(`/api/library?${new URLSearchParams(params)}`),
  libraryStats: () => get<LibraryStats>("/api/library/stats"),
  libraryGenres: () => get<string[]>("/api/library/genres"),
  libraryTags: () => get<TagCount[]>("/api/library/tags"),
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
      tags: string[];
      favorite: boolean;
      watchedAt: string | null;
    }>,
  ) => send<LibraryEntry>("PATCH", `/api/library/${id}`, patch),
  removeEntry: (id: number) =>
    fetch(`/api/library/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Delete failed");
    }),

  /* ignore & discovery prefs */
  ignore: (body: { tmdbId: number; mediaType: MediaType }) =>
    send<{ ok: true }>("POST", "/api/ignore", body),
  unignore: (mediaType: MediaType, tmdbId: number) =>
    fetch(`/api/ignore/${mediaType}/${tmdbId}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Un-ignore failed");
    }),
  ignoredList: () => get<IgnoredTitle[]>("/api/ignore"),
  genres: () => get<Genre[]>("/api/tmdb/genres"),
  getDiscoveryPrefs: () =>
    get<{ excludedGenres: number[] }>("/api/discovery-prefs"),
  setDiscoveryPrefs: (excludedGenres: number[]) =>
    send<{ excludedGenres: number[] }>("PUT", "/api/discovery-prefs", {
      excludedGenres,
    }),

  /* retire-as-anchor (anti-fatigue): keep in taste profile, drop as comparison hook */
  retireAnchor: (libraryId: number) =>
    send<{ retired: true }>("POST", `/api/library/${libraryId}/retire-anchor`),
  unretireAnchor: (libraryId: number) =>
    fetch(`/api/library/${libraryId}/retire-anchor`, { method: "DELETE" }).then(
      (r) => {
        if (!r.ok) throw new Error("Unretire failed");
      },
    ),
  anchorRetired: (libraryId: number) =>
    get<{ retired: boolean; fatigued: boolean }>(`/api/library/${libraryId}/retired`),
  retiredAnchors: () => get<RetiredAnchor[]>("/api/library/retired-anchors"),
  anchorLogging: () => get<{ enabled: boolean }>("/api/library/anchor-logging"),
  setAnchorLogging: (enabled: boolean) =>
    send<{ enabled: boolean }>("POST", "/api/library/anchor-logging", {
      enabled,
    }),
  clearAnchorUsage: () =>
    send<{ ok: true }>("POST", "/api/library/clear-anchor-usage"),

  enrichAll: () =>
    send<{
      ok: true;
      checked?: number;
      enriched?: number;
      skipped?: boolean;
      reason?: string;
    }>("POST", "/api/library/enrich-all"),

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
  insight: (type: MediaType, tmdbId: number, refresh = false, skipAnchorLog = false) =>
    get<TitleInsight>(
      `/api/insight/${type}/${tmdbId}${refresh ? "?refresh=1" : ""}${
        skipAnchorLog ? (refresh ? "&" : "?") + "skipAnchorLog=1" : ""
      }`,
    ),
  recap: (libraryId: number, refresh = false) =>
    get<EpisodeRecap>(`/api/recap/${libraryId}${refresh ? "?refresh=1" : ""}`),
  deleteAllConversations: () =>
    fetch("/api/conversations", { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Delete failed");
    }),
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

  /* Taste Feedback Loop */
  feedback: (
    conversationId: number,
    kind: SignalKind,
    target: string,
    reason = "",
  ) =>
    send<{ id: number; kind: SignalKind; target: string; reason: string; created_at: string }>(
      "POST",
      `/api/conversations/${conversationId}/feedback`,
      { kind, target, reason },
    ),

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
  forkConversation: (id: number, forkPoint: number, label?: string) =>
    fetch(`/api/conversations/${id}/fork`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fork_point: forkPoint, label }),
    }).then((r) => {
      if (!r.ok) throw new Error(`Fork failed: ${r.status}`);
      return r.json() as Promise<{ forkId: number; childConversationId: number }>;
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
