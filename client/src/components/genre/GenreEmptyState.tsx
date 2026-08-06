import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Loader2 } from "lucide-react";
import { api } from "../../lib/api.js";
import { invalidateLibraryData } from "../../lib/invalidate.js";
import { poster } from "../../lib/img.js";
import { playCue } from "../../lib/sound.js";
import type { GenreWorld } from "../../lib/genreWorld.js";
import type { CatalogItem } from "../../lib/types.js";
import { SectionHead } from "./SectionHead.js";

interface Props {
  world: GenreWorld;
  count: number;
  threshold: number;
  /** C10: when provided, renders a CTA that nudges the user to seed an
   *  anchor from their library, closing the cold-start loop. */
  onBootstrap?: () => void;
  /** Titles already on this world's thin rail — don't re-suggest them. */
  excludeKeys?: string[];
  /** Steer media — neighbor rails + search must not leak movies onto TV. */
  mediaType?: "movie" | "tv";
}

type Metaphor = GenreWorld["metaphor"];

/**
 * Per-metaphor niche copy (Task 7.2 / C6 + S1 honesty).
 * Speaks shelf heat / vault cold — never "this world is empty."
 * Catalog still curates; suggestions below prove the room is live.
 */
const METAPHOR_COPY: Record<
  Metaphor,
  { title: string; body: string; strip: string; invite: string }
> = {
  Constellation: {
    title: "A constellation waiting to be charted",
    body: "Vault shelf is thin — add a title to light the first star. Catalog still curates below.",
    strip: "Stars at the edge",
    invite: "Add one to light this sky",
  },
  Frontier: {
    title: "A frontier barely marked",
    body: "Vault shelf is thin — drop a title to mark the first trail. Catalog still curates below.",
    strip: "Trails worth taking",
    invite: "Mark the first trail",
  },
  "Reading Room": {
    title: "A quiet reading room",
    body: "Vault shelf is thin — shelve a title to begin. Catalog still curates below.",
    strip: "Volumes to shelve",
    invite: "Shelve one to begin",
  },
  "Warm Interior": {
    title: "A quiet room",
    body: "Vault shelf is thin — add a title to warm it. Catalog still curates below.",
    strip: "Warmth waiting",
    invite: "Bring one inside",
  },
  Threshold: {
    title: "A threshold not yet crossed",
    body: "Vault shelf is thin — add a title to step through. Catalog still curates below.",
    strip: "Cross the threshold",
    invite: "Step through with one title",
  },
  Panel: {
    title: "A blank panel",
    body: "Vault shelf is thin — add a title to start the show. Catalog still curates below.",
    strip: "Panels to fill",
    invite: "Ink the first panel",
  },
  Generic: {
    title: "A thin shelf",
    body: "Vault shelf is thin — anchor with something you love. Catalog still curates below.",
    strip: "Titles to seed",
    invite: "Seed this shelf",
  },
};

const FALLBACK = {
  title: METAPHOR_COPY.Generic.title,
  strip: METAPHOR_COPY.Generic.strip,
  invite: METAPHOR_COPY.Generic.invite,
};

/**
 * Search queries tuned for worlds where slug≠TMDB genre (or slug search is
 * meta-document noise). Prefer existing /api/tmdb/search — no second catalog.
 * "noir" alone pulls Cat Noir / prestige noise; prefer the full phrase.
 */
const SUGGEST_QUERY: Record<string, string> = {
  "film-noir": "film noir",
  "war-politics": "political thriller",
  "sci-fi": "science fiction",
  "science-fiction": "science fiction",
};

const NOIR_KEYWORD_RE =
  /\b(noir|neo-?noir|detective|private\s*eye|gumshoe|femme\s*fatale|hard-?boiled|maltese|chinatown|double\s+indemnity)\b/i;

/** Worlds that must not rank by voteAverage alone (prestige pollution). */
const AFFINITY_SLUGS = new Set(["film-noir"]);

