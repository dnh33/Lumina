/**
 * World slug allowlist + sanitizers.
 * Guided session keys and Companion RAG must not accept free-form attacker strings.
 * Genre-intro / experience may accept sanitized archive slugs (not only curated worlds).
 */

/** Same curated set the client ships in `lib/genreWorld.ts` (incl. sci-fi alias). */
export const KNOWN_WORLD_SLUGS = new Set([
  "documentary",
  "science-fiction",
  "sci-fi",
  "horror",
  "romance",
  "western",
  "anime",
  "film-noir",
  "thriller",
  "fantasy",
  "crime",
  "mystery",
  "comedy",
  "music",
  "war-politics",
  "history",
  "travel",
]);

export const MAX_WORLD_SLUG_LEN = 64;
export const MAX_GENRE_QUERY_COUNT = 8;
export const MAX_MODULE_QUERY_COUNT = 12;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return true;
  }
  return false;
}

/** Normalize + reject control chars / overlong / non-slug shapes. */
export function sanitizeGenreSlug(raw: string): string | null {
  if (hasControlChars(raw)) return null;
  const s = raw.trim().toLowerCase();
  if (!s || s.length > MAX_WORLD_SLUG_LEN) return null;
  if (!SLUG_RE.test(s)) return null;
  return s;
}

/**
 * Curated world only — guided-session persist / RAG / tour entry.
 * Throws `{ statusCode: 400 }` on reject.
 */
export function assertKnownWorldSlug(raw: string): string {
  const s = sanitizeGenreSlug(raw);
  if (!s || !KNOWN_WORLD_SLUGS.has(s)) {
    throw Object.assign(new Error("invalid world slug"), { statusCode: 400 });
  }
  return s;
}

/** Cap + sanitize `genres` query for discover genre-intro / experience. */
export function parseGenreQueryParam(raw: unknown): string[] {
  const parts = String(raw ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (out.length >= MAX_GENRE_QUERY_COUNT) break;
    const s = sanitizeGenreSlug(part);
    if (s) out.push(s);
  }
  return out;
}

/** Cap + sanitize `modules` query. */
export function parseModulesQueryParam(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  const parts = String(raw)
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (out.length >= MAX_MODULE_QUERY_COUNT) break;
    if (hasControlChars(part) || part.length > MAX_WORLD_SLUG_LEN) continue;
    if (!SLUG_RE.test(part)) continue;
    out.push(part);
  }
  return out;
}
