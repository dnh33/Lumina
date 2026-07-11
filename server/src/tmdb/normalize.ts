import type {
  CatalogItem,
  EpisodeInfo,
  MediaType,
  PersonDetails,
  RawPerson,
  RawSeason,
  RawTmdbDetails,
  RawTmdbItem,
  TitleDetails,
} from "./types.js";

function yearOf(dateStr?: string): number | null {
  if (!dateStr) return null;
  const y = Number(dateStr.slice(0, 4));
  return Number.isFinite(y) && y > 1800 ? y : null;
}

export function normalizeItem(
  raw: RawTmdbItem,
  fallbackType?: MediaType,
): CatalogItem | null {
  const mediaType = (raw.media_type ?? fallbackType) as MediaType | undefined;
  if (mediaType !== "movie" && mediaType !== "tv") return null;
  const title = raw.title ?? raw.name;
  if (!title) return null;
  return {
    tmdbId: raw.id,
    mediaType,
    title,
    year: yearOf(raw.release_date ?? raw.first_air_date),
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    voteAverage:
      typeof raw.vote_average === "number"
        ? Math.round(raw.vote_average * 10) / 10
        : null,
    genreIds: raw.genre_ids ?? [],
    popularity: raw.popularity ?? null,
  };
}

export function normalizeList(
  raw: RawTmdbItem[] | undefined,
  fallbackType?: MediaType,
): CatalogItem[] {
  return (raw ?? [])
    .map((r) => normalizeItem(r, fallbackType))
    .filter((x): x is CatalogItem => x !== null && !!x.posterPath);
}

export function normalizeDetails(
  raw: RawTmdbDetails,
  mediaType: MediaType,
): TitleDetails {
  const base = normalizeItem({ ...raw, media_type: mediaType }, mediaType);
  if (!base) throw new Error("Unrecognized TMDB payload");

  let director: string | null = null;
  let directorId: number | null = null;
  if (mediaType === "movie") {
    const d = raw.credits?.crew?.find((c) => c.job === "Director");
    director = d?.name ?? null;
    directorId = d?.id ?? null;
  } else {
    director = raw.created_by?.[0]?.name ?? null;
    directorId = raw.created_by?.[0]?.id ?? null;
  }

  const cast =
    mediaType === "tv" && raw.aggregate_credits?.cast?.length
      ? raw.aggregate_credits.cast.slice(0, 14).map((c) => ({
          id: c.id ?? null,
          name: c.name,
          character: c.roles?.[0]?.character,
          profilePath: c.profile_path ?? null,
        }))
      : (raw.credits?.cast ?? []).slice(0, 14).map((c) => ({
          id: c.id ?? null,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ?? null,
        }));

  const similarRaw = [
    ...(raw.recommendations?.results ?? []),
    ...(raw.similar?.results ?? []),
  ];
  const seen = new Set<number>();
  const similar = normalizeList(similarRaw, mediaType).filter((s) => {
    if (seen.has(s.tmdbId)) return false;
    seen.add(s.tmdbId);
    return s.tmdbId !== raw.id;
  });

  return {
    ...base,
    tagline: raw.tagline ?? "",
    genres: (raw.genres ?? []).map((g) => g.name),
    runtime:
      mediaType === "movie"
        ? (raw.runtime ?? null)
        : (raw.episode_run_time?.[0] ?? null),
    seasonsCount: raw.number_of_seasons ?? null,
    episodesCount: raw.number_of_episodes ?? null,
    director,
    directorId,
    cast,
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    status: raw.status ?? null,
    similar: similar.slice(0, 18),
    seasons: (raw.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        airDate: s.air_date ?? null,
        posterPath: s.poster_path ?? null,
      })),
  };
}

export function normalizeSeason(raw: RawSeason): EpisodeInfo[] {
  return (raw.episodes ?? []).map((e) => ({
    season: e.season_number,
    episode: e.episode_number,
    name: e.name ?? "",
    airDate: e.air_date ?? null,
    runtime: e.runtime ?? null,
    overview: e.overview ?? "",
  }));
}

/** Deduplicate credits by title, keep the most popular occurrence. */
function dedupeCredits(items: CatalogItem[]): CatalogItem[] {
  const byKey = new Map<string, CatalogItem>();
  for (const item of items) {
    const key = `${item.mediaType}:${item.tmdbId}`;
    const existing = byKey.get(key);
    if (!existing || (item.popularity ?? 0) > (existing.popularity ?? 0)) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

export function normalizePerson(raw: RawPerson): PersonDetails {
  const castCredits = dedupeCredits(
    (raw.combined_credits?.cast ?? [])
      .map((c) => normalizeItem(c))
      .filter((x): x is CatalogItem => x !== null && !!x.posterPath),
  );

  const crew = raw.combined_credits?.crew ?? [];
  const directing = dedupeCredits(
    crew
      .filter((c) => c.job === "Director")
      .map((c) => normalizeItem(c))
      .filter((x): x is CatalogItem => x !== null && !!x.posterPath),
  );
  const writing = dedupeCredits(
    crew
      .filter((c) => c.department === "Writing" || c.job === "Screenplay" || c.job === "Writer" || c.job === "Creator")
      .map((c) => normalizeItem(c))
      .filter((x): x is CatalogItem => x !== null && !!x.posterPath),
  );

  const primary =
    raw.known_for_department === "Directing" && directing.length
      ? directing
      : castCredits.length
        ? castCredits
        : directing;
  const knownFor = [...primary]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 12);

  return {
    id: raw.id,
    name: raw.name,
    biography: raw.biography ?? "",
    birthday: raw.birthday ?? null,
    deathday: raw.deathday ?? null,
    placeOfBirth: raw.place_of_birth ?? null,
    profilePath: raw.profile_path ?? null,
    knownForDepartment: raw.known_for_department ?? null,
    knownFor,
    actingCredits: castCredits,
    directingCredits: directing,
    writingCredits: writing,
  };
}
