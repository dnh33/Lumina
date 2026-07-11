const IMG_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500" | "w780";
export type BackdropSize = "w780" | "w1280" | "original";

export function poster(path: string | null | undefined, size: PosterSize = "w342"): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function backdrop(
  path: string | null | undefined,
  size: BackdropSize = "w1280",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function profile(path: string | null | undefined): string | null {
  return path ? `${IMG_BASE}/w185${path}` : null;
}
