import { env } from "../env.js";
import { getDb } from "../db/connection.js";

const BASE = "https://api.themoviedb.org/3";

/** Cache TTLs per endpoint family (ms). */
const TTL = {
  trending: 6 * 60 * 60 * 1000,
  list: 12 * 60 * 60 * 1000,
  search: 12 * 60 * 60 * 1000,
  details: 7 * 24 * 60 * 60 * 1000,
  season: 3 * 24 * 60 * 60 * 1000,
  genres: 30 * 24 * 60 * 60 * 1000,
  discover: 12 * 60 * 60 * 1000,
} as const;

export class TmdbError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

function ttlFor(path: string): number {
  if (path.startsWith("/trending")) return TTL.trending;
  if (path.startsWith("/search")) return TTL.search;
  if (path.startsWith("/discover")) return TTL.discover;
  if (path.startsWith("/genre")) return TTL.genres;
  if (/\/season\/\d+/.test(path)) return TTL.season;
  if (/^\/(movie|tv)\/\d+/.test(path)) return TTL.details;
  return TTL.list;
}

/**
 * GET a TMDB endpoint with bearer auth and a SQLite-backed cache.
 * `path` starts with `/`, params are query string entries.
 */
export async function tmdbGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  if (!env.tmdbAccessToken) {
    throw new TmdbError(
      "TMDB access token missing — add TMDB_ACCESS_TOKEN to your .env",
      503,
    );
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const url = `${BASE}${path}${qs.size ? `?${qs.toString()}` : ""}`;
  const cacheKey = url;
  const db = getDb();

  const cached = db
    .prepare("SELECT payload, fetched_at FROM tmdb_cache WHERE cache_key = ?")
    .get(cacheKey) as { payload: string; fetched_at: number } | undefined;

  if (cached && Date.now() - cached.fetched_at < ttlFor(path)) {
    return JSON.parse(cached.payload) as T;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.tmdbAccessToken}`,
        Accept: "application/json",
      },
    });
  } catch (err) {
    // Network failure — serve stale cache if we have one.
    if (cached) return JSON.parse(cached.payload) as T;
    throw new TmdbError(
      `Could not reach TMDB (${(err as Error).message})`,
      502,
    );
  }

  if (!res.ok) {
    if (cached) return JSON.parse(cached.payload) as T;
    const detail =
      res.status === 401
        ? "TMDB rejected the access token — check TMDB_ACCESS_TOKEN in .env"
        : `TMDB responded ${res.status}`;
    throw new TmdbError(detail, res.status === 401 ? 401 : 502);
  }

  const json = (await res.json()) as T;
  db.prepare(
    `INSERT INTO tmdb_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
  ).run(cacheKey, JSON.stringify(json), Date.now());

  // Opportunistic pruning (~2% of writes): keep the 5000 freshest entries
  // so the cache can't grow without bound.
  if (Math.random() < 0.02) {
    db.prepare(
      `DELETE FROM tmdb_cache WHERE cache_key IN (
         SELECT cache_key FROM tmdb_cache ORDER BY fetched_at DESC LIMIT -1 OFFSET 5000)`,
    ).run();
  }
  return json;
}

/** Genre id maps, cached aggressively. */
export async function genreMap(
  mediaType: "movie" | "tv",
): Promise<Map<string, number>> {
  const data = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    `/genre/${mediaType}/list`,
  );
  return new Map(data.genres.map((g) => [g.name.toLowerCase(), g.id]));
}
