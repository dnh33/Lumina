/**
 * ToolResultCard — rich movie/TV result cards that wrap below ToolTrace rows.
 *
 * Three variants based on the tool name:
 *  - compare_titles  → side-by-side poster verdict cards
 *  - get_title_details → poster + metadata grid + where-to-watch
 *  - search_tmdb / discover_titles → thumbnail grid
 *
 * Design tokens: matches PosterCard (SuggestionCards.tsx) exactly —
 *   aspect-[2/3], h-24, rounded-lg, object-cover, ring-1 ring-white/10,
 *   gold-400 accent, mist-300 secondary text, Fraunces display.
 *
 * Progressive disclosure: collapsed by default, expanded via chevron.
 * Reuses the same ToolTrace collapse pattern (AnimatePresence + max-height).
 */

import {
  ChevronDown,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import type { ToolNode } from "./buildToolNodes";

type JsonObject = { [k: string]: unknown };

/** Safe JSON parse — returns null on any error. */
function safeParse(s?: string): unknown {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function asObj(v: unknown): JsonObject | null {
  return v && typeof v === "object" && !Array.isArray(v) ? v as JsonObject : null;
}

function jstr(o: JsonObject | null, k: string): string | undefined {
  const v = o?.[k];
  return typeof v === "string" ? v : v === undefined ? undefined : String(v);
}

function jnum(o: JsonObject | null, k: string): number | undefined {
  const v = o?.[k];
  return typeof v === "number" ? v : undefined;
}

function jarr(o: JsonObject | null, k: string): unknown[] | undefined {
  const v = o?.[k];
  return Array.isArray(v) ? v : undefined;
}

type ToolResult =
  | { tool: "compare_titles"; parsed: JsonObject }
  | { tool: "get_title_details"; parsed: JsonObject }
  | { tool: "search_tmdb"; parsed: JsonObject }
  | { tool: "unknown" };

function classifyOutcome(node: ToolNode): ToolResult {
  const parsed = safeParse(node.outcome);
  const obj = asObj(parsed);
  const tool = node.name;
  if (obj) {
    if (tool === "compare_titles") return { tool: "compare_titles", parsed: obj };
    if (tool === "get_title_details") return { tool: "get_title_details", parsed: obj };
    if (tool === "search_tmdb" || tool === "discover_titles") return { tool: "search_tmdb", parsed: obj };
  }
  return { tool: "unknown" };
}

function posterUrl(obj: JsonObject): string | undefined {
  const path = jstr(obj, "poster_path") ?? jstr(obj, "posterPath") ?? jstr(obj, "poster") ?? jstr(obj, "posterUrl");
  return path && path.startsWith("http") ? path : path ? `https://image.tmdb.org/t/p/w342${path}` : undefined;
}

export interface ToolResultCardProps {
  node: ToolNode;
}

export function ToolResultCard({ node }: ToolResultCardProps) {
  const result = classifyOutcome(node);
  if (result.tool === "unknown") return null;

  const label =
    result.tool === "compare_titles" ? "Side-by-side verdict"
    : result.tool === "get_title_details" ? "Details & where to watch"
    : "Results grid";

  return (
    <div
      data-testid="tool-result-card"
      data-tool={node.name}
      className="mt-1.5 overflow-hidden rounded-lg border border-white/5 bg-ink-800/50"
    >
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-2xs font-medium text-mist-300 transition hover:text-mist-200">
          <ChevronDown className="h-3 w-3 shrink-0 text-mist-400/70 transition-transform group-open:rotate-180" />
          <span>{label}</span>
        </summary>
        <div className="px-3 pb-3 pt-1">
          {renderResult(result)}
        </div>
      </details>
    </div>
  );
}

function renderResult(result: ToolResult): React.ReactNode {
  switch (result.tool) {
    case "compare_titles": return renderCompare(result.parsed);
    case "get_title_details": return renderDetails(result.parsed);
    case "search_tmdb": return renderGrid(result.parsed);
  }
}

function renderCompare(parsed: JsonObject): React.ReactNode {
  const candidates = jarr(parsed, "candidates");
  const mood = jstr(parsed, "mood");
  if (!candidates || candidates.length === 0) {
    return <p className="text-2xs text-mist-400">No candidates to compare.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {mood && <p className="text-2xs italic text-mist-400">Mood: {mood}</p>}
      <div className="flex gap-2.5 overflow-x-auto">
        {candidates.map((c, i) => {
          const o = asObj(c);
          const title = jstr(o, "title") ?? jstr(o, "name") ?? "Untitled";
          const year = jnum(o, "year") ?? jnum(o, "release_year");
          const rating = jnum(o, "tmdbRating") ?? jnum(o, "vote_average");
          const poster = posterUrl(o ?? {});
          return (
            <div key={i} className="flex w-32 shrink-0 flex-col">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-b from-ink-700 to-ink-800">
                {poster ? (
                  <img src={poster} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center">
                    <span className="font-display text-[0.7rem] font-semibold text-mist-200">{title}</span>
                  </div>
                )}
                <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
              </div>
              <p className="mt-1 font-display text-[0.7rem] font-semibold text-mist-100">{title}</p>
              {year && <p className="text-2xs text-mist-400">{year}</p>}
              {rating !== undefined && (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                  <span className="text-2xs text-mist-300">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderDetails(parsed: JsonObject): React.ReactNode {
  const title = jstr(parsed, "title") ?? jstr(parsed, "name") ?? "Untitled";
  const year = jnum(parsed, "year") ?? jnum(parsed, "release_year");
  const tagline = jstr(parsed, "tagline");
  const overview = jstr(parsed, "overview") ?? jstr(parsed, "synopsis");
  const runtime = jnum(parsed, "runtime");
  const rating = jnum(parsed, "tmdbRating") ?? jnum(parsed, "vote_average");
  const genres = jarr(parsed, "genres");
  const director = jstr(parsed, "director");
  const poster = posterUrl(parsed);
  const watchProviders = asObj(parsed["where_to_watch"] ?? parsed["whereToWatch"] ?? null);

  return (
    <div className="flex gap-3">
      <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-ink-700 to-ink-800">
        {poster ? (
          <img src={poster} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-1 text-center">
            <span className="font-display text-[0.6rem] font-semibold text-mist-200">{title}</span>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[0.8rem] font-semibold text-mist-100">{title}</p>
        {year && <p className="text-2xs text-mist-400">{year}</p>}
        {tagline && <p className="mt-1 text-2xs italic text-mist-300">“{tagline}”</p>}

        <div className="mt-2 flex flex-wrap gap-2.5">
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
              <span className="text-2xs text-mist-300">{rating.toFixed(1)}</span>
            </div>
          )}
          {runtime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-mist-400" />
              <span className="text-2xs text-mist-300">{runtime} min</span>
            </div>
          )}
          {year && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-mist-400" />
              <span className="text-2xs text-mist-300">{year}</span>
            </div>
          )}
        </div>

        {genres && genres.length > 0 && (
          <p className="mt-1 text-2xs text-mist-400">
            {genres.map((g) => jstr(asObj(g) ?? null, "name") ?? String(g)).join(", ")}
          </p>
        )}
        {director && <p className="mt-1 text-2xs text-mist-400">Dir: {director}</p>}
        {overview && <p className="mt-1.5 text-2xs leading-snug text-mist-300 line-clamp-2">{overview}</p>}

        {watchProviders && Object.keys(watchProviders).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(watchProviders).map(([provider, region]) => {
              const p = Array.isArray(region) ? String(region[0]) : String(region);
              return (
                <span key={provider} className="inline-flex items-center gap-1 rounded-md bg-ink-700/40 px-1.5 py-0.5 text-2xs text-mist-300">
                  {provider} • {p}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function renderGrid(parsed: JsonObject): React.ReactNode {
  const results = jarr(parsed, "results");
  if (!results || results.length === 0) {
    return <p className="text-2xs text-mist-400">No results found.</p>;
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(80px,_1fr))] gap-2">
      {results.slice(0, 8).map((r, i) => {
        const o = asObj(r) ?? {};
        const title = jstr(o, "title") ?? jstr(o, "name") ?? "Untitled";
        const poster = posterUrl(o);
        return (
          <div key={i} className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-b from-ink-700 to-ink-800">
            {poster ? (
              <img src={poster} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-1 text-center">
                <span className="font-display text-[0.6rem] font-semibold text-mist-200">{title}</span>
              </div>
            )}
            <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
          </div>
        );
      })}
    </div>
  );
}
