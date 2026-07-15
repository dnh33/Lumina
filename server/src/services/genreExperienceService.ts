import type { DB } from "../db/connection.js";
import { genreMap, tmdbGet } from "../tmdb/client.js";
import { normalizeList, normalizeDetails } from "../tmdb/normalize.js";
import type { MediaType, RawTmdbItem, TitleDetails, WatchProviders } from "../tmdb/types.js";
import { flag, type CatalogItemWithFlags } from "./discoverService.js";
import { fatigueScores, isRetired } from "./anchorService.js";
import { retrieveLibrary } from "../rag/retrieval.js";
import { computeTasteProfile } from "../rag/tasteProfile.js";
import { profileStateOf, type ProfileState } from "../llm/insightService.js";
import { currentModel, getLlm, getSetting, setSetting } from "../llm/openrouter.js";
import { genreCuratorPrompt } from "../llm/prompts.js";
import { ensureRatings } from "./ratingsService.js";
import { fetchDetailsFromTmdb } from "./libraryService.js";

interface Paged {
  results?: RawTmdbItem[];
}

export type GenreItem = CatalogItemWithFlags;

export interface GenreItemEnrichment {
  director: string | null;
  directorId: number | null;
  /** tv only */
  seasons?: { seasonNumber: number; name: string; episodeCount: number }[];
  watchProviders: WatchProviders | null;
  originCountry: string[];
  imdbRating?: number | null;
  rtRating?: number | null;
  /** F3 "The Argument": thesis + pointer to a divergent neighbor */
  argument?: {
    thesis: string;
    counterpoint?: { title: string; relation: string; tmdbId?: number; mediaType?: MediaType } | null;
  } | null;
}

// extend GenreItem with optional enrichment so existing consumers are unaffected
declare module "./discoverService.js" {
  interface CatalogItemWithFlags {
    enrichment?: GenreItemEnrichment;
  }
}

export type ExperienceMode = "self" | "guided";

export interface GenreExperienceIntro {
  hook: string;
  tone: string;
  basedOn: string[];
}

export interface GenreAnchor {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  rating: number | null;
}

export interface GenreExperience {
  key: string;
  genres: string[];
  mode: ExperienceMode;
  /** Optional: the curator intro has been split into buildGenreIntro
   *  (GET /discover/genre-intro) so the rails don't wait on the LLM. */
  intro?: GenreExperienceIntro | null;
  items: GenreItem[];
  anchorsUsed: GenreAnchor[];
  profileState: ProfileState;
}

export interface GenreExperienceOpts {
  genres: string[];
  mediaType: MediaType;
  mode?: ExperienceMode;
  /** enabled module keys (from genreWorld) — drives which enrichment to compute */
  modules?: string[];
}

// TMDB genre names the slugs don't map onto verbatim.
const SLUG_ALIASES: Record<string, string> = {
  "sci-fi": "science fiction",
  "scifi": "science fiction",
  "science-fiction": "science fiction",
  "film-noir": "film noir",
  "war-politics": "war & politics",
  "anime": "animation",
  "animation": "animation",
};

/** Resolve genre slugs to TMDB genre ids; unknown slugs are dropped. */
export async function genreSlugsToIds(
  genres: string[],
  mediaType: MediaType,
): Promise<number[]> {
  const map = await genreMap(mediaType);
  return genres
    .map((slug) => {
      const s = slug.toLowerCase();
      const name = SLUG_ALIASES[s] ?? s;
      return map.get(name) ?? map.get(name.replace(/-/g, " "));
    })
    .filter((x): x is number => !!x);
}

/**
 * Per-item enrichment so the client modules render real data (not props the
 * server never produced). Bounded by which modules are enabled for the world:
 * only the fetches those modules need run. Detail fetches + insight are cached
 * (tmdbGet TTL / insight: cache), so a warm build is cheap; the whole experience
 * is also cached 12h in buildGenreExperience.
 */
