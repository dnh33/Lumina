import type { DB } from "../db/connection.js";
import type { LibraryEntry } from "../services/libraryService.js";
import { getEntry } from "../services/libraryService.js";

/**
 * RAG · Layer 2 — Library retrieval.
 * Full-text search over the user's library (titles, overviews, genres,
 * people, personal notes and tags) with a relevance score that blends
 * BM25 with the user's own signal (ratings, favorites).
 */

/** Turn free text into a safe FTS5 MATCH expression (OR of prefix tokens). */
export function toFtsQuery(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/["'’`]/g, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3)
    .slice(0, 12);
  if (!tokens.length) return "";
  return tokens.map((t) => `"${t}"*`).join(" OR ");
}

export interface ScoredEntry extends LibraryEntry {
  relevance: number;
}

export function retrieveLibrary(db: DB, query: string, k = 10): ScoredEntry[] {
  const match = toFtsQuery(query);
  if (!match) return [];

  let rows: { rowid: number; score: number }[];
  try {
    rows = db
      .prepare(
        `SELECT rowid, bm25(library_fts, 8.0, 2.0, 3.0, 4.0, 3.0, 5.0, 6.0) AS score
         FROM library_fts WHERE library_fts MATCH ?
         ORDER BY score LIMIT ?`,
      )
      .all(match, k * 3) as { rowid: number; score: number }[];
  } catch {
    return []; // malformed query — fail soft
  }

  const scored: ScoredEntry[] = [];
  for (const r of rows) {
    const entry = getEntry(db, r.rowid);
    if (!entry) continue;
    // bm25 returns negative-is-better; invert, then scale by user signal so
    // ratings/favorites break ties without drowning out text relevance.
    const base = -r.score;
    const multiplier =
      1 + (entry.rating ?? 5) / 40 + (entry.favorite ? 0.15 : 0);
    scored.push({
      ...entry,
      relevance: Math.round(base * multiplier * 100) / 100,
    });
  }
  scored.sort((a, b) => b.relevance - a.relevance);
  return scored.slice(0, k);
}

/** Render retrieved entries as a compact context block. */
export function renderLibraryMatches(entries: ScoredEntry[]): string {
  if (!entries.length) return "";
  return entries
    .map((e) => {
      const bits = [
        `${e.title}${e.year ? ` (${e.year})` : ""} — ${e.mediaType === "tv" ? "series" : "film"}, ${e.status}`,
      ];
      if (e.rating != null) bits.push(`rated ${e.rating}/10`);
      if (e.favorite) bits.push("favorite");
      if (e.tags.length) bits.push(`tagged: ${e.tags.join(", ")}`);
      if (e.genres.length) bits.push(e.genres.slice(0, 3).join("/"));
      if (e.director) bits.push(`by ${e.director}`);
      if (e.notes) bits.push(`notes: "${e.notes.slice(0, 160)}"`);
      return `• ${bits.join(", ")}`;
    })
    .join("\n");
}
