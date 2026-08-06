/**
 * Era-rail quality: turn a larger discover pool into valuable suggestions.
 * Pure functions — no I/O. Wired from genreExperienceService after discover,
 * before enrichment / guided re-rank.
 */

export interface EraRankable {
  tmdbId: number;
  mediaType: string;
  title: string;
  year: number | null;
  overview?: string | null;
  posterPath?: string | null;
  voteAverage: number | null;
  genreIds?: number[] | null;
  popularity?: number | null;
}

export interface EraRailOpts {
  /** World slug (first genre slug) — drives affinity / metaphor integrity. */
  slug: string;
  /** Cap on titles returned to the rail (default 84). */
  limit?: number;
  /** Hard cap per decade so mega-decades cannot eat the spine (default 14). */
  maxPerDecade?: number;
  /**
   * Soft floor: try to give every decade this many before filling decades
   * that already hit the soft soft-max (default 3).
   */
  softMinPerDecade?: number;
}

/** Target rail size after quality trim — enough for era zoom without junk. */
export const ERA_RAIL_LIMIT = 84;
/** One mega-decade must not monopolize All-eras density. */
export const ERA_MAX_PER_DECADE = 14;
export const ERA_SOFT_MIN_PER_DECADE = 3;

const DOC_GENRE_ID = 99;
const AFFINITY_SLUGS = new Set(["film-noir"]);

const NOIR_KEYWORD_RE =
  /\b(noir|neo-?noir|detective|private\s*eye|gumshoe|femme\s*fatale|hard-?boiled|maltese|chinatown|double\s+indemnity)\b/i;

/** Floor a year to its decade (0 = unknown). Matches TimelineScrubber.decadeOf. */
export function decadeOfYear(year: number | null): number {
  if (year == null || !Number.isFinite(year) || year < 1800) return 0;
  return Math.floor(year / 10) * 10;
}

function haystack(item: EraRankable): string {
  return `${item.title} ${item.overview ?? ""}`;
}

function hasNoirKeyword(item: EraRankable): boolean {
  return NOIR_KEYWORD_RE.test(haystack(item));
}

/**
 * Film-noir affinity — mirrors GenreEmptyState.affinityScore so the experience
 * rail refuses the same prestige pollution the empty-state strip already blocks.
 */
export function affinityScore(slug: string, item: EraRankable): number {
  if (!AFFINITY_SLUGS.has(slug.toLowerCase())) return item.voteAverage ?? 0;

  let score = 0;
  if (hasNoirKeyword(item)) score += 100;
  const gids = item.genreIds ?? [];
  if (gids.includes(53) || gids.includes(9648)) score += 40; // thriller / mystery
  if (gids.includes(80)) score += 20; // crime
  if ((item.voteAverage ?? 0) >= 8 && !hasNoirKeyword(item)) score -= 80;
  score += Math.min(item.voteAverage ?? 0, 7.5);
  return score;
}

const NOIR_AFFINITY_FLOOR = 40;

/**
 * Metaphor / genre integrity over raw vote spam.
 * Soft-caps voteAverage so a 9.0 Top-250 hit cannot drown every decade.
 */
export function worldIntegrityScore(slug: string, item: EraRankable): number {
  const s = slug.toLowerCase();
  if (AFFINITY_SLUGS.has(s)) return affinityScore(s, item);

  // Soft-cap: vote is a signal, not a monopoly.
  let score = Math.min(item.voteAverage ?? 0, 8.2) * 10;

  if (s === "documentary") {
    const gids = item.genreIds ?? [];
    if (gids.includes(DOC_GENRE_ID)) score += 25;
    else score -= 50; // fiction prestige leaking into docs world
    const overview = (item.overview ?? "").trim();
    if (overview.length >= 40) score += 5;
    // Reality-adjacent junk often rides high popularity with thin craft signal.
    const pop = item.popularity ?? 0;
    const vote = item.voteAverage ?? 0;
    if (pop > 40 && vote < 7) score -= 15;
  }

  if (item.year == null) score -= 12;
  if (!item.posterPath) score -= 30;

  return score;
}

