export type MediaType = "movie" | "tv";
export type LibraryStatus = "watched" | "watching" | "watchlist" | "abandoned";

export interface CatalogItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number | null;
  genreIds: number[];
  popularity: number | null;
  inLibrary?: boolean;
}

export interface PersonCredit {
  name: string;
  character?: string;
  profilePath: string | null;
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
}

export interface TitleDetails extends CatalogItem {
  tagline: string;
  genres: string[];
  runtime: number | null;
  seasonsCount: number | null;
  episodesCount: number | null;
  director: string | null;
  cast: PersonCredit[];
  releaseDate: string | null;
  status: string | null;
  similar: CatalogItem[];
  seasons: SeasonSummary[];
}

export interface LibraryEntry {
  id: number;
  titleId: number;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  genres: string[];
  runtime: number | null;
  seasonsCount: number | null;
  episodesCount: number | null;
  director: string | null;
  voteAverage: number | null;
  status: LibraryStatus;
  rating: number | null;
  notes: string;
  favorite: boolean;
  watchedAt: string | null;
  addedAt: string;
  updatedAt: string;
  watchedEpisodes?: number;
}

export interface EpisodeRow {
  id: number;
  titleId: number;
  season: number;
  episode: number;
  name: string;
  airDate: string | null;
  runtime: number | null;
  overview: string;
  watched: boolean;
  watchedAt: string | null;
}

export interface LibraryStats {
  total: number;
  watched: number;
  watching: number;
  watchlist: number;
  favorites: number;
  movies: number;
  shows: number;
  avgRating: number | null;
  ratedCount: number;
  estimatedHours: number;
  episodesWatched: number;
}

export interface ConversationSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
}

export interface ChatMessageRow {
  id: number;
  role: "user" | "assistant";
  content: string;
  meta: string | null;
  created_at: string;
}

export interface Health {
  ok: boolean;
  tmdbConfigured: boolean;
  aiConfigured: boolean;
  model: string;
  libraryCount: number;
  dataDir: string;
}

export interface ForYou {
  basedOn: string[];
  items: CatalogItem[];
}

export interface Because {
  source: { title: string; tmdbId: number; mediaType: MediaType } | null;
  items: CatalogItem[];
}

export interface TitleInsight {
  text: string;
  cached: boolean;
  model: string;
}

export type ChatEvent =
  | { type: "context"; librarySize: number; matches: string[]; memoryHits: number }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string }
  | { type: "tool_done"; name: string }
  | { type: "done"; messageId: number; conversationTitle: string }
  | { type: "error"; message: string };

export interface SuggestionItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year?: number;
}
