import type { WatchProviders } from "./types.js";

/**
 * TMDB movie genre id -> human-readable name. Covers the genre worlds the app
 * builds (see lib/genreWorld.ts GENRE_WORLDS) plus the full standard TMDB
 * movie genre list, so topic spines always resolve to a real name.
 */
export const GENRE_ID_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

/** Human country name for an ISO 3166-1 alpha-2 production-country code. */
export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  ES: "Spain",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  MX: "Mexico",
  RU: "Russia",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  NL: "Netherlands",
  IE: "Ireland",
  NZ: "New Zealand",
  HK: "Hong Kong",
  TW: "Taiwan",
  TH: "Thailand",
  TR: "Turkey",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Resolve a TMDB genre id to its name, falling back to `Genre <id>`. */
export function genreName(gid: number): string {
  return GENRE_ID_NAMES[gid] ?? `Genre ${gid}`;
}

/** Resolve an ISO 3166-1 alpha-2 code to its country name. */
export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? regionNames.of(code) ?? code;
}

/** Flatten a WatchProviders payload into a de-duplicated list of provider
 *  names (flatrate + rent + buy), in priority order. */
export function watchProviderNames(
  wp: WatchProviders | null | undefined,
): string[] {
  if (!wp) return [];
  const order: string[] = [];
  const push = (name?: string) => {
    if (name && !order.includes(name)) order.push(name);
  };
  for (const p of wp.flatrate ?? []) push(p.name);
  for (const p of wp.rent ?? []) push(p.name);
  for (const p of wp.buy ?? []) push(p.name);
  return order;
}
