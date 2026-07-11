import type { DB } from "../db/connection.js";
import { genreMap, tmdbGet } from "../tmdb/client.js";
import { normalizeList } from "../tmdb/normalize.js";
import type { CatalogItem, MediaType, RawTmdbItem } from "../tmdb/types.js";
import { libraryTmdbIds } from "./libraryService.js";
import { computeTasteProfile } from "../rag/tasteProfile.js";

interface Paged {
  results?: RawTmdbItem[];
}

export interface CatalogItemWithFlags extends CatalogItem {
  inLibrary: boolean;
}

function flag(db: DB, items: CatalogItem[]): CatalogItemWithFlags[] {
  const owned = libraryTmdbIds(db);
  return items.map((i) => ({
    ...i,
    inLibrary: owned.has(`${i.mediaType}:${i.tmdbId}`),
  }));
}

export async function trending(db: DB): Promise<CatalogItemWithFlags[]> {
  const data = await tmdbGet<Paged>("/trending/all/week");
  return flag(db, normalizeList(data.results));
}

export async function popular(
  db: DB,
  mediaType: MediaType,
): Promise<CatalogItemWithFlags[]> {
  const data = await tmdbGet<Paged>(`/${mediaType}/popular`);
  return flag(db, normalizeList(data.results, mediaType));
}

export async function topRated(
  db: DB,
  mediaType: MediaType,
): Promise<CatalogItemWithFlags[]> {
  const data = await tmdbGet<Paged>(`/${mediaType}/top_rated`);
  return flag(db, normalizeList(data.results, mediaType));
}

export async function searchMulti(
  db: DB,
  query: string,
): Promise<CatalogItemWithFlags[]> {
  const data = await tmdbGet<Paged>("/search/multi", {
    query,
    include_adult: "false",
  });
  return flag(
    db,
    normalizeList(data.results).filter(
      (r) => r.mediaType === "movie" || r.mediaType === "tv",
    ),
  );
}

export interface ForYouResult {
  basedOn: string[];
  items: CatalogItemWithFlags[];
}

/**
 * Personalized discovery: takes the user's top-rated genres from the taste
 * profile and asks TMDB discover for acclaimed titles in those genres,
 * excluding everything already in the library.
 */
export async function forYou(db: DB): Promise<ForYouResult> {
  const profile = computeTasteProfile(db);
  const topGenres = profile.topGenres.slice(0, 3).map((g) => g.name);
  if (!topGenres.length) return { basedOn: [], items: [] };

  const owned = libraryTmdbIds(db);
  const collected: CatalogItem[] = [];

  for (const mediaType of ["movie", "tv"] as const) {
    const map = await genreMap(mediaType);
    const ids = topGenres
      .map((name) => map.get(name.toLowerCase()))
      .filter((x): x is number => !!x);
    if (!ids.length) continue;

    const data = await tmdbGet<Paged>(`/discover/${mediaType}`, {
      with_genres: ids.join("|"),
      sort_by: "vote_average.desc",
      "vote_count.gte": mediaType === "movie" ? 500 : 200,
      include_adult: "false",
    });
    collected.push(...normalizeList(data.results, mediaType));
  }

  // Interleave movies and shows, drop owned titles.
  const fresh = collected.filter(
    (i) => !owned.has(`${i.mediaType}:${i.tmdbId}`),
  );
  fresh.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));

  return {
    basedOn: topGenres,
    items: flag(db, fresh.slice(0, 24)),
  };
}

export interface BecauseResult {
  source: { title: string; tmdbId: number; mediaType: MediaType } | null;
  items: CatalogItemWithFlags[];
}

/** "Because you loved X" — recommendations seeded by the user's favorites. */
export async function becauseYouLoved(db: DB): Promise<BecauseResult> {
  const seed = db
    .prepare(
      `SELECT t.tmdb_id, t.media_type, t.title
       FROM library l JOIN titles t ON t.id = l.title_id
       WHERE l.favorite = 1 OR l.rating >= 9
       ORDER BY l.updated_at DESC LIMIT 1`,
    )
    .get() as
    | { tmdb_id: number; media_type: MediaType; title: string }
    | undefined;
  if (!seed) return { source: null, items: [] };

  const data = await tmdbGet<Paged>(
    `/${seed.media_type}/${seed.tmdb_id}/recommendations`,
  );
  const owned = libraryTmdbIds(db);
  const items = normalizeList(data.results, seed.media_type).filter(
    (i) => !owned.has(`${i.mediaType}:${i.tmdbId}`),
  );

  return {
    source: {
      title: seed.title,
      tmdbId: seed.tmdb_id,
      mediaType: seed.media_type,
    },
    items: flag(db, items.slice(0, 20)),
  };
}