/** Human query for TMDB multi-search. */
function suggestQuery(slug: string): string {
  return SUGGEST_QUERY[slug] ?? slug.replace(/-/g, " ").trim();
}

function itemHaystack(item: CatalogItem): string {
  return `${item.title} ${item.overview ?? ""}`;
}

function hasNoirKeyword(item: CatalogItem): boolean {
  return NOIR_KEYWORD_RE.test(itemHaystack(item));
}

/**
 * Affinity score for niche empty-state ranking. Film-noir: keyword + adjacent
 * genres beat raw voteAverage so Shawshank/Godfather cannot outrank Chinatown.
 */
export function affinityScore(slug: string, item: CatalogItem): number {
  if (!AFFINITY_SLUGS.has(slug)) return item.voteAverage ?? 0;

  let score = 0;
  if (hasNoirKeyword(item)) score += 100;
  const gids = item.genreIds ?? [];
  if (gids.includes(53) || gids.includes(9648)) score += 40; // thriller / mystery
  if (gids.includes(80)) score += 20; // crime
  // Prestige demotion: high-vote without noir texture → Top-250 pollution.
  if ((item.voteAverage ?? 0) >= 8 && !hasNoirKeyword(item)) score -= 80;
  // Soft tiebreaker — never let vote dominate keyword/genre.
  score += Math.min(item.voteAverage ?? 0, 7.5);
  return score;
}

/** Minimum score to keep a film-noir suggestion (keyword or thriller/mystery). */
const NOIR_AFFINITY_FLOOR = 40;

/** Lexicon word that actually fits the title — not a rotating lie. */
function lexiconWordFor(world: GenreWorld, item: CatalogItem, index: number): string {
  const lex = world.register.lexicon;
  if (!lex.length) return world.metaphor.toLowerCase();

  if (world.slug === "film-noir") {
    const hay = itemHaystack(item).toLowerCase();
    if (/\b(shadow|noir|dark|night|neon)\b/.test(hay) && lex.includes("shadows")) {
      return "shadows";
    }
    if (/\b(motive|murder|crime|detective|case|kill)\b/.test(hay) && lex.includes("motive")) {
      return "motive";
    }
    if (/\b(fatal|doom|betray|corrupt|doomed)\b/.test(hay) && lex.includes("fatalism")) {
      return "fatalism";
    }
  }
  return lex[index % lex.length]!;
}

