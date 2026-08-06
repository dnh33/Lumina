import type { GuidedPick, MediaType } from "../../lib/types.js";

export interface TonightBagItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string;
}

/** Deep-link into Library filtered to watchlist. */
export function libraryWatchlistPath(): string {
  return "/library?status=watchlist";
}

/**
 * Titles bagged this session: picks whose tmdbId appears in actedWatchlistIds.
 * Pre-library peers not acted this session stay out. Shelf order preserved.
 */
export function buildTonightBag(
  picks: GuidedPick[],
  actedWatchlistIds: readonly number[],
): TonightBagItem[] {
  const bagged = new Set(actedWatchlistIds);
  return picks
    .filter((p) => bagged.has(p.tmdbId))
    .map((p) => {
      const item: TonightBagItem = {
        tmdbId: p.tmdbId,
        mediaType: p.mediaType,
        title: p.title,
      };
      if (p.posterPath) item.posterPath = p.posterPath;
      return item;
    });
}
