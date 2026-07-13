import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { env } from "../env.js";
import { getDb } from "../db/connection.js";
import { tmdbGet } from "../tmdb/client.js";
import { buildUrl } from "../lib/sourceResolver.js";

/**
 * In-app viewing. Sources are user-supplied in the gitignored
 * `data/sources.local.json` — the repo ships none. Templates never leave
 * the server; clients only ever see names and validated https URLs.
 */

interface LocalSource {
  name: string;
  type?: string;
  template: string;
  trusted?: boolean;
}

function readSources(filePath: string): LocalSource[] {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as { sources?: unknown };
    if (!Array.isArray(parsed.sources)) return [];
    return parsed.sources.filter(
      (s): s is LocalSource =>
        !!s &&
        typeof (s as LocalSource).name === "string" &&
        typeof (s as LocalSource).template === "string",
    );
  } catch {
    return []; // missing or malformed file → no sources, never an error
  }
}

export function createWatchRouter(
  sourcesPath = path.join(env.repoRoot, "data", "sources.local.json"),
): Router {
  const router = Router();

  // Names only — the template stays server-side.
  router.get("/sources", (_req, res) => {
    res.json(
      readSources(sourcesPath).map((s) => ({
        name: s.name,
        type: s.type ?? "custom",
        trusted: !!s.trusted,
      })),
    );
  });

  router.get("/watch/resolve", async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const source = String(q.source ?? "");
    if (!source) return void res.status(400).json({ error: "source required" });
    const tmdbId = Number(q.tmdbId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return void res.status(400).json({ error: "bad tmdbId" });
    }
    if (q.type !== "movie" && q.type !== "tv") {
      return void res.status(400).json({ error: "bad media type" });
    }

    // Resolve the IMDb id for {imdbId} templates (1flex-style embeds key
    // off IMDb, not TMDB). Prefer the cached DB value; if missing, do a
    // live TMDB external_ids lookup and persist it so we don't re-fetch.
    const imdbRow = getDb()
      .prepare("SELECT imdb_id FROM titles WHERE tmdb_id = ? AND media_type = ?")
      .get(tmdbId, q.type) as { imdb_id: string | null } | undefined;
    let imdbId = imdbRow?.imdb_id ?? undefined;
    if (!imdbId) {
      try {
        const ext = await tmdbGet<{ imdb_id?: string | null }>(
          `/${q.type}/${tmdbId}/external_ids`,
        );
        if (ext.imdb_id) {
          imdbId = ext.imdb_id;
          getDb()
            .prepare("UPDATE titles SET imdb_id = ? WHERE tmdb_id = ? AND media_type = ?")
            .run(imdbId, tmdbId, q.type);
        }
      } catch {
        /* leave imdbId undefined — template that needs it fails with a clear error */
      }
    }

    const match = readSources(sourcesPath).find((s) => s.name === source);
    if (!match) return void res.status(404).json({ error: "Unknown source" });

    const built = buildUrl(match.template, {
      id: tmdbId,
      imdbId,
      s: q.season,
      e: q.episode,
    });
    if (!built.ok) {
      // Surface the real cause for {imdbId} failures instead of a dead end.
      const hint =
        built.error === "imdbId required"
          ? " — this source needs an IMDb id and none was found for this title (TMDB lookup failed or title unknown)"
          : "";
      return void res.status(400).json({ error: built.error + hint });
    }
    res.json({ url: built.url, trusted: !!match.trusted });
  });

  return router;
}

export const watchRouter = createWatchRouter();
