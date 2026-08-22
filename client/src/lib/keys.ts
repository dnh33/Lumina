/** Shared localStorage keys — single source of truth. */
export const DOCK_CONVERSATION_KEY = "lumina-dock-conversation";
/** Distinct conversation id for the in-world /genre Companion (Task 4.3).
 *  Kept SEPARATE from DOCK_CONVERSATION_KEY so the genre companion never
 *  clobbers the user's main global chat, and kept CONSTANT (not slug-derived)
 *  in Self mode so navigating /genre/a → /genre/b keeps the same conversation
 *  (no abort). Guided mode uses `genreCompanionConversationKey` instead. */
export const GENRE_DOCK_CONVERSATION_KEY = "lumina-genre-dock-conversation";
export const SPOILER_SHIELD_KEY = "lumina-spoiler-shield";
export const STILL_BACKFILL_KEY = "lumina-stills-backfilled";
export const SOUND_KEY = "lumina:sound";

/** Per-genre world state (filter/steer/dismissed) persisted to localStorage.
 *  The slug is appended: `${GENRE_STATE_KEY}:${slug}`. */
export const GENRE_STATE_KEY = "lumina:genre-state";

/** Stream snapshot key — checkpoint the assistant's partial text mid-stream
 *  so a browser refresh mid-turn preserves the response in progress.
 *  Format: `${STREAM_SNAPSHOT_KEY}:${conversationId}`. */
export const STREAM_SNAPSHOT_KEY = "lumina:stream-snapshot";

/**
 * LocalStorage key for the in-world Companion conversation id.
 * - Self: shared constant (genre hops keep one thread).
 * - Guided: per `{slug}:{mediaType}` so documentary tour chat ≠ horror tour chat.
 *   Aligns with server session key `guided-session:{slug}:{mediaType}`.
 */
export function genreCompanionConversationKey(
  slug: string,
  mediaType: "movie" | "tv",
  guided: boolean,
): string {
  if (!guided) return GENRE_DOCK_CONVERSATION_KEY;
  return `${GENRE_DOCK_CONVERSATION_KEY}:guided:${slug}:${mediaType}`;
}
