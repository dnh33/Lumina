import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { env } from "../env.js";
import { getDb } from "../db/connection.js";
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

  router.get("/watch/resolve", (req, res) => {
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
    // off IMDb, not TMDB). Missing imdb_id → null; templates that need it fail.
    const imdbRow = getDb()
      .prepare("SELECT imdb_id FROM titles WHERE tmdb_id = ? AND media_type = ?")
      .get(tmdbId, q.type) as { imdb_id: string | null } | undefined;
    const imdbId = imdbRow?.imdb_id ?? undefined;

    const match = readSources(sourcesPath).find((s) => s.name === source);
    if (!match) return void res.status(404).json({ error: "Unknown source" });

    const built = buildUrl(match.template, {
      id: tmdbId,
      imdbId,
      s: q.season,
      e: q.episode,
    });
    if (!built.ok) return void res.status(400).json({ error: built.error });
    res.json({ url: built.url, trusted: !!match.trusted });
  });

  return router;
}

export const watchRouter = createWatchRouter();