/** Deterministic one-line why — lexicon word + year. No LLM, no fake critic. */
function whyLine(world: GenreWorld, item: CatalogItem, index: number): string {
  const word = lexiconWordFor(world, item, index);
  const era = item.year != null ? String(item.year) : item.mediaType === "tv" ? "Series" : "Film";
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} · ${era}`;
}

/**
 * Dedupe + affinity-aware ranking. Drop meta hits whose title is just the
 * query ("Film Noir" docs). Film-noir refuses prestige-by-vote fallback.
 */
export function uniquePicks(
  items: CatalogItem[],
  query: string,
  limit: number,
  excludeKeys: Set<string> = new Set(),
  opts: { slug?: string; mediaType?: "movie" | "tv" } = {},
): CatalogItem[] {
  const q = query.toLowerCase();
  const seen = new Set<string>(excludeKeys);
  const slug = opts.slug ?? "";
  const requireAffinity = AFFINITY_SLUGS.has(slug);

  const pool = items.filter((it) => {
    if (!it.posterPath) return false;
    if (opts.mediaType && it.mediaType !== opts.mediaType) return false;
    return true;
  });

  const ranked = [...pool].sort(
    (a, b) => affinityScore(slug, b) - affinityScore(slug, a),
  );

  const out: CatalogItem[] = [];
  for (const it of ranked) {
    const key = `${it.mediaType}:${it.tmdbId}`;
    if (seen.has(key)) continue;
    const title = it.title.toLowerCase().trim();
    // Meta noise: title is exactly the search phrase (e.g. "Film Noir" docs).
    if (title === q || title === "film noir" || title === "noir") continue;
    if (requireAffinity && affinityScore(slug, it) < NOIR_AFFINITY_FLOOR) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= limit) break;
  }
  // Generic worlds: if filters emptied the list, fall back to ranked posters.
  // Affinity worlds: empty strip > teaching the wrong genre.
  if (out.length === 0 && !requireAffinity) {
    const seenFb = new Set<string>(excludeKeys);
    for (const it of ranked) {
      const key = `${it.mediaType}:${it.tmdbId}`;
      if (seenFb.has(key)) continue;
      seenFb.add(key);
      out.push(it);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/**
 * Compact suggestion tile: poster + why + single Add CTA.
 * Quieter than PosterCard (no hover menus / ranking chrome) so the empty
 * state stays one coherent section, not a competing Discover rail.
 */
function SuggestTile({
  item,
  why,
  invite,
  delayMs = 0,
}: {
  item: CatalogItem;
  why: string;
  invite: string;
  delayMs?: number;
}) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(!!item.inLibrary);
  const src = poster(item.posterPath);

  const add = useMutation({
    mutationFn: () =>
      api.addToLibrary({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        status: "watchlist",
      }),
    onSuccess: () => {
      playCue("success");
      setSaved(true);
      invalidateLibraryData(qc);
    },
  });

  return (
    <li
      className="flex w-[9.5rem] shrink-0 flex-col gap-2 motion-safe:animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] sm:w-[10.5rem]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Link
        to={`/title/${item.mediaType}/${item.tmdbId}`}
        className="group relative block aspect-[2/3] overflow-hidden rounded-lg bg-ink-800 ring-1 ring-white/10 transition-[box-shadow,ring-color] duration-300 hover:ring-[var(--world-accent)]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
        aria-label={`${item.title}${item.year ? ` (${item.year})` : ""}`}
      >
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-center text-xs text-mist-300">
            {item.title}
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-950/80 to-transparent"
        />
      </Link>

      <div className="min-h-[3.25rem] px-0.5">
        <p className="truncate font-display text-sm font-medium text-mist-100">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-mist-500">{why}</p>
      </div>

      <button
        type="button"
        disabled={saved || add.isPending}
        onClick={() => add.mutate()}
        aria-label={saved ? `${item.title} already in library` : `${invite}: ${item.title}`}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)] ${
          saved
            ? "bg-white/[0.06] text-mist-300 ring-1 ring-white/10"
            : "bg-[var(--world-accent)]/90 text-ink-950 hover:opacity-90"
        }`}
      >
        {add.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : saved ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden />
            Anchored
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add
          </>
        )}
      </button>
    </li>
  );
}

/**
 * Niche-genre empty state (design R6 / metric 9). Shown when a genre has
 * fewer than `threshold` titles — a tailored empty + calm suggestion strip,
 * not a blank rail and not a second hero. Suggestions use existing
 * `/api/tmdb/search` + add-to-library (no second catalog stack).
 */
