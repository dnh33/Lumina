import type { DB } from "../db/connection.js";
import { env } from "../env.js";

/**
 * Critics scores (IMDb + Rotten Tomatoes) are pulled from OMDb using the
 * title's IMDb id. They describe the TITLE, not the user's personal 1–10
 * rating (library.rating) — they are cached on the `titles` row and shared
 * across every library entry for that tmdb_id.
 *
 * No OMDB_API_KEY configured → we never touch the network and just return
 * whatever is already cached (possibly null). This keeps the app fully
 * functional in dev / for self-hosters who don't want OMDb.
 */

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  Ratings?: OmdbRating[];
}

export interface CriticsScores {
  imdb: number | null;
  rt: number | null;
}

function parseImdb(value: string | undefined): number | null {
  if (!value || value === "N/A") return null;
  // OMDb returns the top-level imdbRating as a plain decimal, e.g. "7.6"
  // (the Ratings[] entry is "7.6/10", so accept both).
  const m = value.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function parseRt(ratings: OmdbRating[] | undefined): number | null {
  const rt = ratings?.find((r) => r.Source === "Rotten Tomatoes");
  if (!rt || rt.Value === "N/A") return null;
  // OMDb returns e.g. "92%"
  const m = rt.Value.match(/(\d+)\s*%/);
  return m ? Number(m[1]) : null;
}

async function fetchFromOmdb(imdbId: string): Promise<CriticsScores> {
  const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${env.omdbApiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`OMDb ${res.status}`);
  const data = (await res.json()) as OmdbResponse;
  if (data.Response !== "True") return { imdb: null, rt: null };
  return {
    imdb: parseImdb(data.imdbRating),
    rt: parseRt(data.Ratings),
  };
}

/**
 * Ensure critics scores exist for a title, lazily. Returns cached values if
 * still fresh (≤30d). Otherwise resolves the IMDb id (from the titles row,
 * or a TMDb external_ids lookup if missing) and fetches from OMDb.
 */
export async function ensureRatings(
  db: DB,
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<CriticsScores> {
  const row = db
    .prepare(
      `SELECT id, imdb_id, imdb_rating, rt_rating, ratings_fetched_at
       FROM titles WHERE tmdb_id = ? AND media_type = ?`,
    )
    .get(tmdbId, mediaType) as
    | {
        id: number;
        imdb_id: string | null;
        imdb_rating: number | null;
        rt_rating: number | null;
        ratings_fetched_at: number | null;
      }
    | undefined;

  if (!row) return { imdb: null, rt: null };

  const fresh =
    row.ratings_fetched_at != null &&
    Date.now() - row.ratings_fetched_at < TTL_MS;
  if (fresh) {
    return { imdb: row.imdb_rating, rt: row.rt_rating };
  }

  // Need a fresh fetch. Without a key we can't, so return what we have.
  if (!env.omdbApiKey) {
    return { imdb: row.imdb_rating, rt: row.rt_rating };
  }

  let imdbId = row.imdb_id;
  if (!imdbId) {
    const details = await fetchDetailsForImdbId(tmdbId, mediaType);
    imdbId = details;
    if (imdbId) {
      db.prepare("UPDATE titles SET imdb_id = ? WHERE id = ?").run(
        imdbId,
        row.id,
      );
    }
  }
  if (!imdbId) {
    // No IMDb id available → mark as fetched (so we don't retry every load).
    db.prepare(
      "UPDATE titles SET ratings_fetched_at = ? WHERE id = ?",
    ).run(Date.now(), row.id);
    return { imdb: row.imdb_rating, rt: row.rt_rating };
  }

  try {
    const scores = await fetchFromOmdb(imdbId);
    db.prepare(
      `UPDATE titles SET imdb_rating = ?, rt_rating = ?, ratings_fetched_at = ?
       WHERE id = ?`,
    ).run(scores.imdb, scores.rt, Date.now(), row.id);
    return scores;
  } catch {
    // Network/OMDb failure → fall back to cached (or null) and don't retry
    // until the TTL lapses.
    db.prepare(
      "UPDATE titles SET ratings_fetched_at = ? WHERE id = ?",
    ).run(Date.now(), row.id);
    return { imdb: row.imdb_rating, rt: row.rt_rating };
  }
}

// Lazy import avoids a hard cycle if libraryService imports this module.
async function fetchDetailsForImdbId(
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<string | null> {
  const { fetchDetailsFromTmdb } = await import("./libraryService.js");
  try {
    const details = await fetchDetailsFromTmdb(tmdbId, mediaType);
    return details.imdbId;
  } catch {
    return null;
  }
}
