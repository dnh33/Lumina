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
  id: number | null;
  name: string;
  character?: string;
  profilePath: string | null;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  profilePath: string | null;
  knownForDepartment: string | null;
  knownFor: CatalogItem[];
  actingCredits: CatalogItem[];
  directingCredits: CatalogItem[];
  writingCredits: CatalogItem[];
}

export interface UpNextItem {
  entry: LibraryEntry;
  next: {
    episodeId: number;
    season: number;
    episode: number;
    name: string;
    airDate: string | null;
  } | null;
  watched: number;
  total: number;
  hasNewEpisode: boolean;
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
}

export interface WatchProvider {
  name: string;
  logoPath: string | null;
}

export interface WatchProviders {
  region: string;
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface TitleDetails extends CatalogItem {
  tagline: string;
  genres: string[];
  runtime: number | null;
  seasonsCount: number | null;
  episodesCount: number | null;
  director: string | null;
  directorId: number | null;
  cast: PersonCredit[];
  releaseDate: string | null;
  status: string | null;
  logoPath: string | null;
  trailerKey: string | null;
  watchProviders: WatchProviders | null;
  nextEpisodeToAir: {
    season: number;
    episode: number;
    name: string;
    airDate: string | null;
  } | null;
  similar: CatalogItem[];
  seasons: SeasonSummary[];
}

export interface EpisodeRecap {
  text: string;
  resumeAt: { season: number; episode: number; name: string } | null;
  watched: number;
  total: number;
  cached: boolean;
}

export interface TagCount {
  name: string;
  count: number;
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
  tags: string[];
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
  stillPath: string | null;
  voteAverage: number | null;
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
  watchRegion: string;
  libraryCount: number;
  dataDir: string;
}

/** Parsed shape of ChatMessageRow.meta (best-effort). */
export interface MessageMeta {
  toolsUsed?: string[];
  writeReceipts?: string[];
  stopped?: boolean;
  model?: string;
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
  | { type: "tool_done"; name: string; summary?: string }
  | { type: "done"; messageId: number; conversationTitle: string }
  | { type: "error"; message: string };

export interface SuggestionItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year?: number;
  /** one-clause taste rationale from the model */
  reason?: string;
  /** safe = squarely their taste, stretch = adventurous */
  pick?: "safe" | "stretch";
}
