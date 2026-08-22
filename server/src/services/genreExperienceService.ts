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
import { genreCuratorPrompt, genreGuidedCuratorPrompt } from "../llm/prompts.js";
import { ensureRatings } from "./ratingsService.js";
import { fetchDetailsFromTmdb } from "./libraryService.js";
import {
  getOrCreateGuidedSession,
  rankForGuided,
  refreshGuidedPicks,
} from "./guidedSessionService.js";
import {
  ERA_MAX_PER_DECADE,
  ERA_RAIL_LIMIT,
  decadeOfYear,
  selectEraBalancedRail,
} from "./eraRailQuality.js";

interface Paged {
  results?: RawTmdbItem[];
  page?: number;
  total_pages?: number;
}

/**
 * Pages of TMDB discover to merge per genre world (~20/page → ~100).
 * Quality selection below always trims the union to ERA_RAIL_LIMIT.
 */
const DISCOVER_PAGES = 5;

/** Decades we try to keep stocked when popularity discover starves them. */
const BACKFILL_DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020];

/**
 * Backfill trigger — MUST be higher than rail soft-min.
 * Soft-min alone left decades with exactly 2 popularity hits un-backfilled
 * forever (Horror 1970s/1980s stuck at 2). Aim for a dense decade zoom.
 */
const BACKFILL_TARGET_PER_DECADE = Math.max(8, Math.floor(ERA_MAX_PER_DECADE / 2));

/** Vote-sorted pages per starved decade (~20/page). */
const BACKFILL_PAGES = 2;

/**
 * Discover ranking choice (era density):
 * - sort: popularity.desc — spreads across decades better than vote_average.desc
 *   (prestige classics otherwise monopolize page 1).
 * - vote_count floor: movie 250 / tv 100 (was 500 / 200) — still filters junk,
 *   less starvation of thinner eras.
 * Keyword path keeps a softer floor (80 / 40) because keyword worlds are sparse.
 */
function discoverVoteFloor(mediaType: MediaType, keywordPath: boolean): number {
  if (keywordPath) return mediaType === "movie" ? 80 : 40;
  return mediaType === "movie" ? 250 : 100;
}

/**
 * Fetch discover pages 1..n, concatenate, dedupe by TMDB id (first page wins).
 * Exported for unit tests.
 */
