import { Router } from "express";
import { getDb } from "../db/connection.js";
import {
  addToLibrary,
  fetchDetailsFromTmdb,
  getEntry,
  getExcludedGenres,
  ignoreTitle,
  libraryStats,
  listEpisodes,
  listIgnored,
  listLibrary,
  removeEntry,
  setEpisodeWatched,
  setExcludedGenres,
  setSeasonWatched,
  syncEpisodes,
  unignoreTitle,
  updateEntry,
  upsertTitle,
  listRetiredAnchors,
  type LibraryStatus,
  type ListFilters,
} from "../services/libraryService.js";
import { ensureRatings } from "../services/ratingsService.js";
import { setRetired, isRetired, fatigueScores } from "../services/anchorService.js";
import { env } from "../env.js";
import type { MediaType } from "../tmdb/types.js";

export const libraryRouter = Router();

/* ── validation helpers ──────────────────────────────────────────── */

const STATUSES = new Set(["watched", "watching", "watchlist", "abandoned"]);

function intParam(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Validate a library write body; returns an error string or null. */
function validateWrite(b: Record<string, unknown>): string | null {
  if (b.status !== undefined && !STATUSES.has(String(b.status))) {
    return "status must be watched|watching|watchlist|abandoned";
  }
  if (
    b.rating !== undefined &&
    b.rating !== null &&
    !(Number.isInteger(b.rating) && (b.rating as number) >= 1 && (b.rating as number) <= 10)
  ) {
    return "rating must be an integer 1-10 (or null)";
  }
  if (b.notes !== undefined && typeof b.notes !== "string") {
    return "notes must be a string";
  }
  if (b.tags !== undefined && !Array.isArray(b.tags)) {
    return "tags must be an array of strings";
  }
  if (b.favorite !== undefined && typeof b.favorite !== "boolean") {
    return "favorite must be a boolean";
  }
  if (
    b.watchedAt !== undefined &&
    b.watchedAt !== null &&
    typeof b.watchedAt !== "string"
  ) {
    return "watchedAt must be a string date (or null)";
  }
  return null;
}

libraryRouter.get("/library", (req, res) => {
  const f: ListFilters = {
    status: (req.query.status as ListFilters["status"]) || "all",
    mediaType: (req.query.type as MediaType) || undefined,
    genre: (req.query.genre as string) || undefined,
    tag: (req.query.tag as string) || undefined,
    search: (req.query.search as string) || undefined,
    sort: (req.query.sort as ListFilters["sort"]) || "added",
  };
  res.json(listLibrary(getDb(), f));
});

// Backfill critics scores for every title in the library. Respects the OMDb
// 30-day cache and 1k/day quota: ensureRatings() no-ops on fresh rows and
// skips the network entirely when OMDB_API_KEY is unset. Designed to be run
// on a schedule or manually — never call this per-render.
libraryRouter.post("/library/enrich-all", async (_req, res) => {
  if (!env.omdbApiKey) {
    res.json({ ok: true, skipped: true, reason: "no OMDB_API_KEY", enriched: 0 });
    return;
  }
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT tmdb_id, media_type FROM titles WHERE imdb_rating IS NULL OR rt_rating IS NULL",
    )
    .all() as { tmdb_id: number; media_type: MediaType }[];

  let enriched = 0;
  for (const r of rows) {
    const scores = await ensureRatings(db, r.tmdb_id, r.media_type);
    if (scores.imdb != null || scores.rt != null) enriched++;
  }
  res.json({ ok: true, checked: rows.length, enriched });
});

libraryRouter.get("/library/stats", (_req, res) => {
  res.json(libraryStats(getDb()));
});

libraryRouter.get("/library/genres", (_req, res) => {
  const rows = getDb()
    .prepare("SELECT genres FROM titles t JOIN library l ON l.title_id = t.id")
    .all() as { genres: string }[];
  const set = new Set<string>();
  for (const r of rows) for (const g of JSON.parse(r.genres) as string[]) set.add(g);
  res.json([...set].sort());
});

libraryRouter.get("/library/tags", (_req, res) => {
  const rows = getDb()
    .prepare("SELECT tags FROM library WHERE tags != '[]'")
    .all() as { tags: string }[];
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const t of JSON.parse(r.tags) as string[]) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  res.json(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  );
});

libraryRouter.post("/library", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const tmdbId = Number(body.tmdbId);
  const mediaType = body.mediaType as MediaType;
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || (mediaType !== "movie" && mediaType !== "tv")) {
    return void res.status(400).json({ error: "tmdbId and mediaType required" });
  }
  const invalid = validateWrite(body);
  if (invalid) return void res.status(400).json({ error: invalid });

  const entry = await addToLibrary(getDb(), {
    tmdbId,
    mediaType,
    status: body.status as LibraryStatus | undefined,
    rating: body.rating as number | null | undefined,
    notes: body.notes as string | undefined,
    tags: body.tags as string[] | undefined,
    favorite: body.favorite as boolean | undefined,
    watchedAt: body.watchedAt as string | null | undefined,
  });
  res.status(201).json(entry);
});

libraryRouter.patch("/library/:id", (req, res) => {
  const id = intParam(req.params.id);
  if (!id) return void res.status(400).json({ error: "bad id" });
  const body = (req.body ?? {}) as Record<string, unknown>;
  const invalid = validateWrite(body);
  if (invalid) return void res.status(400).json({ error: invalid });
  const entry = updateEntry(getDb(), id, body);
  if (!entry) return void res.status(404).json({ error: "Not found" });
  res.json(entry);
});

