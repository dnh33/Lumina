import type OpenAI from "openai";
import type { DB } from "../db/connection.js";
import { retrieveLibrary } from "../rag/retrieval.js";
import {
  computeTasteProfile,
  renderTasteProfile,
} from "../rag/tasteProfile.js";
import {
  addToLibrary,
  fetchDetailsFromTmdb,
  getEntryByTmdb,
  libraryTmdbIds,
  listEpisodes,
  syncEpisodes,
} from "../services/libraryService.js";
import { searchMulti } from "../services/discoverService.js";
import { genreMap, tmdbGet } from "../tmdb/client.js";
import { normalizeList } from "../tmdb/normalize.js";
import type { MediaType, RawTmdbItem } from "../tmdb/types.js";

/**
 * RAG · Layer 4 — live tools.
 * The model reaches into the local library and TMDB itself during the
 * conversation, so answers stay accurate and current.
 */

export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_library",
      description:
        "Full-text search the user's private library (titles, genres, people, their personal notes). Returns their status, rating and notes for matches.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_taste_profile",
      description:
        "Get the user's full aggregated taste profile: genre affinities, loved/disliked titles, favorite directors, current watching progress, watchlist.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_tmdb",
      description:
        "Search the global TMDB catalog for films and series. Use to verify any title exists and get its tmdbId, year and rating before recommending.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          media_type: {
            type: "string",
            enum: ["movie", "tv"],
            description: "Optional filter",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_title_details",
      description:
        "Full details for one title: synopsis, genres, runtime, director/creator, cast, similar titles, and whether it's already in the user's library.",
      parameters: {
        type: "object",
        properties: {
          tmdb_id: { type: "number" },
          media_type: { type: "string", enum: ["movie", "tv"] },
        },
        required: ["tmdb_id", "media_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "discover_titles",
      description:
        "Browse TMDB by genre/era/acclaim — ideal for mood and vibe requests. Returns titles NOT in the user's library first.",
      parameters: {
        type: "object",
        properties: {
          media_type: { type: "string", enum: ["movie", "tv"] },
          genres: {
            type: "array",
            items: { type: "string" },
            description:
              "Genre names, e.g. ['Science Fiction','Thriller']. OR-combined.",
          },
          sort: {
            type: "string",
            enum: ["acclaimed", "popular"],
            description: "acclaimed = best rated, popular = most watched now",
          },
          year_from: { type: "number" },
          year_to: { type: "number" },
        },
        required: ["media_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_library",
      description:
        "Save a title to the user's library. Use ONLY when the user asks to save/queue/log something. Default status: watchlist.",
      parameters: {
        type: "object",
        properties: {
          tmdb_id: { type: "number" },
          media_type: { type: "string", enum: ["movie", "tv"] },
          status: {
            type: "string",
            enum: ["watchlist", "watched", "watching"],
          },
        },
        required: ["tmdb_id", "media_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_episode_progress",
      description:
        "For a series in the user's library: how many episodes they've watched and which episode is next.",
      parameters: {
        type: "object",
        properties: {
          title_query: { type: "string", description: "Series name" },
        },
        required: ["title_query"],
      },
    },
  },
];

type Args = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function executeTool(
  db: DB,
  name: string,
  argsJson: string,
): Promise<string> {
  let args: Args = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Args) : {};
  } catch {
    return JSON.stringify({ error: "Malformed tool arguments" });
  }

  try {
    switch (name) {
      case "search_library": {
        const hits = retrieveLibrary(db, str(args.query), 10);
        return JSON.stringify(
          hits.map((h) => ({
            title: h.title,
            year: h.year,
            mediaType: h.mediaType,
            tmdbId: h.tmdbId,
            status: h.status,
            rating: h.rating,
            favorite: h.favorite,
            genres: h.genres,
            director: h.director,
            notes: h.notes.slice(0, 200),
          })),
        );
      }

      case "get_taste_profile": {
        return renderTasteProfile(computeTasteProfile(db));
      }

      case "search_tmdb": {
        const all = await searchMulti(db, str(args.query));
        const type = str(args.media_type);
        const filtered = type
          ? all.filter((r) => r.mediaType === type)
          : all;
        return JSON.stringify(
          filtered.slice(0, 8).map((r) => ({
            tmdbId: r.tmdbId,
            mediaType: r.mediaType,
            title: r.title,
            year: r.year,
            tmdbRating: r.voteAverage,
            inUserLibrary: r.inLibrary,
            overview: r.overview.slice(0, 200),
          })),
        );
      }

      case "get_title_details": {
        const tmdbId = Number(args.tmdb_id);
        const mediaType = str(args.media_type) as MediaType;
        const d = await fetchDetailsFromTmdb(tmdbId, mediaType);
        const owned = getEntryByTmdb(db, tmdbId, mediaType);
        return JSON.stringify({
          tmdbId: d.tmdbId,
          mediaType: d.mediaType,
          title: d.title,
          year: d.year,
          tagline: d.tagline,
          overview: d.overview,
          genres: d.genres,
          runtime: d.runtime,
          seasons: d.seasonsCount,
          episodes: d.episodesCount,
          director: d.director,
          cast: d.cast.slice(0, 8).map((c) => c.name),
          tmdbRating: d.voteAverage,
          similarTitles: d.similar.slice(0, 8).map((s) => ({
            tmdbId: s.tmdbId,
            title: s.title,
            year: s.year,
            mediaType: s.mediaType,
          })),
          inUserLibrary: owned
            ? { status: owned.status, rating: owned.rating, notes: owned.notes.slice(0, 200) }
            : false,
        });
      }

      case "discover_titles": {
        const mediaType = (str(args.media_type) || "movie") as MediaType;
        const map = await genreMap(mediaType);
        const names = Array.isArray(args.genres)
          ? (args.genres as unknown[]).map((g) => String(g))
          : [];
        const ids = names
          .map((n) => map.get(n.toLowerCase()))
          .filter((x): x is number => !!x);

        const dateKey =
          mediaType === "movie" ? "primary_release_date" : "first_air_date";
        const params: Record<string, string | number | undefined> = {
          sort_by:
            args.sort === "popular" ? "popularity.desc" : "vote_average.desc",
          "vote_count.gte": mediaType === "movie" ? 400 : 150,
          include_adult: "false",
          with_genres: ids.length ? ids.join("|") : undefined,
        };
        if (args.year_from) params[`${dateKey}.gte`] = `${args.year_from}-01-01`;
        if (args.year_to) params[`${dateKey}.lte`] = `${args.year_to}-12-31`;

        const data = await tmdbGet<{ results?: RawTmdbItem[] }>(
          `/discover/${mediaType}`,
          params,
        );
        const ownedIds = libraryTmdbIds(db);
        const items = normalizeList(data.results, mediaType);
        items.sort((a, b) => {
          const aOwned = ownedIds.has(`${a.mediaType}:${a.tmdbId}`) ? 1 : 0;
          const bOwned = ownedIds.has(`${b.mediaType}:${b.tmdbId}`) ? 1 : 0;
          return aOwned - bOwned;
        });
        return JSON.stringify(
          items.slice(0, 12).map((r) => ({
            tmdbId: r.tmdbId,
            mediaType: r.mediaType,
            title: r.title,
            year: r.year,
            tmdbRating: r.voteAverage,
            inUserLibrary: ownedIds.has(`${r.mediaType}:${r.tmdbId}`),
            overview: r.overview.slice(0, 160),
          })),
        );
      }

      case "add_to_library": {
        const tmdbId = Number(args.tmdb_id);
        const mediaType = str(args.media_type) as MediaType;
        const status = (str(args.status) || "watchlist") as
          | "watchlist"
          | "watched"
          | "watching";
        const entry = await addToLibrary(db, { tmdbId, mediaType, status });
        return JSON.stringify({
          saved: true,
          title: entry.title,
          year: entry.year,
          status: entry.status,
        });
      }

      case "get_episode_progress": {
        const hits = retrieveLibrary(db, str(args.title_query), 3).filter(
          (h) => h.mediaType === "tv",
        );
        if (!hits.length)
          return JSON.stringify({ error: "No matching series in the library" });
        const h = hits[0];
        let eps = listEpisodes(db, h.titleId);
        if (!eps.length) {
          await syncEpisodes(db, h.titleId);
          eps = listEpisodes(db, h.titleId);
        }
        const watched = eps.filter((e) => e.watched);
        const next = eps.find((e) => !e.watched);
        return JSON.stringify({
          title: h.title,
          status: h.status,
          watched: watched.length,
          total: eps.length,
          nextEpisode: next
            ? { season: next.season, episode: next.episode, name: next.name }
            : null,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message });
  }
}