async function enrichGenreItems(
  db: DB,
  items: GenreItem[],
  modules: Set<string>,
  mediaType: MediaType,
): Promise<GenreItem[]> {
  const needDetails = modules.has("maker") || modules.has("watchorder") || modules.has("critic") || modules.has("geo");
  const needRatings = modules.has("critic");
  // NOTE (P2.2): the "argument" module is intentionally NOT enriched here.
  // It runs an LLM call (titleInsight) per title, which blocked the rails from
  // painting. The client fetches `argument` per-title AFTER paint via
  // GET /insight/:type/:tmdbId, so buildGenreExperience stays LLM-free for the
  // items payload. Keep the guard free of needArgument.
  if (!needDetails && !needRatings) return items;

  return Promise.all(
    items.map(async (it) => {
      const enrichment: GenreItemEnrichment = {
        director: null,
        directorId: null,
        watchProviders: null,
        originCountry: [],
      };

      if (needDetails) {
        const details: TitleDetails = await fetchDetailsFromTmdb(it.tmdbId, it.mediaType);
        enrichment.director = details.director;
        enrichment.directorId = details.directorId;
        enrichment.watchProviders = details.watchProviders;
        enrichment.originCountry = details.originCountry ?? [];
        if (mediaType === "tv" && details.seasons?.length) {
          enrichment.seasons = details.seasons.map((s) => ({
            seasonNumber: s.seasonNumber,
            name: s.name,
            episodeCount: s.episodeCount,
          }));
        }
      }

      if (needRatings) {
        const scores = await ensureRatings(db, it.tmdbId, it.mediaType);
        enrichment.imdbRating = scores.imdb;
        enrichment.rtRating = scores.rt;
      }

      return { ...it, enrichment };
    }),
  );
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Anchor selection mirrors insightService neighbor logic: retired titles
 * are dropped and the least-fatigued anchors surface first. Selection ONLY,
 * never logged here (G3): a logAnchor happens later on a real title-open.
 */
function selectAnchors(db: DB, query: string): GenreAnchor[] {
  const neighbors = retrieveLibrary(db, query, 8);
  const fatigue = fatigueScores(db);
  const usable = neighbors.filter((n) => !isRetired(db, n.tmdbId, n.mediaType));
  const ordered = [...usable].sort(
    (a, b) =>
      (fatigue.get(`${a.mediaType}:${a.tmdbId}`) ?? 0) -
      (fatigue.get(`${b.mediaType}:${b.tmdbId}`) ?? 0),
  );
  return ordered.slice(0, 3).map((n) => ({
    tmdbId: n.tmdbId,
    mediaType: n.mediaType as MediaType,
    title: n.title,
    rating: n.rating ?? null,
  }));
}

/** One batched curator call. Degrades to null when the LLM is unavailable. */
async function curatorIntro(
  db: DB,
  genres: string[],
  anchors: GenreAnchor[],
  profileState: ProfileState,
): Promise<GenreExperienceIntro | null> {
  try {
    const llm = getLlm();
    const anchorBlock = anchors.length
      ? anchors
          .map((a) => `- ${a.title} (rated ${a.rating ?? "unrated"}/10)`)
          .join("\n")
      : "None yet.";
    const completion = await llm.chat.completions.create({
      model: currentModel(db),
      messages: [
        { role: "system", content: genreCuratorPrompt(profileState) },
        {
          role: "user",
          content: `Genres: ${genres.join(" + ")}\n\nTheir library titles closest to this world:\n${anchorBlock}`,
        },
      ],
      temperature: 0.8,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    if (typeof parsed?.hook !== "string") return null;
    return {
      hook: parsed.hook,
      tone: typeof parsed.tone === "string" ? parsed.tone : "",
      basedOn: Array.isArray(parsed.basedOn)
        ? parsed.basedOn.filter((x: unknown) => typeof x === "string")
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Genre-seeded discovery engine. Unlike forYou (which derives its genres
 * from the taste profile and takes no seed), this is seeded by explicit
 * genre slugs; multiple slugs are OR-combined via TMDB's pipe syntax.
 */
export async function buildGenreExperience(
  db: DB,
  opts: GenreExperienceOpts,
): Promise<GenreExperience> {
  const mode: ExperienceMode = opts.mode ?? "self";
  const key = `${opts.mediaType}:${mode}:${opts.genres.join("+")}:${(opts.modules ?? []).sort().join(",")}`;

  const cachedRaw = getSetting(db, `genre-exp:${key}`);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as {
        fetchedAt: number;
        exp: GenreExperience;
      };
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        // Re-flag on read (G2): exclusions may have changed since caching.
        return { ...cached.exp, items: flag(db, cached.exp.items) };
      }
    } catch {
      // Corrupt cache entry: fall through and rebuild.
    }
  }

  const ids = await genreSlugsToIds(opts.genres, opts.mediaType);

  let items: GenreItem[] = [];
  if (ids.length) {
    const data = await tmdbGet<Paged>(`/discover/${opts.mediaType}`, {
      with_genres: ids.join("|"),
      sort_by: "vote_average.desc",
      "vote_count.gte": opts.mediaType === "movie" ? 500 : 200,
      include_adult: "false",
    });
    // GATE G2: flag() is the single chokepoint that drops ignored titles
    // and excluded genres. Never bare filterCatalog here.
    items = flag(db, normalizeList(data.results, opts.mediaType));
  }

  // Enrich per enabled modules (drives real module data). No-op when no
  // enrichment-driving modules are enabled.
  const moduleSet = new Set(opts.modules ?? []);
  if (items.length && moduleSet.size) {
    items = await enrichGenreItems(db, items, moduleSet, opts.mediaType);
  }

  const profile = computeTasteProfile(db);
  const profileState = profileStateOf(profile);
  const anchorsUsed = selectAnchors(db, opts.genres.join(" "));

  // NOTE (P1.1/2.3): the curator intro is split into its own call
  // (buildGenreIntro + GET /discover/genre-intro) so the rails can paint
  // without waiting on the LLM. Enrichment stays here for now (Task 2.2
  // will make it lazy).
  const res: GenreExperience = {
    key,
    genres: opts.genres,
    mode,
    items,
    anchorsUsed,
    profileState,
  };

  setSetting(
    db,
    `genre-exp:${key}`,
    JSON.stringify({ fetchedAt: Date.now(), exp: res }),
  );
  return res;
}

/**
 * Standalone curator intro. Computes the taste profile / anchors it needs
 * internally so callers don't have to thread them through. Cached separately
 * (12h) under `genre-exp-intro:${key}` so the rails can render from
 * buildGenreExperience while this warms independently.
 */
export async function buildGenreIntro(
  db: DB,
  opts: GenreExperienceOpts,
): Promise<GenreExperienceIntro | null> {
  const mode: ExperienceMode = opts.mode ?? "self";
  const key = `${opts.mediaType}:${mode}:${opts.genres.join("+")}:${(opts.modules ?? []).sort().join(",")}`;

  const cachedRaw = getSetting(db, `genre-exp-intro:${key}`);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as {
        fetchedAt: number;
        intro: GenreExperienceIntro | null;
      };
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.intro;
      }
    } catch {
      // Corrupt cache entry: fall through and rebuild.
    }
  }

  try {
    const profile = computeTasteProfile(db);
    const profileState = profileStateOf(profile);
    const anchorsUsed = selectAnchors(db, opts.genres.join(" "));
    const intro = await curatorIntro(db, opts.genres, anchorsUsed, profileState);
    setSetting(
      db,
      `genre-exp-intro:${key}`,
      JSON.stringify({ fetchedAt: Date.now(), intro }),
    );
    return intro;
  } catch {
    return null;
  }
}
