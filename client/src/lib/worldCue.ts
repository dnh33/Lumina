import { playCue } from "./sound.js";
import type { GenreWorld } from "./genreWorld.js";

/**
 * Maps a semantic world beat ("open" / "discover" / "warn") to a concrete
 * cue name from the world's `register.cueBeatMap` and plays it.
 *
 * `cueBeatMap` carries the genre's authored beat keys; `playCue` already
 * no-ops when muted or given an unknown name, so we don't re-implement
 * mute logic here — we just forward the resolved key (which may be a
 * not-yet-wired SemanticKey, hence `as any`).
 */
export function playWorldCue(
  world: GenreWorld | undefined,
  cue: "open" | "discover" | "warn",
) {
  const map = world?.register?.cueBeatMap;
  if (!map || map.length === 0) return;
  const name = map.find((c) => c === cue) ?? map[0];
  if (name) playCue(name as any);
}
