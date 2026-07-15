import type { GenreWorld } from "./genreWorld.js";

/**
 * Resolve a world's accent token (a CSS color value, e.g. hex like "#6366f1").
 * Falls back to the legacy amber (#f59e0b) so existing hardcoded usages that
 * haven't been migrated still render with the established warm tone.
 */
export function accentVar(world: GenreWorld | undefined): string {
  return world?.register?.accent ?? "#f59e0b";
}
