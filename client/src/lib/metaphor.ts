import type { GenreWorld } from "./genreWorld.js";

/**
 * Resolve a world's accent token (a CSS color value, e.g. hex like "#6366f1").
 * Falls back to the legacy amber (#f59e0b) so existing hardcoded usages that
 * haven't been migrated still render with the established warm tone.
 */
export function accentVar(world: GenreWorld | undefined): string {
  return world?.register?.accent ?? "#f59e0b";
}

/**
 * The layout grammar a world's metaphor resolves to (Task 4.1, design
 * §92 / §188-190). Two flagships get a DECORATIVE backdrop; the rest only
 * get a themed TitleCard variant.
 */
export type MetaphorLayout = {
  backdrop: "constellation" | "frontier" | "none";
  cardVariant:
    | "constellation"
    | "frontier"
    | "threshold"
    | "reading-room"
    | "warm-interior"
    | "panel"
    | "generic";
};

/** "Reading Room" -> "reading-room", "Warm Interior" -> "warm-interior", etc. */
function kebab(metaphor: string): string {
  return metaphor.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Map a world's metaphor to a LAYOUT grammar (Task 4.1, design §92/§188-190):
 *  - Constellation + Frontier are the two flagship bespoke layouts: they get a
 *    decorative backdrop (node-map / geo-spine) behind the cards.
 *  - The other five metaphors (Threshold, Reading Room, Warm Interior, Panel,
 *    Generic) are NOT bespoke layouts — they only get a themed TitleCard
 *    variant (accent emphasis + spacing). backdrop stays "none".
 * Pure function, no React. Safe on undefined (falls back to generic/none).
 */
export function metaphorLayout(world: GenreWorld | undefined): MetaphorLayout {
  if (!world) return { backdrop: "none", cardVariant: "generic" };
  switch (world.metaphor) {
    case "Constellation":
      return { backdrop: "constellation", cardVariant: "constellation" };
    case "Frontier":
      return { backdrop: "frontier", cardVariant: "frontier" };
    default:
      return {
        backdrop: "none",
        cardVariant: kebab(world.metaphor) as MetaphorLayout["cardVariant"],
      };
  }
}
