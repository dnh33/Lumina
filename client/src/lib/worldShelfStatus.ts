import type { LibraryEntry } from "./types.js";

/**
 * Hub / map status = library shelf heat for a world — not "is the world empty?"
 * Self still serves a curated discover catalog when the shelf is cold.
 * Align threshold with GenreExperience niche gate.
 */
export const NICHE_THRESHOLD = 6;

export type ShelfStatus = "empty" | "sparse" | "filled";

/** Short labels — always "shelf", never bare Empty/Filled (empty-world lie). */
export const SHELF_STATUS_COPY: Record<ShelfStatus, string> = {
  filled: "Dense shelf",
  sparse: "Thin shelf",
  empty: "No shelf",
};

export function slugifyGenreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Match a library genre string to an atlas slug. Handles TMDB naming drift
 * (Science Fiction, Film Noir, War) and the sci-fi alias.
 */
export function genreMatchesSlug(genreName: string, slug: string): boolean {
  const g = slugifyGenreName(genreName);
  if (g === slug) return true;
  if (slug === "science-fiction" && (g === "sci-fi" || g === "sci-fi-fantasy"))
    return true;
  if (slug === "film-noir" && (g === "noir" || g === "filmnoir")) return true;
  if (slug === "war-politics" && (g === "war" || g === "politics")) return true;
  if (slug === "anime" && g === "animation") return true;
  return false;
}

export function shelfCountForSlug(
  entries: LibraryEntry[],
  slug: string,
): number {
  return entries.reduce((n, e) => {
    const hit = (e.genres ?? []).some((g) => genreMatchesSlug(g, slug));
    return hit ? n + 1 : n;
  }, 0);
}

export function shelfStatusFromCount(count: number): ShelfStatus {
  if (count <= 0) return "empty";
  if (count < NICHE_THRESHOLD) return "sparse";
  return "filled";
}

/** Count whisper under the status word — empty shelf ≠ empty catalog. */
export function shelfCountLabel(count: number): string {
  if (count <= 0) return "0 on shelf · catalog live";
  return `${count} title${count === 1 ? "" : "s"} on shelf`;
}

/** Compact focus-strip / door meta after the status word. */
export function shelfStatusDetail(count: number): string {
  if (count <= 0) return "catalog live";
  return `${count} on shelf`;
}

/** Accessible one-liner for map nodes / doors. */
export function shelfStatusAria(status: ShelfStatus, count: number): string {
  if (count <= 0) return `${SHELF_STATUS_COPY[status]}, catalog live`;
  return `${SHELF_STATUS_COPY[status]}, ${count} on shelf`;
}
