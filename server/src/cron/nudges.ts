/**
 * Proactive Nudge System — passive, in-session only.
 *
 * Nudges are evaluated on a background schedule (every 6h) and stored as
 * NUDGE records. They are surfaced ONLY when the user opens a conversation
 * (dormant → active transition) — never as push notifications, toasts, or
 * emails. This preserves Lumina's reactive, composed identity.
 *
 * Triggers:
 * - Series near finish: <5 unwatched episodes remaining
 * - Stale watchlist: items on watchlist >30 days
 * - New episode aired: next_episode_to_air date passed since last watch
 * - Anchor fatigue: anchorService fatigue score >= 0.6
 * - New release match: TMDB discover returns high-rated titles in watched genres
 */

import type { DB } from "../db/connection.js";
import { getLlm } from "../llm/openrouter.js";
import { upNext, type UpNextItem } from "../services/discoverService.js";
import { fatigueScores } from "../services/anchorService.js";
import { tmdbGet } from "../tmdb/client.js";
import { computeTasteProfile } from "../rag/tasteProfile.js";
import type { CatalogItem } from "../tmdb/types.js";

export interface Nudge {
  id: number;
  conversation_id: number | null;
  kind: "near_finish" | "stale_watchlist" | "new_episode" | "anchor_fatigue" | "new_release";
  text: string;
  dismissed: boolean;
  created_at: string;
}

/** Generate all nudges for the current library state. */
export async function generateNudges(db: DB): Promise<Nudge[]> {
  const nudges: Omit<Nudge, "id" | "created_at">[] = [];

  // 1. Series near finish (<5 unwatched episodes remaining)
  const nearFinish = await nearFinishNudges(db);
  nudges.push(...nearFinish);

  // 2. Stale watchlist (>30 days)
  const stale = staleWatchlistNudges(db);
  nudges.push(...stale);

  // 3. New episode aired since last watch
  const newEpisodes = newEpisodeNudges(db);
  nudges.push(...newEpisodes);

  // 4. Anchor fatigue (fatigue score >= 0.6)
  const fatigue = fatigueNudges(db);
  nudges.push(...fatigue);

  // 5. New release match (high-rated titles in user's genres, released this week)
  const newRelease = await newReleaseNudges(db);
  nudges.push(...newRelease);

  // Persist new nudges (dedupe by text to avoid spam)
  const insert = db.prepare(
    "INSERT OR IGNORE INTO nudges (conversation_id, kind, text, dismissed, created_at) VALUES (?, ?, ?, 0, ?)",
  );
  for (const n of nudges) {
    insert.run(n.conversation_id, n.kind, n.text, new Date().toISOString());
  }

  return nudges as Nudge[];
}

/** Series with <5 unwatched episodes remaining. */
function nearFinishNudges(db: DB): Omit<Nudge, "id" | "created_at">[] {
  const items: Omit<Nudge, "id" | "created_at">[] = [];
  const nextItems = upNext(db);

  for (const item of nextItems) {
    if (item.next && item.total - item.watched <= 4 && item.watched > 0) {
      const remaining = item.total - item.watched;
      items.push({
        conversation_id: null,
        kind: "near_finish",
        text: `${item.entry.title} — ${remaining} ${remaining === 1 ? "episode" : "episodes"} left`,
        dismissed: false,
      });
    }
  }
  return items;
}

/** Watchlist items untouched for >30 days. */
function staleWatchlistNudges(db: DB): Omit<Nudge, "id" | "created_at">[] {
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const stale = db
    .prepare(
      `SELECT t.title, t.year FROM library l JOIN titles t ON t.id = l.title_id
       WHERE l.status = 'watchlist' AND l.added_at < ?
       ORDER BY l.added_at ASC LIMIT 5`,
    )
    .all(cutoff) as { title: string; year: number | null }[];

  return stale.map((t) => ({
    conversation_id: null,
    kind: "stale_watchlist",
    text: `${t.title}${t.year ? ` (${t.year})` : ""} — still on your watchlist? Revisit?`,
    dismissed: false,
  }));
}

/** Titles where new episodes aired after the user's last watch. */
function newEpisodeNudges(db: DB): Omit<Nudge, "id" | "created_at">[] {
  // Reuse upNext — it already computes hasNewEpisode
  const items = upNext(db);
  const withNew = items.filter((i) => i.hasNewEpisode);

  return withNew.slice(0, 3).map((item) => ({
    conversation_id: null,
    kind: "new_episode",
    text: `${item.entry.title} — new episode aired since you last watched`,
    dismissed: false,
  }));
}

/** Titles with high anchor fatigue scores (over-used in recommendations). */
function fatigueNudges(db: DB): Omit<Nudge, "id" | "created_at">[] {
  const scores = fatigueScores(db);
  const fatigued = [...scores.entries()]
    .filter(([, score]) => score >= 0.6)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return fatigued.map(([key]) => ({
    conversation_id: null,
    kind: "anchor_fatigue",
    text: `You've seen ${key.split(":")[1]} referenced a lot — want to dive deeper?`,
    dismissed: false,
  }));
}

/** New releases matching user's taste genres, released this week. */
async function newReleaseNudges(db: DB): Promise<Omit<Nudge, "id" | "created_at">[]> {
  try {
    const profile = computeTasteProfile(db);
    const topGenres = profile.topGenres.slice(0, 3);
    if (!topGenres.length) return [];

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const items: CatalogItem[] = [];
    for (const mediaType of ["movie", "tv"] as const) {
      for (const genre of topGenres) {
        const data = await tmdbGet<{ results?: CatalogItem[] }>(
          `/discover/${mediaType}`,
          {
            with_genres: genre.name,
            "primary_release_date.gte": weekAgo.toISOString().slice(0, 10),
            "primary_release_date.lte": nextWeek.toISOString().slice(0, 10),
            sort_by: "popularity.desc",
          },
        );
        if (data.results) items.push(...data.results);
      }
    }

    // Dedupe by tmdbId
    const seen = new Set<number>();
    const unique = items.filter((i) => {
      if (seen.has(i.tmdbId)) return false;
      seen.add(i.tmdbId);
      return true;
    });

    return unique.slice(0, 3).map((item) => ({
      conversation_id: null,
      kind: "new_release",
      text: `${item.title}${item.year ? ` (${item.year})` : ""} — new release matching your ${topGenres[0].name} taste`,
      dismissed: false,
    }));
  } catch {
    return [];
  }
}

/** Retrieve undismissed nudges for display in a new conversation. */
export function getActiveNudges(db: DB): Nudge[] {
  try {
    return db
      .prepare(
        `SELECT id, conversation_id, kind, text, dismissed, created_at
         FROM nudges WHERE dismissed = 0 ORDER BY created_at ASC LIMIT 5`,
      )
      .all() as Nudge[];
  } catch {
    // Table may not exist in test DBs without full migrations
    return [];
  }
}

/** Mark a nudge as dismissed. */
export function dismissNudge(db: DB, id: number): void {
  db.prepare("UPDATE nudges SET dismissed = 1 WHERE id = ?").run(id);
}

/** Render active nudges as a context block for the system prompt. */
export function renderNudges(db: DB): string {
  const nudges = getActiveNudges(db);
  if (!nudges.length) return "";
  const lines = nudges.map((n) => `- ${n.text}`);
  return `## Passive context (while you were away)\n${lines.join("\n")}`;
}
