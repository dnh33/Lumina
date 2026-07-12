import type { DB } from "../db/connection.js";
import {
  computeTasteProfile,
  renderTasteProfile,
} from "../rag/tasteProfile.js";
import { fetchDetailsFromTmdb } from "../services/libraryService.js";
import { getEntryByTmdb } from "../services/libraryService.js";
import type { MediaType } from "../tmdb/types.js";
import { currentModel, getLlm, getSetting, setSetting } from "./openrouter.js";
import { insightPrompt } from "./prompts.js";

export interface TitleInsight {
  text: string;
  cached: boolean;
  model: string;
}

/**
 * "Why you'll love this" — a one-shot personalized reflection for a title,
 * grounded in the taste profile. Cached per title until refreshed.
 */
export async function titleInsight(
  db: DB,
  tmdbId: number,
  mediaType: MediaType,
  refresh = false,
): Promise<TitleInsight> {
  const cacheKey = `insight:${mediaType}:${tmdbId}`;
  if (!refresh) {
    const cached = getSetting(db, cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { text: string; model: string };
      return { text: parsed.text, cached: true, model: parsed.model };
    }
  }

  const [details, profile] = await Promise.all([
    fetchDetailsFromTmdb(tmdbId, mediaType),
    Promise.resolve(computeTasteProfile(db)),
  ]);
  const owned = getEntryByTmdb(db, tmdbId, mediaType);

  const titleBlock = [
    `Title: ${details.title}${details.year ? ` (${details.year})` : ""} — ${mediaType === "tv" ? "series" : "film"}`,
    details.tagline ? `Tagline: ${details.tagline}` : "",
    `Genres: ${details.genres.join(", ")}`,
    details.director ? `Director/creator: ${details.director}` : "",
    `Cast: ${details.cast.slice(0, 6).map((c) => c.name).join(", ")}`,
    `TMDB rating: ${details.voteAverage ?? "—"}`,
    `Premise: ${details.overview}`,
    owned
      ? `Already in their library: status ${owned.status}${owned.rating ? `, their rating ${owned.rating}/10` : ""}${owned.notes ? `, their notes: "${owned.notes}"` : ""}`
      : "Not in their library yet.",
  ]
    .filter(Boolean)
    .join("\n");

  const llm = getLlm();
  const model = currentModel(db);
  const completion = await llm.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: "system", content: insightPrompt() },
      {
        role: "user",
        content: `## The user's taste profile\n${renderTasteProfile(profile)}\n\n## The title\n${titleBlock}`,
      },
    ],
  });

  const text =
    completion.choices[0]?.message?.content?.trim() ??
    "No insight available right now.";
  setSetting(db, cacheKey, JSON.stringify({ text, model }));
  return { text, cached: false, model };
}
