import { Router } from "express";
import { getDb } from "../db/connection.js";
import {
  addToLibrary,
  getEntry,
  libraryStats,
  listEpisodes,
  listLibrary,
  removeEntry,
  setEpisodeWatched,
  setSeasonWatched,
  syncEpisodes,
  updateEntry,
  type LibraryStatus,
  type ListFilters,
} from "../services/libraryService.js";
import type { MediaType } from "../tmdb/types.js";

export const libraryRouter = Router();

libraryRouter.get("/library", (req, res) => {
  const f: ListFilters = {
    status: (req.query.status as ListFilters["status"]) || "all",
    mediaType: (req.query.type as MediaType) || undefined,
    genre: (req.query.genre as string) || undefined,
    search: (req.query.search as string) || undefined,
    sort: (req.query.sort as ListFilters["sort"]) || "added",
  };
  res.json(listLibrary(getDb(), f));
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

libraryRouter.post("/library", async (req, res) => {
  const { tmdbId, mediaType, status, rating, notes, favorite, watchedAt } =
    req.body as {
      tmdbId: number;
      mediaType: MediaType;
      status?: LibraryStatus;
      rating?: number | null;
      notes?: string;
      favorite?: boolean;
      watchedAt?: string | null;
    };
  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return void res.status(400).json({ error: "tmdbId and mediaType required" });
  }
  const entry = await addToLibrary(getDb(), {
    tmdbId,
    mediaType,
    status,
    rating,
    notes,
    favorite,
    watchedAt,
  });
  res.status(201).json(entry);
});

libraryRouter.patch("/library/:id", (req, res) => {
  const entry = updateEntry(getDb(), Number(req.params.id), req.body ?? {});
  if (!entry) return void res.status(404).json({ error: "Not found" });
  res.json(entry);
});

libraryRouter.delete("/library/:id", (req, res) => {
  removeEntry(getDb(), Number(req.params.id));
  res.status(204).end();
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
