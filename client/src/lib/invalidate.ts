import type { QueryClient } from "@tanstack/react-query";

/**
 * One invalidation set for every "library changed" mutation, so save
 * badges, filters, stats and rails never disagree about reality.
 */
export function invalidateLibraryData(qc: QueryClient): void {
  for (const key of [
    "library",
    "library-stats",
    "library-genres",
    "library-tags",
    "up-next",
    "taste-profile",
    "trending",
    "for-you",
    "because",
    "popular",
    "top-rated",
    "title",
  ]) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}
