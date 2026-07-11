import { Router } from "express";
import { getDb } from "../db/connection.js";
import {
  becauseYouLoved,
  forYou,
  popular,
  searchMulti,
  topRated,
  trending,
} from "../services/discoverService.js";
import {
  fetchDetailsFromTmdb,
  getEntryByTmdb,
} from "../services/libraryService.js";
import { tmdbGet } from "../tmdb/client.js";
import { normalizeSeason } from "../tmdb/normalize.js";
import type { MediaType, RawSeason } from "../tmdb/types.js";

export const catalogRouter = Router();

function asMediaType(v: string): MediaType {
  if (v !== "movie" && v !== "tv") throw Object.assign(new Error("bad media type"), { statusCode: 400 });
  return v;
}

catalogRouter.get("/tmdb/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return void res.json([]);
  res.json(await searchMulti(getDb(), q));
});

catalogRouter.get("/tmdb/trending", async (_req, res) => {
  res.json(await trending(getDb()));
});

catalogRouter.get("/tmdb/popular/:type", async (req, res) => {
  res.json(await popular(getDb(), asMediaType(req.params.type)));
});

catalogRouter.get("/tmdb/top-rated/:type", async (req, res) => {
  res.json(await topRated(getDb(), asMediaType(req.params.type)));
});

catalogRouter.get("/tmdb/title/:type/:id", async (req, res) => {
  const mediaType = asMediaType(req.params.type);
  const tmdbId = Number(req.params.id);
  const db = getDb();
  const details = await fetchDetailsFromTmdb(tmdbId, mediaType);
  const entry = getEntryByTmdb(db, tmdbId, mediaType);
  res.json({ details, library: entry });
});

catalogRouter.get("/tmdb/title/tv/:id/season/:n", async (req, res) => {
  const raw = await tmdbGet<RawSeason>(
    `/tv/${Number(req.params.id)}/season/${Number(req.params.n)}`,
  );
  res.json(normalizeSeason(raw));
});

catalogRouter.get("/discover/for-you", async (_req, res) => {
  res.json(await forYou(getDb()));
});

catalogRouter.get("/discover/because", async (_req, res) => {
  res.json(await becauseYouLoved(getDb()));
});