libraryRouter.delete("/library/:id", (req, res) => {
  const id = intParam(req.params.id);
  if (!id) return void res.status(400).json({ error: "bad id" });
  removeEntry(getDb(), id);
  res.status(204).end();
});

/* ── Ignored titles ──────────────────────────────────────────────── */

libraryRouter.get("/ignore", (_req, res) => {
  res.json(listIgnored(getDb()));
});

libraryRouter.post("/ignore", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const tmdbId = Number(body.tmdbId);
  const mediaType = body.mediaType as MediaType;
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || (mediaType !== "movie" && mediaType !== "tv")) {
    return void res.status(400).json({ error: "tmdbId and mediaType required" });
  }
  const db = getDb();
  ignoreTitle(db, tmdbId, mediaType);
  // Best-effort metadata snapshot so the manage list can show a real title
  // and poster. The ignore itself must never fail on a TMDB hiccup.
  try {
    upsertTitle(db, await fetchDetailsFromTmdb(tmdbId, mediaType));
  } catch {
    /* listIgnored falls back to a placeholder title */
  }
  res.status(201).json({ ok: true });
});

libraryRouter.delete("/ignore/:type/:id", (req, res) => {
  const mediaType = req.params.type as MediaType;
  const tmdbId = intParam(req.params.id);
  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return void res.status(400).json({ error: "bad params" });
  }
  unignoreTitle(getDb(), tmdbId, mediaType);
  res.status(204).end();
});

/* ── Discovery preferences ───────────────────────────────────────── */

libraryRouter.get("/discovery-prefs", (_req, res) => {
  res.json({ excludedGenres: getExcludedGenres(getDb()) });
});

libraryRouter.put("/discovery-prefs", (req, res) => {
  const body = (req.body ?? {}) as { excludedGenres?: unknown };
  if (
    !Array.isArray(body.excludedGenres) ||
    body.excludedGenres.some((x) => !Number.isInteger(x))
  ) {
    return void res
      .status(400)
      .json({ error: "excludedGenres must be an array of genre ids" });
  }
  setExcludedGenres(getDb(), body.excludedGenres as number[]);
  res.json({ excludedGenres: getExcludedGenres(getDb()) });
});

/* ── Retire-as-anchor ─────────────────────────────────────────── */

// Keep a loved title in the taste profile but stop it from being used as a
// "like X" comparison anchor (anti-fatigue). Independent of ignore.
libraryRouter.post("/library/:id/retire-anchor", (req, res) => {
  const id = intParam(req.params.id);
  if (!id) return void res.status(400).json({ error: "bad id" });
  if (!getEntry(getDb(), id)) return void res.status(404).json({ error: "Not found" });
  setRetired(getDb(), id, true);
  res.status(201).json({ retired: true });
});

libraryRouter.delete("/library/:id/retire-anchor", (req, res) => {
  const id = intParam(req.params.id);
  if (!id) return void res.status(400).json({ error: "bad id" });
  setRetired(getDb(), id, false);
  res.status(204).end();
});

libraryRouter.get("/library/:id/retired", (req, res) => {
  const id = intParam(req.params.id);
  if (!id) return void res.status(400).json({ error: "bad id" });
  const entry = getEntry(getDb(), id);
  if (!entry) return void res.status(404).json({ error: "Not found" });
  const retired = isRetired(getDb(), entry.tmdbId, entry.mediaType);
  // Anti-fatigue: surface a passive, threshold-gated "over-used" hint so the
  // user can retire a title they're tired of seeing used as a comparison.
  const fatigue = fatigueScores(getDb());
  const fatigued = (fatigue.get(`${entry.mediaType}:${entry.tmdbId}`) ?? 0) >= 0.6;
  res.json({ retired, fatigued });
});

// Anti-fatigue: list all titles the user retired as comparison anchors,
// so they can be reviewed / un-retired in one place (discoverability).
libraryRouter.get("/library/retired-anchors", (_req, res) => {
  const retired = listRetiredAnchors(getDb());
  res.json(retired);
});

/* ── Episodes ────────────────────────────────────────────────────── */

libraryRouter.get("/library/:id/episodes", async (req, res) => {
  const db = getDb();
  const entry = getEntry(db, Number(req.params.id));
  if (!entry) return void res.status(404).json({ error: "Not found" });
  let eps = listEpisodes(db, entry.titleId);
  if (entry.mediaType === "tv" && (!eps.length || req.query.sync === "1")) {
    await syncEpisodes(db, entry.titleId);
    eps = listEpisodes(db, entry.titleId);
  }
  res.json(eps);
});

libraryRouter.patch("/episodes/:id", (req, res) => {
  const watched = !!(req.body as { watched?: boolean }).watched;
  setEpisodeWatched(getDb(), Number(req.params.id), watched);
  res.json({ ok: true });
});

libraryRouter.post("/library/:id/season/:season", (req, res) => {
  const db = getDb();
  const entry = getEntry(db, Number(req.params.id));
  if (!entry) return void res.status(404).json({ error: "Not found" });
  const watched = !!(req.body as { watched?: boolean }).watched;
  setSeasonWatched(db, entry.titleId, Number(req.params.season), watched);
  res.json({ ok: true });
});
