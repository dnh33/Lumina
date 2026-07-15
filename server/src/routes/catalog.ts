import { Router } from "express";
import { getDb } from "../db/connection.js";
import {
  becauseYouLoved,
  encore,
  forYou,
  popular,
  searchMulti,
  topRated,
  trending,
  upNext,
} from "../services/discoverService.js";
import { buildGenreExperience, buildGenreIntro } from "../services/genreExperienceService.js";
import {
  fetchDetailsFromTmdb,
  getEntryByTmdb,
  libraryTmdbIds,
} from "../services/libraryService.js";
import { ensureRatings } from "../services/ratingsService.js";
import { tmdbGet } from "../tmdb/client.js";
import { normalizePerson, normalizeSeason } from "../tmdb/normalize.js";
import type { MediaType, RawPerson, RawSeason } from "../tmdb/types.js";

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

catalogRouter.get("/tmdb/genres", async (_req, res) => {
  // Union of movie + tv genres — some ids overlap (Comedy, Drama…), some are
  // exclusive to one medium (War & Politics). Deduped by id.
  const merged = new Map<number, string>();
  for (const mediaType of ["movie", "tv"] as const) {
    const data = await tmdbGet<{ genres: { id: number; name: string }[] }>(
      `/genre/${mediaType}/list`,
    );
    for (const g of data.genres) merged.set(g.id, g.name);
  }
  res.json(
    [...merged.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
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
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return void res.status(400).json({ error: "bad id" });
  }
  const db = getDb();
  const details = await fetchDetailsFromTmdb(tmdbId, mediaType);
  // Lazily ensure critics scores (OMDb), then surface them on the details.
  const scores = await ensureRatings(db, tmdbId, mediaType);
  details.imdbRating = scores.imdb;
  details.rtRating = scores.rt;
  const entry = getEntryByTmdb(db, tmdbId, mediaType);
  // the title page needs episode progress too (RecapCard, Library ribbons)
  if (entry && entry.mediaType === "tv") {
    const row = db
      .prepare("SELECT SUM(watched) AS w FROM episodes WHERE title_id = ?")
      .get(entry.titleId) as { w: number | null };
    entry.watchedEpisodes = row.w ?? 0;
  }
  res.json({ details, library: entry });
});

catalogRouter.get("/tmdb/title/tv/:id/season/:n", async (req, res) => {
  const raw = await tmdbGet<RawSeason>(
    `/tv/${Number(req.params.id)}/season/${Number(req.params.n)}`,
  );
  res.json(normalizeSeason(raw));
});

catalogRouter.get("/tmdb/person/:id", async (req, res) => {
  const raw = await tmdbGet<RawPerson>(`/person/${Number(req.params.id)}`, {
    append_to_response: "combined_credits",
  });
  const person = normalizePerson(raw);
  const owned = libraryTmdbIds(getDb());
  const flag = (items: typeof person.knownFor) =>
    items.map((i) => ({
      ...i,
      inLibrary: owned.has(`${i.mediaType}:${i.tmdbId}`),
    }));
  res.json({
    ...person,
    knownFor: flag(person.knownFor),
    actingCredits: flag(person.actingCredits),
    directingCredits: flag(person.directingCredits),
    writingCredits: flag(person.writingCredits),
  });
});

catalogRouter.get("/discover/up-next", (_req, res) => {
  res.json(upNext(getDb()));
});

catalogRouter.get("/discover/encore", (_req, res) => {
  res.json(encore(getDb()));
});

catalogRouter.get("/discover/for-you", async (_req, res) => {
  res.json(await forYou(getDb()));
});

catalogRouter.get("/discover/genre-experience", async (req, res) => {
  const genres = String(req.query.genres ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const mode = req.query.mode === "guided" ? "guided" : "self";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  const modules = req.query.modules
    ? String(req.query.modules).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const result = await buildGenreExperience(getDb(), { genres, mediaType, mode, modules });
  res.json(result);
});

// P1.1/2.3: standalone curator intro so the rails don't block on the LLM.
catalogRouter.get("/discover/genre-intro", async (req, res) => {
  const genres = String(req.query.genres ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const mode = req.query.mode === "guided" ? "guided" : "self";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  const modules = req.query.modules
    ? String(req.query.modules).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const result = await buildGenreIntro(getDb(), { genres, mediaType, mode, modules });
  res.json(result);
});

catalogRouter.get("/discover/because", async (_req, res) => {
  res.json(await becauseYouLoved(getDb()));
});