export function GenreEmptyState({
  world,
  count,
  threshold,
  onBootstrap,
  excludeKeys = [],
  mediaType = "movie",
}: Props) {
  const hasOwnCopy = world.metaphor !== "Generic" && world.metaphor in METAPHOR_COPY;
  const copy = hasOwnCopy
    ? METAPHOR_COPY[world.metaphor]
    : {
        title: FALLBACK.title,
        body: `Only ${count} title${count === 1 ? "" : "s"} on the vault shelf. Anchor with something you love — catalog still curates below.`,
        strip: FALLBACK.strip,
        invite: FALLBACK.invite,
      };
  const shelfHonesty =
    count <= 0
      ? "No shelf · catalog live"
      : `Thin shelf · ${count} on shelf · catalog live`;

  const q = suggestQuery(world.slug);
  const neighbors = world.register.adjacency ?? [];
  const suggestions = useQuery({
    queryKey: ["genre-empty-suggest", world.slug, q, neighbors.join(","), mediaType],
    queryFn: async () => {
      // Prefer neighbor-world rails (existing genre-experience) over bare
      // search — string search returns meta/prestige noise; Crime/Thriller
      // discover yields adjacent texture when affinity-filtered. Merge search
      // when neighbors alone cannot clear the affinity floor (TV sparse).
      const searched = api.search(q).catch(() => [] as CatalogItem[]);
      if (neighbors.length) {
        const batches = await Promise.all(
          neighbors.slice(0, 2).map((slug) =>
            api.genreExperience([slug], "self", mediaType, []).catch(() => null),
          ),
        );
        const fromNeighbors = batches.flatMap((b) => b?.items ?? []);
        if (fromNeighbors.length) {
          const neighborHits = uniquePicks(fromNeighbors, q, 5, new Set(excludeKeys), {
            slug: world.slug,
            mediaType,
          });
          if (neighborHits.length >= 3) return fromNeighbors;
          return [...fromNeighbors, ...(await searched)];
        }
      }
      return searched;
    },
    enabled: q.length > 0 || neighbors.length > 0,
    staleTime: 12 * 60 * 60 * 1000,
  });

  // Calm density: 5 unique posters max — avoids Discover-row chaos.
  const picks = uniquePicks(suggestions.data ?? [], q, 5, new Set(excludeKeys), {
    slug: world.slug,
    mediaType,
  });

  return (
    <section
      className="rounded-2xl bg-white/[0.02] px-4 py-6 ring-1 ring-white/10 sm:px-6"
      aria-labelledby="genre-empty-heading"
      data-testid="genre-shelf-thin"
      data-empty-kind="shelf-thin"
    >
      {/* Status whisper — compact, not a competing hero card */}
      <div className="max-w-xl">
        <div
          aria-hidden="true"
          className="mb-4 h-px w-12 bg-[var(--world-accent)]/40"
        />
        <p
          data-testid="genre-shelf-honesty"
          className="mb-2 text-[11px] uppercase tracking-wider text-mist-500"
        >
          {shelfHonesty}
        </p>
        <h2
          id="genre-empty-heading"
          className="font-display text-base font-medium tracking-tight text-mist-100 sm:text-lg"
        >
          {copy.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-300">{copy.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-wide text-[var(--world-accent)]/70">
            {count} / {threshold} on shelf
          </p>
          {onBootstrap && (
            <button
              type="button"
              onClick={onBootstrap}
              className="text-xs font-medium text-mist-300 underline-offset-4 transition-colors hover:text-mist-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
            >
              Anchor from library
            </button>
          )}
        </div>
      </div>

      {/* Coherent suggestion strip — SectionHead matches Worlds IA chrome */}
      <div className="mt-6">
        <SectionHead id="genre-suggest-strip">{copy.strip}</SectionHead>
        <p className="mb-3 text-xs text-mist-500">{copy.invite}</p>

        {suggestions.isLoading && (
          <ul
            className="flex gap-3 overflow-hidden"
            aria-busy="true"
            aria-label="Loading title suggestions"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="h-[14rem] w-[9.5rem] shrink-0 animate-pulse rounded-lg bg-white/[0.04] sm:w-[10.5rem]"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </ul>
        )}

        {suggestions.isError && (
          <p className="text-sm text-mist-300">
            Couldn&rsquo;t load suggestions. Use Anchor from library, or search on Discover.
          </p>
        )}

        {!suggestions.isLoading && !suggestions.isError && picks.length === 0 && (
          <p className="text-sm text-mist-300">
            No posters matched &ldquo;{q}&rdquo; yet. Anchor from your library instead.
          </p>
        )}

        {picks.length > 0 && (
          <ul
            className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={`${copy.strip} — suggested titles`}
          >
            {picks.map((it, i) => (
              <SuggestTile
                key={`${it.mediaType}:${it.tmdbId}`}
                item={it}
                why={whyLine(world, it, i)}
                invite={copy.invite}
                delayMs={Math.min(i, 4) * 60}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
