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
  id: number | null;
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
  directorId: number | null;
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
    cast?: {
      id?: number;
      name: string;
      character?: string;
      profile_path?: string | null;
    }[];
    crew?: { id?: number; name: string; job?: string }[];
  };
  aggregate_credits?: {
    cast?: {
      id?: number;
      name: string;
      roles?: { character?: string }[];
      profile_path?: string | null;
    }[];
  };
  created_by?: { id?: number; name: string }[];
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

export interface RawPerson {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  combined_credits?: {
    cast?: (RawTmdbItem & { character?: string })[];
    crew?: (RawTmdbItem & { job?: string; department?: string })[];
  };
}
