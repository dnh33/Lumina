import type { DB } from "../db/connection.js";
import { listEpisodes } from "../services/libraryService.js";
import { currentModel, getLlm, getSetting, setSetting } from "./openrouter.js";
import { recapPrompt } from "./prompts.js";

export interface EpisodeRecap {
  text: string;
  resumeAt: { season: number; episode: number; name: string } | null;
  watched: number;
  total: number;
  cached: boolean;
}

/**
 * "Previously on…" — a spoiler-safe re-immersion for a series the user is
 * resuming. The model sees ONLY episodes they've already watched, so it
 * physically cannot spoil what's ahead. Cached per watch-position.
 */
export async function episodeRecap(
  db: DB,
  titleId: number,
  refresh = false,
): Promise<EpisodeRecap> {
  const eps = listEpisodes(db, titleId);
  const watched = eps.filter((e) => e.watched);
  const next = eps.find((e) => !e.watched) ?? null;
  const resumeAt = next
    ? { season: next.season, episode: next.episode, name: next.name }
    : null;

  if (!watched.length) {
    return { text: "", resumeAt, watched: 0, total: eps.length, cached: false };
  }

  const title = db
    .prepare("SELECT title FROM titles WHERE id = ?")
    .get(titleId) as { title: string } | undefined;
  if (!title) {
    return { text: "", resumeAt, watched: watched.length, total: eps.length, cached: false };
  }

  // cache key includes watch position — auto-invalidates as they progress
  const cacheKey = `recap:${titleId}:${watched.length}`;
  if (!refresh) {
    const cached = getSetting(db, cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { text: string };
      return {
        text: parsed.text,
        resumeAt,
        watched: watched.length,
        total: eps.length,
        cached: true,
      };
    }
  }

  const last = watched[watched.length - 1];
  const source = watched
    .slice(-10)
    .map(
      (e) =>
        `S${e.season}E${e.episode} "${e.name}": ${e.overview || "(no summary)"}`,
    )
    .join("\n");

  const llm = getLlm();
  const completion = await llm.chat.completions.create({
    model: currentModel(db),
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: recapPrompt(title.title, last.season, last.episode),
      },
      { role: "user", content: source },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (text) setSetting(db, cacheKey, JSON.stringify({ text }));
  return { text, resumeAt, watched: watched.length, total: eps.length, cached: false };
}