export async function fetchDiscoverPages(
  path: string,
  baseParams: Record<string, string | number>,
  pages = DISCOVER_PAGES,
): Promise<RawTmdbItem[]> {
  const seen = new Set<number>();
  const out: RawTmdbItem[] = [];
  for (let page = 1; page <= pages; page++) {
    const data = await tmdbGet<Paged>(path, { ...baseParams, page });
    for (const item of data.results ?? []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    // Stop early if TMDB has fewer pages than requested.
    if (data.total_pages != null && page >= data.total_pages) break;
  }
  return out;
}

function decadeDateParams(
  mediaType: MediaType,
  decade: number,
): Record<string, string> {
  const gte = `${decade}-01-01`;
  const lte = `${decade + 9}-12-31`;
  if (mediaType === "tv") {
    return { "first_air_date.gte": gte, "first_air_date.lte": lte };
  }
  return { "primary_release_date.gte": gte, "primary_release_date.lte": lte };
}

/**
 * Popularity multi-page often starves older decades. For each backfill decade
 * under BACKFILL_TARGET, fetch vote-sorted pages bounded to that decade, then
 * merge. Quality trim still decides what survives.
 */
export async function backfillSparseDecades(
  mediaType: MediaType,
  baseParams: Record<string, string | number>,
  existing: { year: number | null }[],
  target = BACKFILL_TARGET_PER_DECADE,
): Promise<RawTmdbItem[]> {
  const counts = new Map<number, number>();
  for (const it of existing) {
    const d = decadeOfYear(it.year);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const needy = BACKFILL_DECADES.filter((d) => (counts.get(d) ?? 0) < target);
  if (!needy.length) return [];

  const batches = await Promise.all(
    needy.flatMap((decade) =>
      Array.from({ length: BACKFILL_PAGES }, (_, i) =>
        tmdbGet<Paged>(`/discover/${mediaType}`, {
          ...baseParams,
          ...decadeDateParams(mediaType, decade),
          sort_by: "vote_average.desc",
          page: i + 1,
        }).catch(() => ({ results: [] as RawTmdbItem[] })),
      ),
    ),
  );

  const seen = new Set<number>();
  const out: RawTmdbItem[] = [];
  for (const batch of batches) {
    for (const item of batch.results ?? []) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function mergeRawById(primary: RawTmdbItem[], extra: RawTmdbItem[]): RawTmdbItem[] {
  const seen = new Set(primary.map((r) => r.id));
  const out = [...primary];
  for (const item of extra) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
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

/** Slugs that are moods / eras / styles, not TMDB genre list entries.
 *  Resolved via /search/keyword → discover `with_keywords` when genre ids miss. */
const KEYWORD_FIRST_SLUGS = new Set(["film-noir"]);

function slugQueryName(slug: string): string {
  const s = slug.toLowerCase();
  return SLUG_ALIASES[s] ?? s.replace(/-/g, " ");
}

/** Resolve genre slugs to TMDB genre ids; unknown slugs are dropped. */
export async function genreSlugsToIds(
  genres: string[],
  mediaType: MediaType,
): Promise<number[]> {
  const map = await genreMap(mediaType);
  return genres
    .map((slug) => {
      const name = slugQueryName(slug);
      return map.get(name) ?? map.get(name.replace(/-/g, " "));
    })
    .filter((x): x is number => !!x);
}

/**
 * Resolve world slugs to TMDB keyword ids (e.g. film-noir → "film noir").
 * Used when the slug is not a TMDB genre — without this, discover returns []
 * and Threshold worlds stay permanently empty.
 */
export async function genreSlugsToKeywordIds(genres: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const slug of genres) {
    const query = slugQueryName(slug);
    try {
      const data = await tmdbGet<{ results?: { id: number; name: string }[] }>(
        "/search/keyword",
        { query },
      );
      const needle = query.toLowerCase();
      const exact = (data.results ?? []).find(
        (k) => k.name.toLowerCase() === needle,
      );
      const pick = exact ?? data.results?.[0];
      if (pick?.id) ids.push(pick.id);
    } catch {
      // Keyword search failed — caller falls through to empty rail.
    }
  }
  return [...new Set(ids)];
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
  mode: ExperienceMode = "self",
): Promise<GenreExperienceIntro | null> {
  try {
    const llm = getLlm();
    const anchorBlock = anchors.length
      ? anchors
          .map((a) => `- ${a.title} (rated ${a.rating ?? "unrated"}/10)`)
          .join("\n")
      : "None yet.";
    const system =
      mode === "guided"
        ? genreGuidedCuratorPrompt(profileState)
        : genreCuratorPrompt(profileState);
    const completion = await llm.chat.completions.create({
      model: currentModel(db),
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Genres: ${genres.join(" + ")}\n\nTheir library titles closest to this world:\n${anchorBlock}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
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
  // v7: denser rails (5 discover pages, backfill target 8/2pp, max 14/decade, limit 84).
  const key = `v7:${opts.mediaType}:${mode}:${opts.genres.join("+")}:${(opts.modules ?? []).sort().join(",")}`;

  const cachedRaw = getSetting(db, `genre-exp:${key}`);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as {
        fetchedAt: number;
        exp: GenreExperience;
      };
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        // Re-flag on read (G2): exclusions may have changed since caching.
        let items = flag(db, cached.exp.items);
        // Guided: re-rank against the live session so beat answers are not
        // stuck behind a mode-only cache key.
        if (mode === "guided") {
          const slug = opts.genres[0] ?? "documentary";
          const session = getOrCreateGuidedSession(db, slug, opts.mediaType);
          const anchorSeeds = (cached.exp.anchorsUsed ?? []).map((a) => ({
            tmdbId: a.tmdbId,
            mediaType: a.mediaType,
          }));
          items = rankForGuided(items, session, { slug, seeds: anchorSeeds });
          refreshGuidedPicks(db, slug, opts.mediaType, items);
        }
        return { ...cached.exp, mode, items };
      }
    } catch {
      // Corrupt cache entry: fall through and rebuild.
    }
  }

  const keywordFirst = opts.genres.some((g) => KEYWORD_FIRST_SLUGS.has(g.toLowerCase()));
  const ids = keywordFirst ? [] : await genreSlugsToIds(opts.genres, opts.mediaType);
  const worldSlug = (opts.genres[0] ?? "documentary").toLowerCase();

  let items: GenreItem[] = [];
  if (ids.length) {
    const baseParams: Record<string, string | number> = {
      with_genres: ids.join("|"),
      sort_by: "popularity.desc",
      "vote_count.gte": discoverVoteFloor(opts.mediaType, false),
      include_adult: "false",
    };
    let raw = await fetchDiscoverPages(`/discover/${opts.mediaType}`, baseParams);
    // Quality: seed starved decades (e.g. Documentary 1970s) before trim.
    const backfill = await backfillSparseDecades(
      opts.mediaType,
      {
        with_genres: ids.join("|"),
        "vote_count.gte": discoverVoteFloor(opts.mediaType, false),
        include_adult: "false",
      },
      normalizeList(raw, opts.mediaType),
    );
    raw = mergeRawById(raw, backfill);
    // GATE G2: flag() is the single chokepoint that drops ignored titles
    // and excluded genres. Never bare filterCatalog here.
    items = flag(db, normalizeList(raw, opts.mediaType));
  }
  // Keyword path: non-genre worlds (film-noir) OR genre discover returned nothing
  // for an unknown slug. Prefer existing TMDB search/discover stack — no second catalog.
  if (!items.length) {
    const keywordIds = await genreSlugsToKeywordIds(opts.genres);
    if (keywordIds.length) {
      const baseParams: Record<string, string | number> = {
        with_keywords: keywordIds.join("|"),
        sort_by: "popularity.desc",
        "vote_count.gte": discoverVoteFloor(opts.mediaType, true),
        include_adult: "false",
      };
      let raw = await fetchDiscoverPages(`/discover/${opts.mediaType}`, baseParams);
      const backfill = await backfillSparseDecades(
        opts.mediaType,
        {
          with_keywords: keywordIds.join("|"),
          "vote_count.gte": discoverVoteFloor(opts.mediaType, true),
          include_adult: "false",
        },
        normalizeList(raw, opts.mediaType),
      );
      raw = mergeRawById(raw, backfill);
      items = flag(db, normalizeList(raw, opts.mediaType));
    }
  }

  // ---------------------------------------------------------------------------
  // QUALITY / ERA BALANCE (complement to DISCOVER_PAGES above)
  // Larger popularity pool → integrity score + per-decade caps. Featured (client
  // vote pick among steered) and Guided (rankForGuided) re-order this curated
  // set — they stay sharp because junk never enters the rail.
  // ---------------------------------------------------------------------------
  if (items.length) {
    items = selectEraBalancedRail(items, {
      slug: worldSlug,
      limit: ERA_RAIL_LIMIT,
    });
  }

  // Enrich AFTER quality trim so we do not detail-fetch titles the rail drops.
  const moduleSet = new Set(opts.modules ?? []);
  if (items.length && moduleSet.size) {
    items = await enrichGenreItems(db, items, moduleSet, opts.mediaType);
  }

  const profile = computeTasteProfile(db);
  const profileState = profileStateOf(profile);
  // Anchors before Guided rank so "Seeded by…" titles can inject onto Tonight shelf.
  const anchorsUsed = selectAnchors(db, opts.genres.join(" "));

  // Guided: session answers re-rank the quality-trimmed rail + Tonight shelf.
  // Self keeps era-balanced integrity order (client Featured still vote-picks).
  if (mode === "guided") {
    const slug = opts.genres[0] ?? "documentary";
    const session = getOrCreateGuidedSession(db, slug, opts.mediaType);
    items = rankForGuided(items, session, {
      slug,
      seeds: anchorsUsed.map((a) => ({ tmdbId: a.tmdbId, mediaType: a.mediaType })),
    });
    refreshGuidedPicks(db, slug, opts.mediaType, items);
  }

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
    const intro = await curatorIntro(db, opts.genres, anchorsUsed, profileState, mode);
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
