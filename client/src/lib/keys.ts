/** Shared localStorage keys — single source of truth. */
export const DOCK_CONVERSATION_KEY = "lumina-dock-conversation";
export const SPOILER_SHIELD_KEY = "lumina-spoiler-shield";
export const STILL_BACKFILL_KEY = "lumina-stills-backfilled";
export const SOUND_KEY = "lumina:sound";

/** Per-genre world state (filter/steer/dismissed) persisted to localStorage.
 *  The slug is appended: `${GENRE_STATE_KEY}:${slug}`. */
export const GENRE_STATE_KEY = "lumina:genre-state";
