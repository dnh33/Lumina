import { Router } from "express";
import { env } from "../env.js";
import { getDb } from "../db/connection.js";
import { titleInsight } from "../llm/insightService.js";
import { currentModel, setSetting } from "../llm/openrouter.js";
import {
  computeTasteProfile,
  renderTasteProfile,
} from "../rag/tasteProfile.js";
import { exportAll, importCsv } from "../services/exportService.js";
import type { MediaType } from "../tmdb/types.js";

export const miscRouter = Router();

miscRouter.get("/health", (_req, res) => {
  const db = getDb();
  const libraryCount = (
    db.prepare("SELECT COUNT(*) n FROM library").get() as { n: number }
  ).n;
  res.json({
    ok: true,
    tmdbConfigured: !!env.tmdbAccessToken,
    aiConfigured: !!env.openRouterApiKey,
    model: currentModel(db),
    watchRegion: env.watchRegion,
    libraryCount,
    dataDir: env.dbPath,
  });
});

miscRouter.get("/insight/:type/:tmdbId", async (req, res) => {
  const mediaType = req.params.type as MediaType;
  if (mediaType !== "movie" && mediaType !== "tv") {
    return void res.status(400).json({ error: "bad media type" });
  }
  const insight = await titleInsight(
    getDb(),
    Number(req.params.tmdbId),
    mediaType,
    req.query.refresh === "1",
  );
  res.json(insight);
});

miscRouter.get("/recap/:libraryId", async (req, res) => {
  const db = getDb();
  const libraryId = Number(req.params.libraryId);
  if (!Number.isInteger(libraryId) || libraryId <= 0) {
    return void res.status(400).json({ error: "bad id" });
  }
  const row = db
    .prepare("SELECT title_id FROM library WHERE id = ?")
    .get(libraryId) as { title_id: number } | undefined;
  if (!row) return void res.status(404).json({ error: "Not found" });
  const { episodeRecap } = await import("../llm/recapService.js");
  res.json(await episodeRecap(db, row.title_id, req.query.refresh === "1"));
});

miscRouter.delete("/conversations", (_req, res) => {
  const db = getDb();
  const wipe = db.transaction(() => {
    db.prepare("DELETE FROM messages_fts").run();
    db.prepare("DELETE FROM messages").run();
    db.prepare("DELETE FROM conversations").run();
  });
  wipe();
  res.status(204).end();
});

miscRouter.get("/taste-profile", (_req, res) => {
  const profile = computeTasteProfile(getDb());
  res.json({ profile, rendered: renderTasteProfile(profile) });
});

miscRouter.put("/settings/model", (req, res) => {
  const model = String((req.body as { model?: string })?.model ?? "").trim();
  if (!model) return void res.status(400).json({ error: "model required" });
  setSetting(getDb(), "openrouter_model", model);
  res.json({ ok: true, model });
});

miscRouter.get("/export", (_req, res) => {
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="lumina-export-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  res.json(exportAll(getDb()));
});

miscRouter.post("/import/csv", async (req, res) => {
  const csv = String((req.body as { csv?: string })?.csv ?? "");
  if (!csv.trim()) return void res.status(400).json({ error: "csv required" });
  res.json(await importCsv(getDb(), csv));
});
