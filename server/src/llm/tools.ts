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
  listEpisodes,
  setWatchedUpTo,
  syncEpisodes,
  updateEntry,
  type LibraryEntry,
  type LibraryStatus,
} from "../services/libraryService.js";
import { flag, searchMulti } from "../services/discoverService.js";
import { fatigueScores, isRetired, logAnchor } from "../services/anchorService.js";
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
        "Save a title to the user's library, optionally with their rating, a note and tags in the same call. Use when the user asks to save/queue/log something. Default status: watchlist.",
      parameters: {
        type: "object",
        properties: {
          tmdb_id: { type: "number" },
          media_type: { type: "string", enum: ["movie", "tv"] },
          status: {
            type: "string",
            enum: ["watchlist", "watched", "watching"],
          },
          rating: {
            type: "number",
            description: "The user's own rating 1-10, only if they stated or clearly implied one",
          },
          note: {
            type: "string",
            description: "The user's reaction in their own words, distilled (max ~200 chars)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description:
              "Short taste tags capturing WHY it landed or didn't, e.g. ['fast-hook','puzzle-box','slow-burn-dnf']",
          },
        },
        required: ["tmdb_id", "media_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_library_entry",
      description:
        "Update an existing library entry: set the user's rating, append to their notes, add/remove tags, change status or favorite. THIS is how you persist what the user tells you about titles they've seen — their reactions must outlive this conversation.",
      parameters: {
        type: "object",
        properties: {
          tmdb_id: { type: "number", description: "Preferred lookup" },
          media_type: { type: "string", enum: ["movie", "tv"] },
          title_query: {
            type: "string",
            description: "Fallback lookup by name if tmdb_id unknown",
          },
          rating: { type: "number", description: "1-10" },
          note_append: {
            type: "string",
            description: "Text appended to their notes (their sentiment, distilled)",
          },
          tags_add: { type: "array", items: { type: "string" } },
          tags_remove: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["watched", "watching", "watchlist", "abandoned"],
          },
          favorite: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_episode_progress",
      description:
        "Mark episode progress for a series in the library. Provide season+episode to check off everything up to that point ('I'm through S2E4'), season alone for whole seasons ('mark season 1 watched'), or neither to mark the entire show watched.",
      parameters: {
        type: "object",
        properties: {
          title_query: { type: "string", description: "Series name" },
          season: { type: "number" },
          episode: { type: "number" },
        },
        required: ["title_query"],
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
  {
    type: "function",
    function: {
      name: "compare_titles",
      description:
        "Decision helper when the user is torn between 2-4 titles. Returns comparable facts per candidate (commitment cost, genre overlap with their strengths, favorite-director match, what loved titles it echoes) so you can deliver a ranked verdict: the safe pick vs the stretch. Use for 'X or Y?', 'help me pick', 'which tonight?'.",
      parameters: {
        type: "object",
        properties: {
          candidates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tmdb_id: { type: "number" },
                media_type: { type: "string", enum: ["movie", "tv"] },
              },
              required: ["tmdb_id", "media_type"],
            },
            description: "2-4 titles (ids from prior tool results)",
          },
          mood: {
            type: "string",
            description: "Optional: stated mood / energy / time budget tonight",
          },
        },
        required: ["candidates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_continuing_series",
      description:
        "Everything the user is mid-way through: exact next episode per show, progress, and whether NEW episodes aired since they last watched. Use for 'anything new for me?', 'what should I continue?', or proactive nudges.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_episode_recap",
      description:
        "Spoiler-safe 'previously on…' for a series the user is resuming: a recap built ONLY from episodes they've already watched, plus where to resume. Use when they say 'where was I', 'remind me what happened', or resume a show after a break.",
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

function strArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => String(x)).filter(Boolean);
}

function clampRating(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(10, Math.max(1, Math.round(n)));
}

/** Find a library entry by tmdb id (preferred) or fuzzy title query. */
function resolveEntry(db: import("../db/connection.js").DB, args: Args): LibraryEntry | null {
  const tmdbId = Number(args.tmdb_id);
  const mediaType = str(args.media_type) as MediaType;
  if (Number.isFinite(tmdbId) && tmdbId > 0 && (mediaType === "movie" || mediaType === "tv")) {
    const byId = getEntryByTmdb(db, tmdbId, mediaType);
    if (byId) return byId;
  }
  const q = str(args.title_query);
  if (q) {
    const hits = retrieveLibrary(db, q, 1);
    if (hits.length) return hits[0];
  }
  return null;
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
          whereToWatch: d.watchProviders
            ? {
                region: d.watchProviders.region,
                streaming: d.watchProviders.flatrate.map((p) => p.name),
                rent: d.watchProviders.rent.map((p) => p.name),
              }
            : null,
          hasTrailer: !!d.trailerKey,
          nextEpisodeToAir: d.nextEpisodeToAir,
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
        const items = flag(db, normalizeList(data.results, mediaType));
        items.sort((a, b) => Number(a.inLibrary) - Number(b.inLibrary));
        return JSON.stringify(
          items.slice(0, 12).map((r) => ({
            tmdbId: r.tmdbId,
            mediaType: r.mediaType,
            title: r.title,
            year: r.year,
            tmdbRating: r.voteAverage,
            inUserLibrary: r.inLibrary,
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
        const rating = clampRating(args.rating);
        const entry = await addToLibrary(db, {
          tmdbId,
          mediaType,
          status,
          rating,
          notes: str(args.note) || undefined,
          tags: strArray(args.tags),
        });
        return JSON.stringify({
          saved: true,
          title: entry.title,
          year: entry.year,
          status: entry.status,
          rating: entry.rating,
          tags: entry.tags,
        });
      }

      case "update_library_entry": {
        const entry = resolveEntry(db, args);
        if (!entry) {
          return JSON.stringify({
            error:
              "No matching library entry — check the title with search_library, or add it first with add_to_library",
          });
        }
        const patch: Parameters<typeof updateEntry>[2] = {};
        const rating = clampRating(args.rating);
        if (rating !== undefined) patch.rating = rating;
        if (args.status) patch.status = str(args.status) as LibraryStatus;
        if (typeof args.favorite === "boolean") patch.favorite = args.favorite;

        const noteAppend = str(args.note_append).trim();
        if (noteAppend) {
          patch.notes = entry.notes
            ? `${entry.notes}\n${noteAppend}`
            : noteAppend;
        }

        const add = strArray(args.tags_add) ?? [];
        const remove = new Set(
          (strArray(args.tags_remove) ?? []).map((t) => t.toLowerCase()),
        );
        if (add.length || remove.size) {
          patch.tags = [...entry.tags, ...add].filter(
            (t) => !remove.has(t.toLowerCase()),
          );
        }

        const updated = updateEntry(db, entry.id, patch)!;
        return JSON.stringify({
          updated: true,
          title: updated.title,
          status: updated.status,
          rating: updated.rating,
          tags: updated.tags,
          notes: updated.notes.slice(0, 300),
          favorite: updated.favorite,
        });
      }

      case "set_episode_progress": {
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
        const season = args.season != null ? Number(args.season) : undefined;
        const episode = args.episode != null ? Number(args.episode) : undefined;
        const changed = setWatchedUpTo(db, h.titleId, season, episode);
        const after = listEpisodes(db, h.titleId);
        const watched = after.filter((e) => e.watched).length;
        return JSON.stringify({
          title: h.title,
          markedWatched: changed,
          progress: `${watched}/${after.length}`,
          scope:
            season != null && episode != null
              ? `through S${season}E${episode}`
              : season != null
                ? `through season ${season}`
                : "entire show",
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

      case "compare_titles": {
        const { computeTasteProfile } = await import("../rag/tasteProfile.js");
        const profile = computeTasteProfile(db);
        const topGenres = new Set(profile.topGenres.map((g) => g.name));
        const lovedDirs = new Set(profile.favoriteDirectors.map((d) => d.name));
        const cands = (Array.isArray(args.candidates) ? args.candidates : [])
          .slice(0, 4) as Args[];
        if (cands.length < 2) {
          return JSON.stringify({ error: "Need 2-4 candidates to compare" });
        }
        const fatigue = fatigueScores(db);
        const out = await Promise.all(
          cands.map(async (c) => {
            const id = Number(c.tmdb_id);
            const mt = str(c.media_type) as MediaType;
            const d = await fetchDetailsFromTmdb(id, mt);
            const owned = getEntryByTmdb(db, id, mt);
            // Anti-fatigue: reinforce only fresh anchors, so retired or
            // overused titles stop accruing usage signal.
            if (!isRetired(db, id, mt) && (fatigue.get(`${mt}:${id}`) ?? 0) < 0.6) {
              logAnchor(db, id, mt, "compare_titles");
            }
            // Verdict computation (brand-faithful: only "The one" earns gold)
            const genreOverlap = d.genres.filter((g) => topGenres.has(g));
            const directorIsFav = !!d.director && lovedDirs.has(d.director);
            const inLib = owned ? { status: owned.status, rating: owned.rating, tags: owned.tags } : false;
            const isRewatch = inLib && inLib.rating != null && inLib.rating >= 8;
            const isTheOne = (genreOverlap.length >= 1 && directorIsFav) ||
                             (genreOverlap.length >= 2 && (d.voteAverage ?? 0) >= 7);
            const verdict: "The one" | "Safe pick" | "Stretch" | "Rewatch" | null =
              isRewatch ? "Rewatch" :
              isTheOne ? "The one" :
              genreOverlap.length >= 1 ? "Safe pick" :
              (d.voteAverage ?? 0) >= 7.5 ? "Stretch" : null;

            return {
              tmdbId: id,
              mediaType: mt,
              title: d.title,
              year: d.year,
              commitment:
                mt === "tv"
                  ? `${d.seasonsCount ?? "?"} seasons / ${d.episodesCount ?? "?"} eps`
                  : `${d.runtime ?? "?"} min`,
              genreOverlapWithTheirStrengths: genreOverlap,
              directorIsAFavorite: directorIsFav,
              director: d.director,
              tmdbRating: d.voteAverage,
              inLibrary: inLib,
              verdict,
            };
          }),
        );
        return JSON.stringify({ mood: str(args.mood) || null, candidates: out });
      }

      case "check_continuing_series": {
        const { upNext } = await import("../services/discoverService.js");
        const items = upNext(db);
        if (!items.length) {
          return JSON.stringify({ watching: [], note: "Nothing in progress." });
        }
        return JSON.stringify({
          watching: items.map((i) => ({
            title: i.entry.title,
            mediaType: i.entry.mediaType,
            tmdbId: i.entry.tmdbId,
            progress: i.total ? `${i.watched}/${i.total}` : null,
            nextEpisode: i.next
              ? { season: i.next.season, episode: i.next.episode }
              : null,
            newEpisodesSinceLastWatch: i.hasNewEpisode,
          })),
        });
      }

      case "get_episode_recap": {
        const hits = retrieveLibrary(db, str(args.title_query), 3).filter(
          (h) => h.mediaType === "tv",
        );
        if (!hits.length)
          return JSON.stringify({ error: "No matching series in the library" });
        const { episodeRecap } = await import("./recapService.js");
        const recap = await episodeRecap(db, hits[0].titleId);
        return JSON.stringify({
          title: hits[0].title,
          recap: recap.text || "No watched episodes yet to recap.",
          resumeAt: recap.resumeAt,
          progress: `${recap.watched}/${recap.total}`,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message });
  }
}
