/** Shared localStorage keys — single source of truth. */
export const DOCK_CONVERSATION_KEY = "lumina-dock-conversation";
/** Distinct conversation id for the in-world /genre Companion (Task 4.3).
 *  Kept SEPARATE from DOCK_CONVERSATION_KEY so the genre companion never
 *  clobbers the user's main global chat, and kept CONSTANT (not slug-derived)
 *  so navigating /genre/a → /genre/b keeps the same conversation (no abort). */
export const GENRE_DOCK_CONVERSATION_KEY = "lumina-genre-dock-conversation";
export const SPOILER_SHIELD_KEY = "lumina-spoiler-shield";
export const STILL_BACKFILL_KEY = "lumina-stills-backfilled";
export const SOUND_KEY = "lumina:sound";

/** Per-genre world state (filter/steer/dismissed) persisted to localStorage.
 *  The slug is appended: `${GENRE_STATE_KEY}:${slug}`. */
export const GENRE_STATE_KEY = "lumina:genre-state";
