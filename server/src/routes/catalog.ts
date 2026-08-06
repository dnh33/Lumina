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
  beatsForSlug,
  getOrCreateGuidedSession,
  getGuidedSession,
  peekGuidedSessionProgress,
  answerGuidedBeat,
  actOnGuidedPick,
  resetGuidedSession,
  linkGuidedConversation,
  type GuidedBeatId,
} from "../services/guidedSessionService.js";
import {
  assertKnownWorldSlug,
  parseGenreQueryParam,
  parseModulesQueryParam,
} from "../services/worldSlug.js";
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
  const genres = parseGenreQueryParam(req.query.genres);
  const mode = req.query.mode === "guided" ? "guided" : "self";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  const modules = parseModulesQueryParam(req.query.modules);
  const result = await buildGenreExperience(getDb(), { genres, mediaType, mode, modules });
  res.json(result);
});

// P1.1/2.3: standalone curator intro so the rails don't block on the LLM.
catalogRouter.get("/discover/genre-intro", async (req, res) => {
  const genres = parseGenreQueryParam(req.query.genres);
  const mode = req.query.mode === "guided" ? "guided" : "self";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  const modules = parseModulesQueryParam(req.query.modules);
  const result = await buildGenreIntro(getDb(), { genres, mediaType, mode, modules });
  res.json(result);
});

// ── Guided tour session (Worlds G1) ──────────────────────────────────
catalogRouter.get("/discover/guided-session", (req, res) => {
  const rawSlug = String(req.query.slug ?? "").trim();
  if (!rawSlug) {
    res.status(400).json({ error: "slug required" });
    return;
  }
  let slug: string;
  try {
    slug = assertKnownWorldSlug(rawSlug);
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode ?? 400;
    res.status(status).json({ error: (err as Error).message });
    return;
  }
  const peek = req.query.peek === "1" || req.query.peek === "true";
  const mediaType = req.query.mediaType === "tv" ? "tv" : "movie";
  // Hub Resume: read-only peek (no create). Optional mediaType; omit → any with progress.
  if (peek) {
    const session =
      req.query.mediaType === "movie" || req.query.mediaType === "tv"
        ? getGuidedSession(getDb(), slug, mediaType)
        : peekGuidedSessionProgress(getDb(), slug);
    res.json({
      session,
      beats: session ? beatsForSlug(slug) : [],
    });
    return;
  }
  const session = getOrCreateGuidedSession(getDb(), slug, mediaType);
  res.json({ session, beats: beatsForSlug(slug) });
});

catalogRouter.post("/discover/guided-session/answer", (req, res) => {
  const slug = String(req.body?.slug ?? "").trim();
  const beatId = String(req.body?.beatId ?? "") as GuidedBeatId;
  const choiceId = String(req.body?.choiceId ?? "");
  if (!slug || !beatId || !choiceId) {
    res.status(400).json({ error: "slug, beatId, choiceId required" });
    return;
  }
  const mediaType = req.body?.mediaType === "tv" ? "tv" : "movie";
  try {
    const session = answerGuidedBeat(getDb(), slug, mediaType, beatId, choiceId);
    res.json({ session, beats: beatsForSlug(session.slug) });
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

catalogRouter.post("/discover/guided-session/act", async (req, res) => {
  const slug = String(req.body?.slug ?? "").trim();
  const tmdbId = Number(req.body?.tmdbId);
  const action = String(req.body?.action ?? "") as "watchlist" | "dismiss" | "open";
  if (
    !slug ||
    !Number.isInteger(tmdbId) ||
    tmdbId <= 0 ||
    !["watchlist", "dismiss", "open"].includes(action)
  ) {
    res.status(400).json({ error: "slug, tmdbId, action required" });
    return;
  }
  const mediaType = req.body?.mediaType === "tv" ? "tv" : "movie";
  const titleMediaType = req.body?.titleMediaType === "tv" ? "tv" : "movie";
  try {
    const session = await actOnGuidedPick(getDb(), {
      slug,
      mediaType,
      tmdbId,
      titleMediaType,
      action,
      title: req.body?.title,
      year: req.body?.year ?? null,
      posterPath: req.body?.posterPath ?? null,
    });
    res.json({ session, beats: beatsForSlug(session.slug) });
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

catalogRouter.post("/discover/guided-session/reset", (req, res) => {
  const slug = String(req.body?.slug ?? "").trim();
  if (!slug) {
    res.status(400).json({ error: "slug required" });
    return;
  }
  const mediaType = req.body?.mediaType === "tv" ? "tv" : "movie";
  try {
    const session = resetGuidedSession(getDb(), slug, mediaType);
    res.json({ session, beats: beatsForSlug(session.slug) });
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

catalogRouter.post("/discover/guided-session/link", (req, res) => {
  const slug = String(req.body?.slug ?? "").trim();
  const conversationId = Number(req.body?.conversationId);
  if (!slug || !Number.isInteger(conversationId) || conversationId <= 0) {
    res.status(400).json({ error: "slug, conversationId required" });
    return;
  }
  const mediaType = req.body?.mediaType === "tv" ? "tv" : "movie";
  try {
    const session = linkGuidedConversation(getDb(), slug, mediaType, conversationId);
    res.json({ session, beats: beatsForSlug(session.slug) });
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

catalogRouter.get("/discover/because", async (_req, res) => {
  res.json(await becauseYouLoved(getDb()));
});
