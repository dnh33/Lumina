export type MediaType = "movie" | "tv";

/** Normalized shape used across the app for anything coming from TMDB. */
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
}

export interface PersonCredit {
  name: string;
  character?: string;
  profilePath: string | null;
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

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
}

export interface EpisodeInfo {
  season: number;
  episode: number;
  name: string;
  airDate: string | null;
  runtime: number | null;
  overview: string;
}

/* ── Raw TMDB payloads (only fields we read) ─────────────────────── */

export interface RawTmdbItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  popularity?: number;
}

export interface RawTmdbDetails extends RawTmdbItem {
  tagline?: string;
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  credits?: {
    cast?: { name: string; character?: string; profile_path?: string | null }[];
    crew?: { name: string; job?: string }[];
  };
  aggregate_credits?: {
    cast?: {
      name: string;
      roles?: { character?: string }[];
      profile_path?: string | null;
    }[];
  };
  created_by?: { name: string }[];
  similar?: { results?: RawTmdbItem[] };
  recommendations?: { results?: RawTmdbItem[] };
  seasons?: {
    season_number: number;
    name: string;
    episode_count: number;
    air_date?: string | null;
    poster_path?: string | null;
  }[];
}

export interface RawSeason {
  episodes?: {
    season_number: number;
    episode_number: number;
    name?: string;
    air_date?: string | null;
    runtime?: number | null;
    overview?: string;
  }[];
}
