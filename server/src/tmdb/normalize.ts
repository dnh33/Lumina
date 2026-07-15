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

function normalizeWatchProviders(
  raw: RawTmdbDetails,
  region: string,
): TitleDetails["watchProviders"] {
  const r = raw["watch/providers"]?.results?.[region];
  if (!r) return null;
  const map = (
    list?: { provider_name: string; logo_path?: string | null }[],
  ) =>
    (list ?? []).slice(0, 8).map((p) => ({
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
    }));
  const providers = {
    region,
    link: r.link ?? null,
    flatrate: map(r.flatrate),
    rent: map(r.rent),
    buy: map(r.buy),
  };
  if (!providers.flatrate.length && !providers.rent.length && !providers.buy.length) {
    return null;
  }
  return providers;
}

export function normalizeDetails(
  raw: RawTmdbDetails,
  mediaType: MediaType,
  region = "US",
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

  // Official title-treatment logo: prefer English, then highest-voted.
  const logos = raw.images?.logos ?? [];
  const logoPath =
    [...logos]
      .sort((a, b) => {
        const aEn = a.iso_639_1 === "en" ? 1 : 0;
        const bEn = b.iso_639_1 === "en" ? 1 : 0;
        if (aEn !== bEn) return bEn - aEn;
        return (b.vote_average ?? 0) - (a.vote_average ?? 0);
      })[0]?.file_path ?? null;

  // Best YouTube trailer: official Trailer > any Trailer > Teaser.
  const vids = (raw.videos?.results ?? []).filter((v) => v.site === "YouTube");
  const trailerKey =
    vids.find((v) => v.type === "Trailer" && v.official)?.key ??
    vids.find((v) => v.type === "Trailer")?.key ??
    vids.find((v) => v.type === "Teaser")?.key ??
    null;

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

  // TMDB keyword tags: movie `raw.keywords` ({id,name}[]), tv `raw.keywords.results`.
  const kw = raw.keywords as
    | { id: number; name: string }[]
    | { results?: { id: number; name: string }[] }
    | undefined;
  const rawKeywords = Array.isArray(kw) ? kw : (kw?.results ?? []);
  const keywords = rawKeywords.map((k) => ({ id: k.id, name: k.name }));

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
    logoPath,
    trailerKey,
    watchProviders: normalizeWatchProviders(raw, region),
    keywords,
    imdbId: raw.external_ids?.imdb_id ?? null,
    nextEpisodeToAir: raw.next_episode_to_air
      ? {
          season: raw.next_episode_to_air.season_number,
          episode: raw.next_episode_to_air.episode_number,
          name: raw.next_episode_to_air.name ?? "",
          airDate: raw.next_episode_to_air.air_date ?? null,
        }
      : null,
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
    imdbRating: null,
    rtRating: null,
    originCountry: raw.origin_country ?? [],
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
    stillPath: e.still_path ?? null,
    voteAverage:
      typeof e.vote_average === "number" && e.vote_average > 0
        ? Math.round(e.vote_average * 10) / 10
        : null,
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