function itemKey(it: EraRankable): string {
  return `${it.mediaType}:${it.tmdbId}`;
}

/**
 * Select an era-balanced rail from a (possibly multi-page) discover pool.
 *
 * Rules:
 * 1. Niche affinity floors drop prestige pollution before diversification.
 * 2. Within each decade, prefer integrity over pure vote rank.
 * 3. Round-robin across decades so 2010s cannot eat the spine.
 * 4. Soft-min pass stocks sparse eras before maxing a mega-decade.
 */
export function selectEraBalancedRail<T extends EraRankable>(
  items: T[],
  opts: EraRailOpts,
): T[] {
  const slug = (opts.slug || "").toLowerCase();
  const limit = opts.limit ?? ERA_RAIL_LIMIT;
  const maxPerDecade = opts.maxPerDecade ?? ERA_MAX_PER_DECADE;
  const softMin = opts.softMinPerDecade ?? ERA_SOFT_MIN_PER_DECADE;

  if (!items.length || limit <= 0) return [];

  const requireAffinity = AFFINITY_SLUGS.has(slug);
  const filtered = items.filter((it) => {
    if (!it.posterPath) return false;
    if (requireAffinity && affinityScore(slug, it) < NOIR_AFFINITY_FLOOR) return false;
    // Documentary: refuse non-doc genre pollution when genre ids are present.
    if (slug === "documentary") {
      const gids = it.genreIds ?? [];
      if (gids.length > 0 && !gids.includes(DOC_GENRE_ID)) return false;
      // Soft craft floor — popularity backfill often includes Jackass-tier noise.
      if ((it.voteAverage ?? 0) < 6.8) return false;
    }
    return true;
  });

  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const it of filtered) {
    const k = itemKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(it);
  }

  const buckets = new Map<number, T[]>();
  for (const it of deduped) {
    const d = decadeOfYear(it.year);
    const list = buckets.get(d) ?? [];
    list.push(it);
    buckets.set(d, list);
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => {
      const ds = worldIntegrityScore(slug, b) - worldIntegrityScore(slug, a);
      if (ds !== 0) return ds;
      return a.title.localeCompare(b.title);
    });
  }

  const decades = [...buckets.keys()].sort((a, b) => {
    if (a === 0) return 1;
    if (b === 0) return -1;
    return a - b;
  });

  const taken = new Set<string>();
  const counts = new Map<number, number>();
  const out: T[] = [];

  const tryTake = (decade: number): boolean => {
    if (out.length >= limit) return false;
    const list = buckets.get(decade);
    if (!list?.length) return false;
    const used = counts.get(decade) ?? 0;
    if (used >= maxPerDecade) return false;
    const next = list.find((it) => !taken.has(itemKey(it)));
    if (!next) return false;
    taken.add(itemKey(next));
    counts.set(decade, used + 1);
    out.push(next);
    return true;
  };

  // Pass 1 — soft-min: stock every era a little before mega-decades grow.
  let progressed = true;
  while (progressed && out.length < limit) {
    progressed = false;
    for (const d of decades) {
      const used = counts.get(d) ?? 0;
      if (used >= softMin) continue;
      if (tryTake(d)) progressed = true;
    }
  }

  // Pass 2 — round-robin fill until limit / caps.
  progressed = true;
  while (progressed && out.length < limit) {
    progressed = false;
    for (const d of decades) {
      if (tryTake(d)) progressed = true;
    }
  }

  // Chronological spine for All-eras; within-decade order already integrity-desc.
  return [...out].sort((a, b) => {
    const da = decadeOfYear(a.year);
    const db = decadeOfYear(b.year);
    const aKey = da === 0 ? 9999 : da;
    const bKey = db === 0 ? 9999 : db;
    if (aKey !== bKey) return aKey - bKey;
    return worldIntegrityScore(slug, b) - worldIntegrityScore(slug, a);
  });
}
